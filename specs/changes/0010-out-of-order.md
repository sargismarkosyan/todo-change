# Spec 0010: out of order

- **Status:** shipped
- **Issue:** none — direct request.

## Who this is for

Nell, in **Write it down** — [workflow 1](../workflows.md) — and in **Tidy**,
[workflow 4](../workflows.md), which is where it sounds like it belongs and is
not where it mostly happens.

The request reads like maintenance. The moment it actually serves is dictation:
somebody is reading a recipe out over the phone, and they read it out the way
people do — "cream the butter and sugar — oh, and heat the oven first."

## The job behind the request

**Get the lines of a recipe into the order I meant, without typing it again.**

## Why now

Two reasons, and the second is the one that makes it urgent.

**Recipes are not dictated in order.** `persona.md` opens on exactly this: "A
recipe someone is reading out gets written down before they hang up." Nobody
reading a recipe aloud does it in a clean pass. Today the only correction
available is to delete every line after the mistake and retype it — for an
eight-step method with a missing step 2, that is seven deletions and seven
retypes to fix one thing. The alternative is to leave it wrong.

**For the method, wrong order is not untidy, it is incorrect.**
[`features/look/spec.md`](../features/look/spec.md) numbers the steps "because a
step's position is part of what it says." A method in the wrong order is a
recipe that lies, and it lies at the worst possible moment —
[workflow 3](../workflows.md), reading it with the pan already out.

That is the difference between this and reordering a shopping list. Nothing else
in this app can be wrong in that particular way.

## The end value

A line goes where it should go, by dragging it there or by pressing an arrow
key. The retype-the-whole-method workaround stops existing.

**How we would know it worked:** delete-and-retype sequences go to zero, and a
recipe dictated out of order ends up in the right order rather than being left
wrong because fixing it cost more than living with it.

## What changes

- **Every ingredient and every step gets a handle**, furthest left on the line.
  The grip is faint until reached for, the rule
  [`features/look/spec.md`](../features/look/spec.md) already sets for the
  delete crosses.
- **On a step, the number is part of the handle.** Grabbing "2." moves the line
  just as grabbing the grip does — the thing that most obviously belongs to a
  step's position is the thing that moves it. The number does not fade with the
  grip: the method stays numbered whether or not anybody is reaching for it,
  which is what `features/look/spec.md` requires.
- **Dragging a line by its handle drops it elsewhere in its group.**
- **The same handle takes keyboard focus**, and the arrow keys move the line it
  belongs to. One control, two ways to use it — rather than a set of arrows
  sitting next to a drag handle doing the same job twice.
- **A line moves only within its own group.** An ingredient cannot become a
  step. A step dropped among the ingredients changes nothing.
- **The ends hold.** The first line does not move up and the last does not move
  down.
- **Nothing else changes.** Not the text, not the ids, not the recipe's place in
  the contents, not any other recipe.
- **The new order is written down** the moment it changes, like everything else.
- **Writing a line down is unchanged.** It still goes to the bottom of its
  group, from the one box that group has.

**Rules added or changed** — the `@rule:` ids in `specs/features/`:

| Rule id | Feature file | New or changed |
|---|---|---|
| `line-moved-within-its-group` | `features/recipes/reordering.feature` | new |
| `line-moves-only-within-its-group` | `features/recipes/reordering.feature` | new |
| `moving-changes-nothing-but-the-order` | `features/recipes/reordering.feature` | new |
| `the-new-order-is-kept` | `features/recipes/reordering.feature` | new |
| `line-moved-by-keyboard` | `features/recipes/reordering-by-keyboard.feature` | new |
| `the-ends-of-the-group-hold` | `features/recipes/reordering-by-keyboard.feature` | new |

**No existing rule id changes and no existing rule is reworded.**

Prose specs updated in the same pass: the *Nothing moves* decision in
[`features/look/spec.md`](../features/look/spec.md); *Ordering* in
[`features/recipes/spec.md`](../features/recipes/spec.md); workflow 4 in
[`workflows.md`](../workflows.md); and **the handle** in the vocabulary in
[`spec.md`](../spec.md).

## What this argues against, out loud

**[`features/look/spec.md`](../features/look/spec.md): "Nothing moves."**

That sentence was written to protect [workflow 3](../workflows.md) — reading a
recipe with your hands full — and it is amended rather than dropped, because the
thing it protects is untouched. **Nobody drags a line with the pan on.** The
distinction is who caused the movement and when: reading never moves; editing
moves only under a finger deliberately moving it, and stops the moment it is let
go.

Two limits keep that honest, and both are in the look spec: **the rest of the
page stays still** while a line is dragged — no reflow, no lift on anything not
being held — and **`prefers-reduced-motion` removes the sliding entirely**,
leaving the same outcome from the same gesture.

This was chosen deliberately over arrow buttons on every line, which would have
needed no amendment at all. The trade is stated here so it is not rediscovered
as an accident: dragging is what people expect and it is one gesture instead of
several presses, and it costs this product one of its stricter promises.

**[`features/recipes/spec.md`](../features/recipes/spec.md): "nothing
rearranges itself."** Not touched, and worth saying why it looks like it is.
That promise is about *the app* reordering things under somebody's eye. This is
the opposite: the only thing that ever changes the order is a person doing it on
purpose.

## What we are not doing

- **An insert-here control on every line.** Asked for in the same breath as
  reordering — "add new rows in the middle" — and it falls out of reordering for
  free: type at the bottom, then move it up. Building both would put five
  controls on every line of every recipe, and `features/look/spec.md` already
  warns that the delete crosses alone "read as an app sitting on top of a card."
  The cost accepted: inserting near the top of a ten-step method is several
  presses rather than one. Tidy is meant to be rare.
- **A second place to type.** One box per group, at the bottom, unchanged.
- **Reordering recipes in the contents.** The contents is newest-first on
  purpose and an alphabetical one is already noted as its own version in
  `features/recipes/spec.md`. Dragging recipes about is a different feature with
  a different argument.
- **Moving a line between recipes, or between books.** A line belongs to the
  recipe it is in.
- **Undo.** Deleting has none either. A move is cheap to reverse by moving it
  back, which is the whole difference.
- **Touch.** `persona.md` is one machine, one browser, a pinned tab. Pointer and
  keyboard are the two that exist here; a handle that works by touch is worth
  its own version if the app ever leaves the desk.
- **Multi-select, or moving several lines at once.**

## Data

**None.** `ingredients` and `steps` are already ordered arrays and this reorders
them in place. No new key, no migration, no change to what a line is: the same
`id` and the same `text`, in a different position.

This is the first version since 0008 that cannot damage anything already
written down, and it is worth saying because it is the reason the step is cheap.

## Risks

- **A line dropped somewhere nobody meant.** The realistic failure, and there is
  no undo — mitigated only by a move being cheap to reverse, which deleting is
  not. Worth watching at the screenshot pass: if it is easy to drop a step into
  the ingredients by accident, the group boundary is not obvious enough.
- **Three controls where there was one.** A handle and a cross on every line,
  plus the number on every step. `features/look/spec.md` already calls the
  crosses alone "an app sitting on top of a card" at full strength, so the
  handle follows the same waits-to-be-reached-for rule. If the card looks busy
  in the still, that is the finding.
- **Drag is the most code in the app for the least frequent action.** No
  dependencies are allowed, so it is hand-written, and drag has more failure
  modes than a button: a drop outside any target, a drag that starts on the text
  instead of the handle, a pointer released off-window. Each needs a defined
  outcome, and "nothing happens" is an acceptable one for all of them.
- **jsdom does not really implement drag.** The behaviour tests drive the events
  directly, which means they check the app's handling and not the browser's
  gesture. The real-browser pass is doing more work than usual here and the
  keyboard path is the one with honest coverage.
- **Workflow 5 (Return): none.** No storage shape change, no migration.

## Acceptance checks

1. Write down a recipe and give it three steps in the wrong order.
2. Drag the last step to the top by its handle. The method reads in the new
   order and the numbers renumber.
3. Reload. It is still in that order.
4. Drag a step onto the ingredients. Nothing moves, in either group.
5. Drag the first step above itself, and drop a line back where it started.
   Nothing changes and nothing flickers.
6. Tab to a handle. The focus ring is visible. Press up twice — the line climbs
   two places, and the handle still has focus.
7. Press up on the first line and down on the last. Nothing happens, twice.
8. With **Reduce motion** turned on in the OS, drag a line: it lands in the new
   place with no sliding.
9. While dragging, watch the rest of the page: nothing else moves.
10. Add a new line while a recipe has six. It goes to the bottom, as always.
11. Delete a line that was moved. It goes; the rest keep their order.
