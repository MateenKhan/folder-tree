import * as React from 'react';
import { memo } from 'react';
import type { DropPosition, TreeNode, TreeNodeId } from './types';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
  FileIcon,
  FolderIcon,
  GripIcon,
  LockIcon,
  TrashIcon,
  UnlockIcon,
} from './icons';
import { RenameInput } from './RenameInput';

export type TreeRowProps<T> = {
  node: TreeNode<T>;
  depth: number;
  rowId: string;
  selected: boolean;
  focused: boolean;
  expanded: boolean;
  hasChildren: boolean;
  matched: boolean;
  level: number;
  setSize: number;
  posInSet: number;
  renaming: boolean;

  /** Drop feedback for this row, or null. */
  dropPosition: DropPosition | null;
  /** The row is a refused drop target right now (own-subtree, read-only…). */
  dropRejected: boolean;

  draggable: boolean;
  canToggleHidden: boolean;
  canToggleLocked: boolean;
  canDelete: boolean;
  canRename: boolean;

  onRowPointerDown: (id: TreeNodeId, e: React.MouseEvent) => void;
  onToggleExpand: (id: TreeNodeId) => void;
  onStartRename: (id: TreeNodeId) => void;
  onSubmitRename: (id: TreeNodeId, name: string) => void;
  onCancelRename: () => void;
  onToggleHidden?: (id: TreeNodeId) => void;
  onToggleLocked?: (id: TreeNodeId) => void;
  onDelete?: (ids: TreeNodeId[]) => void;
  onHover?: (id: TreeNodeId | null) => void;
  onContextMenu?: (id: TreeNodeId, e: React.MouseEvent) => void;

  onDragStart: (id: TreeNodeId, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (id: TreeNodeId, hasChildren: boolean, e: React.DragEvent) => void;
  onDrop: (id: TreeNodeId, e: React.DragEvent) => void;

  style?: React.CSSProperties;
};

function TreeRowInner<T>(props: TreeRowProps<T>) {
  const {
    node,
    depth,
    rowId,
    selected,
    focused,
    expanded,
    hasChildren,
    matched,
    level,
    setSize,
    posInSet,
    renaming,
    dropPosition,
    dropRejected,
    draggable,
    canToggleHidden,
    canToggleLocked,
    canDelete,
    canRename,
    onRowPointerDown,
    onToggleExpand,
    onStartRename,
    onSubmitRename,
    onCancelRename,
    onToggleHidden,
    onToggleLocked,
    onDelete,
    onHover,
    onContextMenu,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    style,
  } = props;

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const cls = [
    'ft-row',
    selected && 'ft-row--selected',
    focused && 'ft-row--focused',
    matched && 'ft-row--matched',
    node.hidden && 'ft-row--hidden',
    node.locked && 'ft-row--locked',
    node.disabled && 'ft-row--disabled',
    node.readOnly && 'ft-row--readonly',
    dropPosition && !dropRejected && `ft-row--drop-${dropPosition}`,
    dropRejected && 'ft-row--drop-rejected',
  ]
    .filter(Boolean)
    .join(' ');

  // A row that cannot be reordered still has to accept drops onto it, so the
  // handle disappears but the drop listeners stay.
  const dragEnabled = draggable && !node.readOnly && !renaming;

  return (
    <div
      id={rowId}
      className={cls}
      role="treeitem"
      aria-level={level}
      aria-selected={selected}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      aria-disabled={node.disabled || undefined}
      data-node-id={node.id}
      style={{ ...style, ['--ft-depth' as string]: depth }}
      draggable={dragEnabled || undefined}
      onDragStart={dragEnabled ? (e) => onDragStart(node.id, e) : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      onDragOver={draggable ? (e) => onDragOver(node.id, hasChildren, e) : undefined}
      onDrop={draggable ? (e) => onDrop(node.id, e) : undefined}
      onMouseDown={(e) => onRowPointerDown(node.id, e)}
      onMouseEnter={onHover ? () => onHover(node.id) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
      onContextMenu={onContextMenu ? (e) => onContextMenu(node.id, e) : undefined}
      onDoubleClick={
        canRename && !node.readOnly
          ? (e) => {
              e.stopPropagation();
              onStartRename(node.id);
            }
          : undefined
      }
    >
      <span className="ft-indent" aria-hidden="true" />

      {/* Drag handle — only when onMove is wired up. */}
      {dragEnabled && (
        <span className="ft-grip" aria-hidden="true">
          <GripIcon />
        </span>
      )}

      {/* Disclosure. Kept in the layout (invisible) for leaves so labels line up. */}
      <button
        type="button"
        className={`ft-twisty${hasChildren ? '' : ' ft-twisty--empty'}`}
        tabIndex={-1}
        aria-hidden={!hasChildren}
        title={hasChildren ? (expanded ? 'Collapse' : 'Expand') : undefined}
        onMouseDown={stop}
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) onToggleExpand(node.id);
        }}
      >
        {hasChildren ? expanded ? <ChevronDownIcon /> : <ChevronRightIcon /> : null}
      </button>

      <span className="ft-icon" aria-hidden="true">
        {node.icon ?? (hasChildren ? <FolderIcon /> : <FileIcon />)}
      </span>

      <span className="ft-label-wrap">
        {renaming ? (
          <RenameInput
            initialValue={node.label}
            onSubmit={(name) => onSubmitRename(node.id, name)}
            onCancel={onCancelRename}
          />
        ) : (
          <span className="ft-label" title={node.label}>
            {node.label}
          </span>
        )}
      </span>

      {node.hint != null && node.hint !== '' && !renaming && (
        <span className="ft-hint">{node.hint}</span>
      )}

      {(canToggleHidden || canToggleLocked || canDelete) && !renaming && (
        <span className="ft-actions" onMouseDown={stop} onDoubleClick={stop}>
          {canToggleHidden && (
            <button
              type="button"
              tabIndex={-1}
              className={`ft-act${node.hidden ? ' ft-act--off' : ''}`}
              title={node.hidden ? 'Show' : 'Hide'}
              aria-label={node.hidden ? `Show ${node.label}` : `Hide ${node.label}`}
              aria-pressed={!!node.hidden}
              onClick={(e) => {
                e.stopPropagation();
                onToggleHidden?.(node.id);
              }}
            >
              {node.hidden ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}

          {canToggleLocked && (
            <button
              type="button"
              tabIndex={-1}
              className={`ft-act${node.locked ? ' ft-act--warn' : ''}`}
              title={node.locked ? 'Unlock' : 'Lock'}
              aria-label={node.locked ? `Unlock ${node.label}` : `Lock ${node.label}`}
              aria-pressed={!!node.locked}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLocked?.(node.id);
              }}
            >
              {node.locked ? <LockIcon /> : <UnlockIcon />}
            </button>
          )}

          {canDelete && !node.readOnly && (
            <button
              type="button"
              tabIndex={-1}
              className="ft-act ft-act--danger"
              title="Delete"
              aria-label={`Delete ${node.label}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.([node.id]);
              }}
            >
              <TrashIcon />
            </button>
          )}
        </span>
      )}
    </div>
  );
}

/**
 * Rows are the hot path in a large tree, so only the fields that actually
 * change a row's paint are compared. Same trick the original `LayerTreeItem`
 * used, minus the shape-specific fields.
 */
export const TreeRow = memo(TreeRowInner, (a, b) => {
  return (
    a.node === b.node &&
    a.depth === b.depth &&
    a.selected === b.selected &&
    a.focused === b.focused &&
    a.expanded === b.expanded &&
    a.hasChildren === b.hasChildren &&
    a.matched === b.matched &&
    a.level === b.level &&
    a.setSize === b.setSize &&
    a.posInSet === b.posInSet &&
    a.renaming === b.renaming &&
    a.dropPosition === b.dropPosition &&
    a.dropRejected === b.dropRejected &&
    a.draggable === b.draggable &&
    a.canToggleHidden === b.canToggleHidden &&
    a.canToggleLocked === b.canToggleLocked &&
    a.canDelete === b.canDelete &&
    a.canRename === b.canRename &&
    a.style?.top === b.style?.top
  );
}) as <T>(props: TreeRowProps<T>) => React.ReactElement;
