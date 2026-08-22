# Workflows

**A workflow is a bounded attempt to achieve something.** It has a trigger, some
steps, and an end state you can stand at and say "done". That is the whole
definition, and everything in this folder is held against it.

It is deliberately narrower than two words it gets confused with:

| | Spans | Carries | Here |
|---|---|---|---|
| **workflow** | one sitting | a trigger and an end state | `*.feature`, in this folder — **asserted** |
| **journey** | months, and the gaps between | the arc, and the seams between workflows | [`../journeys/`](../journeys/README.md) — prose, never asserted |
| **job** | the whole reason for using the app | why bother at all | one line inside each workflow, and in [`../personas/nell.md`](../personas/nell.md) |

"Workflow" is kept over "user flow" because the latter conventionally means a
diagram of screens, and [`../README.md`](../README.md) already bans specs that
know the UI has parts.

## The six

| Workflow | Trigger | Ends when |
|---|---|---|
| [`name-a-recipe`](name-a-recipe.feature) | someone is reading one out; the thing in the oven worked | it is at the top of the contents — 3s, no mouse |
| [`fill-a-recipe-in`](fill-a-recipe-in.feature) | a recipe exists with nothing under it | it is cookable, by hand or a line at a time from a draft |
| [`find-a-recipe`](find-a-recipe.feature) | deciding what to make, or wanting a specific one | the recipe is open |
| [`correct-a-line`](correct-a-line.feature) | dictated out of order; a line is wrong | the order is right |
| [`throw-something-out`](throw-something-out.feature) | it turned out badly; a book was a bad idea | it is gone |
| [`organise-the-books`](organise-the-books.feature) | too many to tell apart; one is misnamed | the shelf reads at a glance |

No numbers on the filenames. `01-`, `02-` would imply a sequence, and these are
independent attempts fired by different triggers — the numbering would be
inventing an order that is not true.

## Reading this as a map

**Naming a recipe and finding one are where the value is.** Filling one in is
what the naming was for. Correcting a line and throwing something out are
maintenance. Organising the books pays off entirely inside finding one.

Most good changes make writing a recipe down shorter, or make a recipe easier to
find. **Most bad ones add a field to the writing to serve something that happens
once a year.** If a change makes `name-a-recipe` longer, the thing it buys had
better arrive in `find-a-recipe`, and the spec had better say so out loud.

This paragraph is evaluative and the [journeys](../journeys/README.md) are
descriptive. They are not the same document and must not collapse into each
other: a journey says what happens and in what order, this says which of it
matters.

## What is *not* a workflow

**Guarantees.** *Cook from it* and *Return* were on the old list of five and
neither is a bounded attempt: their steps were literally *"Look at it. Keep
looking at it."* and *"Open the app. Look."* A property with no trigger and no
end state cannot be walked, so it cannot be a workflow — and a bucket nothing
can be walked in fills up with strays, which is exactly what happened.

They are now `@guarantee:` ids, declared in [`../spec.md`](../spec.md) under
*What it must always be*, and asserted **inside** every workflow above rather
than in a folder of their own. Every workflow's last example comes back to the
app and finds it exactly as left; that is `survives-return` asserted six times
instead of once.

**Journeys.** The gap between `name-a-recipe` and `fill-a-recipe-in` — a book of
names with nothing under them — is not a defect in either one. It lives in
[`../journeys/keeping-what-you-cook.md`](../journeys/keeping-what-you-cook.md),
because no workflow file can hold a seam between two workflows.

## The gates

`npm run trace` enforces, and the direction matters as much as the check:

| Check | Level |
|---|---|
| every feature names ≥1 live `@workflow:` or `@guarantee:` | error |
| every workflow is claimed by ≥1 feature | error |
| every workflow names ≥1 live `@persona:` | error |
| every persona is named by ≥1 workflow, or is `@retired` | error |
| every guarantee is claimed by ≥1 feature, or is `@planned` | error |
| every workflow is walked by ≥1 end-to-end test | error |
| a journey naming a workflow that does not exist | error |
| a workflow naming no journey | warning |

The old `Specs.` lists this replaces were hand-maintained, and by version 0017
nine of thirty-five feature files were claimed by nobody while workflow 2 had
absorbed eleven. Nothing reported it because nothing read the lists. See
[change 0018](../changes/0018-what-it-serves.md).

## What happened to the five

Nell's five, written in [0004](../changes/0004-recipe-book.md) and replaced in
0018. Three of them were not workflows.

| The five | Became | |
|---|---|---|
| 1. Write it down | `name-a-recipe` **and** `fill-a-recipe-in` | Two attempts wearing one id. The file said so itself — *"this workflow half-finishes"* — and the second half had no name, which is why nine `suggesting/` files were orphans. |
| 2. Browse | `find-a-recipe` | Same attempt, three entry points. It held eleven features because it was the only real "find something" bucket and absorbed everything adjacent. |
| 3. Cook from it | `@guarantee:readable-while-cooking` | Never a workflow: no trigger, no end state. Held one feature file because there is nothing to put in a non-workflow. |
| 4. Tidy | `correct-a-line`, `throw-something-out`, `organise-the-books` | A category, not an attempt. Held six unrelated features, of which correcting a line was a correctness fix filed next to deleting a book. |
| 5. Return | `@guarantee:survives-return` | Never a workflow either — *"Open the app. Look."* Now asserted at the end of every workflow above. |

## And the five before those

Rowan's, from versions 0001–0003, retired by
[change 0004](../changes/0004-recipe-book.md) along with the persona. Kept here
because a workflow that was deliberately dropped is evidence, and one that
quietly vanished is a bug.

| Rowan's | Nell's | |
|---|---|---|
| 1. Capture | `name-a-recipe` | Same shape, same three seconds. The thing written is bigger, so the box that starts it matters more, not less. |
| 2. Review | `find-a-recipe` | Was a dozen glances a day at what is left. Is now a deliberate read of a contents page. |
| 3. Complete | — | **Gone.** Nothing is finished, so nothing is ticked. This is the change. |
| 4. Prune | `throw-something-out` | Was daily hygiene against accumulation. Is now rare correction; nothing accumulates. |
| 5. Return | `@guarantee:survives-return` | Unchanged in shape and more important, because the gap is months. |
| — | `fill-a-recipe-in` | **New.** A todo was one line and complete. A recipe is not. |
| — | `@guarantee:readable-while-cooking` | **New.** Reading something while doing something else. The old product never did this. |
