# Spec 0009: what is in the fridge

- **Status:** shipped
- **Issue:** [#9](https://github.com/sargismarkosyan/todo-change/issues/9) — all
  of it this time. Version 0008 took the reason the issue gave and served it
  with a search box, deliberately leaving the three things it actually asked
  for. This is those three.

## Why this is one version and not four

**It breaks the one-change-one-version rule**, and it does so on purpose, with
approval, after the alternative was put and turned down. Saying that out loud is
the price of doing it — the same move [spec 0002](0002-sub-todos.md) made against
`persona.md` rather than quietly contradicting it.

The argument for splitting was the ordinary one: tags, then filtering, then
suggestion, three screenshots, each working on its own. The argument against is
specific to this feature and is not merely scheduling:

**Tags without suggestion are a worse product than no tags.** Tagging is typing
"chicken" underneath a line that already reads "2 free-range chicken thighs",
and `persona.md` names *"retyping something they already wrote down"* first among
what annoys Nell. A version that shipped that and promised the fix later would
have shipped the annoyance and called it progress. The two belong in one step
because one of them is the answer to the strongest objection to the other.

Filtering is in the same step for a blunter reason: **tags that cannot be
filtered by are decoration.** A version that only displayed them would have no
end value to state, and this template refuses to be filled in for one.

What that costs, and it is a real cost: this is the largest step in the repo —
17 new rules across five feature files, against 6 for 0008. It is one screenshot
of a screen that changed in three places, and if any part of it slips, the
version is not shippable in pieces. That is the trade, made knowingly.

## Who this is for

Nell, in **Browse** — [workflow 2](../workflows.md), at its stated trigger:
*"Standing at the fridge, deciding what to make."*

Every way into the app so far starts from a recipe. The contents starts from a
name you can see; the search from 0008 starts from a word you remember. Both
assume there is a recipe in mind. At the fridge there is not — there is half a
chicken and two lemons, and the question runs the other way.

`persona.md` describes that moment as one of the two times a day the app is
opened. It is the moment the product has never answered.

## The job behind the request

**Decide what to cook out of what is actually in the house, without reading
every book to find out what uses it.**

No solution in that sentence, and note what is not in it either: not "find a
recipe" — 0008 does that — and not "organise my recipes". Nothing here is about
filing. The end of this job is a pan on the stove.

**What they do today instead:** open each book in turn and open recipes one at a
time to read the ingredients, or give up and cook one of the four things they
can remember. The drawer of loose paper is no worse at this, which is the bar
`persona.md` sets.

## Why now

0008 shipped a search that reads ingredients, and it does answer part of this —
`chicken` finds recipes with chicken in them. It is worth being exact about
where that stops, because it is the whole case for this version:

- **It matches letters, not ingredients.** `ice` answers with every rice and
  every juice. `egg` finds the aubergines. `salt` finds the unsalted butter.
  Noise that has to be read past is the thing a contents page exists to avoid.
- **It takes one term.** A fridge holds several things and the question is what
  they add up to. There is no way to ask for chicken *and* lemon.
- **You cannot type a word you have not thought of.** A search box is a box that
  requires you to already have the word. Standing at the fridge, the word is
  what is missing.
- **The vocabulary is invisible.** Nothing on screen tells you that eleven
  recipes across four books involve lemon, so nothing prompts the question.

None of those are bugs in 0008. They are what a substring search is, and they
are why the issue asked for tags in the first place.

## The end value

Nell names what is in the fridge — picking the words off a list rather than
recalling them — and every book answers at once with what takes all of them.
Writing those words down is a press of a button on machines that can, and typing
one word on machines that cannot.

**How we would know it worked:** something gets cooked that was not one of the
four things they always cook. Observable in the app: a recipe reached by picking
two tags, from a book that was not open, without a recipe name having been
thought of first — and, at the fridge, no book opened at all.

## What changes

### A recipe carries tags

- **A tag is one word**, lower case, trimmed, and held once per recipe. Typed
  into an open recipe, exactly the way an ingredient is.
- **Tags sit under the name, on the card as well as on the open recipe** —
  visible while reading the contents, which is what "alongside the cards" in the
  issue asked for and what makes the vocabulary visible at all.
- **A tag has no id.** The word is the identity, which is what makes "chicken"
  on two recipes the same tag and filtering by it mean anything.
- **Nothing derives a tag from an ingredient**, and an ingredient line is never
  rewritten. Reading one out of the other is the parser
  [`features/recipes/spec.md`](../features/recipes/spec.md) refuses to grow.
- **Removed only from an open recipe.** The contents is read down, not edited in
  passing.

### The browser's model proposes them

- **A control on an open recipe asks for tags**, from the recipe's name and its
  ingredients. It exists only where there is a model.
- **Nothing proposed is a tag.** Suggestions are accepted one word at a time. A
  wrong tag nobody approved makes the filter lie quietly, and there is no undo
  anywhere in this app.
- **Where there is no model, there is nothing** — no control, no disabled
  button, no line explaining what this browser cannot do. Tagging by hand is
  unchanged and is how tagging works for most people.
- **Fetching a model is the one thing in the app that can be slow**, and it says
  so. Nothing else waits on it, ever.
- Full detail, including the verified API surface, is in
  [`features/suggesting/spec.md`](../features/suggesting/spec.md).

### Filtering by them, across every book

- **A tag box below the search box**, holding the picked tags and offering the
  ones in use, alphabetically. It is not on screen at all until something is
  tagged.
- **Typing narrows the offer**, on the letters, immediately.
- **A model, if there is one, adds related tags underneath** — "pig" pointing at
  the tag "pork" you already wrote. It can only ever point at a tag that exists;
  it never mints one. These arrive after and never hold up the letters.
- **Picking a tag replaces the contents with results**, from every book, each
  saying which book it is in — the same result shape 0008 established.
- **Picking a second narrows to what carries both.**
- **Nothing carrying all of them** says "No recipe takes all of those." — not
  the search's message and not the book's empty state.
- **Opening a result opens that book with that recipe open**, and clears the
  filter.
- **A search and a filter replace each other**, and writing a recipe down or
  switching books ends both.

**Rules added or changed** — the `@rule:` ids in `specs/features/`:

| Rule id | Feature file | New or changed |
|---|---|---|
| `tag-added-to-recipe` | `features/recipes/tags.feature` | new |
| `a-tag-is-a-word-not-a-line` | `features/recipes/tags.feature` | new |
| `tags-show-on-the-card` | `features/recipes/tags.feature` | new |
| `tag-removed-from-recipe` | `features/recipes/tags.feature` | new |
| `filter-reaches-every-book` | `features/finding/filtering.feature` | new |
| `filter-combines-tags` | `features/finding/filtering.feature` | new |
| `filter-finds-nothing` | `features/finding/filtering.feature` | new |
| `filter-offers-only-tags-in-use` | `features/finding/filtering.feature` | new |
| `filter-opens-it-where-it-lives` | `features/finding/leaving-a-filter.feature` | new |
| `one-way-of-looking-at-a-time` | `features/finding/leaving-a-filter.feature` | new |
| `suggestions-are-not-tags-until-accepted` | `features/suggesting/tags.feature` | new |
| `suggesting-needs-a-model` | `features/suggesting/tags.feature` | new |
| `suggesting-says-when-it-cannot` | `features/suggesting/tags.feature` | new |
| `the-model-is-the-one-slow-thing` | `features/suggesting/tags.feature` | new |
| `related-tags-never-hold-anything-up` | `features/suggesting/related-words.feature` | new |
| `related-tags-are-tags-that-exist` | `features/suggesting/related-words.feature` | new |
| `no-model-no-related-tags` | `features/suggesting/related-words.feature` | new |

**No existing rule id changes, and no existing rule is reworded.** One example
title in `features/recipes/reading.feature` was — "a closed recipe is only its
name" stopped being true of a tagged one — and its assertions and its rule's id
are untouched, so no test moves.

Prose specs updated in the same pass: a new
[`features/suggesting/spec.md`](../features/suggesting/spec.md); the storage
contract, the *Instant* promise and the vocabulary in [`spec.md`](../spec.md);
workflow 2 and workflow 5 in [`workflows.md`](../workflows.md); a *Tags* section
and two paragraphs in
[`features/recipes/spec.md`](../features/recipes/spec.md); the *not a tag*
paragraph in [`features/books/spec.md`](../features/books/spec.md); the search
versus filter comparison in
[`features/finding/spec.md`](../features/finding/spec.md); and a new constraint
section in [`setup/constraints.md`](../setup/constraints.md).

## What we are not doing

- **Deriving tags from ingredient text without a model.** Stripping "2 free-range
  chicken thighs" down to "chicken" needs to know that "free-range" is not the
  ingredient and "2" is a count. That is the parser `features/recipes/spec.md`
  refuses, it would be wrong silently, and issue #9 said the same thing from the
  other direction: store the tags, do not recompute them.
- **Auto-tagging.** Nothing the model proposes is written down without being
  accepted. This is the single most important thing this version does not do.
- **Tag management.** No renaming a tag everywhere, no merging two, no list of
  every tag with counts. The tags in use are the whole of the vocabulary's
  existence; a screen for tending tags is filing about filing.
- **Ranking, fuzzy matching, or partial tag matches in the results.** A tag
  matches whole. Nothing in this app rearranges itself.
- **OR across tags.** Picking two means both. "Either" is a different question
  and nobody at a fridge is asking it.
- **Tags on a book.** A book is an occasion and a tag is an ingredient; that
  boundary is written down in `features/books/spec.md` and this version keeps
  it.
- **Suggesting anything other than tags** — not an ingredient, not a step, not a
  recipe name, not a book. `persona.md`: typing it out is how it ends up in your
  words.
- **A hosted model, an API key, or a bundled one.** No model on the machine
  means no suggestion. See `setup/constraints.md`.
- **A shopping list.** A tag index looks one step from "everything I need for
  these three recipes". `persona.md` rules it out by name.
- **Search as the home page.** Still issue #10, still its own argument.

## Data

**The stored shape gains one optional key.** A recipe may carry `tags`: an array
of plain strings, lower case, trimmed, each present at most once.

```json
{
  "id": "1739827200000-9f2c41ab7e0d5c83",
  "name": "Apple cake",
  "tags": ["apple", "cake"],
  "ingredients": [ … ],
  "steps": [ … ]
}
```

- **Absent means none**, exactly as `ingredients` and `steps` already work. There
  is no migration, no rewrite, and nothing to convert: every book written by
  0004–0008 is already valid 0009 data.
- **Untrusted on read like everything else.** A `tags` that is not an array, or
  entries that are not non-empty strings, yield no tags — and the recipe
  survives, the same way a junk ingredient is dropped and its neighbours kept. A
  recipe is never discarded over its tags.
- **Normalised on the way in, not on the way out.** Lower-casing and trimming
  happen when the tag is written, so reading stays a read.
- **Deleting a recipe takes its tags.** A tag that was on nothing else stops
  being offered, because the offer is only ever the tags in use.

## Risks

- **A half-tagged book makes the filter lie by omission.** This is the real risk
  of the version and it has no full mitigation. Finding nothing is loud; finding
  three of the five recipes that take chicken looks like a complete answer and is
  not. Two things hold the line: the contents and the search from 0008 need no
  upkeep and are not replaced, and suggestion exists so that tagging is a press
  rather than a chore — on the machines that have a model. Written into workflow
  2 so it is not rediscovered as a bug.
- **Workflow 1 (Write it down) must not gain a step, and does not.** Tagging
  happens on an open recipe, never in the box. `features/books/spec.md` calls
  that the one thing that must not change, and the check at the screenshot pass
  is that the box still takes a name and Enter and nothing else.
- **Three inputs above the contents**, where 0008 already flagged two as the
  risk of that version. Mitigated by the tag box not existing until something is
  tagged — a fresh app still has two — and by it being picked from rather than
  typed into. Worth watching in the screenshot pass; if the top of the page has
  become a control panel, the contents has stopped being the interface.
- **Tags under every name make the contents busier.** A page of names is what a
  book has and a list does not. If the screenshot shows a wall of small words,
  the rendering is wrong even though the rules pass.
- **Workflow 5 (Return): low, and lower than any version since 0004.** The change
  is additive — a browser opening 0009 on 0008 data sees exactly 0008. The one
  honest edge: a browser sent *back* to 0008 would drop tags on its next write,
  because 0008's sanitiser does not know the key. Not reachable while Pages
  serves one version, and recorded rather than solved.
- **"Instant" is amended**, which is a promise this product has kept since
  version 1. Bounded to one deliberate press, written into `spec.md` rather than
  left as a contradiction, and the screenshot pass should confirm that a machine
  with no model shows no trace of the exception.
- **Model output is plausible, not correct.** Handled by acceptance-before-storage,
  by related words being restricted to tags that already exist, and by output
  reaching the page as text and never as markup.
- **The pipeline cannot run a real model.** jsdom has none, and neither will CI.
  The model is handed to `mountApp` the way the document and the storage already
  are, tests pass a fake, and no rule asserts what a model says — only what the
  app does with an answer. The absent-model path is the default in tests because
  it is the default in the world.

## Acceptance checks

Done in Chrome 148+ on a desktop that meets the model requirements, and then
repeated in Firefox or Safari, which is the more important half.

1. Open a recipe with ingredients in it. Type "chicken" as a tag. It appears
   under the name. Close the recipe — the tag is still there, on the card.
2. Type "Chicken" as a second tag. Nothing is added; it is the same word.
3. Type spaces as a tag. Nothing is added.
4. Remove the tag from the open recipe. Close it — there is no way to remove a
   tag from the contents.
5. Write a recipe down in the box. It takes a name and Enter, asks nothing about
   tags, and lands at the top of the contents.
6. **With a model:** press the suggest control on an open recipe. Words appear
   and none of them is a tag yet. Accept one — it becomes a tag. Reload; it is
   still there. Ask again — the accepted word is not offered a second time.
7. **On a fresh profile:** the first press says the model is being fetched, and
   the page stays usable while it does — type a tag by hand during it.
8. **In Firefox or Safari:** the suggest control is not on screen, there is no
   message about a model, and tagging by hand works exactly as in Chrome. This is
   the check that matters most, because it is what most people will see.
9. Tag recipes in two different books with "chicken", and one of them also with
   "lemon". Pick "chicken" in the tag box: both appear, each naming its book.
10. Pick "lemon" as well: only the one carrying both. Unpick it: both again.
11. Pick two tags nothing shares: "No recipe takes all of those.", the picked
    tags still on screen, and not the empty-book message.
12. Type "lem" into the tag box — the offer narrows on the letters. **With a
    model,** type "pig" against a book tagged "pork" and see "pork" offered
    underneath, in its own group.
13. Open a result. The book on screen is that recipe's book, the recipe is open,
    and nothing is picked.
14. Search for something, then pick a tag: the search box empties. Pick a tag,
    then search: nothing is picked.
15. Pick a tag, then write a recipe down. The filter is gone and the new recipe
    is at the top of the contents.
16. Reload. Every tag is where it was, nothing is picked, and no search is
    running.
17. In devtools, set a recipe's `tags` to `"chicken"` (a string, not an array),
    and another's to `[1, null, ""]`. Reload: both recipes are still there with
    no tags, every other recipe is untouched, and the app opens normally.
