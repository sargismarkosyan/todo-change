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

**Where it also breaks, quietly.** The name takes three seconds and the rest
takes a dozen submissions, so this workflow half-finishes: a book of names with
nothing under them, which nothing reports because nothing went wrong. Since
0009, a machine that has a model can draft the ingredients and the method in one
press, accepted a line at a time — see
`features/suggesting/spec.md`. It is an accelerator on the long half and it
changes nothing about the first three seconds: the box still takes a name and
Enter, and never asks anything else.

**Where it breaks.** Anything that adds a step: a field that must be clicked, a
book to pick, a quantity split into a number and a unit, a save button. Silent
failure is worse — a recipe that does not appear is one nobody finds out about
until they go looking for it a month later.

**The box lives in a book, and since 0013 the app has a front door that is not
one.** The three seconds are unchanged for the way this app is actually opened: a
pinned tab holds the address of the book it was left on, so reopening it lands in
that book with the box under the cursor. What did move is the cost of arriving at
`#/` instead — one click into a book before there is anywhere to type. That is the
trade this file warns about most, taken deliberately and only for the arrival
case; see `features/home/spec.md` for why the home cannot hold the box.

**Specs.** `features/recipes/writing.feature`,
`features/recipes/ingredients.feature`, `features/recipes/method.feature`,
`features/books/switching.feature`, `features/suggesting/drafting.feature`,
`features/suggesting/turning-a-draft-down.feature`

---

## 2. Browse — what is in this book?

**Trigger.** Standing at the fridge, deciding what to make.

**Steps.** Open a book. Read the names. Open one.

**Done well.** The contents is a page of names that can be read down in one
pass, and opening one is a single click. The name of the open book is on screen
throughout, because that is what says which book is being looked at.

**Switching books lives here**, and nowhere else. It is the deliberate version
of browsing: "show me the other book".

**Since 0015 a book says which one it is without being read.** Every book is
bound in one of six colours, worn down the binding edge of the page and beside
its name in the book menu. It changes no step above — it takes the glance that
used to go up to the masthead, and it is what makes "show me the other book" a
thing you point at rather than a list of names you read.

**When there is nothing in mind at all**, it starts before the first step. The
trigger is the fridge door, and "open a book" already assumes an answer — which
book, and therefore roughly what for. The home is the version with no assumption
in it: three recipes from any book, each saying which book it is in, arrived at by
opening the app and nothing else. It reaches into a book nobody has opened since
March, which is the one thing neither browsing nor searching does.

**When the book is not known**, this runs the other way round. The recipe is
somewhere and the book is the missing piece, so the steps are: type part of the
name, or part of something it takes → read the matches, each one saying which
book it is in → open it, and land in that book with it open. That is the same
workflow arriving from the other end, and it is the one thing in the app that
reaches past the open book.

**Where it breaks.** Every recipe open at once, so there is nothing to read down
— a wall of text is not a contents page. A book that rearranges itself, so what
was second is now fifth. A book that opens onto whatever was left open a
fortnight ago instead of onto its contents. And, since books exist, having to
open all of them to find one thing — which is what searching is for.

**Specs.** `features/recipes/reading.feature`,
`features/books/switching.feature`, `features/books/creating.feature`,
`features/recipes/empty-state.feature`, `features/finding/searching.feature`,
`features/finding/leaving-a-search.feature`,
`features/home/starting-from.feature`, `features/home/routes.feature`,
`features/look/telling-books-apart.feature`

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

**Steps.** Delete the recipe. Rename the book. Colour the book. Rarely, delete a
whole book.

**Colouring is the mildest thing in this workflow**, added in 0015 and the only
one of them that destroys nothing: one press on a swatch in the book menu, on the
book already open, undone by pressing another. It is here rather than in workflow
1 because it is done once to a book and then never again — and it pays off in
workflow 2, which is the shape renaming has too.

**Done well.** Rare, deliberate, and out of the way. This is maintenance, not
hygiene: nothing accumulates here that has to be cleared, because nothing is
finished.

**Putting a line right lives here too**, since 0010. A recipe is dictated out of
order — "cream the butter and sugar, oh, and heat the oven first" — and until
then the only fix was deleting every line after the mistake and typing them
again. A line is now dragged into place, or moved with the arrow keys. For the
method that is a correctness fix rather than a tidiness one: the steps are
numbered because position is part of what a step says.

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
`features/books/renaming.feature`, `features/books/colouring.feature`,
`features/recipes/reordering.feature`,
`features/recipes/reordering-by-keyboard.feature`

---

## 5. Return — come back and find it intact

**Trigger.** Reopening the tab. Tomorrow, next month, after a restart, after a
crash.

**Steps.** Open the app. Look.

**Done well.** Everything is exactly as it was left — same recipes, same order,
same ingredients, same method, and the same book open. Since 0013 **the address
is part of where you were**: a pinned tab on `#/book/<id>` reopens on that book
rather than on whatever storage was last told, and one opened at the root reopens
on the front door. A draft nobody accepted
is not among them: proposals are never written down. Nothing to restore,
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
`features/storage/books-migration.feature`, `features/home/routes.feature`

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
