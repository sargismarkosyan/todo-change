# Vue

The second library this app ships, and the first one it did not choose. See
[`specs/setup/constraints.md`](../../specs/setup/constraints.md), which this
addition amended, and
[`specs/changes/0016-somebody-elses-frame.md`](../../specs/changes/0016-somebody-elses-frame.md),
which argues for it and says plainly what it is worth to the person using the
app.

| | |
|---|---|
| **Version** | 3.5.41 |
| **Licence** | MIT — `LICENSE`, beside this file |
| **Source** | <https://unpkg.com/vue@3.5.41/dist/vue.runtime.esm-browser.prod.js> |
| **Vendored** | 2026-08-21 |
| **Dependencies** | none |

## Why this build and not another

`vue.runtime.esm-browser.prod.js` is the **runtime-only** build: the renderer
and the reactivity, without the template compiler. It is the one Vue ships that
fits this repo.

- **Runtime-only, so there is no compiler to carry.** The page is described with
  `h()` in `src/app.mjs` rather than with template strings, so nothing needs
  compiling in the browser. The full build is bigger and its extra half would
  never run.
- **Single-file components are ruled out**, because they need a build step and
  this repo does not have one and is not getting one.
- **`esm-browser`, so the browser imports it as it stands.** The `.prod` build
  has `process.env.NODE_ENV` already resolved, which matters: there is no
  bundler here to define `process`, and the development build would throw on
  the first line that looked for it.
- **Not from a CDN.** A CDN import would add a second origin to every page load,
  which this repo already refused for a font host.

## Why it is not under `src/`

`src/**` is held at 95% coverage, and that gate is there to measure code this
repo wrote. A minified bundle inside it would either sink the gate or force it
to be gamed. Same reasoning as `../sortable/README.md`.

## What it is used for

All of the drawing. `src/app.mjs` mounts one Vue application over
`<main class="app">` and describes the whole page from state; there is no other
renderer left in the repo.

**Two pieces of it are reached for by name and are worth knowing about:**

- **`withDirectives` and a custom directive** attach SortableJS to each group's
  list when it appears and destroy it when it goes. It used to be remade on
  every repaint; the diff keeps the rows now, so it does not have to be.
- **`nextTick`** is what `mountApp` hands back as `settled`. Vue coalesces a
  repaint onto a microtask, so the tests wait on it. Nothing else does.

## Updating it

By hand, deliberately, and nothing here will remind you. Replace both files from
the same two URLs at the new version, change the table above, and run
`npm run verify` — then check a drag and a reorder in a real browser, because
the gate cannot see either gesture.

**This is the known cost of vendoring, and it is larger here than it is for
SortableJS.** Vue is bigger, more exposed, and released more often, and a
vendored copy receives none of its fixes. `constraints.md` says a typeface is
finished but a library is not; this is the most expensive version of that
sentence in the repo. Version 3.5.41 is what has been read and shipped; a later
one is untested here until somebody tests it.
