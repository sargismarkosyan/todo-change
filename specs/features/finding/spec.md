# Finding — general spec

Everything in `../recipes/` describes what happens inside a book, and everything
in `../books/` describes the container. **This folder is the one thing that
reaches across them**: a way to find a recipe without first knowing which book
it is in.

It exists because books created the problem. Before version 0006 there was one
contents page and nothing to search; now there are several, and a recipe you
cannot place is one you have to go looking for book by book. `persona.md` names
"hunting for the recipe they know is in there somewhere" as one of the four
things that annoy Nell, and books made that worse before this made it better.

## A search is a way of looking, not a thing you have

Nothing about a search is written down. It is screen state, exactly like which
recipe is open — the same argument, in `../recipes/spec.md`: it is where the
reader is looking, not something they own. Closing the tab ends it, and there is
no search history, no recent searches, and no saved search.

That is also what makes this version free of risk to workflow 5: the stored
shape does not change, so nothing that already exists can be read wrong.

## What it matches

The recipe's **name** and its **ingredients**. Case-insensitive, and a substring
rather than a whole word — "lemon" finds "Lemon drizzle", and "chick" finds
"Roast chicken", because a half-remembered name is usually half a word too.

**Not the method.** A method is full of oven, bowl, minutes and salt; matching it
would return most of the book for terms that identify nothing. Ingredients are
different — what a recipe takes is how it is chosen, which is why they sit above
the method when one is open.

Ingredients also mean the question "what can I make with chicken" is already
answerable, without a tag, a field, or a model. That was the larger half of
issue #9, and it is worth noticing how much of it falls out of text that was
already there.

## What a result says

The recipe's name and **the book it is in**. The book name is not decoration:
"find it regardless of which book" is only useful if the answer says which one,
and it is the thing the person searching did not know.

When the match was in an ingredient rather than the name, the result also shows
that line — otherwise a result reading "Thursday casserole" for a search of
"chicken" looks like a bug. A name match shows no line, because the name already
shows why it is there.

## Opening one

Opening a result **switches to that book and opens the recipe in it**. It does
not show the recipe inside the search.

That is deliberate, and it is about the next thing that happens rather than this
one. The box at the top writes into whichever book is open — `../books/spec.md`
calls that the one thing that must not change — so a recipe read out of a
context with no book behind it is a recipe written into a book nobody chose. One
invariant holds instead: **what is on screen is always in the open book.**

For the same reason, anything that follows a search ends it. Writing a recipe
down clears it, because `workflows.md` promises a new recipe is visibly there at
the top of the contents, and it cannot be if a search is covering the contents.
Switching books clears it, because another book is another contents page.

## What this is not

- **The front door as well, since 0013.** This said searching was *not a home
  page* — the contents is the interface, the box sits above it, and making search
  the front door was issue #10 and a different argument. That argument was made,
  in [change 0013](../../changes/0013-a-front-door.md), and it went the other
  way: the home is a search box with three recipes under it, and a book is where
  the contents lives. See `../home/spec.md`.

  **Nothing here changed.** The same box, the same matching, the same results, in
  two places now. What differs is only what comes back when it is emptied — the
  picks on the home, the contents in a book — because that is what was there
  before it was typed into.
- **Not ranked.** Results sit in book order, then contents order. Relevance
  scoring is a guess about intent, and this app has never rearranged anything
  under the cursor. The picks on the home are arbitrary rather than ranked, which
  is a different thing and held still for a day precisely so it stays one.
- **Not an index.** No stored search index, no precomputed tokens. A few books of
  a few dozen recipes is a scan over text already in memory, and anything else
  is a cache that can disagree with the data.
- **Not tags.** Tagging recipes by ingredient, and filtering by those tags, is
  the other half of issue #9. It serves browsing by what is in the fridge rather
  than finding what is already in mind, and it needs its own version — with a
  stored field, which this has none of.
