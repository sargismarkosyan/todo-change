# Spec 0004: the recipe book

- **Status:** proposed
- **Issue:** [#8](https://github.com/sargismarkosyan/todo-change/issues/8)

**This change replaces the product.** It is the largest thing that has happened
in this repo, and the only one so far that retires rules rather than adding
them. Everything below is written on the assumption that the reader knows the
app as a todo list.

## Who this is for

**Nell, and Nell is new.** [persona.md](../persona.md) has been rewritten rather
than widened: Rowan, who kept today's list and wanted things gone once done, is
not the person this app is for any more. Nell keeps recipes and wants them
kept.

That is the decision this spec exists to make, and #8 says so plainly — it filed
the request as *direction*, offered two readings, and said the fork had to be
resolved before anything was specced. **Reading B was chosen**: a recipe book, not
a themed re-skin of a checklist.

The evidence for B, in the order it arrived:

- The report itself — *"so that you can open and look into recipes you like"*.
  Looking something up was not one of Rowan's five workflows; all five were about
  getting things out of your head and ticking them off.
- The issue title — *"themed books of recipes, **not a list of todos**"*.
- #9 and #10, which both presume recipes exist and neither of which can be
  specced at all until this is decided.

This lands in **Write it down** (step: the box, unchanged) and, more to the
point, in **Browse** and **Cook from it** — two workflows the old product did not
have. See [workflows.md](../workflows.md), also rewritten, and the table at its
foot for what became of the old five.

**The contradiction is faced rather than argued around.** The old persona said
"Archives. The list is about now. History is not a feature." A recipe book *is*
an archive — that is what one is for. The old sentence is not reinterpreted; it
is retired with the person who wanted it.

**The reporter is the tester, not Nell**, and this request went through a persona
check like any other. What did not survive it is in *What we are not doing*.

## The job behind the request

Things worth keeping — the cake that worked, the thing a grandmother dictated
over the phone — have nowhere to live. The app throws things away by design:
you tick them, you delete them, and the whole product is arranged around a list
that is about today. Anything with a life longer than an afternoon goes in a
drawer of paper or a phone full of screenshots instead, where it cannot be found
when it is wanted.

The job: **write down the things you cook, keep them in whatever grouping makes
sense to you, and come back weeks later and read one while you make it.**

Stated without any solution in it, that is not a todo list with different
words. It has no notion of finishing, and its whole value is in what it holds
rather than in what has left it.

## Why now

Nothing is broken. This is a change of direction, and it should be labelled as
one.

What it costs to leave undecided is that **the tracker has stopped making
sense**. Three consecutive issues describe a recipe book, two of them are
blocked on this one, and neither can be refined into a spec while the app is a
todo list — #9's "find a recipe regardless of the book it is in" and #10's
"popular recipes on the home page" are not statements about todos under any
reading. The queue cannot move until the fork is resolved either way.

There is also a *now* reason rather than a *someday* one, and it is the same one
0003 had: this migration drops a field, and every version that ships first is
more stored data to convert and more ticks to throw away.

And one honest note on cost. Retiring a rule id is permanent — 9 of the 40 live
rules go and their ids can never be reused. If this direction is going to be
reversed, the cheapest moment to say so is before this spec is approved, not
after.

## The end value

Nell can write a recipe down in the book it belongs to while someone is still
reading it out, and open that book weeks later to a page of names, pick one, and
read what it takes and what to do — with nothing having expired, been tidied
away, or asked whether they had finished it.

**How we would know it worked:** someone can put three recipes into a book called
"Sweets", close the tab, come back the next day, and cook from one of them
without touching anything but the recipe's own name. Negatively, in two parts,
both of which are checkable by looking: there is no tick box anywhere on the
page, and writing a recipe's name down is still one line, one Enter, and no
question about which book.

## What changes

### The product

- **Todos become recipes.** A recipe has a name, the **ingredients** it takes,
  and a **method** made of steps. It is written into the open book by typing its
  name in the box, exactly as a todo was.
- **Notepads become books.** Same behaviour throughout — one open at a time,
  switched from the menu behind the title, made, renamed and deleted there. The
  name changes, and what the menu is *for* changes: Sweets, Dinner, Chicken
  rather than Home and Work.
- **Sub-todos become the method.** One flat level, typed into the recipe, kept in
  the order typed. The shape that shipped in 0002 carries over intact.
- **Ingredients are new**, and are the only genuinely new model in this change:
  a second flat list on a recipe, above the method, each one a line of text with
  the amount written into it — `200g plain flour`.
- **Nothing is ticked off.** Every checkbox is gone from the page, and `done` is
  gone from the data. This is the change; everything else follows from it.

### On screen

- **The contents.** The open book shows its recipes as a page of names, newest
  first, one per line. Closed.
- **Opening one** shows it in place under its name: ingredients first, then the
  method. Clicking its name again closes it. Opening another closes the first —
  **one open at a time**, so there is always a contents page to read down.
- **An open recipe carries two boxes**, one for an ingredient and one for a
  step, each appending to the bottom of its own group. A closed recipe shows
  neither, and neither box exists anywhere else on the page.
- **The box at the top is untouched** — one line, Enter, straight into the open
  book, no question asked. Its placeholder becomes "What are we cooking?".
- **Deleting** a recipe is unchanged: immediate, no question, and it takes the
  recipe's ingredients and method with it.
- **The empty book** says "No recipes in this book yet.".
- **Which recipe is open is not remembered.** A reload opens the book on its
  contents, everything closed.
- **The look does not change in this version.** See *What we are not doing*.

### Rules

**Retired — 9 ids, gone for good** (recorded in
[`features/RETIRED.md`](../features/RETIRED.md)):

| Rule id | Feature file |
|---|---|
| `complete-marks-done` | `features/todo/completing.feature` |
| `complete-is-reversible` | `features/todo/completing.feature` |
| `complete-keeps-position` | `features/todo/completing.feature` |
| `parent-done-when-all-sub-todos-done` | `features/todo/sub-todos-completing.feature` |
| `parent-reopens-when-a-sub-todo-is-unticked` | `features/todo/sub-todos-completing.feature` |
| `ticking-parent-ticks-sub-todos` | `features/todo/sub-todos-completing.feature` |
| `new-sub-todo-reopens-parent` | `features/todo/sub-todos-completing.feature` |
| `deleting-sub-todos-settles-the-parent` | `features/todo/sub-todos-completing.feature` |
| `delete-works-on-done-todos` | `features/todo/deleting.feature` |

Both `completing.feature` files are deleted with them, along with their tests
and the code behind them.

**Added — 7 new rules, all `@planned` in this commit:**

| Rule id | Feature file | New or changed |
|---|---|---|
| `recipe-opens-to-be-read` | `features/recipes/reading.feature` | new |
| `one-recipe-open-at-a-time` | `features/recipes/reading.feature` | new |
| `nothing-is-ticked-off` | `features/recipes/reading.feature` | new |
| `ingredient-added-to-recipe` | `features/recipes/ingredients.feature` | new |
| `ingredients-keep-typing-order` | `features/recipes/ingredients.feature` | new |
| `ingredient-rejects-blank` | `features/recipes/ingredients.feature` | new |
| `old-notepads-open-as-books` | `features/storage/books-migration.feature` | new |

**Reworded and moved — 31 ids, every one of them kept.** The implementation
renames the folders and rewrites the rule text in the vocabulary of the new
product. No id changes:

| Now | Becomes | Rules |
|---|---|---|
| `features/todo/adding.feature` | `features/recipes/writing.feature` | `add-goes-to-top`, `add-clears-the-box`, `add-rejects-blank` |
| `features/todo/sub-todos.feature` | `features/recipes/method.feature` | `sub-todo-added-under-parent`, `sub-todos-keep-typing-order`, `sub-todo-rejects-blank`, `sub-todo-depth-is-one` |
| `features/todo/deleting.feature` | `features/recipes/deleting.feature` | `delete-removes-only-that-one`, `delete-parent-deletes-sub-todos` |
| `features/todo/empty-state.feature` | `features/recipes/empty-state.feature` | `empty-state-on-first-visit`, `empty-state-returns`, `empty-state-is-per-notepad` |
| `features/notepads/*` | `features/books/*` | all 9, unchanged in behaviour |
| `features/storage/persistence.feature` | same | all 4, recipe-shaped |
| `features/storage/recovery.feature` | same | all 4, recipe-shaped |
| `features/storage/notepads-migration.feature` | `features/storage/books-migration.feature` | `old-list-opens-as-one-notepad`, `migration-happens-once` |

**Why the ids stay even when their words go stale.** `capture-goes-to-the-open-notepad`
will name a rule about books; `persist-notepads` will be about persisting books.
That reads oddly and is still correct: an id is a handle, not a description, and
`CLAUDE.md` says ids are permanent. Renaming thirty of them would be the largest
orphaning risk in a change that already has enough of them, and would buy
nothing a reader of the rule text does not already have.

**Why the feature files' `@feature:` ids do change.** Nothing references them —
tests bind to rule ids — so they move with their folders: `todo-adding` becomes
`recipe-writing`, `notepad-switching` becomes `book-switching`.

### Prose

Rewritten in this commit: [`persona.md`](../persona.md) (replaced — Nell, and
what happened to Rowan), [`workflows.md`](../workflows.md) (replaced — the five
new ones and a table mapping the old five onto them), [`spec.md`](../spec.md)
(the product, the storage contract, the vocabulary),
[`features/storage/spec.md`](../features/storage/spec.md) (the second migration,
the discarded field, recipe-shaped recovery), and new files
[`features/recipes/spec.md`](../features/recipes/spec.md) and
[`features/RETIRED.md`](../features/RETIRED.md).

Moved with the code in the implementing commit: `features/todo/spec.md` is
superseded by `features/recipes/spec.md` and deleted; `features/notepads/spec.md`
becomes `features/books/spec.md`. `CLAUDE.md` and `specs/setup/constraints.md`
both still describe a todo app under one key `todo-change.todos` — the latter has
been stale since 0003 — and are corrected there too.

## What we are not doing

- **The look.** This is the one that will be missed, so it is first. #8 asked for
  a granny's recipe book and this version does not look like one — it is the same
  flat white card in system-ui with different words in it. Bundling a full visual
  identity into the largest model change in the repo would produce one muddled
  screenshot instead of two clear ones, and `CLAUDE.md` is explicit that one
  change spec is one step. **It is version 0005, and its direction is already
  decided** so that it is not relitigated: the full skeuomorphic treatment —
  paper grain, index-card recipes with a red margin rule, a handwritten heading,
  tape — and **system fonts only**. No webfont link (an external request on every
  load, against the no-backend constraint) and no font file in the repo.
- **Ticking steps while cooking.** A scratch mark saying which pan you are on is
  a real idea and a *different* one: it would be state that is never written
  down, cleared the moment the recipe is closed. Retiring `done` deliberately
  does not build it. If cooking from a long method turns out to need it, that is
  a report and its own version.
- **Quantities as a field.** An ingredient stays one line with the amount written
  into it. A number-plus-unit-plus-name field is three decisions during the one
  workflow that must not grow any, and it exists only to serve scaling and
  shopping lists, which are out of scope for the product.
- **Editing anything.** A recipe's name, an ingredient, a step: none can be
  changed after they are typed, exactly as no todo could. Delete and retype is
  the answer, and it was a fair bet on a two-word todo. **It is a much worse bet
  on a recipe**, and this change makes it worse without fixing it — see *Risks*.
  Left out because it is a genuine feature with its own design, not a detail of
  this one.
- **Search, filtering and ingredient tags** — [#9](https://github.com/sargismarkosyan/todo-change/issues/9).
  Needs recipes to exist first. This spec is what unblocks it, not what does it.
- **A search-first home page** — [#10](https://github.com/sargismarkosyan/todo-change/issues/10).
  Also unblocked by this and also untouched, and it additionally proposes
  secondary pages, which contradicts the single-page constraint and needs that
  argument made on its own.
- **Photographs of food.** Bulk in `localStorage`, against a quota that
  `features/storage/spec.md` still lists as unhandled. Out of scope for the
  product, not merely unbuilt.
- **Moving a recipe between books.** Same answer as 0003 gave for todos: delete
  and retype, until someone reports it costing something.
- **An alphabetical contents.** Genuinely a better fit for a book than
  newest-first once one has grown past a screen, and genuinely a different rule
  with its own spec. Newest-first is kept here because it is what exists and
  because the recipe just written should be under the eye.
- **Remembering which recipe was open.** It is where the reader is looking, not
  something they own. A book reopens on its contents.
- **Undo.** Still unbuilt and unspecced, and now guarding something more
  valuable. Named in *Risks* rather than fixed.
- **A second level anywhere.** No sub-steps, no ingredients inside steps, no
  books inside books.
- **Anything about two tabs.** The known gap gets sharper and is not addressed.

## Data

The key changes for the second time: **`todo-change.books`**, holding the books
and which one is open. The namespace keeps the repo's name.

```json
{
  "books": [
    {
      "id": "1739827000000-1a2b3c4d5e6f7a8b",
      "name": "Sweets",
      "recipes": [
        {
          "id": "1739827200000-9f2c41ab7e0d5c83",
          "name": "Apple cake",
          "ingredients": [
            { "id": "1739827210000-77c3e5b0d9124fae", "text": "200g plain flour" }
          ],
          "steps": [
            { "id": "1739827230000-5e0b73da1c9f4820", "text": "Heat the oven to 180C" }
          ]
        }
      ]
    }
  ],
  "openId": "1739827000000-1a2b3c4d5e6f7a8b"
}
```

Books sit oldest first, recipes newest first, ingredients and steps oldest first.
A book is well-formed when `id` and `name` are non-empty strings and `recipes` is
an array; a recipe when `id` and `name` are non-empty strings; an ingredient or a
step when `id` and `text` are non-empty strings. `ingredients` and `steps` are
optional and default to empty.

**There is no `done` in the shape**, at any level. It is not stored, not read,
and not written back when found.

### The migrations, and the field that is thrown away

Two older keys are read only when `todo-change.books` is absent:

1. **`todo-change.notepads`** (0003) — each notepad becomes a book of the same
   name, each todo a recipe whose name is the todo's text, and a todo's
   `subTodos` that recipe's `steps`. `ingredients` is empty.
2. **`todo-change.todos`** (0002 and earlier) — the bare array becomes one book
   called "My book", converted the same way. Anyone who has opened version 3
   no longer has this key; anyone whose last visit was version 2 still does, and
   dropping the hop would silently lose their list.

Each is sanitised by the untrusted read *before* conversion, writes
`todo-change.books`, and removes the key it came from. It happens once.

**Ticks are read and discarded, and that is data loss.** Someone who leaves a
half-ticked list and opens this version gets every tick back as unticked — or
rather, gets recipes, which have no ticks at all. There is no honest place to
put the value: a recipe is not finished. It is called out here, in
`books-migration.feature`, and in the acceptance checks, because it is the first
thing this app has ever thrown away on purpose.

## Risks

- **This is a one-way door, and rule ids are the hinge.** Nine ids are spent.
  Reversing to a todo list later would need nine new ids for nine rules that
  already existed, and every reference in git history would point at rules that
  no longer mean what they say. The mitigation is not technical: it is that this
  decision was asked as a decision, and answered.
- **Return (workflow 5), harder than 0003's.** The second migration in two
  versions, this one converting a shape *and* dropping a field. A bug here is a
  blank screen or a lost book, and what is lost is no longer a list of today's
  errands. Two rules cover it; the manual check below is the one that matters —
  a real list saved by the live site, opened on this version.
- **Both migrations are one-way.** After either runs, the deployed version sees
  no key it recognises and opens empty. Nothing is lost — the data is under the
  new key — but the live site and a local checkout will disagree for anyone who
  opens both. Worth knowing before taking the screenshot.
- **No editing, on much bigger content.** Deleting and retyping a two-word todo
  cost nothing. A recipe is a name, six ingredients and eight steps, and the only
  way to fix a typo in the first line is to type all fifteen again. This change
  does not cause the gap, but it is the change that makes it expensive, and it is
  the most likely thing to come back as a report. Named here so that when it
  does, it is not a surprise.
- **Delete has no undo and now guards more.** A mis-click on a recipe takes the
  only copy of something somebody dictated once. The old bet — a list this small
  is cheap to retype — is weaker and is being renewed anyway, because a
  confirmation on every delete is the chore the old persona complained about and
  the new one inherits the complaint.
- **One-open-at-a-time could be wrong.** It is what makes a contents page
  possible, and it is a guess: someone cooking may want two recipes open at once,
  or may find that opening the same one repeatedly is a click they resent. The
  screenshot pass is where that gets judged.
- **Writing a recipe down could regress without any rule failing.** The rules
  check that a name lands in the open book; they cannot check that it still
  *feels* like nothing changed. If the eye has to find anything before typing,
  this change cost more than it bought.
- **The version's screenshot is weak on purpose.** 0004 looks almost exactly like
  0003 with different words. The series is the deliverable, so this is a real
  cost — accepted because 0005 is the version that pays it back, and because the
  alternative was one screenshot showing two changes.
- **A second tab still overwrites.** Unaddressed, and now sharper: the loser of
  the race loses recipes it was never showing.

## Acceptance checks

1. Open the app with notepads already saved by the live version. Every notepad is
   a book of the same name, every todo is a recipe of the same name, and any
   sub-todos are that recipe's method. In devtools, `todo-change.notepads` is
   gone and `todo-change.books` holds it. **Ticks are gone, and nothing on the
   page offers one.**
2. In a fresh browser profile, set `todo-change.todos` to a bare array of two
   todos and open the app. One book called "My book", both as recipes.
3. Write a recipe down the way you always did: type "Apple cake", Enter. Nothing
   about it is different, no mouse, and nothing asked which book.
4. Open "Apple cake". Add three ingredients and three steps. They appear in the
   order typed, ingredients above the method.
5. Close it. It is one line again, and the contents reads down as names.
6. Open a second recipe. The first closes on its own.
7. Reload. Everything is there — same books, same recipes, same ingredients, same
   method, same book open — and every recipe is closed.
8. Make a book called "Sweets", switch to it, write a recipe into it, switch back.
   The first book is exactly as it was.
9. Delete a recipe that has ingredients and steps in it. It goes immediately, with
   nothing asked, and takes them with it.
10. Delete a book with recipes in it. You are asked once, and the question says
    how many recipes go.
11. Try to submit a blank recipe name, a blank ingredient and a blank step.
    Nothing is made in any of the three.
12. In devtools, set `todo-change.books` to `{not json` and reload. A usable empty
    book called "My book" opens.
13. In devtools, add `"done": true` to a stored recipe and reload. It reads
    exactly as before, and the next change you make writes it back without the
    field.
14. Search the running page for a checkbox. There is not one.
15. Take the screenshot with a book open and one recipe open in it — that is the
    version's picture, and it is the last one that looks like a todo app.
