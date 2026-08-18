# Spec 0002: sub-todos

- **Status:** proposed
- **Issue:** none — direct request

## Who this is for

Rowan, in **Capture** (step: what arrives is one thought, not one action) and
**Complete** (step: the tick, and what it closes out). It touches **Prune** and
**Return** as consequences rather than as goals.

**This widens the persona, and that has to be said out loud.** Until this
change, `persona.md` listed sub-tasks under *Not for → Project tracking*. The
widening is deliberate and narrow: a todo may hold **one flat level** of
sub-todos, and a sub-todo may hold none. The rest of that boundary — no
dependencies, no milestones, no estimates — stands exactly as it was, and the
depth cap is what keeps this on the right side of it. Two levels is an outline;
an outline is a project plan; a project plan is a different product.

The argument for widening is that the old boundary was drawn against a *use*
(running projects) but written as a *shape* (nesting), and it caught something
Rowan genuinely does. "Sort out the car insurance" is one item on their list and
three things to do. That is not project tracking. It is one sticky note with
three lines on it, which is exactly the bar `persona.md` sets.

## The job behind the request

Some of what Rowan captures is a single thought that takes more than one action.
Written as one line, it tells them nothing about how far in they are — it looks
identical on day one and on day three, so the only way to know is to remember.
Written as three separate lines, the connection between them exists only in
Rowan's head, and no single moment says *that whole thing is finished*.

The job: **hold one thing that takes several actions, see how far into it I am,
and get one clean "done" when it is over.**

## Why now

Nothing is broken. This is a capability gap, and it should be labelled as one.

What it costs today is small and repeated: a multi-step todo sits in the list
looking exactly as it did when it was written, so Review (workflow 2) stops
being answerable at a glance for that row. Rowan's workaround — several adjacent
todos, held together only by newest-first ordering — mostly works on a
five-to-fifteen item list, which is precisely why this is an improvement and not
a fix. What the workaround never gives is the closing tick: with three separate
lines there is no row that means "the car insurance is sorted."

## The end value

Rowan can put a multi-step thing in the list as one thing, see at a glance which
of its steps are left, and finish it with the same click that finishes the last
step. The list stays a list of things they mean to do, not a list of fragments.

**How we would know it worked:** a todo that would previously have been written
as three adjacent lines is written as one with three under it — and closing it
takes one tick fewer than the number of steps, because the last step closes the
parent. Negatively: the top box behaves exactly as it did, and Capture for a
plain one-line todo is unchanged in every measurable way.

## What changes

- Each todo row gains a control that opens a small box beneath it for typing a
  sub-todo. **The box at the top of the list is untouched** — it still creates
  one plain todo and asks nothing.
- Sub-todos render indented under their parent, in the order they were typed
  (oldest first — the opposite of the top-level list, argued in
  `features/todo/spec.md`).
- Blank or whitespace-only sub-todo text is rejected, like the main box.
- Sub-todos do not offer a control of their own. One level, enforced in the UI.
- A parent with sub-todos is done exactly when all of them are done:
  - ticking the last unfinished sub-todo marks the parent done;
  - unticking any sub-todo makes the parent unfinished;
  - ticking the parent ticks every sub-todo, and unticking it clears them;
  - adding a sub-todo to a done parent makes it unfinished.
- Deleting a sub-todo re-settles the parent against what is left. Deleting a
  parent deletes its sub-todos with it. A parent that loses its last sub-todo
  becomes an ordinary todo and keeps the state it had.
- Nesting persists across a reload, and broken nesting in stored data still
  opens a usable list.

**Rules added or changed** — the `@rule:` ids in `specs/features/`:

| Rule id | Feature file | New or changed |
|---|---|---|
| `sub-todo-added-under-parent` | `features/todo/sub-todos.feature` | new |
| `sub-todos-keep-typing-order` | `features/todo/sub-todos.feature` | new |
| `sub-todo-rejects-blank` | `features/todo/sub-todos.feature` | new |
| `sub-todo-depth-is-one` | `features/todo/sub-todos.feature` | new |
| `parent-done-when-all-sub-todos-done` | `features/todo/sub-todos-completing.feature` | new |
| `parent-reopens-when-a-sub-todo-is-unticked` | `features/todo/sub-todos-completing.feature` | new |
| `ticking-parent-ticks-sub-todos` | `features/todo/sub-todos-completing.feature` | new |
| `new-sub-todo-reopens-parent` | `features/todo/sub-todos-completing.feature` | new |
| `deleting-sub-todos-settles-the-parent` | `features/todo/sub-todos-completing.feature` | new |
| `delete-parent-deletes-sub-todos` | `features/todo/deleting.feature` | new |
| `persist-sub-todos` | `features/storage/persistence.feature` | new |
| `recover-from-bad-sub-todos` | `features/storage/recovery.feature` | new |

No existing rule id changes, and no existing rule is reworded. Prose specs
updated in the same pass: `persona.md` (the widening), `workflows.md` (Capture,
Complete, Prune), `spec.md` (storage contract, vocabulary), and
`features/todo/spec.md` (ordering, nesting, the done invariant, deletion).

**On the size of this step.** Twelve rules is larger than a change spec here
should usually be, and it was tested against a split — nesting first, the done
invariant second. It does not split: the intermediate version would ship a
parent that can be ticked while its steps stay open, which contradicts the very
next version and is not a screenshot anyone should take. The step was shrunk in
the other direction instead, in *What we are not doing*.

## What we are not doing

- **More than one level.** Not now, not later. This is the boundary, not a
  starting point.
- **Promoting or demoting an existing todo.** No dragging a todo under another,
  no lifting a sub-todo out. Sub-todos are created as sub-todos. If Rowan gets
  it wrong, the fix is delete and retype, which on one line is cheap.
- **Reordering sub-todos.** They sit in the order typed. Same argument as the
  main list: nothing rearranges itself.
- **Collapsing or hiding a group.** A parent with two steps under it is three
  short lines. Collapse earns its place on a list that is too long to read, and
  that list is out of scope by persona.
- **A progress count ("1 of 3").** The ticks are already visible directly
  beneath the parent, and the count would restate them in the row that has the
  least room. Worth revisiting only if groups turn out to run longer than
  expected.
- **Editing todo text.** Still not a feature; unchanged by this.
- **A confirmation when deleting a parent with sub-todos.** Tempting, because
  one click now removes several lines — but `persona.md` names confirmation
  dialogs as the thing that turns Prune into a chore. Left out deliberately, and
  flagged under *Risks* as the most likely thing to come back.

## Data

`localStorage`, key `todo-change.todos`, unchanged in kind. Each todo gains an
**optional** `subTodos` array:

```json
[
  { "id": "…", "text": "Buy milk", "done": false },
  {
    "id": "…",
    "text": "Sort out car insurance",
    "done": false,
    "subTodos": [{ "id": "…", "text": "Call current insurer", "done": true }]
  }
]
```

**Existing data needs no migration.** A todo without the key is a todo with no
sub-todos, which is exactly what every currently stored todo means. Nothing is
rewritten on read, and a list written by the previous version opens identically.

A sub-todo has the same shape as a todo and never carries its own `subTodos`;
one found in stored data is ignored rather than honoured, so no reachable state
exists that the screen cannot draw. Ids remain unique across the whole file,
parents and sub-todos alike — a sub-todo is addressed by id like anything else.

On read, `subTodos` that is not an array is treated as absent, entries that are
not valid todos are dropped, and a parent's `done` is recomputed from the
sub-todos that survive. Stored data is untrusted, so the invariant is restored
rather than believed.

## Risks

- **Return (workflow 5) is the one that matters.** The read path gains a nested
  shape to validate, and a bug there is a blank screen rather than a missing
  feature. `recover-from-bad-sub-todos` covers non-array, junk-entry, and
  disagreeing-state cases; the write path is unchanged in kind.
- **Old data.** Low risk by construction — the key is optional and absence is
  meaningful — but the check is worth doing by hand: open a list saved by the
  current live version and confirm it is untouched.
- **Deleting a parent now destroys more than one line, with no undo.** This is
  the sharpest edge in the change and it is going in unguarded on purpose. If
  the human loses something real during testing, that is a bug report and
  probably an undo spec, not a patch to this one.
- **Capture regression.** The top box gains a neighbour on every row. The check
  is that adding a plain todo still needs no mouse and no decision; if the new
  control competes for the eye or the tab order, that is a failure of this
  change even if every rule passes.
- **A busier row.** Every todo now carries an add control it will mostly never
  use. Review is the workflow that pays for that, and it is the one no test can
  fail — it needs the screenshot pass.

## Acceptance checks

1. Add a plain todo the way you always do — type, Enter. Nothing about it feels
   different, and no mouse was needed.
2. Add "Sort out car insurance". Use its row control to add "Call current
   insurer", then "Compare two quotes". They appear under it, in that order, and
   the parent has not moved.
3. Tick "Call current insurer". The parent is still unfinished. Tick "Compare
   two quotes". The parent goes done on its own.
4. Untick "Call current insurer". The parent reopens.
5. Tick the parent directly. Both steps go done. Untick it. Both reopen.
6. With the parent ticked, add a third step. The parent reopens; the two
   finished steps stay finished.
7. Reload. Everything above is exactly as you left it — order, nesting, ticks.
8. Confirm a sub-todo offers no way to add a sub-todo of its own.
9. Delete the parent. All of it goes, in one click, with no confirmation.
10. In devtools, set `todo-change.todos` to `[{"id":"a","text":"x","done":true,
    "subTodos":"nope"}]` and reload. A usable list opens with "x" and no
    sub-todos.
11. Open a list saved by the currently live version. It reads exactly as before.
