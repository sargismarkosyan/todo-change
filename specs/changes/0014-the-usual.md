# Spec 0014: the usual

- **Status:** shipped
- **Issue:** [#13](https://github.com/sargismarkosyan/todo-change/issues/13) —
  "Allow to favoritize certain recepies and access them easier. The favorite
  icon should be an star icon."

## Who this is for

Nell, in **Browse** — [workflow 2](../workflows.md) — at the same fridge-door
moment [0013](0013-a-front-door.md) opened up, but arriving with the *other*
half of an answer.

0013 wrote down the case of having nothing in mind. This is the case of having
*almost* something in mind: it is Tuesday, it is one of the four things we
actually cook, and the app currently makes that the same amount of work as
finding something last seen in March. The steps today are recall which book, or
recall enough of the name to type it. Both are recall, and neither is what a
book of a handful of regulars should cost.

It also touches **Tidy** — [workflow 4](../workflows.md) — in the smallest way a
change can: the star is a mark you make and unmake, and it is the second thing in
this app after a book's name that is edited rather than written.

## The job behind the request

**Get to one of the few recipes cooked over and over without having to name it or
remember where it is.**

Stated with no solution in it, that is the whole of "access them easier". The
star is a mechanism for it, and the issue proposes one — which happens to be the
right one, for a reason [0013](0013-a-front-door.md) already wrote down in
detail.

**The alternative was considered a version ago and rejected on the evidence.**
0013 dropped "most popular" because the only popularity available here would be
counted from what gets opened: a stored per-recipe count, written on read, a
behavioural record of the person using the app, and empty on a fresh install.
Every one of those objections is about *inferring* the answer. None of them
applies to being told it. One deliberate press replaces the whole apparatus, it
is right rather than probably-right, and it is correct on the first day.

So the request is not a solution in search of a problem. It is the cheap, honest
version of the half of #10 that was left open, and it arrives from a different
issue by coincidence.

## Why now

**The front door exists and has nothing personal on it.** Since 0013 opening the
app offers three recipes chosen by the date, which is the correct answer to "no
idea what to make" and no answer at all to "the usual". A regular is offered
one day in twelve by chance, and only by chance.

So the app's opening screen is, for the most common visit, a screen you look
past. Nell opens the app twice an evening: once at the fridge, once with the pan
out. The fridge visit is the one this is about, and for the majority of those
visits the answer is already roughly known and the app has no shortcut to it.

**And a mark of some kind is the only thing that can serve it.** There is nothing
already in the data that says which recipes matter — not the order, which is
when they were written down; not the book, which is the occasion; not the
contents position, which is hand-set for other reasons. This is genuinely new
information and it has to come from the person.

**What it costs today**, concretely: recalling which of Sweets / Dinner /
Chicken holds it, or typing enough of the name into the search box that it comes
back. Neither is expensive on its own, which is precisely why nothing has been
reported broken — it is a small tax on the most frequent thing the app is opened
for.

## The end value

Opening the app puts the handful of recipes actually cooked at the top of the
screen, each saying which book it is in, one click from being open and readable.
Nothing else about the app changes, and anybody who never presses a star sees
the front door exactly as version 0013 left it.

**How we would know it worked:** a recipe that gets made most weeks is reachable
from a cold open in one click and no typing — where today it takes either the
right book remembered or the right word typed. And the check that keeps it
honest: with nothing starred, the home is byte-for-byte the screen 0013 shipped,
so the feature costs a fresh install nothing.

## What changes

**The star, in the contents.**

- **Every row of the contents carries a star**, beside the delete control it
  already has. Filled when the recipe is a favourite, outline when it is not.
- **Pressing it marks the recipe; pressing it again unmarks it.** Immediate,
  written down at once, like everything else this app stores.
- **It changes nothing else.** The contents does not reorder, the recipe does not
  open or close, and a starred recipe is deleted, renamed, dragged and searched
  exactly as before.
- **It is visible on every row, starred or not**, because a mark you cannot see
  where you made it is a mark you stop trusting — and because reading down the
  contents is how you see which ones are marked.

**The favourites, on the home.**

- **They lead the home**, above the picks, under their own heading, each naming
  the book it is in. Opening one goes to that book with the recipe open — the
  same thing opening a pick or a result does, drawn by the same row.
- **In book order, then contents order** — the order results already sit in.
  Nothing is ranked, and nothing is ordered by when it was starred, which would
  be a stored timestamp and a list that rearranges itself.
- **All of them**, with no cap. See *What we are not doing*.
- **The picks skip anything starred.** Three picks still, and the point of them —
  reaching into a book nobody has opened since March — is preserved rather than
  spent re-offering a name already on screen four lines up.
- **Nothing starred means no group and no heading**, and the picks alone, as
  today. There is no empty state for favourites: the front door of a fresh
  install is not where a feature nobody has used yet gets advertised.
- **Typing in the search box replaces both; clearing puts both back**, the
  favourites unchanged and the picks the same three. The existing rule about the
  picks stepping aside now has a second thing standing beside it, and it behaves
  the same way.

**Nothing about searching changes.** Same box, same matching, same results. A
favourite is not searched for differently, not filtered by, and not marked in the
results — a result names the recipe and the book it is in, and offers nothing
else. Every rule in `features/finding/` stays true as written.

**Rules added or changed** — the `@rule:` ids in `specs/features/`:

| Rule id | Feature file | New or changed |
|---|---|---|
| `a-recipe-can-be-starred` | `features/recipes/favourites.feature` | new |
| `a-star-is-kept` | `features/recipes/favourites.feature` | new |
| `starring-moves-nothing` | `features/recipes/favourites.feature` | new |
| `favourites-lead-the-home` | `features/home/favourites.feature` | new |
| `the-picks-do-not-repeat-a-favourite` | `features/home/favourites.feature` | new |
| `nothing-starred-is-the-home-as-it-was` | `features/home/favourites.feature` | new |
| `a-search-covers-the-favourites-too` | `features/home/favourites.feature` | new |

**No existing rule is reworded or retired.** `picks-reach-every-book` still says
three from any book and `picks-step-aside-for-the-results` still says what comes
back when the box is emptied; both are now true of a home that may have a group
above them. `nothing-is-ticked-off` in `features/recipes/reading.feature` is
untouched and is the rule this change is most answerable to — see below.

Prose specs updated in the same pass: a new *Favourites* section in
[`features/recipes/spec.md`](../features/recipes/spec.md), the picks section of
[`features/home/spec.md`](../features/home/spec.md), the storage contract and two
vocabulary entries in [`spec.md`](../spec.md), workflow 2 in
[`workflows.md`](../workflows.md), and an amendment to the marking sentence in
[`persona.md`](../persona.md) — argued below rather than made quietly.

## The three decisions this rests on

**A star is not a tick, and `persona.md` is amended out loud rather than read
generously.** That file says Nell will never "rate one", and that nothing is
"asked to be marked as anything". The second half is the one this has to answer,
and the word doing the work in it is *asked*. Nothing here asks: a recipe nobody
stars behaves exactly as it does today, the home with no favourites is the home
0013 shipped, and no screen ever shows an unanswered question about a recipe.
Nor is it a rating — one bit, no scale, no second star, nothing about whether a
recipe is any good, and nothing ordered by it. And it points the opposite way to
a tick: a tick means *finished, and now it can go away*, which is the idea 0004
tore out of this product; a star means *come back to this*, which is what a
recipe book is for. `persona.md` has been amended twice before on exactly this
pattern — the settings-screen-versus-a-switch paragraph, and the typing-it-out
paragraph 0009 added — and this is the third, written in the same place and the
same way.

**The payoff goes on the home, not into the contents.** Floating starred recipes
to the top of their book was the obvious alternative and it is the one thing this
must not do. `workflows.md` names "a book that rearranges itself, so what was
second is now fifth" as where browsing breaks, `features/recipes/spec.md` says a
person moves a line and the app never does, and versions 0010 to 0012 are three
consecutive versions of work spent making the order hand-set. A favourite that
reorders the contents would spend all of that to save a scroll. The home is real
estate built one version ago for precisely the arriving-with-a-half-formed-idea
moment, and it is empty of anything personal.

**A field on the recipe, not a list of ids on the store.** A top-level
`favourites: [id, ...]` is a second structure that can disagree with the data:
ids left behind by deleted recipes, and an ordering nobody set. This is the same
objection `features/finding/spec.md` makes to a search index — "a cache that can
disagree with the data" — and the answer is the same. One optional key on the
recipe travels with it, goes when it goes, and needs no cleanup pass.

## What we are not doing

- **Reordering anything.** Not the contents, not the books, not the results. The
  star is read on the home and nowhere else changes shape because of it.
- **Starring from the home, or from a search.** A pick and a result name a recipe
  and the book it is in and offer nothing else — no delete, nothing to type into.
  Marking happens in the book, where the contents is. Adding a second control to
  the result row would make one row draw two different things.
- **A capped or paged favourites list.** Star twenty recipes and the home shows
  twenty, pushing the picks below the fold. That is a real ceiling and it is
  deliberately left as one: a cap is a number invented before anybody has been
  annoyed by the absence of one, and "I starred too many" is a report worth
  waiting for. See *Risks*.
- **A favourites book, or a filter.** Not a pseudo-book in the book menu, not a
  "show only favourites" toggle over the contents. `features/books/spec.md` is
  explicit that a book is a thing somebody made, and a fake one in the menu is a
  container that cannot be written into, renamed, or deleted.
- **More than one bit.** No ratings, no stars out of five, no "made this 12
  times", no last-cooked date. Any of those is the counting 0013 rejected, or the
  rating `persona.md` rules out, wearing a different hat.
- **Ordering favourites by hand.** The grip moves lines within a recipe; the
  favourites are a view of every book at once, and there is no group for them to
  be moved within. If the order on the home ever matters, that is a version.
- **Marking anything else.** Not a book, not an ingredient, not a step. Issue
  [#14](https://github.com/sargismarkosyan/todo-change/issues/14) asks for books
  to carry a colour for a related reason; it is its own request, its own stored
  field, and its own argument.
- **An undo for unstarring.** Pressing the star again is the undo, and unlike a
  delete nothing is destroyed by it.

## Data

**One optional key on a recipe.**

```json
{ "id": "...", "name": "Apple cake", "favourite": true }
```

- **Present only when true.** A recipe that is not a favourite has no key, the
  same way a recipe with no method has no `steps`. Anything that is not exactly
  `true` reads as not a favourite — untrusted on read, like every other field.
- **No migration.** Every recipe stored by every previous version reads as not a
  favourite, which is correct rather than merely safe: nobody has starred
  anything yet.
- **Nothing else moves.** No new top-level key, no change to `openId`,
  `suggestions`, or the older-key migrations. A recipe that arrives from
  `todo-change.notepads` or `todo-change.todos` has no star, because a todo never
  had one.
- **Deleting a recipe takes its star with it**, because the star is on the
  recipe. There is nothing left over to clean up, which is the point of putting it
  there.

## Risks

- **The persona line.** This is the first change in the repo's history to put a
  mark on a recipe, and `persona.md` has a sentence about being asked to mark
  things. The argument is above and the file is amended rather than reinterpreted
  — but if the star ever grows a second state, a number, or a prompt, that
  amendment has stopped being honest and this is the paragraph to come back to.
- **A second control on every contents row.** The contents is defended as a page
  of names you run your eye down, and it now carries two controls per row rather
  than one. This is the change most likely to look wrong in the screenshot rather
  than in a test, and it is the thing to look at first in the pass.
- **A long favourites list buries the picks.** Uncapped by decision. Twenty stars
  and the picks are below the fold; the feature shipped one version ago is then
  invisible to the person who starred most. Watch it in use rather than guessing
  a number now.
- **Workflow 5 (Return) — the smallest storage change this repo has made.** One
  optional boolean, added, never required, and absent in every byte written by
  every previous version. A second tab on an older build would drop stars it does
  not know about when it writes, which is the same two-tab hazard
  `features/storage/spec.md` already describes and no worse for this field.
- **The picks exclusion is the one place two features touch.** If everything is
  starred there are no picks at all, and the home must not then claim there is
  nothing written down — the empty message belongs to an empty book, not to an
  empty group. It has a rule of its own for that reason.

## Acceptance checks

1. Open a book. Every recipe in the contents has an outline star beside its
   delete control, and nothing on the row is a tick box.
2. Press the star on one. It fills. The contents does not move, nothing opens,
   nothing closes.
3. Press it again. It empties.
4. Star one recipe in one book and one in another. Go to the home. Both are at
   the top, above the picks, each naming its book.
5. Read the three picks. Neither starred recipe is among them.
6. Open a favourite. That book is on screen, its name in the masthead, the
   recipe open and readable.
7. Type "lemon". Results replace everything. Empty the box. The favourites and
   the same three picks come back.
8. Reload. Both stars are still there.
9. Unstar both. The home is the search box and three picks, with no heading and
   no empty group — the screen version 0013 shipped.
10. Star a recipe, then delete that recipe. The home does not offer it.
11. In devtools, set a recipe's `"favourite"` to `"yes"` and reload. It is not a
    favourite, and the book opens normally.
12. Star every recipe in every book. The home shows all of them, no picks, and
    does not say "Nothing written down yet."
