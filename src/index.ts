/**
 * @jugaaadi/folder-tree
 *
 *   import { FolderTree } from '@jugaaadi/folder-tree';
 *   import '@jugaaadi/folder-tree/styles.css';
 *
 * Zero runtime dependencies. React 17+ as a peer.
 */

export { FolderTree, DRAG_MIME } from './FolderTree';

export type {
  TreeNodeId,
  TreeNode,
  DropPosition,
  SelectMeta,
  FolderTreeProps,
  FlatRow,
} from './types';

/**
 * Pure tree helpers. `moveNodes` is the one most consumers want — hand it the
 * arguments `onMove` gave you and it returns the new tree, guard included.
 */
export {
  moveNodes,
  canDrop,
  findNode,
  findNodePath,
  ancestorIds,
  collectDescendantIds,
  isDescendantOf,
  walkTree,
  searchTree,
  nodeMatches,
  flattenVisible,
} from './tree-utils';
export type { SearchResult } from './tree-utils';

/** Default row icons, exported so a consumer can reuse or restyle them. */
export { FolderIcon, FileIcon } from './icons';
