# The look — general spec

The app is a recipe book somebody has cooked from. This file says what that
means concretely enough to check by looking, and — more usefully — what the look
is not allowed to cost.

## The parts

- **A paper ground**, warm and grained. The grain is an inline SVG in the
  stylesheet, so nothing is fetched: see `../../setup/constraints.md`.
- **A page** laid on that ground, lighter than it, with the crease the binding
  pulls into the paper and the stitching itself down the inside edge: short
  thread with paper between the stitches, not a dashed border.
- **One piece of tape**, straddling the top edge of the page with torn ends and
  enough translucency to show the paper through. Once, at the top: tape
  everywhere is a theme; tape once is a book. Flat, square-ended and floating
  clear of the edge — which is what 0005 shipped — is a beige rectangle.
- **Index cards.** Every recipe is one — a red margin rule down its left edge, a
  hairline under every ingredient and every step, square corners rather than
  rounded ones.
- **A numbered method**, because a step's position is part of what it says.
  Since 0010 the number is also what the step is taken hold of by, with the grip
  just left of it: the thing that most obviously belongs to a step's position is
  the thing that moves it. The number itself never fades — only the grip does.
- **A cover that says what this is.** The masthead reads *Recipes*. The
  repository is called `todo-change` and says so where it is the repository
  being named — the URL, the README, the storage key — but not on the cover,
  where it contradicted every other thing on the page.
- **Furniture that waits to be reached for.** A filled-in recipe carries eight
  delete crosses down its right-hand side; at full strength they read as an app
  sitting on top of a card. They stay faint until the pointer is on their line
  or they take keyboard focus. Opacity only — this reveals a control, it does
  not move one.
- **Two faces.** A book face for everything read, and a second, more written
  face for the things that only label: the title, the book's name, and the two
  group headings.

## What the look is not allowed to cost

Three things, and they are the reason `paper.feature` exists at all.

**The glance stays first.** `spec.md` says the app must be legible at a glance
and from a step back. A warm palette is where that quietly goes: cream on cream
is the most natural mistake in this direction. Every colour a recipe is read in
clears 4.5 to 1 against what it sits on, and that is checked rather than judged.

**Nothing moves while it is being read.** No rotated cards that straighten when
opened, no lift on hover, no transition on a recipe unfolding. Workflow 3 is
reading with your hands full, and anything that moves while being read is
exactly what it says breaks it.

**Amended in version 0010, and narrowed rather than dropped.** A line being
dragged into place moves, and it has to: a thing you are holding that does not
follow your hand is broken. Since 0012 the moving is SortableJS's rather than
this app's, which changes who writes it and not what is allowed. The distinction
is *who caused it and when*.
Reading never moves — nobody drags a line with the pan on. Editing moves only
under a finger that is deliberately moving it, and stops the instant it is let
go. Everything the original sentence was protecting is still protected.

Two limits keep that honest. The rest of the page stays still while a line is
dragged — no reflow, no lift on anything not being held. And
`prefers-reduced-motion` removes the sliding entirely: the line is simply
somewhere else, which is the same outcome by the same gesture.

**Texture never gets under text.** The grain is on the ground and stops there.
The page and the cards are flat, because texture behind words is the fastest way
to lose the thing the words are for.

## Faces

Two: a book face for everything that is read, and **Caveat** for the four things
that only label — the masthead, the open book's name, the two group headings,
and the empty-book message.

**Caveat is one of this app's own files**, at `src/fonts/`, under the SIL Open
Font License with the licence beside it. It is not linked from a font host, and
that distinction is the whole of the reasoning: a `<link>` to one is a request
on every load and a second origin the app depends on, which is the no-backend
constraint. A file served from this origin is neither. `nothing-is-fetched-from-elsewhere`
is the rule that keeps it that way, and it is written broadly on purpose — it
will fail for the next tempting CDN as well as for this one.

Versions 0005 and 0006 shipped without it, on a stack of whatever handwriting
the reader's machine happened to have. That was wrong in a way worth recording
rather than quietly fixing: on a machine with none — which includes the one the
screenshot series is recorded on — there was no second voice at all, and the two
group headings differed from the lines under them by colour alone. The look was
being carried entirely by palette and rules, and it read as a warm app rather
than as a book.

**The system handwriting names stay in the stack behind Caveat**, and the stack
still ends in Palatino and then a serif rather than the `cursive` generic. That
is the same argument as before, now doing a smaller job: it only matters if the
file fails to load, and where it does the fallback should still be a deliberate
second voice.

**The face never carries anything read while cooking.** A recipe's name, its
ingredients and its method are all set in the book face, and
`handwriting-labels-but-is-not-read` enforces it. Handwriting is legible in
four words and tiring in forty, and workflow 3 is the forty.

## What is still deliberately plain

The header still says `todo-change`, because that is the repository's name and
renaming it is a different decision. There are no food photographs: bulk in
`localStorage`, against a quota `../storage/spec.md` still lists as unhandled,
and out of scope for the product rather than merely unbuilt.
