# Retired rule ids

**Rule ids are permanent.** An id that has been used is spent, whether the rule
it named is still live or not: tests reference ids, git history references ids,
and an id that comes back meaning something else makes every earlier reference
a lie.

This file is the list of ids that are gone. Nothing reads it — `npm run trace`
only knows about rules that exist — so it is here for the person about to invent
a rule id, and it is the one place that says why the id they picked is taken.

## Retired by [change 0004](../changes/0004-recipe-book.md) — the recipe book

The product stopped being a todo list. A recipe is not finished, so every rule
about done state lost its subject. These were not reworded, because there was
nothing left for them to be about.

| Rule id | Was in | Was |
|---|---|---|
| `complete-marks-done` | `todo/completing.feature` | Ticking a todo marks it done, with a line through the text |
| `complete-is-reversible` | `todo/completing.feature` | Unticking a todo makes it unfinished again |
| `complete-keeps-position` | `todo/completing.feature` | Completing a todo does not move it |
| `parent-done-when-all-sub-todos-done` | `todo/sub-todos-completing.feature` | Ticking the last unfinished sub-todo marks the parent done |
| `parent-reopens-when-a-sub-todo-is-unticked` | `todo/sub-todos-completing.feature` | Unticking a sub-todo makes the parent unfinished again |
| `ticking-parent-ticks-sub-todos` | `todo/sub-todos-completing.feature` | Ticking a parent ticks everything under it |
| `new-sub-todo-reopens-parent` | `todo/sub-todos-completing.feature` | Adding a sub-todo to a done parent makes it unfinished |
| `deleting-sub-todos-settles-the-parent` | `todo/sub-todos-completing.feature` | Deleting sub-todos leaves the parent agreeing with what is left |
| `delete-works-on-done-todos` | `todo/deleting.feature` | A done todo can be deleted like any other |

Their replacement is a single rule saying the state is gone:
`nothing-is-ticked-off` in `recipes/reading.feature`.

**Every other rule id survived 0004.** Ids whose words now read oddly —
`add-goes-to-top`, `sub-todo-added-under-parent`, `capture-goes-to-the-open-notepad`,
`persist-notepads`, `old-list-opens-as-one-notepad` — were kept deliberately.
An id is a handle, not a description; churning twenty of them to match new
wording would have been the largest orphaning risk in the change, for no gain.

## Retired by [change 0018](../changes/0018-what-it-serves.md) — the look was never an area

**No rule id was spent here.** All fourteen rules survived, with their ids and
their tests untouched; what was retired is the *folder they lived in*.

`features/look/` was created by 0005 and grew because a redesign had happened. A
visual change alters an existing behaviour, produces a new one, or — if it is
genuinely stylistic — produces neither. It does not produce a feature area of its
own, any more than a refactor does, and an area nobody owns becomes the home for
whatever did not fit. By 0017 it held one file nothing had ever referenced.

| Was | Is now | Serves |
|---|---|---|
| `look/paper.feature` | `guarantees/paper.feature` | `@guarantee:readable-while-cooking` |
| `look/within-reach.feature` | `guarantees/within-reach.feature` | `@guarantee:within-reach` |
| `look/telling-books-apart.feature` | `books/telling-books-apart.feature` | `@workflow:find-a-recipe`, `@workflow:organise-the-books` |
| `look/spec.md` | `guarantees/spec.md`, plus the book-colour contrast argument into `books/spec.md` | — |

**The feature ids keep their `look-` prefix** — `look-paper`,
`look-within-reach`, `look-telling-books-apart` — for the reason given at the top
of this file about rule ids. An id is a handle, not a description.

Change specs 0005 through 0017 link to the old paths. Those links are history and
were not rewritten: a frozen change spec says what was true when it shipped, and
`git log --follow` is what connects the two.
