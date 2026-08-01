# Event reference

Every callback `FolderTree` can fire, what triggers it, what it hands you, and what the component does to itself before or after calling you.

Three of them are required — `onSelect` is how selection works at all, and `nodes` / `selectedIds` are always yours. **Everything else is optional, and omitting one removes its control from the UI rather than disabling it.** That is the whole design: there is no such thing as a rendered-but-dead affordance in this package.

The tree is fully controlled. It never mutates `nodes`, and it never holds selection. It holds exactly three pieces of its own state: search text (only when you don't control it), expansion (only when you don't control it), and transient UI — which row has the keyboard focus ring, which row is being renamed, and what the current drag is doing.

---

## 1. Selection

### `onSelect(ids: TreeNodeId[], meta: SelectMeta) => void`

**Required.** Fires with the **complete next selection**, never a delta. Assign it straight to state.

```ts
type SelectMeta = {
  multi: boolean;   // Ctrl or Cmd was held
  range: boolean;   // Shift was held
  via: 'pointer' | 'keyboard';
};
```

The tree has already resolved `multi` and `range` into `ids` by the time it calls you — a Shift-click hands you the whole span, a Ctrl-click hands you the previous selection with one id added or removed. `meta` is there for when you want to *react* differently, not to re-implement the arithmetic.

| Trigger                                          | `ids`                                    | `meta`                                  |
| ------------------------------------------------ | ---------------------------------------- | --------------------------------------- |
| Click a row                                      | `[id]`                                   | `{ multi: false, range: false, via: 'pointer' }` |
| Ctrl/Cmd-click a row                             | previous ± that id                       | `{ multi: true, range: false, via: 'pointer' }`  |
| Shift-click a row                                | every visible row between anchor and target | `{ multi: false, range: true, via: 'pointer' }` |
| Ctrl+Shift-click                                 | previous ∪ the span                      | `{ multi: true, range: true, via: 'pointer' }`   |
| <kbd>↓</kbd> <kbd>↑</kbd> <kbd>Home</kbd> <kbd>End</kbd> | `[id]`                          | `{ multi: false, range: false, via: 'keyboard' }` |
| <kbd>Shift</kbd> + <kbd>↓</kbd>/<kbd>↑</kbd>     | the span from the anchor                 | `{ multi: false, range: true, via: 'keyboard' }`  |
| <kbd>Space</kbd>                                 | previous ± the focused id                | `{ multi: true, range: false, via: 'keyboard' }`  |
| <kbd>Ctrl/Cmd</kbd> + <kbd>A</kbd>               | every **visible** row                    | `{ multi: true, range: false, via: 'keyboard' }`  |
| Right-click a row not already selected           | `[id]`                                   | `{ multi: false, range: false, via: 'pointer' }`  |

> **The anchor.** Shift extends from the last row selected without Shift. Every non-range selection moves the anchor; a range selection does not.
>
> **`Ctrl+A` respects the filter.** While a search is active it selects the rows on screen, not the rows in `nodes`.
>
> **Right-click preserves a multi-selection.** Right-clicking a row that is *already* selected fires no `onSelect` at all, so your context menu still sees all five rows the user had picked.

```tsx
<FolderTree
  nodes={nodes}
  selectedIds={selectedIds}
  onSelect={(ids, meta) => {
    setSelectedIds(ids);
    // A keyboard sweep fires once per arrow press — don't re-render the 3D view each time.
    if (meta.via === 'pointer') highlightInViewport(ids);
  }}
/>
```

### Scroll-to-selection

Not a callback, but selection-driven: when `selectedIds` changes from **outside** the tree, the last id in the array is scrolled into view. Changes the tree caused itself are excluded, so clicking row 40 never yanks the scroll position.

Works in virtualised mode too — the row is located by index and the scroll container is positioned directly, whether or not the row is mounted.

---

## 2. Search

### `onSearchChange(value: string) => void`

Fires on every keystroke in the built-in field, and once with `''` when the clear button or <kbd>Escape</kbd> empties it.

Pass `search` to control the query; leave it off and the tree keeps its own copy while still reporting changes. Pass `showSearch={false}` to hide the built-in field entirely and drive `search` from your own chrome.

| You pass                        | Result                                                             |
| ------------------------------- | ------------------------------------------------------------------ |
| nothing                         | Built-in field, tree owns the text.                                |
| `onSearchChange` only           | Built-in field, tree owns the text, you get told.                  |
| `search` + `onSearchChange`     | Built-in field, **you** own the text.                              |
| `search` + `showSearch={false}` | No field; filtering driven entirely from outside.                  |

### What a query does to expansion

Ancestors of every match open automatically. **Nothing is written back** — no `onExpandedChange` fires while searching, and clearing the query restores the exact expansion state from before, including rows the user had deliberately closed.

If the user manually collapses a row that the search opened, it stays closed for as long as that exact query stands, and resets when the query changes.

### What a query does to visibility

| Row                        | Visible? |
| -------------------------- | -------- |
| Matches `label`            | yes, with a highlight ring (`.ft-row--matched`) |
| Matches `keywords`         | yes, with a highlight ring — `keywords` is searched but never drawn |
| Ancestor of a match        | yes, so the hierarchy still reads |
| Descendant of a match      | yes, so opening a folder that matched is not empty |
| None of the above          | no |

Matching is a case-insensitive substring test on `label` and `keywords`. There is no fuzzy matching, and no regex.

---

## 3. Expansion

### `onExpandedChange(ids: TreeNodeId[]) => void`

Fires with the complete next set of expanded ids whenever the user opens or closes a row — by clicking a disclosure triangle, or with <kbd>←</kbd>/<kbd>→</kbd>.

| Prop                 | Effect                                                        |
| -------------------- | ------------------------------------------------------------- |
| `expandedIds`        | Present ⇒ controlled. The tree renders exactly what you pass.  |
| `defaultExpandedIds` | Uncontrolled starting state. Read once, on first render.       |
| neither              | Everything starts collapsed.                                   |

> **Search-driven expansion never reaches this callback.** It is layered on at render time and discarded when the query empties. If you persist `expandedIds` to a store, searching will not dirty it.

---

## 4. Row capabilities

Each of these both *does something* and *draws something*. Omit it and its control is not in the DOM.

### `onRename(id: TreeNodeId, name: string) => void`

Opens an inline input; fires when the user commits.

| Opened by                                    | Committed by                       | Cancelled by                  |
| -------------------------------------------- | ---------------------------------- | ----------------------------- |
| Double-clicking the row, or <kbd>Enter</kbd> on the focused row | <kbd>Enter</kbd>, or blur | <kbd>Escape</kbd> |

- The name is `.trim()`ed. An empty result, or one identical to the current label, **cancels instead of firing**.
- Keystrokes inside the field never reach the tree's navigation handler — you can type `Delete` in a name without deleting the row.
- Rows with `readOnly: true` do not open an editor; neither the double-click nor <kbd>Enter</kbd> does anything.
- Focus returns to the tree when the field closes, so arrow keys keep working.

### `onToggleHidden(id: TreeNodeId) => void`

Draws an eye button on every row. Fires with the id, once, per click. The tree does **not** flip `node.hidden` — you do, and the icon follows on the next render.

A row with `hidden: true` renders its label and icon at `--ft-hidden-opacity`, and its eye stays visible even when the row is not hovered, because that is state rather than chrome.

### `onToggleLocked(id: TreeNodeId) => void`

Draws a padlock button. Same contract: you own `node.locked`. A locked row renders its label italic and keeps its padlock visible at all times.

`locked` is presentational as far as this package is concerned — it does not block dragging, renaming or deletion. If you want it to, gate it in your handlers. `readOnly` is the flag that actually restricts.

### `onDelete(ids: TreeNodeId[]) => void`

Draws a trash button, and enables <kbd>Delete</kbd>/<kbd>Backspace</kbd>.

| Trigger                                  | `ids`                                                       |
| ---------------------------------------- | ----------------------------------------------------------- |
| Trash button on a row                    | `[thatRowId]` — always just that row, even in a multi-selection |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | the whole `selectedIds`, or the focused row if nothing is selected |

`readOnly` rows are filtered out of the keyboard payload and never render a trash button. If everything in the selection is `readOnly`, nothing fires. There is no confirmation prompt — that is your call.

### `onMove(moved: TreeNodeId[], target: TreeNodeId, position: DropPosition) => void`

The only callback that enables a whole interaction layer. With it, rows get `draggable`, a grip handle, drop listeners and drop indicators. Without it, none of that exists in the DOM.

```ts
type DropPosition = 'before' | 'inside' | 'after';
```

| Argument   | Meaning                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `moved`    | Ids being moved, in tree order. More than one if the drag started on a selected row. |
| `target`   | The row that was dropped on.                                            |
| `position` | Where, relative to `target`.                                            |

**Resolving `position`:** the cursor's vertical position in the target row — top 28 % is `before`, bottom 28 % is `after`, the middle is `inside` if the target has a `children` array and `after` if it does not.

**Which rows move:** dragging a row inside the current selection moves the whole selection; dragging an unselected row moves only it — the mousedown that starts the drag selects it first, so `onSelect` fires before `onMove`. `readOnly` rows are stripped from the payload, and a drag consisting only of `readOnly` rows never starts.

**The end zone:** the strip below the last row fires `onMove(moved, lastTopLevelId, 'after')` — how you get a nested node back out to the top level in one gesture.

**`dataTransfer`:** the ids go on `text/plain` as a comma-separated list, and on `DRAG_MIME` (`application/x-jugaaadi-folder-tree`) as JSON. Export `DRAG_MIME` if you need to distinguish this tree's drags from other drag sources on the page.

#### Refusals — the events that deliberately do not fire

| Attempt                                     | What happens                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| Drop a node **inside its own descendant**   | `dragover` never calls `preventDefault()`, so the browser refuses the drop and **no `drop` event is dispatched**. `onMove` cannot fire. |
| Drop a node **before/after its own descendant** | Same. Beside a descendant is still inside the moved subtree.          |
| Drop a node onto itself                     | Same.                                                                    |
| Multi-drag where any dragged node is an ancestor of the target | Same, for the whole drag.                              |
| Drop `inside` a `readOnly` row              | Same. `before`/`after` against it are fine.                              |

While the cursor is over a refused target the row renders `.ft-row--drop-rejected` — a red inset ring and a `not-allowed` cursor — instead of a drop line, so the user sees the refusal before releasing.

The guard (`canDrop`) then runs **again** inside the `drop` handler, and a **third** time inside `moveNodes`. Three layers, because a bad move here silently corrupts the consumer's tree: the moved node and everything under it detach from the root and become unreachable.

```tsx
import { FolderTree, moveNodes } from '@jugaaadi/folder-tree';

<FolderTree
  nodes={nodes}
  selectedIds={selectedIds}
  onSelect={setSelectedIds}
  onMove={(moved, target, position) => {
    setNodes((prev) => moveNodes(prev, moved, target, position));
    undoStack.push({ moved, target, position });
  }}
/>;
```

`moveNodes` returns the **same array reference** when it refuses a move, so `setNodes` bails out of the re-render rather than churning.

---

## 5. Pointer

### `onHoverNode(id: TreeNodeId | null) => void`

Fires with an id on `mouseenter` and with `null` on `mouseleave`. Nothing is attached to any row unless you pass this — no listener, no cost.

Built for linking a tree to a canvas or 3D scene. It fires on every row crossing, so throttle if the handler is expensive.

### `onContextMenu(id: TreeNodeId, e: React.MouseEvent) => void`

Fires on right-click, with the row's id and the raw event. The native menu is **not** suppressed for you — call `e.preventDefault()` yourself.

Selection is settled before this fires: a right-click on an unselected row selects it first (one `onSelect`, then `onContextMenu`); a right-click on an already-selected row leaves the selection alone so your menu can act on all of it.

---

## 6. Ordering guarantees

| Situation                        | Order                                                                  |
| -------------------------------- | ---------------------------------------------------------------------- |
| Right-click on an unselected row | `onSelect` → `onContextMenu`                                           |
| Click a row's trash button       | `onDelete` only — the click never reaches the row, so no `onSelect`    |
| Click a row's eye or padlock     | `onToggleHidden` / `onToggleLocked` only — no `onSelect`               |
| Click a disclosure triangle      | `onExpandedChange` only — no `onSelect`                                |
| <kbd>Delete</kbd> on a selection | `onDelete` only                                                        |
| Rename committed                 | `onRename`, then focus returns to the tree                             |
| A completed drag                 | `onSelect` (from the mousedown that began it) → `onMove`               |
| A refused drag                   | `onSelect` only — no `onMove`                                          |

Action buttons stop propagation, so the row-level handlers behind them never see the click. That is deliberate: toggling visibility on the fourth of five selected rows should not collapse the selection to that one row.

---

## 7. What never fires

- **No `onChange` for `nodes`.** The tree does not own or mutate your data.
- **No expansion events during search.** Auto-expansion is derived and discarded.
- **No `onSelect` on a right-click inside an existing selection.**
- **No event from a key whose callback is missing.** <kbd>Delete</kbd> without `onDelete`, <kbd>Enter</kbd> without `onRename` — both inert.
- **No `drop` event, and therefore no `onMove`, for an illegal target.** The refusal happens at `dragover`.
