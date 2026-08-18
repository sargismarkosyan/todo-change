# Spec 0011: in its place

- **Status:** shipped
- **Issue:** none — direct request, correcting version 0009.

## Who this is for

Nell, in **Write it down** — [workflow 1](../workflows.md), filling in a recipe
that is already part written.

## The job behind the request

**End up with the method in the order it should be in, without doing the
ordering myself.**

## Why now

**The model already knows where its lines go, and the app throws that away.**

That is the whole of it. Asked to fill in a method that says "heat the oven"
and "bake for 45 minutes", a model knows that rubbing the butter in belongs
between them. Version 0009 asked only *what is missing*, got a flat list back,
and piled it at the foot of the group — discarding the placement before it ever
reached the screen. Then accepting a line appended it, discarding the placement
a second time.

**What that costs today:** every accepted line has to be dragged into position
by hand. For a five-line draft into a three-step method that is five presses and
roughly ten drags, to put things where the machine had already put them.

It is worth being exact that this is a **correction, not a new capability**.
Nothing here asks the model for anything it did not already know; it asks it to
say so, and asks the app to stop losing it.

## The end value

A draft is drawn as one list: your lines and the model's, in one run of numbers,
reading as the method would read if you took the lot. Take one out of the middle
and it stays in the middle. Take the lot in one press and the method is written.

**How we would know it worked:** the drag-every-accepted-line-into-place step
disappears. The check that keeps it honest is that a proposal is still not a
line — reload with a draft on screen and the recipe is exactly as it was.

## What changes

### A proposal sits where it belongs

- **Each drafted line comes back with the place it should take**, and is drawn
  there — between the existing lines, at the top, wherever the model put it.
- **One list, one run of numbers.** A method's numbers count proposals too, so
  the method reads as it would read if the draft were taken. They shift while a
  draft is on screen and shift back when it is dismissed.
- **The place is an index, not a quotation.** Naming the line to follow would
  mean quoting your text back exactly, and one wrong character puts the line
  nowhere. An index cannot be misspelt.
- **An index that is not there lands last** rather than vanishing — including no
  index at all, or a nonsense one. That matters because a recipe can be typed
  into while the model is still writing.
- **Read once, then anchored.** The index is resolved against the group as it
  stands when the draft arrives; after that the proposal sits with its neighbour
  and travels with it.

### Accepting keeps the place

- **A line taken out of the middle is written into the middle.** Not appended.
- **Taken out of order, they still land in the drafted order**, because each one
  goes to its own place rather than onto the end of a pile.

### The whole draft can be taken at once

- **One press takes the lot**, each line landing where it sat. A bare recipe
  drafted from nothing is a page of proposals that are all wanted, and taking
  them one at a time is ceremony rather than care.
- **One at a time still works**, for when only some are right.

### A proposal can be moved before it is accepted

- **By its handle, or with the arrow keys** — the same control 0010 gave every
  other line.
- **Moving one writes nothing down.** A proposal dragged the length of the
  method is still a proposal.

**Rules added or changed** — the `@rule:` ids in `specs/features/`:

| Rule id | Feature file | New or changed |
|---|---|---|
| `draft-lands-where-the-model-put-it` | `features/suggesting/placing-a-draft.feature` | new |
| `draft-index-out-of-range-lands-last` | `features/suggesting/placing-a-draft.feature` | new |
| `draft-taken-whole` | `features/suggesting/taking-a-draft.feature` | new |
| `proposal-can-be-moved` | `features/suggesting/moving-a-proposal.feature` | new |
| `draft-accepted-line-by-line` | `features/suggesting/drafting.feature` | **changed — reworded in the implementing commit, id kept** |

That last one currently reads "A proposal becomes a line only when it is taken,
one at a time" and its examples assert that accepted lines append. The rule is
live and has tests, so it stays true in this spec commit and is reworded in
place when the behaviour changes — the same move
[spec 0008](0008-one-box-every-book.md) made with
`switch-shows-only-that-notepad`. The id does not change, so its test does not
move.

Prose specs updated in the same pass: placement, the index argument and
accepting-in-place in
[`features/suggesting/spec.md`](../features/suggesting/spec.md); the
bottom-of-the-group sentence in
[`features/recipes/spec.md`](../features/recipes/spec.md); and **a proposal** in
the vocabulary in [`spec.md`](../spec.md).

## What this argues against, out loud

**[`features/suggesting/spec.md`](../features/suggesting/spec.md), version
0009: "Accepted lines append the way typed ones do — oldest first, because a
method is a sequence."**

Half right, and the wrong half was load-bearing. A method *is* a sequence, which
is precisely why appending is wrong: the sequence has a shape, the model was
told to respect it, and then the app flattened it. Appending is correct for a
line **you type**, because the bottom is where typing lands and you can see it
land. It is not correct for a line whose position was the point.

**[`features/look/spec.md`](../features/look/spec.md): "A numbered method,
because a step's position is part of what it says."** Untouched and leaned on.
It is the argument for numbering the proposals in the same run: a proposal that
sat outside the numbering would be a step whose position said nothing, which is
the one thing that file says a step cannot be.

The cost is that the numbers move while a draft is on screen. That is accepted
because it is not a reading moment — nobody drafts a recipe with the pan on —
and because a draft that did not renumber would be showing a method that does
not exist.

## What we are not doing

- **Accepting at the bottom and dragging into place.** What 0010 already makes
  possible, and the cheaper answer by a distance — no model changes, no merged
  list, no proposals in the numbering. It is rejected because it makes the
  person redo work the machine already did, every line, every time. Recorded
  because it is the version to fall back to if the merged list proves confusing.
- **Letting the model reorder lines you wrote.** It says where *its* lines go.
  Yours stay where you put them, and a draft still never removes or moves them.
- **Editing a proposal before accepting it.** Take it and edit the line, or
  ignore it and type your own.
- **Marking which accepted lines came from a draft.** Decided in 0009 and
  unchanged: once accepted, a line is a line.
- **Proposals across groups.** An ingredient proposal cannot be dragged into the
  method, exactly as a line cannot.
- **Re-drafting into an existing draft.** One draft at a time; dismiss it and
  press again.

## Data

**None.** Proposals are never stored — that is the guarantee this version has to
be most careful not to break, since they now sit inside the list rather than
beside it. Accepting writes an ordinary line into the group's array at a
position, where before it wrote one onto the end. Same shape, same `id` and
`text`, no new key, no migration.

## Risks

- **A proposal that looks like a line.** The sharpest risk of the whole version:
  it now sits *in* the list, numbered with everything else, so "is this in my
  recipe or not?" is a question a person can get wrong — and getting it wrong
  means cooking from a step nobody accepted. Dashed throughout, and a reload
  check is in the acceptance list.
- **"Take all" is the press that writes an unread recipe into the book.** Named
  here rather than hidden: per-line acceptance existed exactly to prevent that,
  and this version adds a way around it because a bare recipe makes twelve
  presses ceremony. The mitigation is that it is a second, separate control and
  never the default.
- **Numbers moving under the eye.** Mitigated by when it happens rather than by
  design: drafting is not a reading moment.
- **An index resolved against a list that has moved on.** Clamping means it
  always lands somewhere, but somewhere is not always right — a line typed in
  while the model was writing can shift what index 2 meant. Anchoring after the
  first resolve limits the drift to that one window.
- **Workflow 5 (Return): none.** Nothing new is stored.

## Acceptance checks

1. Give a recipe two steps. Draft it. Proposals appear *between* them where the
   model put them, dashed, and the numbers count them.
2. Reload without accepting. The recipe has exactly the two steps it had.
3. Draft again and accept one proposal from the middle. It stays in the middle.
   Reload — still there, still in the middle.
4. Draft again and accept two proposals bottom-first. They land in the drafted
   order, not the order you pressed.
5. Drag a proposal above another line, then accept it. It stays where you put
   it.
6. Drag a proposal, then reload without accepting. Nothing was written.
7. Press **Take all** on a bare recipe. The whole method is written, in order,
   and no proposals remain.
8. Type a line by hand while a draft is on screen. It goes to the bottom, as
   always.
9. Try to drag an ingredient proposal into the method. Nothing happens.
10. **In Firefox or Safari:** no draft control at all, and the recipe behaves
    exactly as it did.
