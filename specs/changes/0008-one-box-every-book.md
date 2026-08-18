# Spec 0008: one box, every book

- **Status:** proposed
- **Issue:** [#9](https://github.com/sargismarkosyan/todo-change/issues/9) — the
  job it opens with. The tagging it asks for is still open there; see *What we
  are not doing*.

## Who this is for

Nell, in **Browse** — [workflow 2](../workflows.md), at the step before the one
it currently describes. Browse today is "open a book, read the names, open one",
which works when the book is known. This is the case where it is not: the recipe
is somewhere, and which somewhere is the missing piece.

[persona.md](../persona.md) lists four things that annoy Nell. **"Hunting for the
recipe they know is in there somewhere"** is the second, and it is the only one
this app has never answered. Their real alternative is a drawer of loose paper,
and the stated bar is "quicker to find than the drawer" — a drawer you have to
riffle through four times is not it.

## The job behind the request

**Get to a recipe I know I wrote down, without first remembering where I filed
it.**

Stated with no solution in it, that is all of it. The request arrived as
"tag ingredients with local browser AI and then filter by them", but the reason
given was "so that if I want to find a recipe regardless of the book that is in
I could do so" — and that reason is served completely by matching text that is
already stored, with no model, no new field, and no browser that gets left out.

The mechanism asked for serves a second, real job — *browsing by what is in the
fridge* — which is a different thing and a different version.

## Why now

Books shipped in 0006, and books are what broke this. One contents page needed no
search. Four do: a recipe is in exactly one of them, the app shows one at a time
on purpose, and switching resets the reader to the top of a fresh contents page.

So the cost today is the whole point of the container being paid back in the one
place it hurts. Finding a half-remembered recipe means opening every book in
turn and reading down each one, and the app actively closes whatever was open
each time it switches. With four books that is four switches and four reads —
worse than the drawer, which at least lets both hands hold paper.

[`features/books/spec.md`](../features/books/spec.md) already predicted this and
wrote it down under *What a book is not*: "**Not searchable across.** Finding a
recipe regardless of which book it is in is a real need and a different feature;
it needs this container to exist first." The container exists.

## The end value

Nell types part of a name — or part of something it takes — and every book
answers at once, each match saying which book it lives in. Opening one lands
them in that book, with the recipe open, ready to cook from.

**How we would know it worked:** the number of books that have to be opened to
reach a half-remembered recipe goes from *all of them* to *none*. And the check
that keeps it honest — after opening a result, the book name on screen is the
book the recipe is in, so the next thing typed cannot land somewhere unexpected.

## What changes

- **A search box between the composer and the contents**, labelled *Find a
  recipe in any book*. It is below the box that writes recipes, not beside it:
  the top of the page stays the three-second capture that
  [workflows.md](../workflows.md) protects, and the finding tool sits with the
  reading rather than the writing.
- **Typing in it replaces the contents with results, from every book.** Live, on
  each keystroke — nothing is submitted, nothing loads.
- **A match is a case-insensitive substring** of the recipe's name or of any of
  its ingredients. Not the method.
- **A result is the recipe's name and the book it is in.** When the match was in
  an ingredient rather than the name, the matching line shows under it.
- **Results sit in book order, then contents order.** Nothing is ranked.
- **Opening a result opens that book with that recipe open**, and clears the
  search.
- **Nothing found says so** — "No recipe matches that." — which is not the
  book's empty state and must not be confused with it.
- **Emptying the search puts the contents back exactly as it was**, including
  whatever recipe was open before.
- **Writing a recipe down, or switching books, ends the search**, so a new
  recipe is visibly at the top of the contents where it was promised to be.

**Rules added or changed** — the `@rule:` ids in `specs/features/`:

| Rule id | Feature file | New or changed |
|---|---|---|
| `search-reaches-every-book` | `features/finding/searching.feature` | new |
| `search-matches-what-it-takes` | `features/finding/searching.feature` | new |
| `search-finds-nothing` | `features/finding/searching.feature` | new |
| `search-opens-it-where-it-lives` | `features/finding/leaving-a-search.feature` | new |
| `search-clears-back-to-the-contents` | `features/finding/leaving-a-search.feature` | new |
| `search-does-not-outlast-what-follows-it` | `features/finding/leaving-a-search.feature` | new |
| `switch-shows-only-that-notepad` | `features/books/switching.feature` | changed — reworded, id kept |

That last one said "The open book's recipes are the only ones on screen", which
this makes false. It is reworded in place to be about **the contents** — which is
what it was always guarding — and the feature now names searching as the one
thing that reaches past it. The id does not change, so its test does not move.

Prose specs updated in the same pass: a new
[`features/finding/spec.md`](../features/finding/spec.md), the *Not searchable
across* paragraph in [`features/books/spec.md`](../features/books/spec.md),
workflow 2 in [`workflows.md`](../workflows.md), and two words of vocabulary in
[`spec.md`](../spec.md).

## What we are not doing

- **Tags on recipes.** The literal ask, and still open on #9. A tag is a stored
  field, an editing affordance, and a rendering on the card — a version of its
  own, and it serves *browse by what I have* rather than *find what I am
  thinking of*. Notably, searching ingredients answers a good part of it for
  free: "chicken" already finds everything with chicken in it.
- **AI-suggested tags.** The third piece of #9, and the one that argues with
  [`setup/constraints.md`](../setup/constraints.md). It cannot be started before
  tags exist to suggest, and when it is, it needs its own spec making the case
  out loud — including what happens in the browsers that will never have a
  model, which is most of them.
- **Search as the home page.** Issue #10. The search box sits above the
  contents; it does not replace it, and books do not become a second page. That
  request takes on "Single page" and "the contents is the interface" together,
  and deserves its own argument.
- **Matching the method.** Ruled out on purpose — "oven" would match most of a
  baking book and identify nothing.
- **Relevance ranking, fuzzy matching, typo tolerance.** A guess about intent,
  in an app whose one ordering promise is that nothing rearranges itself.
- **Searching from the keyboard with a shortcut**, recent searches, or a search
  history. History is the thing this app has never kept, and a shortcut is worth
  its own look once the box has been used.
- **Editing anything in a result.** No deleting from the results, no adding an
  ingredient there. A result is a way to get somewhere.

## Data

**None.** The `localStorage` shape is untouched, nothing new is stored, and no
read path changes. What is typed into the search box lives as long as the tab
does, exactly like which recipe is open.

This is the first version since 0004 that cannot damage stored data, and it is
worth saying because it is the reason the step is cheap.

## Risks

- **Workflow 5 (Return): none.** Nothing is written, nothing is read, no
  migration. A browser opening this version sees precisely what it saw in 0007.
- **Two boxes near the top of the page.** The real risk of this change: a recipe
  name typed into the search box instead of the composer. Mitigated by
  separation (the search box is below the contents' heading area, not beside the
  composer), by a placeholder that says what it is for, and by the search box
  having no Add button — nothing it can do creates anything. Worth watching in
  the screenshot pass, because the cost lands on the workflow this app is most
  protective of.
- **Searching hides the contents.** A search on screen means the open book's
  contents is not. Every exit puts it back, and the three that matter are
  specced rather than left to the implementation: clearing, writing, switching.
- **Nothing found reading as nothing stored.** "No recipe matches that." is one
  message away from "No recipes in this book yet.", and a person who reads the
  wrong one thinks the book emptied itself. They are different strings and the
  rule asserts both — the second must not appear during a search.

## Acceptance checks

1. Make a second book. Put "Roast chicken" in it. Go back to the first book.
2. Type "chick" into the search box. The result appears with **Dinner** beside
   it, without the book having been opened.
3. Click it. The book on screen is now Dinner, the recipe is open, its method is
   readable, and the search box is empty.
4. Open "Apple cake", add "200g plain flour" to it, close nothing. Search
   "flour". The result is Apple cake, with "200g plain flour" shown under it.
5. Search "apple". The result is Apple cake with no line under it — the name is
   its own explanation.
6. Search "paella". "No recipe matches that." — and not the empty-book message.
7. Empty the box. The contents comes back with whatever was open still open.
8. Search "chicken", then type "Bakewell tart" into the composer and press
   Enter. The search is gone and Bakewell tart is at the top of the contents.
9. Reload. Nothing about the search survived, and every recipe is where it was.
