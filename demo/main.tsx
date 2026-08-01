import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FolderTree, moveNodes } from '../src';
import type { TreeNode, TreeNodeId } from '../src';
import '../src/folder-tree.css';
import './demo.css';

/** The consumer's own payload — the package never looks inside it. */
type Part = {
  material: 'ply18' | 'ply12' | 'mdf18' | 'edge';
  widthMm: number;
  heightMm: number;
  qty: number;
};

const chip = (color: string) => <span className="chip" style={{ background: color }} />;

const part = (
  id: string,
  label: string,
  color: string,
  data: Part,
  extra: Partial<TreeNode<Part>> = {},
): TreeNode<Part> => ({
  id,
  label,
  icon: chip(color),
  hint: `${data.widthMm} × ${data.heightMm}${data.qty > 1 ? ` ×${data.qty}` : ''}`,
  data,
  ...extra,
});

const initial: TreeNode<Part>[] = [
  {
    id: 'cupboard',
    label: 'Cupboard 900',
    children: [
      {
        id: 'carcass',
        label: 'Carcass',
        keywords: 'box frame',
        children: [
          part('side-l', 'Side · left', '#0ea5e9', {
            material: 'ply18',
            widthMm: 580,
            heightMm: 2100,
            qty: 1,
          }),
          part('side-r', 'Side · right', '#0ea5e9', {
            material: 'ply18',
            widthMm: 580,
            heightMm: 2100,
            qty: 1,
          }),
          part('back', 'Back panel', '#64748b', {
            material: 'mdf18',
            widthMm: 900,
            heightMm: 2100,
            qty: 1,
          }),
          part('top', 'Top', '#0ea5e9', {
            material: 'ply18',
            widthMm: 864,
            heightMm: 580,
            qty: 1,
          }),
          part('bottom', 'Bottom', '#0ea5e9', {
            material: 'ply18',
            widthMm: 864,
            heightMm: 580,
            qty: 1,
          }),
        ],
      },
      {
        id: 'shelving',
        label: 'Shelving',
        children: [
          part('shelf-1', 'Shelf 1', '#a3e635', {
            material: 'ply18',
            widthMm: 864,
            heightMm: 560,
            qty: 1,
          }),
          part('shelf-2', 'Shelf 2', '#a3e635', {
            material: 'ply18',
            widthMm: 864,
            heightMm: 560,
            qty: 1,
          }),
          part('shelf-3', 'Shelf 3', '#a3e635', {
            material: 'ply18',
            widthMm: 864,
            heightMm: 560,
            qty: 1,
          }),
        ],
      },
      {
        id: 'door-assy',
        label: 'Door',
        keywords: 'front hinge handle',
        children: [
          part('door-panel', 'Door panel', '#f59e0b', {
            material: 'ply18',
            widthMm: 894,
            heightMm: 2094,
            qty: 1,
          }),
          part('edging', 'Edge banding', '#f59e0b', {
            material: 'edge',
            widthMm: 22,
            heightMm: 6000,
            qty: 1,
          }),
        ],
      },
      {
        id: 'planks',
        label: 'Loose planks',
        children: [
          part('plank-a', 'Plank A', '#c084fc', {
            material: 'ply12',
            widthMm: 400,
            heightMm: 1200,
            qty: 4,
          }),
          part('plank-b', 'Plank B', '#c084fc', {
            material: 'ply12',
            widthMm: 300,
            heightMm: 900,
            qty: 2,
          }),
        ],
      },
    ],
  },
  part(
    'offcuts',
    'Offcut bin',
    '#475569',
    { material: 'ply18', widthMm: 0, heightMm: 0, qty: 0 },
    { readOnly: true, hint: 'locked', children: [] },
  ),
];

function App() {
  const [nodes, setNodes] = useState(initial);
  const [selectedIds, setSelectedIds] = useState<TreeNodeId[]>(['shelf-2']);
  const [expandedIds, setExpandedIds] = useState<TreeNodeId[]>(['cupboard', 'carcass']);
  const [log, setLog] = useState<string[]>([]);

  const [wireMove, setWireMove] = useState(true);
  const [wireHidden, setWireHidden] = useState(true);
  const [wireLocked, setWireLocked] = useState(true);
  const [wireDelete, setWireDelete] = useState(true);
  const [wireRename, setWireRename] = useState(true);

  const say = (msg: string) => setLog((l) => [msg, ...l].slice(0, 200));

  const patch = (id: TreeNodeId, fn: (n: TreeNode<Part>) => TreeNode<Part>): void => {
    const walk = (list: TreeNode<Part>[]): TreeNode<Part>[] =>
      list.map((n) =>
        n.id === id ? fn(n) : n.children ? { ...n, children: walk(n.children) } : n,
      );
    setNodes(walk);
  };

  const remove = (ids: TreeNodeId[]) => {
    const walk = (list: TreeNode<Part>[]): TreeNode<Part>[] =>
      list
        .filter((n) => !ids.includes(n.id))
        .map((n) => (n.children ? { ...n, children: walk(n.children) } : n));
    setNodes(walk);
  };

  return (
    <div className="wrap">
      <div className="panel">
        <h2>Assembly</h2>
        <div className="toggles">
          <label>
            <input type="checkbox" checked={wireMove} onChange={(e) => setWireMove(e.target.checked)} />
            onMove
          </label>
          <label>
            <input
              type="checkbox"
              checked={wireHidden}
              onChange={(e) => setWireHidden(e.target.checked)}
            />
            onToggleHidden
          </label>
          <label>
            <input
              type="checkbox"
              checked={wireLocked}
              onChange={(e) => setWireLocked(e.target.checked)}
            />
            onToggleLocked
          </label>
          <label>
            <input
              type="checkbox"
              checked={wireDelete}
              onChange={(e) => setWireDelete(e.target.checked)}
            />
            onDelete
          </label>
          <label>
            <input
              type="checkbox"
              checked={wireRename}
              onChange={(e) => setWireRename(e.target.checked)}
            />
            onRename
          </label>
        </div>

        <FolderTree<Part>
          nodes={nodes}
          selectedIds={selectedIds}
          onSelect={(ids, meta) => {
            setSelectedIds(ids);
            say(`select [${ids.join(', ')}] via ${meta.via}${meta.multi ? ' +multi' : ''}${meta.range ? ' +range' : ''}`);
          }}
          expandedIds={expandedIds}
          onExpandedChange={setExpandedIds}
          ariaLabel="Cupboard assembly"
          emptyMessage="No parts match."
          onMove={
            wireMove
              ? (moved, target, position) => {
                  setNodes((prev) => moveNodes(prev, moved, target, position));
                  say(`move [${moved.join(', ')}] → ${position} ${target}`);
                }
              : undefined
          }
          onRename={
            wireRename
              ? (id, name) => {
                  patch(id, (n) => ({ ...n, label: name }));
                  say(`rename ${id} → "${name}"`);
                }
              : undefined
          }
          onToggleHidden={
            wireHidden
              ? (id) => {
                  patch(id, (n) => ({ ...n, hidden: !n.hidden }));
                  say(`toggleHidden ${id}`);
                }
              : undefined
          }
          onToggleLocked={
            wireLocked
              ? (id) => {
                  patch(id, (n) => ({ ...n, locked: !n.locked }));
                  say(`toggleLocked ${id}`);
                }
              : undefined
          }
          onDelete={
            wireDelete
              ? (ids) => {
                  remove(ids);
                  say(`delete [${ids.join(', ')}]`);
                }
              : undefined
          }
          onHoverNode={(id) => id && say(`hover ${id}`)}
          onContextMenu={(id, e) => {
            e.preventDefault();
            say(`contextMenu ${id}`);
          }}
        />
      </div>

      <div className="panel">
        <h2>Events</h2>
        <div className="log">
          {log.map((line, i) => (
            <div key={i}>
              <b>{line.split(' ')[0]}</b> {line.slice(line.indexOf(' ') + 1)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
