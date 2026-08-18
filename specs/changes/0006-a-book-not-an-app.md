# Spec 0006: a book, not an app

- **Status:** approved
- **Issue:** [#8](https://github.com/sargismarkosyan/todo-change/issues/8) — a
  second pass on the same half of it that 0005 shipped.

## Who this is for

Nell, in **Browse** — the moment of opening the app and deciding whether this is
a thing worth keeping recipes in. See [persona.md](../persona.md).

Same as 0005, and this spec exists because 0005 did not finish the job. That is
worth stating plainly rather than dressing up as a new idea: the version shipped,
it was looked at, and four things in it were wrong.

## The job behind the request

Unchanged from 0005: **the thing holding my recipes should feel like the thing
it replaced, not like a form I am filling in.**

What changed is the evidence. 0005 was specced from a description and shipped
without anyone looking at the result. Looked at, it reads as a tidy recipe app in
warm colours — not as a book. Four specific things carry that:

1. **The masthead said `todo-change`.** The first thing the eye lands on, in a
   plain serif, contradicting everything under it. 0005 scoped this out on the
   grounds that it is the repository's name. That was the wrong call: a book
   announces itself on its cover, and this one announced a todo app.
2. **The tape read as a beige rectangle.** Flat, square-ended, floating clear of
   the page, attached to nothing.
3. **The binding read as a stray dashed border**, not as stitching, and the page
   had no crease — so it looked like a cream card rather than a page of
   something.
4. **A filled-in recipe carries eight delete crosses down its right-hand side**
   at full strength, which is an app sitting on top of a recipe card.

## Why now

Nothing is broken, and this is the cheapest moment. 0005 is one commit old and
its reasoning is still in front of us; the same fixes found in three versions'
time would be archaeology. It is also the honest thing to do with a version that
was specced without looking: fix it in the open rather than let the screenshot
series carry a weak entry and call it done.

## The end value

Opening the app reads as opening a book: it says *Recipes* on the cover, the tape
holds the page down, the binding is stitched, and the furniture stays out of the
way of the card until it is reached for.

**How we would know it worked:** the masthead no longer contradicts the page
under it, and a filled-in recipe reads as a card with writing on it rather than
as a list with eight buttons beside it. Negatively: nothing gained motion, and
every colour a recipe is read in still clears 4.5 to 1 — 0005's two guarantees
are unchanged and still enforced.

## What changes

- **The masthead reads "Recipes"**, and so does the browser tab. The repository
  is still called `todo-change`, and still says so everywhere it is actually the
  repository being named: the URL, the README, the storage key.
- **The tape straddles the top edge of the page**, with torn ends and enough
  translucency to show the paper through. It holds the page down instead of
  hovering over it.
- **The binding is stitched** — short thread with paper between the stitches —
  and the page carries the crease the binding pulls into it.
- **The delete crosses stay faint until they are reached for**, coming to full
  strength on hover or keyboard focus. Opacity only: this reveals a control, it
  does not move one.
- **An open recipe sits proud of the closed ones** by a slightly deeper shadow.
  A static difference, not a lift on hover.
- **The masthead is bigger**, because it is now a cover rather than a label.

**Rules added or changed:**

| Rule id | Feature file | New or changed |
|---|---|---|
| `the-masthead-names-the-book` | `features/look/paper.feature` | new |

One rule, for the one change here that is a promise rather than a refinement.
The tape, the stitching and the faint crosses are all taste, and taste in a
contract stops the contract being read — they are described in
[`features/look/spec.md`](../features/look/spec.md) where they can be argued
with instead.

## What we are not doing

- **Still no handwriting.** This is the biggest single thing standing between
  the app and the brief, and it is unfinished business rather than a decision
  that has been made well. See *Risks*.
- **No deckle or torn page edge.** Considered; it is fiddly, and the crease plus
  the stitching already carry "page of a book". A ragged edge on top of those
  would be the third thing saying the same word.
- **No rotated cards, no hover lift, no transitions.** Unchanged from 0005 and
  unchanged for the same reason: workflow 3 is reading with your hands full.
- **No change to the tagline**, which still says what the project is.
- **No layout change.** Same column, same order, same controls in the same
  places, again.
- **Nothing about behaviour, data, or copy other than the masthead.**

## Data

None.

## Risks

- **The delete crosses are now discoverable only by hovering.** That is a real
  cost and it is being paid deliberately: the app is a pinned tab on one desktop
  machine, so there is a pointer, and keyboard focus reveals them too. If it
  turns out someone cannot find how to delete an ingredient, that is a report and
  it is this line that predicted it.
- **"Recipes" is a plain name on a cover.** It is honest and it is what such a
  book usually says. If it reads as bland once the handwriting is there, that is
  a change to one word.
- **Still no second voice on machines without handwriting.** The two group
  headings differ from the lines under them by colour alone, which is the
  weakest part of the look and the part this version does not fix.

## Acceptance checks

1. Open the app. The cover says *Recipes*, and the tab does too.
2. The tape sits across the top edge of the page with torn ends, and the paper
   shows through it.
3. The binding reads as stitching, with the page creased beside it.
4. Open a recipe with four ingredients and four steps. The crosses down the
   right are quiet until the pointer is on a line, and the open card sits
   slightly proud of the closed ones below it.
5. Tab through the open recipe with the keyboard. Every cross comes to full
   strength when it takes focus.
6. Watch a recipe open and close. Nothing rotates, lifts, fades or slides.
