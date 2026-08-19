# Spec 0012: somebody else's drag

- **Status:** proposed
- **Issue:** none — direct request, correcting version 0010.

## Who this is for

Nell, in **Tidy** — [workflow 4](../workflows.md) — putting a line where it
belongs. Same job as 0010. This is about it working.

## The job behind the request

**Move a line and have it land where I meant, every time.**

## Why now

The drag written in 0010 is flaky, and the diagnosis is not "needs polish". Six
faults, three of them structural:

- **No `dataTransfer.setData` in `dragstart`.** Firefox will not begin a drag
  without it. The feature simply does not exist there.
- **No drop indicator.** Which side of a line a drop lands on is decided by the
  pointer's Y against the row's midpoint, and *nothing shows it*. The result
  looks random even when it is right.
- **Dead space.** Only a row is a drop target. Releasing in the gap between two
  rows, or in the group's padding, does nothing at all and says nothing.
- A drag image of about ten pixels, so almost nothing follows the pointer.
- A grip that is invisible until hovered and about ten pixels wide.
- No `effectAllowed` or `dropEffect`, so some browsers show a "no drop" cursor
  the entire time.

**These are the parts of a drag a library exists to have already solved.** They
were written by hand because [`setup/constraints.md`](../setup/constraints.md)
said no dependencies, and writing them badly is worse than depending on somebody
who wrote them well. That sentence is the whole argument for this version.

## The end value

A line goes where it is dropped, in every browser, with the landing place
visible before the mouse is released.

**How we would know it worked:** the gesture stops needing a second attempt.
And the check that keeps it honest — the arrow keys still move a line, because
SortableJS has no keyboard support and would otherwise take accessibility with
it.

## What changes

- **SortableJS does the dragging.** Vendored at `vendor/sortable/`, MIT, no
  dependencies of its own, imported as the pre-built ES module it ships. No
  build step, and nothing fetched from anyone else's machine at runtime.
- **The grip stays, and stops hiding.** Bigger, and faintly there before it is
  reached for rather than appearing on hover.
- **A drag starts on the grip and nowhere else.** The words of a line are left
  alone on purpose — see below.
- **The arrow keys are untouched.** They are this app's, and they are now the
  only route that works without a pointer.
- **Groups stay separate.** An ingredient cannot be dropped into the method.
- **Nothing about what a move *means* changes.** Same order, same storage, same
  no-op when a line is dropped where it already was, and a proposal still moves
  without being written down.

### Why the whole row is not the grab area

It is what a library gives by default, it is easier to hit, and it would have
removed the small-target fault outright. It is not taken because **a row that
moves when you press it cannot also be a row you press to change**, and editing
a line — which this app has never had — is worth more than a second place to
start a drag.

That is a bet on a version that does not exist yet. It is written down here so
that if editing never arrives, this decision is revisited rather than inherited.

**Rules added or changed** — the `@rule:` ids in `specs/features/`:

| Rule id | Feature file | New or changed |
|---|---|---|
| `a-line-is-dragged-by-its-grip` | `features/recipes/reordering-by-hand.feature` | new |
| `the-grip-does-not-wait-to-be-found` | `features/recipes/reordering-by-hand.feature` | new |
| `line-moved-within-its-group` | `features/recipes/reordering.feature` | **changed — examples reworded, id kept** |
| `line-moves-only-within-its-group` | `features/recipes/reordering.feature` | **changed — examples reworded, id kept** |
| `moving-changes-nothing-but-the-order` | `features/recipes/reordering.feature` | **changed — examples reworded, id kept** |
| `the-new-order-is-kept` | `features/recipes/reordering.feature` | **changed — examples reworded, id kept** |
| `proposal-can-be-moved` | `features/suggesting/moving-a-proposal.feature` | **changed — examples reworded, id kept** |

The five changed rules say the same things and stop saying them in terms of a
gesture this app no longer owns. Their examples are written against the arrow
keys, which produce the identical result — see *How this is tested*. Reworded in
place in the implementing commit, ids kept, so no test moves.

Prose specs updated in the same pass: the dependency constraint and a new
*A vendored library* section in
[`setup/constraints.md`](../setup/constraints.md); the *Nothing moves*
amendment in [`features/look/spec.md`](../features/look/spec.md); *Ordering* and
a new *The grip, and only the grip* in
[`features/recipes/spec.md`](../features/recipes/spec.md); **the grip** in the
vocabulary in [`spec.md`](../spec.md); and the description in `package.json`,
which claimed zero dependencies.

## What this argues against, out loud

**[`setup/constraints.md`](../setup/constraints.md): "The app ships zero
dependencies."**

Amended, and the heading with it, because it is no longer true and a constraint
that is quietly false is worse than one that has been argued with. The full
argument is in that file under *A vendored library*; the short form is that it
answers two of the three questions the self-hosted font answered — no build
step, nothing fetched from another origin — and **fails the third**. A typeface
is finished. A library gets security and bug fixes, and a vendored copy does not
receive them. That cost is real, it is written down beside the library, and it
is the sentence to quote at the next proposal.

**It lives outside `src/`**, so the 95% coverage gate goes on measuring code
this repo wrote. A minified bundle inside `src/` would either sink the gate or
force it to be gamed.

## How this is tested, and what stops being tested

Worth its own heading because the honest answer is *less than before*.

The five reordering rules are currently tested by dispatching `dragstart` and
`drop` by hand in jsdom — which worked only because the app owned those
handlers. Once SortableJS owns the gesture there is nothing to dispatch: jsdom
has no layout, and the library needs real pointer geometry.

**The rules are tested through the arrow keys instead.** The keyboard path is
this app's, runs in jsdom, and produces the identical state change — the same
`setGroup` on the same entries. What each rule asserts is unchanged; only the
gesture in its examples moves.

**The gesture itself gets no automated cover**, and that is the trade. It is
acceptable for exactly one reason: it is not this repo's code any more. Testing
SortableJS's drag here would be testing SortableJS, which its own suite does. It
is checked by hand in the browser pass, and the acceptance list below is longer
than usual because of it.

## What we are not doing

- **Editing a line.** The reason the grip survived, and the obvious next
  version: a click on the words opens them for correction. Not folded in here —
  it is a different job, it touches storage, and bundling it would mean shipping
  a library swap and a new feature under one screenshot.
- **Dragging by the whole row.** See above.
- **A CDN import.** A second origin on every load, which this repo already
  refused for a font host.
- **npm-installing it at deploy time.** There is no build step and there is not
  going to be one; the file is committed.
- **A second library.** The bar is now written down in
  `setup/constraints.md`; anything that can be written in twenty lines still
  gets written in twenty lines.
- **Touch support as a feature.** It arrives free with the library and is
  welcome, but `persona.md` is one desktop machine and nothing here is specced
  for a finger.
- **Autoscroll during a drag**, unless it comes free. A method long enough to
  need it is longer than this app is for.

## Data

**None.** No storage shape change, no migration. A move still rewrites the order
of one group, exactly as it did.

## Risks

- **Being stuck on a version.** The vendored copy does not get security or bug
  fixes, and nothing in this repo will notice. Mitigated only by writing the
  version and origin beside the file, and by this being the one library.
- **The library mutates the DOM; this app re-renders from state.** SortableJS
  moves the elements itself, and every commit here rebuilds the list with
  `replaceChildren`. The join is `onEnd` → read the new order → change state →
  render, and the instances must be recreated after each render because the rows
  are new elements. Getting that wrong shows up as a line that snaps back, or
  two lists fighting over one row.
- **A gesture with no automated cover.** See above. The first regression in
  dragging will be found by a person, not by CI.
- **The grip is still a small target**, just a better one. If it is still
  awkward in the browser pass, the answer is a bigger grip and not the whole
  row, because the row belongs to editing.
- **Motion.** `features/look/spec.md` allows movement under a finger and
  requires `prefers-reduced-motion` to be honoured; SortableJS animates by
  default and must be configured, not assumed.
- **Workflow 5 (Return): none.**

## Acceptance checks

Longer than usual, because the gesture has no automated cover.

1. Drag a step by its grip to the top. It lands there. Reload — still there.
2. Do the same in **Firefox**. It works, which it never did before.
3. Watch the drop: something shows where the line will land before releasing.
4. Release in the gap between two rows, and in the group's padding below the
   last one. Neither swallows the line silently.
5. Drag a step onto the ingredients. Nothing moves, in either group.
6. Press and drag on the **words** of a line. Nothing moves — that gesture
   belongs to editing.
7. Read a recipe without touching anything: every line shows its grip, and every
   step still shows its number.
8. Tab to a grip and press up and down. The line moves; the ends hold.
9. Draft a recipe, then drag an unaccepted proposal into place. It moves, and
   reloading shows it was never written down.
10. Turn on **Reduce motion** and drag again: it lands with no sliding.
11. Delete a line, add a line, and drag again. The list still responds — the
    library was rebuilt with the rows.
