import type { DropPosition, FlatRow, TreeNode, TreeNodeId } from './types';

/** Depth-first walk. Return `false` from `visit` to skip a node's children. */
export function walkTree<T>(
  nodes: TreeNode<T>[],
  visit: (node: TreeNode<T>, parent: TreeNode<T> | null, depth: number) => boolean | void,
  parent: TreeNode<T> | null = null,
  depth = 0,
): void {
  for (const node of nodes) {
    const descend = visit(node, parent, depth);
    if (descend !== false && node.children?.length) {
      walkTree(node.children, visit, node, depth + 1);
    }
  }
}

/** First node with this id, anywhere in the tree. */
export function findNode<T>(nodes: TreeNode<T>[], id: TreeNodeId): TreeNode<T> | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const hit = findNode(node.children, id);
      if (hit) return hit;
    }
  }
  return null;
}

/** Root-to-node chain, `[root, …, node]`, or `null` when the id is unknown. */
export function findNodePath<T>(nodes: TreeNode<T>[], id: TreeNodeId): TreeNode<T>[] | null {
  for (const node of nodes) {
    if (node.id === id) return [node];
    if (node.children?.length) {
      const sub = findNodePath(node.children, id);
      if (sub) return [node, ...sub];
    }
  }
  return null;
}

/** Ids of every ancestor of `id`, nearest last. Empty for a root node. */
export function ancestorIds<T>(nodes: TreeNode<T>[], id: TreeNodeId): TreeNodeId[] {
  const path = findNodePath(nodes, id);
  if (!path) return [];
  return path.slice(0, -1).map((n) => n.id);
}

/** Every id below `node`, not including `node` itself. */
export function collectDescendantIds<T>(node: TreeNode<T>): Set<TreeNodeId> {
  const out = new Set<TreeNodeId>();
  const push = (list: TreeNode<T>[]) => {
    for (const child of list) {
      out.add(child.id);
      if (child.children?.length) push(child.children);
    }
  };
  if (node.children?.length) push(node.children);
  return out;
}

/**
 * Is `candidateId` inside the subtree rooted at `ancestorId`?
 * A node is not its own descendant.
 */
export function isDescendantOf<T>(
  nodes: TreeNode<T>[],
  ancestorId: TreeNodeId,
  candidateId: TreeNodeId,
): boolean {
  const ancestor = findNode(nodes, ancestorId);
  if (!ancestor) return false;
  return collectDescendantIds(ancestor).has(candidateId);
}

/**
 * The single guard that keeps a move from corrupting the tree.
 *
 * A node may not be dropped onto itself, and — the case that actually
 * destroys a tree — it may not be dropped anywhere inside its own subtree.
 * Re-parenting a node under its own child would detach both from the root and
 * leave an orphaned cycle behind.
 *
 * `before` and `after` are checked as strictly as `inside`: landing beside a
 * descendant still means landing inside the moved node's own subtree.
 */
export function canDrop<T>(
  nodes: TreeNode<T>[],
  movedIds: TreeNodeId[],
  targetId: TreeNodeId,
  position: DropPosition,
): boolean {
  if (movedIds.length === 0) return false;

  for (const movedId of movedIds) {
    if (movedId === targetId) return false;
    const moved = findNode(nodes, movedId);
    if (!moved) return false;
    if (moved.readOnly) return false;
    if (collectDescendantIds(moved).has(targetId)) return false;
  }

  const target = findNode(nodes, targetId);
  if (!target) return false;

  if (position === 'inside' && target.readOnly) return false;

  return true;
}

/** Remove a node from the tree, returning the new tree and the node removed. */
function detach<T>(
  nodes: TreeNode<T>[],
  id: TreeNodeId,
): { nodes: TreeNode<T>[]; removed: TreeNode<T> | null } {
  let removed: TreeNode<T> | null = null;
  const next: TreeNode<T>[] = [];

  for (const node of nodes) {
    if (node.id === id) {
      removed = node;
      continue;
    }
    if (node.children?.length) {
      const sub = detach(node.children, id);
      if (sub.removed) {
        removed = sub.removed;
        next.push({ ...node, children: sub.nodes });
        continue;
      }
    }
    next.push(node);
  }

  return { nodes: next, removed };
}

function insert<T>(
  nodes: TreeNode<T>[],
  payload: TreeNode<T>[],
  targetId: TreeNodeId,
  position: DropPosition,
): { nodes: TreeNode<T>[]; done: boolean } {
  const idx = nodes.findIndex((n) => n.id === targetId);

  if (idx !== -1) {
    if (position === 'inside') {
      const target = nodes[idx];
      const next = nodes.slice();
      next[idx] = { ...target, children: [...(target.children ?? []), ...payload] };
      return { nodes: next, done: true };
    }
    const at = position === 'before' ? idx : idx + 1;
    const next = nodes.slice();
    next.splice(at, 0, ...payload);
    return { nodes: next, done: true };
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node.children?.length) continue;
    const sub = insert(node.children, payload, targetId, position);
    if (sub.done) {
      const next = nodes.slice();
      next[i] = { ...node, children: sub.nodes };
      return { nodes: next, done: true };
    }
  }

  return { nodes, done: false };
}

/**
 * Apply a move and get a new tree back. Structural sharing: untouched
 * branches keep their identity, so `React.memo` on rows still pays off.
 *
 * Refuses the move — returning the *same* array — when `canDrop` says no, so
 * a consumer that forwards `onMove` straight into this helper can never
 * corrupt its own tree.
 */
export function moveNodes<T>(
  nodes: TreeNode<T>[],
  movedIds: TreeNodeId[],
  targetId: TreeNodeId,
  position: DropPosition,
): TreeNode<T>[] {
  if (!canDrop(nodes, movedIds, targetId, position)) return nodes;

  // Drop ids that are already inside another moved subtree — moving a parent
  // carries its children along, and detaching both would duplicate them.
  const ordered = movedIds.filter(
    (id) => !movedIds.some((other) => other !== id && isDescendantOf(nodes, other, id)),
  );

  let working = nodes;
  const payload: TreeNode<T>[] = [];
  for (const id of ordered) {
    const res = detach(working, id);
    if (!res.removed) return nodes;
    working = res.nodes;
    payload.push(res.removed);
  }

  const inserted = insert(working, payload, targetId, position);
  return inserted.done ? inserted.nodes : nodes;
}

const norm = (s: string) => s.toLowerCase();

/** Does this node's own text match? Children are not consulted. */
export function nodeMatches<T>(node: TreeNode<T>, query: string): boolean {
  if (!query) return true;
  const q = norm(query);
  return norm(node.label).includes(q) || (!!node.keywords && norm(node.keywords).includes(q));
}

export type SearchResult = {
  /** Ids to render: every match, every ancestor of a match, every descendant of a match. */
  visible: Set<TreeNodeId>;
  /** Ids that matched the query themselves — these get the highlight ring. */
  matched: Set<TreeNodeId>;
  /** Ancestors of matches, to be force-expanded while the search is live. */
  expand: Set<TreeNodeId>;
};

/**
 * Resolve a query into the three id sets the tree needs.
 *
 * A matching node brings its whole subtree with it — expanding a folder that
 * matched shows what is in it rather than an empty disclosure.
 */
export function searchTree<T>(nodes: TreeNode<T>[], query: string): SearchResult {
  const visible = new Set<TreeNodeId>();
  const matched = new Set<TreeNodeId>();
  const expand = new Set<TreeNodeId>();

  if (!query) return { visible, matched, expand };

  const walk = (list: TreeNode<T>[], ancestors: TreeNodeId[]): boolean => {
    let anyHere = false;

    for (const node of list) {
      const self = nodeMatches(node, query);
      const nextAncestors = [...ancestors, node.id];
      const childHit = node.children?.length ? walk(node.children, nextAncestors) : false;

      if (self) {
        matched.add(node.id);
        // The whole subtree comes along.
        visible.add(node.id);
        for (const id of collectDescendantIds(node)) visible.add(id);
      }

      if (self || childHit) {
        anyHere = true;
        visible.add(node.id);
        for (const id of ancestors) {
          visible.add(id);
          expand.add(id);
        }
        // Only force a matching folder open when the match was below it.
        if (childHit) expand.add(node.id);
      }
    }

    return anyHere;
  };

  walk(nodes, []);
  return { visible, matched, expand };
}

/**
 * Flatten the tree into the rows that are actually on screen, in visual
 * order — the list every keyboard move, range-select and virtualiser works
 * against.
 */
export function flattenVisible<T>(
  nodes: TreeNode<T>[],
  expanded: Set<TreeNodeId>,
  visibleFilter: Set<TreeNodeId> | null,
): FlatRow<T>[] {
  const rows: FlatRow<T>[] = [];

  const walk = (list: TreeNode<T>[], depth: number, parentId: TreeNodeId | null) => {
    for (const node of list) {
      if (visibleFilter && !visibleFilter.has(node.id)) continue;

      const children = visibleFilter
        ? (node.children ?? []).filter((c) => visibleFilter.has(c.id))
        : (node.children ?? []);

      const hasChildren = children.length > 0;
      const isExpanded = hasChildren && expanded.has(node.id);

      rows.push({ node, depth, parentId, hasChildren, expanded: isExpanded });

      if (isExpanded) walk(children, depth + 1, node.id);
    }
  };

  walk(nodes, 0, null);
  return rows;
}
