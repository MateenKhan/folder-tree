import type * as React from 'react';

/** Every node needs a stable, tree-unique id. */
export type TreeNodeId = string;

/**
 * One row. Generic over `T` so the consumer can hang its own payload off each
 * node and get it back — typed — from `data`. The package never inspects `T`.
 */
export type TreeNode<T = unknown> = {
  id: TreeNodeId;
  label: string;
  children?: TreeNode<T>[];
  /** Inline SVG, an `<img>`, or a colour chip. Consumer's choice. */
  icon?: React.ReactNode;
  /** Right-aligned muted text — a size, a count, a value. */
  hint?: string;
  /** Extra searchable text that is never rendered. */
  keywords?: string;
  hidden?: boolean;
  locked?: boolean;
  disabled?: boolean;
  /** Rows the consumer owns but must not be reordered or deleted. */
  readOnly?: boolean;
  data?: T;
};

/** Where a dragged node lands relative to the row it was dropped on. */
export type DropPosition = 'before' | 'inside' | 'after';

/** How a selection change was made. */
export type SelectMeta = {
  /** Ctrl/Cmd was held — add to or remove from the selection. */
  multi: boolean;
  /** Shift was held — extend from the anchor row. */
  range: boolean;
  via: 'pointer' | 'keyboard';
};

export type FolderTreeProps<T = unknown> = {
  nodes: TreeNode<T>[];
  selectedIds: TreeNodeId[];
  onSelect: (ids: TreeNodeId[], meta: SelectMeta) => void;

  search?: string;
  onSearchChange?: (value: string) => void;
  /** Render the built-in search field. Default true. */
  showSearch?: boolean;
  /** Placeholder for the built-in search field. */
  searchPlaceholder?: string;

  expandedIds?: TreeNodeId[];
  onExpandedChange?: (ids: TreeNodeId[]) => void;
  /** Ids expanded on first render when the tree is uncontrolled. */
  defaultExpandedIds?: TreeNodeId[];

  onRename?: (id: TreeNodeId, name: string) => void;
  onToggleHidden?: (id: TreeNodeId) => void;
  onToggleLocked?: (id: TreeNodeId) => void;
  onDelete?: (ids: TreeNodeId[]) => void;
  /** Omit to disable drag entirely. */
  onMove?: (moved: TreeNodeId[], target: TreeNodeId, position: DropPosition) => void;

  onHoverNode?: (id: TreeNodeId | null) => void;
  onContextMenu?: (id: TreeNodeId, e: React.MouseEvent) => void;

  emptyMessage?: React.ReactNode;
  /** Rows taller than this switch to virtualised rendering. Default 200. */
  virtualiseAfter?: number;

  /** Accessible name for the `role="tree"` element. */
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
};

/** A node flattened into a render row, with its depth and parent resolved. */
export type FlatRow<T = unknown> = {
  node: TreeNode<T>;
  depth: number;
  parentId: TreeNodeId | null;
  hasChildren: boolean;
  expanded: boolean;
};
