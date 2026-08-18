# Spec 0005: paper and ink

- **Status:** approved
- **Issue:** [#8](https://github.com/sargismarkosyan/todo-change/issues/8) — the
  half of it that 0004 deliberately left out.

## Who this is for

Nell, across all five workflows and none of them in particular. See
[persona.md](../persona.md).

This is the one change in the repo so far that does not make a workflow shorter,
and pretending otherwise would be the dishonest way to write this section. What
it does is make the thing worth opening. Nell's alternative is a drawer of paper
and a phone full of screenshots, and the drawer wins on charm every time —
version 0004 shipped a recipe book that looked like a form.

There is one workflow claim, and it is small but real: **Browse** (step: reading
the contents down) and **Cook from it** (step: reading with your hands full) are
both reading, and 0004 set them in the system UI face at 16px on a flat white
card. A book face at 17px on a warm ground with a ruled card under each line is
easier to read across a kitchen than that was.

## The job behind the request

From #8, in the reporter's own words: *"adjust the UI to look more of granny
recepy book"*. Stated without naming a solution: **the thing holding my recipes
should feel like the thing it replaced, not like a form I am filling in.**

That is a real job even though it is not a task. The drawer of paper is not
kept because it is efficient — it is kept because it is pleasant to open, and an
app that is unpleasant to open loses to it regardless of what it can do.

## Why now

Nothing is broken. This is the second half of a request that was deliberately
split, and it is the half that was promised.

0004 changed every noun in the product and left the screen looking exactly as it
did in 0003. That was the right call — one muddled screenshot instead of two
clear ones — but it means the current version is the least convincing entry in
the series: a recipe book in a todo app's clothes. The deliverable of this repo
is the screenshot series, and this is the version that pays 0004 back.

Doing it now rather than later also keeps the promise concrete while the
decisions behind it are still fresh — the direction and the typeface constraint
were both settled during 0004 and recorded there so they would not be
relitigated.

## The end value

Opening the app feels like opening a recipe book: a grained paper ground, a page
laid on it, index cards with a red margin rule, one piece of tape. The recipe
Nell is cooking from is set in a book face on a ruled card, which is easier to
read at arm's length than the version before it.

**How we would know it worked:** the version's screenshot is distinguishable
from 0001–0004 at thumbnail size, which none of those four are from each other.
Negatively, and this is the half that gets checked rather than judged: every
colour a recipe is read in still clears 4.5 to 1, nothing on screen moves that
did not move before, and no request leaves the machine to fetch any of it.

## What changes

Only `src/styles.css`. No markup, no behaviour, no data, no copy.

- **A warm, grained paper ground.** The grain is an inline SVG data URI in the
  stylesheet — no fetch, no second origin, no binary in the repo.
- **A page**, lighter than the ground, laid on it with a soft shadow and the
  binding stitched down its inside edge.
- **One piece of tape** at the top, holding the label to the cover.
- **Recipes become index cards:** a red margin rule down the left edge, a
  hairline under every ingredient and every step, square corners instead of
  rounded, a slightly heavier shadow.
- **The method's numbers go red**, so the sequence reads before the words do.
- **Two faces.** A book face — Iowan/Palatino/Georgia — for everything that is
  read. A second, more written face for the three things that only label: the
  title, the book's name, and the "Ingredients" and "Method" headings.
- **The accent turns from green to a faded red**, on the Add button, the margin
  rules, the headings and the step numbers.

**Rules added or changed:**

| Rule id | Feature file | New or changed |
|---|---|---|
| `paper-under-everything` | `features/look/paper.feature` | new |
| `ink-reads-on-paper` | `features/look/paper.feature` | new |
| `handwriting-labels-but-is-not-read` | `features/look/paper.feature` | new |

**Three rules for a whole re-skin is the point, not an oversight.** A look is
mostly taste, and taste in a contract is how a contract stops being read. These
three are the part that is not taste: the guarantees a future palette or a
fancier face is not allowed to break, because breaking them costs the glance
rather than the mood. Everything else about the look lives in
`features/look/spec.md`, where it can be argued with.

New prose: [`features/look/spec.md`](../features/look/spec.md).

## What we are not doing

- **No webfont, and no font file in the repo.** A `<link>` to a font host is a
  request on every load and a second origin the app depends on; a `.woff2` is a
  binary asset in a repository whose whole argument is readable diffs. This was
  decided when 0004 was specced and is not being reopened here — it is recorded
  in `features/look/spec.md` along with what it costs.
- **No rotated cards, no hover lift, no transitions.** Every one of them was
  considered and every one of them moves something while it is being read, which
  is what workflow 3 says breaks it.
- **No texture under text.** The grain is on the ground and stops there.
- **No dark theme.** A recipe book is not lit from behind. If someone cooks in
  the dark, that is a report and its own version.
- **No food photographs.** Same answer as 0004: bulk in `localStorage`, against
  a quota that is still unhandled.
- **No change to the markup or the copy.** The header still reads
  `todo-change`, which is the repository's name; renaming the product on screen
  is a different decision and would want its own spec.
- **No layout change.** Same one column, same order, same controls in the same
  places. This version changes how it looks and nothing about where anything is.

## Data

None. Nothing about storage, the shape, or the migrations is touched by this
change.

## Risks

- **The labelling face is a lottery on machines without handwriting.** Windows
  has Segoe Print, macOS has Bradley Hand; a stripped Linux box has neither and
  falls back to the second serif. The stack deliberately ends in Palatino rather
  than the `cursive` generic so the fallback is a choice rather than whatever
  `cursive` maps to — but **the clip in `docs/screenshots/` is recorded in an
  environment with no handwriting installed, so it does not show any.** The live
  page on the reader's own machine is the one that decides how this looks.
- **Warm on warm is where legibility goes.** Cream text on a cream card is the
  natural failure of this whole direction. `ink-reads-on-paper` is the guard,
  and it is computed from the declared palette rather than eyeballed.
- **Taste is not testable and this spec does not pretend it is.** If the tape
  reads as a gimmick or the grain as noise, no rule will catch it. That is what
  the screenshot pass is for, and it is the honest limit of this change.
- **Nothing about behaviour changes, so nothing about behaviour is re-checked.**
  If this version breaks something, it will be visual and a gate will not see
  it.

## Acceptance checks

1. Open the app. It reads as paper: a grained ground, a lighter page on it, one
   piece of tape, stitching down the inside edge.
2. A recipe is an index card — red rule down its left edge, a hairline under
   every ingredient and every step, square corners.
3. Open one. The method is numbered in red, and the two headings are set in a
   different face from the lines under them.
4. Stand back a step and read the open recipe. It should be easier than it was
   in 0004, not harder.
5. Watch a recipe open and close. Nothing rotates, lifts, fades or slides.
6. In devtools, confirm the network panel shows no font or image request — the
   grain is inline and both faces are the machine's own.
7. On Windows or macOS, confirm the title and the two headings render in real
   handwriting. On a machine without it, confirm they fall back to a serif that
   still reads as a second voice rather than as a mistake.
8. Take the screenshot. It should be tellable apart from versions 1–4 at
   thumbnail size, which is the whole point of this one.
