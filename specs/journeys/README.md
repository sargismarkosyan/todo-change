# Journeys

**A journey is orientation, not contract.** Markdown, never Gherkin: it is not
testable and must not wear the costume.

| File | Tag | |
|---|---|---|
| [keeping-what-you-cook.md](keeping-what-you-cook.md) | `@journey:keeping-what-you-cook` `@persona:nell` | A year of it, and the four seams between workflows. |

There is one, so this index is currently doing no work — with a single journey
the file *is* the orientation. It exists because "read this first" needs an
answer the moment there are five, and adding it then is the version nobody
remembers to write.

**One per persona is a rule of thumb, not a law.** The same person can have more
than one journey through the same product.

## How this connects to the rest

The tag lives on the **workflow** side, many-to-many: a `.feature` in
[`../workflows/`](../workflows/README.md) carries `@journey:<id>`, and this file
declares the id. `npm run trace` fails if a journey names a workflow that does
not exist — a dangling reference is factually wrong rather than a judgment call
— and warns if a workflow names no journey at all.

**What is deliberately not gated**, and will be in version 0019: whether a
journey has been looked at since the workflows under it changed. That is a git
question rather than a file question, and it is the only check in this design
that would report something nobody already knew. See
[change 0018](../changes/0018-what-it-serves.md) for why it is not here yet.

## Warning hygiene

The journey checks are the first warnings in this repo that fire on judgment
rather than on a mistake. `npm run trace` already prints one standing warning
(`reordering.feature: 125 lines`) that has simply sat there for five versions,
and three more kinds turn the list into wallpaper.

So, adopted here as a norm: **a warning that survives two versions either
becomes an error or gets deleted.** Nothing is allowed to sit in the output
being ignored.
