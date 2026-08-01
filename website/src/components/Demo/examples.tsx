import React, { useState } from 'react';
import { FolderTree, moveNodes } from '@jugaaadi/folder-tree';
import type { TreeNode, TreeNodeId, DropPosition, SelectMeta } from '@jugaaadi/folder-tree';

const SEED: TreeNode[] = [
  {
    id: 'assets',
    label: 'Assets',
    children: [
      { id: 'logo', label: 'logo.svg', hint: '4 KB' },
      { id: 'hero', label: 'hero.png', hint: '820 KB' },
      {
        id: 'icons',
        label: 'Icons',
        children: [
          { id: 'chev', label: 'chevron.svg', hint: '1 KB' },
          { id: 'star', label: 'star.svg', hint: '1 KB' },
        ],
      },
    ],
  },
  {
    id: 'scenes',
    label: 'Scenes',
    children: [
      { id: 'kitchen', label: 'Kitchen', keywords: 'room interior' },
      { id: 'bedroom', label: 'Bedroom', keywords: 'room interior', locked: true },
      { id: 'garden', label: 'Garden', hidden: true },
    ],
  },
  { id: 'readme', label: 'README.md', hint: '3 KB', readOnly: true },
];

const clone = () => JSON.parse(JSON.stringify(SEED)) as TreeNode[];

/** Everything wired: select, move, rename, hide, lock, delete, search. */
export function FullDemo() {
  const [nodes, setNodes] = useState<TreeNode[]>(clone);
  const [selectedIds, setSelectedIds] = useState<TreeNodeId[]>(['logo']);
  const [search, setSearch] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const say = (m: string) => setLog((l) => [m, ...l].slice(0, 6));

  const patch = (id: TreeNodeId, fn: (n: TreeNode) => void) => {
    const walk = (list: TreeNode[]): TreeNode[] =>
      list.map((n) => {
        if (n.id === id) {
          const copy = { ...n };
          fn(copy);
          return copy;
        }
        return n.children ? { ...n, children: walk(n.children) } : n;
      });
    setNodes((cur) => walk(cur));
  };

  return (
    <div className="demo-split">
      <div className="tree-frame">
        <FolderTree
          nodes={nodes}
          selectedIds={selectedIds}
          onSelect={(ids: TreeNodeId[], meta: SelectMeta) => {
            setSelectedIds(ids);
            say(`select ${ids.length} (${meta.via}${meta.multi ? ', multi' : ''}${meta.range ? ', range' : ''})`);
          }}
          search={search}
          onSearchChange={setSearch}
          defaultExpandedIds={['assets', 'scenes']}
          onMove={(moved: TreeNodeId[], target: TreeNodeId, position: DropPosition) => {
            // moveNodes is the helper — it returns a new tree, guard included.
            setNodes((cur) => moveNodes(cur, moved, target, position));
            say(`move ${moved.join(',')} ${position} ${target}`);
          }}
          onRename={(id, name) => {
            patch(id, (n) => (n.label = name));
            say(`rename ${id} → ${name}`);
          }}
          onToggleHidden={(id) => {
            patch(id, (n) => (n.hidden = !n.hidden));
            say(`hidden ${id}`);
          }}
          onToggleLocked={(id) => {
            patch(id, (n) => (n.locked = !n.locked));
            say(`locked ${id}`);
          }}
          onDelete={(ids) => say(`delete requested: ${ids.join(',')} — the tree is yours, nothing removed`)}
          ariaLabel="Project files"
        />
      </div>
      <div className="demo-readout">
        {log.length === 0 ? <span style={{ opacity: 0.5 }}>callbacks appear here</span> : null}
        {log.map((l, i) => (
          <div key={i} style={{ opacity: 1 - i * 0.13 }}>
            {l}
          </div>
        ))}
        <button className="demo-reset" onClick={() => { setNodes(clone()); setSearch(''); setLog([]); }}>
          reset
        </button>
      </div>
    </div>
  );
}

/** Nothing wired but selection — note the missing controls. */
export function ReadOnlyDemo() {
  const [nodes] = useState<TreeNode[]>(clone);
  const [selectedIds, setSelectedIds] = useState<TreeNodeId[]>([]);

  return (
    <div className="demo-split">
      <div className="tree-frame">
        <FolderTree
          nodes={nodes}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          showSearch={false}
          defaultExpandedIds={['assets']}
          ariaLabel="Read-only files"
        />
      </div>
      <div className="demo-readout">
        <span style={{ opacity: 0.75 }}>
          no onMove → no drag
          <br />
          no onRename → no rename
          <br />
          no onDelete → no delete
          <br />
          no onToggleHidden → no eye
          <br />
          showSearch=false → no field
        </span>
      </div>
    </div>
  );
}

/** Search auto-expands to reveal matches. */
export function SearchDemo() {
  const [nodes] = useState<TreeNode[]>(clone);
  const [selectedIds, setSelectedIds] = useState<TreeNodeId[]>([]);
  const [search, setSearch] = useState('room');

  return (
    <div className="demo-split">
      <div className="tree-frame">
        <FolderTree
          nodes={nodes}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          search={search}
          onSearchChange={setSearch}
          ariaLabel="Searchable files"
        />
      </div>
      <div className="demo-readout">
        searching <b>{search || '—'}</b>
        <br />
        <span style={{ opacity: 0.7 }}>
          Kitchen and Bedroom carry
          <br />
          keywords="room interior",
          <br />
          so they match without
          <br />
          the word being visible.
        </span>
      </div>
    </div>
  );
}
