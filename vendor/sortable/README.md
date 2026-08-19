# SortableJS

The one library this app ships. Everything else here is written in the repo —
see [`specs/setup/constraints.md`](../../specs/setup/constraints.md), which
argues for this exception and sets the bar for a second.

| | |
|---|---|
| **Version** | 1.15.7 |
| **Licence** | MIT — `LICENSE`, beside this file |
| **Source** | <https://unpkg.com/sortablejs@1.15.7/modular/sortable.core.esm.js> |
| **Vendored** | 2026-08-19 |
| **Dependencies** | none |

## Why the file is here rather than installed

There is no build step and there is not going to be one. This is the pre-built
ES module SortableJS ships, committed as it came, and the browser imports it as
it stands. A CDN import would add a second origin to every page load, which this
repo already refused for a font host.

## Why it is not under `src/`

`src/**` is held at 95% coverage, and that gate is there to measure code this
repo wrote. A minified bundle inside it would either sink the gate or force it
to be gamed.

## Updating it

By hand, deliberately, and nothing here will remind you. Replace both files from
the same two URLs at the new version, change the table above, and run
`npm run verify` — then check a drag in a real browser, because the gate cannot.

**This is the known cost of vendoring**, and the reason `constraints.md` says a
typeface is finished but a library is not. Version 1.15.7 is what has been read
and shipped; a later one is untested here until somebody tests it.

## What it is used for

Reordering ingredients and steps within a recipe, by pointer. Nothing else.
`src/app.mjs` initialises it per open group and hands `onEnd` back to the app's
own state.

**It has no keyboard support.** The arrow keys on a grip are this app's own code
and are the only route that works without a pointer — see
`specs/features/recipes/reordering-by-keyboard.feature`. Do not remove them on
the assumption the library covers it.
