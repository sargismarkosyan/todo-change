@journey:keeping-what-you-cook @persona:nell

# Keeping what you cook

**A journey is orientation, not contract.** Nothing here is asserted and nothing
here is Gherkin, because the thing it carries cannot be checked: the arc, the
timescales, and above all the **seams** — what happens in the gaps between two
workflows, where neither one is at fault.

That is why this layer earns its place rather than being a longer
[`workflows/README.md`](../workflows/README.md). Read
[`../personas/nell.md`](../personas/nell.md) first; this is what they do with the
app over a year, and the workflows are the individual attempts it is made of.

## The arc

**Month one — the drawer moves in.** Nell types in the recipes they can find:
the card in the grandmother's handwriting, four off the phone, three off
screenshots. This is `name-a-recipe` and `fill-a-recipe-in`, back to back,
dozens of times. Books get made as they are needed —
`organise-the-books` — because a recipe turned up that did not belong in the
open one.

**Month two onward — the app stops being written to and starts being read.**
Two visits an evening: one at the fridge, one with the pan on. `find-a-recipe`
is nearly all of it. Recipes arrive one at a time now, from a phone call or from
something that worked, and each one is a single `name-a-recipe` in the middle of
an evening that was about something else.

**March — the archive proves itself, or does not.** Something written down in
October is opened for the first time. Everything about the product either holds
here or is worthless: the name was enough to recognise it by, the ingredients
are the first thing on the card, and it is exactly as it was left. There is no
workflow called "March"; this is `find-a-recipe` arriving at a recipe nobody has
thought about in five months, and the whole of `@guarantee:survives-return`
being cashed in at once.

**The year after.** Books get renamed because what they meant has drifted;
recipes get thrown out because the thing was made once and was not good. Both
are rare, and both are triggered by looking at the shelf rather than by cooking.

## The seams

The seams are the point of this file. None of them belongs to a workflow,
because none of them happens *inside* one.

**Named but never filled in.** `name-a-recipe` ends in three seconds and
`fill-a-recipe-in` takes a dozen submissions, often on another day — so the
second one does not always happen. The result is a book of names with nothing
under them, and **nothing reports it, because nothing went wrong**. Neither
workflow failed. It is live in the seed data today: *Lemon drizzle* is
favourited, opens, and has zero ingredients and zero method.

This is the seam the AI draft (0009) was built for, and it is the reason that
feature is not decoration: it attacks the gap rather than either side of it.

**Found, then not cooked from.** `find-a-recipe` ends when the recipe is open,
which is a minute before the moment that actually matters — hands full, a step
back from the screen. Nothing in `find-a-recipe` can assert that moment, which
is why `@guarantee:readable-while-cooking` exists and why it is asserted
everywhere rather than anywhere.

**Written, then months of nothing.** The gap between visits is the app's
largest risk and the only one no feature is responsible for: `localStorage` is
the only copy, a second tab can overwrite it, and the browser may clear it
without asking. Every workflow ends by coming back and finding things as they
were, because the seam cannot be tested in one place.

**Enough books to need telling apart.** `organise-the-books` is triggered by a
shelf that has quietly stopped reading at a glance — a state nothing produces
deliberately and no workflow leaves you in. It arrives by accumulation, which is
a journey-shaped cause.

## What this file must never become

A list of steps. If a paragraph here can be walked start to finish and stood at
the end of, it is a workflow and belongs in
[`../workflows/`](README.md) with a tag and a gate on it. This file holds only
what is left when every walkable part has been taken out.
