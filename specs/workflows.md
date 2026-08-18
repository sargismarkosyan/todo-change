# Workflows

The five things Nell actually does. Specs are written against these, and a
change that does not make one of them shorter, safer, or clearer needs a good
argument.

See [persona.md](persona.md) for who Nell is. These five replace the five
written for Rowan; what happened to each of the old ones is at the bottom.

---

## 1. Write it down — before it is gone

**Trigger.** A recipe arrives. Someone is reading it out, or the thing in the
oven turned out well enough to want again.

**Steps.** Focus the box → type the name → press Enter → the recipe exists.
Then, with it open, the ingredients and the method, one line each.

**Done well.** The name lands in under three seconds, with no mouse and no
decisions, so the rest can be typed at the speed it is being dictated. The new
recipe is visibly *there* — at the top of the contents, where the eye already
is.

**The book it lands in** is whichever one is open, and the box never asks. That
is load-bearing: the choice happens rarely, when switching books, and never
here.

**Where it breaks.** Anything that adds a step: a field that must be clicked, a
book to pick, a quantity split into a number and a unit, a save button. Silent
failure is worse — a recipe that does not appear is one nobody finds out about
until they go looking for it a month later.

**Specs.** `features/recipes/writing.feature`,
`features/recipes/ingredients.feature`, `features/recipes/method.feature`,
`features/books/switching.feature`

---

## 2. Browse — what is in this book?

**Trigger.** Standing at the fridge, deciding what to make.

**Steps.** Open a book. Read the names. Open one.

**Done well.** The contents is a page of names that can be read down in one
pass, and opening one is a single click. The name of the open book is on screen
throughout, because that is what says which book is being looked at.

**Switching books lives here**, and nowhere else. It is the deliberate version
of browsing: "show me the other book".

**Where it breaks.** Every recipe open at once, so there is nothing to read down
— a wall of text is not a contents page. A book that rearranges itself, so what
was second is now fifth. A book that opens onto whatever was left open a
fortnight ago instead of onto its contents.

**Specs.** `features/recipes/reading.feature`,
`features/books/switching.feature`, `features/books/creating.feature`,
`features/recipes/empty-state.feature`

---

## 3. Cook from it — read it with your hands full

**Trigger.** The pan is out.

**Steps.** The recipe is already open. Look at it. Keep looking at it.

**Done well.** Ingredients first, method under them, in the order they happen.
Legible from a step back, without clicking anything, because clicking is what
you cannot do right now.

**Where it breaks.** Anything that needs a hand: a step that must be expanded, a
tick that must be made to see the next line, a screen that has decided you are
finished. Anything that moves while being read.

**This is the workflow the old product had nothing of**, and it is why the
change was worth making. It is also the one with no clicks in it at all, which
makes it the easiest to break without noticing.

**Specs.** `features/recipes/reading.feature`

---

## 4. Tidy — throw out what did not work

**Trigger.** A recipe turned out badly, or a book is called the wrong thing.

**Steps.** Delete the recipe. Rename the book. Rarely, delete a whole book.

**Done well.** Rare, deliberate, and out of the way. This is maintenance, not
hygiene: nothing accumulates here that has to be cleared, because nothing is
finished.

**Where it breaks.** Deleting the wrong thing, which has no undo — and the stakes
are higher than they were, because a recipe may be the only copy of something
somebody dictated once. Deleting a recipe takes its ingredients and its method
with it; the recipe is the unit.

**A whole book can go too**, which is the largest thing this app can destroy. An
empty one goes immediately; one with recipes in it asks once and says how many
are about to go. That is the only question this app asks before deleting
anything, and it is asked because the number is information rather than
ceremony.

**Specs.** `features/recipes/deleting.feature`, `features/books/deleting.feature`,
`features/books/renaming.feature`

---

## 5. Return — come back and find it intact

**Trigger.** Reopening the tab. Tomorrow, next month, after a restart, after a
crash.

**Steps.** Open the app. Look.

**Done well.** Everything is exactly as it was left — same recipes, same order,
same ingredients, same method, and the same book open. Nothing to restore,
nothing to confirm. Recipes saved as todos by an earlier version open as
recipes.

**The gap between visits is now months, not hours**, which makes this the
workflow that carries the most risk in the product. There is no server:
`localStorage` is the only copy, it can be edited in devtools, overwritten by a
second tab, or cleared by the browser. A bad read must still open a usable book
— a blank screen here costs more than any missing feature, because what is lost
is not a list of today's errands.

**Specs.** `features/storage/persistence.feature`,
`features/storage/recovery.feature`,
`features/storage/books-migration.feature`

---

## What happened to the old five

| Rowan's workflow | Nell's | |
|---|---|---|
| 1. Capture | 1. Write it down | Same shape, same three seconds. The thing written is bigger, so the box that starts it matters more, not less. |
| 2. Review | 2. Browse | Was a dozen glances a day at what is left. Is now a deliberate read of a contents page. |
| 3. Complete | — | **Gone.** Nothing is finished, so nothing is ticked. This is the change. |
| 4. Prune | 4. Tidy | Was daily hygiene against accumulation. Is now rare correction; nothing accumulates. |
| 5. Return | 5. Return | Unchanged in shape and more important, because the gap is months. |
| — | 3. Cook from it | **New.** Reading something while doing something else. The old product never did this. |

---

## Reading this as a map

Write it down and Browse are where the value is. Cook from it is what the
writing was for. Tidy is maintenance. Return is the floor everything else stands
on.

Most good changes make writing a recipe down shorter, or make the contents
easier to read down. Most bad ones add a field to the writing to serve something
that happens once a year.
