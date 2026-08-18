# Recipes — general spec

A recipe is one thing you can cook. It has a name, the ingredients it takes, and
the method for making it. It lives in a book, and it is kept.

This folder replaces `../todo/`. The todo — a thing you get rid of by finishing
it — is gone, and with it the whole idea of done. What that means, and why the
rules about it were retired rather than reworded, is in
`../../changes/0004-recipe-book.md` and `../RETIRED.md`.

## Nothing is finished

**A recipe has no state.** It is not done, unfinished, started, or made. You
cook it, and afterwards it is exactly the recipe it was before, because you will
cook it again in March.

This is the single largest thing that changed with the product, and it is worth
saying in the negative too: there is no tick box anywhere on the page, on a
recipe, an ingredient, or a step. A tick box is a promise that something can be
got rid of by doing it, and nothing here can.

Ticking steps *while cooking* — a scratch mark that says which pan you are on,
gone by tomorrow — is a real and different idea. It would be state that is never
written down, and it is not in this version. See the change spec.

## The contents, and opening one

The open book shows its recipes as a page of names. That page is **the
contents**, and it is what a list of everything at once cannot be: something you
run your eye down.

Opening a recipe shows it in place, under its name — **ingredients first, then
the method**. That order is not decoration. Ingredients answer "can I make this
tonight", which is the question asked at the contents; the method answers "what
do I do now", which is asked once the decision is made and the pan is out.

One recipe is open at a time, and opening another closes the first. Which one is
open is not written down — it is where you are looking, not what you have, and
coming back to a book you last read a fortnight ago should show you the contents
rather than whatever you happened to leave open.

## Ordering

Recipes sit newest first, and nothing rearranges itself. A recipe just written
down is under the eye, right where the box that wrote it is, so it is visibly
*there* — the same argument the todo list made, and it survives the change of
product intact.

An alphabetical contents is a genuinely better fit for a book that has grown,
and it is a different rule needing its own spec and its own version. It is not
the default now.

Ingredients and the method both run **oldest first**, appended to the bottom of
their own group. A recipe is read top to bottom and a method is a sequence;
reversing either would fight the thing itself.

## Ingredients

One line each, written the way it is said: `200g plain flour`, `3 apples`, `a
good pinch of salt`. **The amount is part of the line, not a field of its own.**

That is a deliberate cheapness. A quantity field wants a number, a unit, and a
name, which is three decisions on the way in and a parser on the way back — and
the moment it exists, someone wants it scaled, converted, and added to a
shopping list. A card written by hand has none of that and is not worse for it.
If scaling ever becomes real, it needs the field, and the field needs its own
spec.

## The method

One line per step, in the order typed. A step is a step of exactly one recipe
and holds nothing of its own — no sub-steps, no ingredients, no state. The cap
is the same one the old product had on nesting, kept for the same reason: a
second level is an outline, and an outline is a project plan.

## Identity

Every recipe, ingredient and step carries an `id` generated once and never
changed. Rows are addressed by id, never by text or index — two recipes may
legitimately be called "Apple cake", and indexes shift the moment something is
deleted.

Ids are unique across every book. A book is not a namespace, and nothing
addresses a recipe by which book it is in.

## Text

One line, stored exactly as typed apart from trimming the ends. No markdown, no
links, no formatting, in a recipe name, an ingredient, or a step. Trimming is
what makes an all-whitespace one impossible.

## Deleting

Immediate and permanent, and there is no undo. Deleting a recipe takes its
ingredients and its method with it — the recipe is the unit, and an orphaned
step is not a state worth having.

The bet the old product made here — that a list this small is cheap to retype —
is **weaker now and should be watched.** A todo was ninety seconds old. A recipe
may be the only copy of something a grandmother dictated once. Nothing changes
in this version, because a confirmation on every delete is exactly the chore the
old persona complained about and the new one inherits the complaint. The first
report of something lost is the report that makes an undo real.
