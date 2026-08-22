# Personas

One file per persona, one `@persona:<id>` tag at the top of each. A persona is
*who the product is for*, and nothing else in `specs/` is allowed to invent one.

| File | Tag | |
|---|---|---|
| [nell.md](nell.md) | `@persona:nell` | Who this app is for. |
| [rowan.md](rowan.md) | `@persona:rowan` `@retired` | Who it used to be for, kept so nobody cites them by accident. |

**The gate runs both ways.** Every workflow in
[`../workflows/`](../workflows/README.md) must name at least one live persona,
and every persona must be named by at least one workflow — or carry `@retired`.
So a persona cannot be written that nobody does anything as, and a workflow
cannot be written for nobody. `npm run trace` fails on either.

Splitting the old single `persona.md` into a folder is what makes the second
half of that possible: a tag needs a file to sit on. The tombstone at
[`../persona.md`](../persona.md) says where everything went.

## The other person in the room

The human testing this repo is **not** Nell, and has no file here on purpose —
they are not who the product is for, so a `@persona:` tag would let a workflow
be written for them.

They are stress-testing the app deliberately: pasting odd input, opening
devtools, corrupting `localStorage`, trying things Nell never would.

Both matter, differently. What the tester *finds* is real: a crash is a crash.
What the tester *wants* has to be checked against Nell before it becomes a spec.
That check is the [`refine-spec`](../setup/skills.md) skill's first job.
