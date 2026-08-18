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

Ingredients also mean the question "what can I make with chicken" is roughly
answerable without a tag, a field, or a model, and it is worth noticing how much
falls out of text that was already there. Roughly, though, is the limit of it: a
substring matches letters rather than ingredients, so "ice" answers with every
rice and every juice, "egg" with the aubergines, and "salt" with the unsalted
butter. And it takes one term, where a fridge holds several things. That is
where filtering by tag begins — see below.

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

- **Not a home page.** The contents is still the interface and the search box
  sits above it, not in front of it. Making search the front door, with books
  behind it, is issue #10 and a different argument — it takes on
  `setup/constraints.md` ("Single page. No routing, no second page") and
  `spec.md` ("the contents is the interface") together.
- **Not ranked.** Results sit in book order, then contents order. Relevance
  scoring is a guess about intent, and this app has never rearranged anything
  under the cursor.
- **Not an index.** No stored search index, no precomputed tokens. A few books of
  a few dozen recipes is a scan over text already in memory, and anything else
  is a cache that can disagree with the data.
## Searching, and filtering by tag

Both live in this folder, both reach every book, and both put the name of the
book beside what they find. They answer different questions and they are not
combined — picking a tag puts a search away, and searching puts the picked tags
away. See `filtering.feature` and `leaving-a-filter.feature`.

| | A search | A filter |
|---|---|---|
| The question | Where did I put that recipe? | What can I make with this? |
| You start with | a word you remember | a fridge |
| It matches | letters, anywhere in the name or an ingredient | a tag, whole |
| It costs | nothing — the text is already there | the tags had to be added |
| It is wrong by | finding too much: rice for "ice" | finding too little: whatever nobody tagged |

The last row is the one to keep in view. A search cannot miss a recipe it should
have found, because it reads what was typed into the recipe itself. A filter
misses everything untagged, silently, and looks complete while doing it. Neither
replaces the other, and the cheap one is still the one that needs no upkeep.

## What this is not

- **Not a home page.** Issue #10, as above.
- **Not tag management.** No renaming a tag everywhere, no merging two, no list
  of every tag with counts beside it. The tag box offers what is in use and that
  is the whole of the vocabulary's existence; a screen for tending tags is
  filing about filing.
- **Not a shopping list.** A tag index looks one step away from "everything I
  need for these three recipes", and `../../persona.md` rules that out by name.
  Tags find recipes. They do not add up.
