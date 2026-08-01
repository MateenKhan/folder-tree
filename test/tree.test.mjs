/**
 * Pure-logic tests. No DOM, no React render — these cover the parts that can
 * corrupt a consumer's tree if they are wrong.
 *
 *   npm run build && npm test
 */
import assert from 'node:assert/strict';
import {
  canDrop,
  moveNodes,
  isDescendantOf,
  collectDescendantIds,
  findNodePath,
  ancestorIds,
  searchTree,
  flattenVisible,
} from '../dist/index.js';

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}\n      ${err.message}`);
    process.exitCode = 1;
  }
};

/** cupboard > [carcass > [side-l, side-r, back], shelves > [shelf-1, shelf-2], door] */
const tree = () => [
  {
    id: 'cupboard',
    label: 'Cupboard',
    children: [
      {
        id: 'carcass',
        label: 'Carcass',
        children: [
          { id: 'side-l', label: 'Left side' },
          { id: 'side-r', label: 'Right side' },
          { id: 'back', label: 'Back panel' },
        ],
      },
      {
        id: 'shelves',
        label: 'Shelves',
        children: [
          { id: 'shelf-1', label: 'Shelf 1' },
          { id: 'shelf-2', label: 'Shelf 2' },
        ],
      },
      { id: 'door', label: 'Door' },
    ],
  },
  { id: 'plinth', label: 'Plinth' },
];

const ids = (nodes) => nodes.map((n) => n.id);

console.log('\ndescendants');
test('collectDescendantIds is transitive and excludes self', () => {
  const set = collectDescendantIds(tree()[0]);
  assert.equal(set.has('cupboard'), false);
  assert.equal(set.has('shelf-2'), true);
  assert.equal(set.size, 8);
});

test('isDescendantOf', () => {
  const t = tree();
  assert.equal(isDescendantOf(t, 'cupboard', 'shelf-1'), true);
  assert.equal(isDescendantOf(t, 'shelves', 'side-l'), false);
  assert.equal(isDescendantOf(t, 'cupboard', 'cupboard'), false, 'not its own descendant');
});

test('findNodePath / ancestorIds', () => {
  const t = tree();
  assert.deepEqual(
    findNodePath(t, 'shelf-2').map((n) => n.id),
    ['cupboard', 'shelves', 'shelf-2'],
  );
  assert.deepEqual(ancestorIds(t, 'shelf-2'), ['cupboard', 'shelves']);
  assert.deepEqual(ancestorIds(t, 'plinth'), []);
  assert.equal(findNodePath(t, 'nope'), null);
});

console.log('\nT-04 — a node can never be dropped into its own descendant');
test('inside a direct child is refused', () => {
  assert.equal(canDrop(tree(), ['cupboard'], 'carcass', 'inside'), false);
});
test('inside a deep descendant is refused', () => {
  assert.equal(canDrop(tree(), ['cupboard'], 'shelf-2', 'inside'), false);
});
test('before/after a descendant is refused too', () => {
  assert.equal(canDrop(tree(), ['cupboard'], 'shelf-2', 'before'), false);
  assert.equal(canDrop(tree(), ['cupboard'], 'shelf-2', 'after'), false);
});
test('onto itself is refused', () => {
  assert.equal(canDrop(tree(), ['cupboard'], 'cupboard', 'inside'), false);
});
test('a refused move leaves the tree byte-identical', () => {
  const t = tree();
  const out = moveNodes(t, ['cupboard'], 'shelf-2', 'inside');
  assert.equal(out, t, 'same array reference back');
  assert.deepEqual(ids(out), ['cupboard', 'plinth']);
  assert.equal(collectDescendantIds(out[0]).size, 8, 'nothing lost, nothing duplicated');
});
test('refused when any one of a multi-drag is an ancestor of the target', () => {
  assert.equal(canDrop(tree(), ['door', 'cupboard'], 'shelf-1', 'after'), false);
});
test('a legal sideways move is allowed', () => {
  assert.equal(canDrop(tree(), ['shelf-1'], 'carcass', 'inside'), true);
  assert.equal(canDrop(tree(), ['door'], 'plinth', 'after'), true);
});
test('readOnly rows refuse to be moved, and refuse children', () => {
  const t = tree();
  t[1].readOnly = true;
  assert.equal(canDrop(t, ['plinth'], 'door', 'after'), false, 'cannot be dragged');
  t[1].readOnly = false;
  t[0].children[2].readOnly = true;
  t[0].children[2].children = [];
  assert.equal(canDrop(t, ['plinth'], 'door', 'inside'), false, 'cannot receive');
  assert.equal(canDrop(t, ['plinth'], 'door', 'after'), true, 'but can be a sibling anchor');
});
test('unknown ids are refused', () => {
  assert.equal(canDrop(tree(), ['ghost'], 'door', 'after'), false);
  assert.equal(canDrop(tree(), ['door'], 'ghost', 'after'), false);
  assert.equal(canDrop(tree(), [], 'door', 'after'), false);
});

console.log('\nmoveNodes');
test('inside appends to the target', () => {
  const out = moveNodes(tree(), ['plinth'], 'shelves', 'inside');
  assert.deepEqual(ids(out), ['cupboard']);
  const shelves = out[0].children[1];
  assert.deepEqual(ids(shelves.children), ['shelf-1', 'shelf-2', 'plinth']);
});
test('before/after land on the right side of the anchor', () => {
  const before = moveNodes(tree(), ['door'], 'carcass', 'before');
  assert.deepEqual(ids(before[0].children), ['door', 'carcass', 'shelves']);
  const after = moveNodes(tree(), ['door'], 'carcass', 'after');
  assert.deepEqual(ids(after[0].children), ['carcass', 'door', 'shelves']);
});
test('a node lifted out of a group keeps its subtree', () => {
  const out = moveNodes(tree(), ['shelves'], 'plinth', 'after');
  assert.deepEqual(ids(out), ['cupboard', 'plinth', 'shelves']);
  assert.deepEqual(ids(out[2].children), ['shelf-1', 'shelf-2']);
  assert.deepEqual(ids(out[0].children), ['carcass', 'door']);
});
test('multi-move keeps order and drops ids already carried by a moved parent', () => {
  const out = moveNodes(tree(), ['carcass', 'side-l'], 'plinth', 'after');
  assert.deepEqual(ids(out), ['cupboard', 'plinth', 'carcass']);
  assert.deepEqual(ids(out[2].children), ['side-l', 'side-r', 'back'], 'side-l moved once');
});
test('structural sharing: untouched branches keep identity', () => {
  const t = tree();
  const untouched = t[0].children[0];
  const out = moveNodes(t, ['plinth'], 'shelves', 'inside');
  assert.equal(out[0].children[0], untouched);
  assert.notEqual(out, t);
});

console.log('\nT-03 — search');
test('matches, ancestors and force-expansion', () => {
  const r = searchTree(tree(), 'shelf');
  // "Shelves" has no "shelf" in it — only the two leaves match.
  assert.deepEqual([...r.matched].sort(), ['shelf-1', 'shelf-2']);
  assert.equal(r.visible.has('cupboard'), true, 'ancestor stays visible');
  assert.equal(r.visible.has('shelves'), true, 'ancestor stays visible');
  assert.equal(r.visible.has('door'), false, 'non-match hidden');
  assert.equal(r.expand.has('cupboard'), true, 'ancestor of a match auto-expands');
  assert.equal(r.expand.has('shelves'), true, 'holds matching children');
});
test('a matching folder brings its whole subtree', () => {
  const r = searchTree(tree(), 'carcass');
  assert.deepEqual([...r.matched], ['carcass']);
  ['side-l', 'side-r', 'back'].forEach((id) =>
    assert.equal(r.visible.has(id), true, `${id} visible`),
  );
  assert.equal(r.expand.has('carcass'), false, 'a self-match does not force itself open');
});
test('keywords are searchable but never a match on the label', () => {
  const t = tree();
  t[0].children[2].keywords = 'hinge handle';
  const r = searchTree(t, 'hinge');
  assert.deepEqual([...r.matched], ['door']);
});
test('an empty query matches nothing (the tree renders unfiltered)', () => {
  const r = searchTree(tree(), '');
  assert.equal(r.visible.size, 0);
  assert.equal(r.matched.size, 0);
});
test('case-insensitive', () => {
  assert.equal(searchTree(tree(), 'DOOR').matched.has('door'), true);
});

console.log('\nflattenVisible');
test('collapsed tree shows only roots', () => {
  const rows = flattenVisible(tree(), new Set(), null);
  assert.deepEqual(
    rows.map((r) => r.node.id),
    ['cupboard', 'plinth'],
  );
  assert.equal(rows[0].hasChildren, true);
  assert.equal(rows[1].hasChildren, false);
});
test('depth, parentId and expanded are correct', () => {
  const rows = flattenVisible(tree(), new Set(['cupboard', 'shelves']), null);
  assert.deepEqual(
    rows.map((r) => `${r.depth}:${r.node.id}`),
    ['0:cupboard', '1:carcass', '1:shelves', '2:shelf-1', '2:shelf-2', '1:door', '0:plinth'],
  );
  assert.equal(rows[3].parentId, 'shelves');
  assert.equal(rows[1].expanded, false, 'carcass has children but is collapsed');
});
test('a search filter removes rows and recomputes hasChildren', () => {
  const r = searchTree(tree(), 'shelf');
  const rows = flattenVisible(tree(), new Set([...r.expand]), r.visible);
  assert.deepEqual(
    rows.map((r2) => r2.node.id),
    ['cupboard', 'shelves', 'shelf-1', 'shelf-2'],
  );
});

console.log(`\n${passed} passed\n`);
