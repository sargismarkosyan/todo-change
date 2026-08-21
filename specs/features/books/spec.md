# Books — general spec

A book is a named collection of recipes. There is always at least one, exactly
one is open, and the contents on screen is the open one's. Everything in
`../recipes/` describes what happens *inside* a book; nothing there changes
because there is more than one.

This folder was `notepads/` until version 0004. The mechanism is unchanged —
many named containers, one open at a time — and what changed is what it is for:
a notepad was a second sticky note, and a book is an occasion.

## Why more than one

Sweets, Dinner, Chicken. A book is a use case, and the reason to have several is
not filing — it is that deciding what to bake should not mean reading past every
weeknight dinner you have ever written down.

That is the whole of what a book is: a way to look at less. It is not a category
on a recipe, not a filter, not a tag. A recipe is *in* a book the way a page is
in a book, and it never had to be told which one.

## The one thing that must not change

**Writing a recipe down does not gain a decision.** The box asks nothing about
books; a new recipe lands in whichever book is open, because that is the one
being read. `workflows.md` names "a book to pick" as what breaks the first
workflow, and the difference is that the choice happens rarely, at switch time,
not every time something is written down.

If that is ever traded away — a book picker beside the box, a default-book
setting, an "unfiled" book — this feature has cost more than it bought.

## Where it lives on screen

Next to the title, showing the open book's name, and opening a short menu: the
books to switch between, then making, renaming and deleting. It is a menu over
the one page, not a screen to navigate to — the contents stays where it is
behind it. `persona.md` rules out reading a settings screen, and a popover that
is opened for two seconds and closed is not one.

The name of the open book is on screen at all times, because a page of five
recipe names looks much the same in any book, and writing into the wrong one is
the mistake this feature makes possible.

**Switching closes whatever recipe was open.** Another book is another contents
page, and it is read from the top.

## Ordering

Books sit in the order they were made, oldest first, and a new one is appended.
This runs opposite to recipes, which are newest first, for the same reason
recipes are: nothing rearranges itself under the cursor. A book that has just
been written into is the one under the eye; books are made once and then
navigated by remembered position, so the first one stays first.

## Names

One line, trimmed, and that is all that is required of it. Names are not unique
— two books called "Dinner" are allowed, in the same way two recipes may be
called "Apple cake", because a book is addressed by id and never by name. It is
a confusing thing to do rather than an invalid one, and renaming is one click
away.

A blank name is not a name: a book cannot be made or renamed with one, which is
what makes an all-whitespace book impossible.

## Colour

**A book is bound in one of six colours**, and wears it down the binding edge of
the page — the ribbon and the stitching — and beside its name in the book menu.
What that looks like is `../look/spec.md`; what it is *for* is here.

It is for the sentence two sections up: a page of five recipe names looks much
the same in any book, and writing into the wrong one is the mistake this feature
makes possible. Until 0015 the only defence was a name in the masthead, read by
somebody who is looking down the page and typing into a box that never asks. A
colour is seen rather than read, which is the difference.

**Six, not any.** A book is bound in cloth somebody had, not mixed to order. Six
are checked once against the paper — every one clears 3 to 1 against the page and
against the ground — and tell each other apart at the size of a swatch. A colour
picker would move that check onto every read and make "which colours are allowed"
a rule instead of a palette.

**Red is not a choice, it is the absence of one.** The first swatch is the colour
every book has been drawn in since 0005, it is not written down, and a book
nobody colours is the book this app has always drawn. There is nothing to clear
and no third state.

**Only the open book is coloured**, like renaming and deleting, and for the same
reason: the rows used to switch stay clear of controls. A new book is red and is
coloured later or never — the one place this app refuses to add a decision is
making something, and `create-notepad-opens-it-empty` is why.

**Colour never says anything on its own.** Every place a book's colour appears,
its name appears beside it. The tempting next change is a book menu of swatches
with the names dropped, and `colour-is-never-the-only-thing-saying-which-book`
exists to refuse it.

## Deleting, and the size of the mistake

Deleting a book is the largest destructive action in this app. There is still no
undo, so the protection is proportionality rather than ceremony:

- **An empty book** is deleted immediately, with nothing asked. Nothing is at
  stake, and asking would be the confirmation dialog `persona.md` complains
  about.
- **A book with recipes in it** is asked about once, and the question says how
  many recipes go with it. That number is the whole point of the question —
  "are you sure?" is noise, "3 recipes" is information.
- **Only the open book can be deleted**, so the thing being destroyed has been
  read first. It also keeps the delete control away from the rows used to
  switch, where a mis-click would be one pixel from routine.
- **The last book cannot be deleted.** There is always somewhere for a recipe to
  go, so there is no empty state below the empty state.

Deleting one leaves the book before it open, or the first one if it was already
first.

## What a book is not

- **Not a project.** Books do not nest, do not carry state of their own, and do
  not know anything about each other.
- **Not sync.** One browser, one machine, as before. Two tabs on this app still
  overwrite each other — see `../storage/spec.md`, with the sharper edge that
  the two tabs may be on different books and still share one key.

Searching across books — finding one regardless of which book it is in — was
listed here as a real need and a different feature, needing this container to
exist first. It exists, and that feature is version 0008: see
`../finding/spec.md`. It changes nothing above. A search is a way of looking,
results are not the contents, and the box at the top still writes into whichever
book is open.
