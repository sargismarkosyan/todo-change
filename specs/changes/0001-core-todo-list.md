# Spec 0001: core todo list

- **Status:** approved
- **Issue:** none — first feature

## Who this is for

Rowan, and all five workflows at once. This is the version where the app first
exists: **Capture**, **Review**, **Complete**, **Prune** and **Return** all come
into being together, because none of them means anything on its own. A list you
can add to but not tick off is not a todo app; one that forgets on reload is not
a tool.

Nothing here is aimed at anyone outside `persona.md`. It is the floor, not a
feature.

## The job behind the request

Rowan needs somewhere to put a thought before it evaporates, and to still find
it there later. Today they use a sticky note, which is fast to write on and easy
to lose. The job is *not* "manage tasks" — it is "stop losing the thing I
thought of ninety seconds ago."

## Why now

The app does nothing. There is no smaller honest starting point: any subset of
this leaves a version that cannot be used for its actual purpose, and the whole
project is built on every version being worth screenshotting.

## The end value

Rowan can keep today's list in a browser tab and trust it. Things they type are
there when they come back; things they finish are visibly finished; things they
no longer care about are gone.

**How we would know it worked:** they stop reaching for the sticky note. In
testing terms — the list survives a reload with its order and ticks intact, and
nothing typed into the box is ever lost.

## What changes

`index.html` becomes a working todo list, replacing the version 0 placeholder.

- A text box and an **Add** button at the top. Enter adds too, so Capture needs
  no mouse.
- Adding puts the todo at the top of the list and empties the box.
- Blank or whitespace-only text does not become a todo.
- Each row shows a checkbox and the todo's text. Ticking marks it done — a line
  through the text, and muted. Unticking reverses it. The row does not move.
- Each row has a delete control that removes that todo, done or not.
- An empty list shows "Nothing to do yet." rather than a blank panel.
- Every change writes to `localStorage`; a reload restores the list exactly.
- Missing, unparseable, or wrongly-shaped stored data opens an empty list
  instead of a broken screen.

**Rules added** — all 14 already written and tagged `@planned`; this change
removes the tags. Two of them were strengthened before approval, keeping their
ids: `complete-marks-done` and `complete-is-reversible` now assert the line
through the text rather than an unspecified "shown as done", and
`recover-from-unreadable-data` gained an example for a partly-bad array. The
strikethrough was in this spec's prose but not in the contract, which meant
nothing would have failed if it went missing — and it is the part of *done* that
does the work at a glance.

| Rule id | Feature file | New or changed |
|---|---|---|
| `add-goes-to-top` | `features/todo/adding.feature` | new |
| `add-clears-the-box` | `features/todo/adding.feature` | new |
| `add-rejects-blank` | `features/todo/adding.feature` | new |
| `complete-marks-done` | `features/todo/completing.feature` | new |
| `complete-is-reversible` | `features/todo/completing.feature` | new |
| `complete-keeps-position` | `features/todo/completing.feature` | new |
| `delete-removes-only-that-one` | `features/todo/deleting.feature` | new |
| `delete-works-on-done-todos` | `features/todo/deleting.feature` | new |
| `empty-state-on-first-visit` | `features/todo/empty-state.feature` | new |
| `empty-state-returns` | `features/todo/empty-state.feature` | new |
| `persist-across-reload` | `features/storage/persistence.feature` | new |
| `persist-deletions` | `features/storage/persistence.feature` | new |
| `recover-from-missing-key` | `features/storage/recovery.feature` | new |
| `recover-from-unreadable-data` | `features/storage/recovery.feature` | new |

## What we are not doing

- **Editing a todo's text.** Deleting and retyping a five-word todo is cheap.
  Worth revisiting when someone reports retyping a long one.
- **Clearing all done todos at once.** Prune works one at a time until the list
  is long enough for that to hurt. Adding it now would be guessing.
- **Filtering or hiding done todos.** They stay visible on purpose — `workflows.md`
  calls them the proof of a day's work.
- **Undo, and a confirmation before delete.** Both add a step to Prune, and
  Rowan's alternative is a sticky note they can crumple without being asked.
- **Reordering, due dates, priorities, counts.** Out of scope for this persona.

## Data

New key `todo-change.todos`, a JSON array ordered newest first:

```json
[{ "id": "1739827200000-9f2c41ab7e0d5c83", "text": "Buy milk", "done": false }]
```

No existing data to migrate — this is the first version to write anything. Ids
are generated once per todo and never reused; rows are addressed by id, never by
text or index.

A stored entry counts as a todo when `id` and `text` are non-empty strings and
`done` is a boolean. On read, entries failing that are dropped and the rest are
kept — a value that is not an array at all yields an empty list. Discarding the
whole list because one neighbour got mangled is the worse of the two failures.

## Risks

Workflow 5 (Return) is the whole exposure. `localStorage` is the only copy, and
a read that throws takes the entire page down with it, because there is nothing
else to render. Hence `recover-from-missing-key` and
`recover-from-unreadable-data` shipping in this same change rather than later —
the failure they prevent is the one that ends trust in the tool.

Second risk: a write that does not happen. Every mutation must persist
immediately, with no save button and no debounce, or a closed tab loses data.

## Acceptance checks

1. Open the app with no stored data. "Nothing to do yet." is visible.
2. Type "Buy milk", press Enter. It appears; the box is empty.
3. Add "Call the bank". It appears above "Buy milk".
4. Tick "Buy milk". It shows as done and stays in place.
5. Reload. Both are there, in the same order, "Buy milk" still ticked.
6. Delete "Call the bank". It goes; reload confirms it stays gone.
7. Press Enter on an empty box, then on one holding only spaces. Nothing is added.
8. Delete the last todo. "Nothing to do yet." comes back.
9. In devtools, set `todo-change.todos` to `{not json` and reload. The app opens
   on an empty list, not a blank screen.
10. In devtools, replace one entry of a two-todo array with `{"nonsense":true}`
    and reload. The other todo is still there.
