# The look — general spec

The app is a recipe book somebody has cooked from. This file says what that
means concretely enough to check by looking, and — more usefully — what the look
is not allowed to cost.

## The parts

- **A paper ground**, warm and grained. The grain is an inline SVG in the
  stylesheet, so nothing is fetched: see `../../setup/constraints.md`.
- **A page** laid on that ground, lighter than it, with the binding stitched
  down its inside edge.
- **One piece of tape** holding the label to the cover. Once, at the top. Tape
  everywhere is a theme; tape once is a book.
- **Index cards.** Every recipe is one — a red margin rule down its left edge, a
  hairline under every ingredient and every step, square corners rather than
  rounded ones.
- **A numbered method**, because a step's position is part of what it says.
- **Two faces.** A book face for everything read, and a second, more written
  face for the things that only label: the title, the book's name, and the two
  group headings.

## What the look is not allowed to cost

Three things, and they are the reason `paper.feature` exists at all.

**The glance stays first.** `spec.md` says the app must be legible at a glance
and from a step back. A warm palette is where that quietly goes: cream on cream
is the most natural mistake in this direction. Every colour a recipe is read in
clears 4.5 to 1 against what it sits on, and that is checked rather than judged.

**Nothing moves.** No rotated cards that straighten when opened, no lift on
hover, no transition on a recipe unfolding. Workflow 3 is reading with your
hands full, and anything that moves while being read is exactly what it says
breaks it.

**Texture never gets under text.** The grain is on the ground and stops there.
The page and the cards are flat, because texture behind words is the fastest way
to lose the thing the words are for.

## Faces, and the fact that we cannot ship one

There is no webfont. A `<link>` to a font host is a request on every load and a
second origin the app depends on, which is the no-backend constraint, and a
font file in the repo is a binary asset in a repository whose whole argument is
readable diffs. Version 0005 was specced without one deliberately.

That has a consequence worth writing down rather than discovering: **the
labelling face is whatever the reader's machine happens to have.** Windows has
Segoe Print, macOS has Bradley Hand and Apple Chancery, and a stripped Linux box
has neither.

So the stack ends in **Palatino, then Georgia, then a generic serif — not in the
`cursive` generic.** `cursive` always matches something, and where nothing
handwritten is installed that something is the default sans, which lands beside
a serif body looking like a mistake rather than a choice. Ending in a book face
means the labels are a deliberate second voice everywhere: real handwriting
where the system has it, a second serif where it does not.

The practical cost is that **a screenshot taken on a machine with no handwriting
installed does not show the handwriting** — the clip in `docs/screenshots/` is
recorded in exactly such an environment. The live page on the reader's own
machine is the one that decides how this looks.

## What is still deliberately plain

The header still says `todo-change`, because that is the repository's name and
renaming it is a different decision. There are no food photographs: bulk in
`localStorage`, against a quota `../storage/spec.md` still lists as unhandled,
and out of scope for the product rather than merely unbuilt.
