# CLAUDE.md

## What this project is

`todo-change` is a **test bed for spec-driven development**. The software being
built (a browser-based todo app) matters less than the *process* being
demonstrated: every change starts as a written spec, gets implemented in one
small step, and is captured as a commit.

The deliverable of this project is a **series of screenshots** — one per version
of the app — showing how the product evolves change by change. Every commit
should therefore leave the app in a state that is worth looking at.

## How work happens here

This repo is written **only by AI**. The human's role is to *use* the app, find
problems, and report them. The loop is:

1. **Human** runs the app, tests it, and describes what they found in Claude
   chat — in their own words, with screenshots. Not in the app, and not by
   writing an issue by hand.
2. **AI** runs the `feedback` skill: it pulls every distinct insight out of what
   the human said, investigates the code, and files researched **GitHub issues**.
3. **AI** picks up an open issue and writes the spec: Gherkin rules in
   `specs/features/`, tagged `@planned`, plus a numbered change spec in
   `specs/changes/`.
4. **Human** approves the spec (or asks for edits).
5. **AI** implements it, removes the `@planned` tags, writes the tests that
   reference those rules, and commits once `npm run verify` is green.
6. **Human** screenshots the new version. Back to step 1.

Rules that follow from this:

- **One change spec = one step = one version.** Do not bundle unrelated changes.
- **Spec before code.** No implementation without an approved change spec.
- **Feedback is never fixed on the spot.** It becomes an issue, then a spec,
  then a commit.
- **No silent scope growth.** Spotted something else broken? File it as its own
  issue instead of fixing it inline.
- **Every version must run and be green.** Each commit is a screenshot
  candidate and must pass `npm run verify`.

## Specs

Three layers, described in full in [specs/README.md](specs/README.md):

```
specs/spec.md                    product-level prose — why, vocabulary, contracts
specs/features/<area>/spec.md    area-level prose
specs/features/<area>/*.feature  Gherkin — the enforced contract
specs/changes/NNNN-*.md          one numbered change spec per version
```

Feature files are small — one component or behaviour each — and every Feature
and Rule carries a stable id tag:

```gherkin
@feature:todo-adding
Feature: Adding a todo

  @rule:add-goes-to-top
  Rule: A new todo goes to the top of the list

    Example: adding to an empty list
      When I add "Buy milk"
      Then the list reads:
        | Buy milk |
```

`@rule:<id>` is the anchor tests point at. **Reword a `Rule:` line freely;
changing its id breaks the link.** Tag a rule `@planned` while it is specced but
not built.

## Tests

```
tests/unit/          internals. Exempt from rule references.
tests/behaviour/     must reference a Rule. Everything else lives here.
tests/support/       helpers, not tests
```

Behaviour tests declare what they are for:

```js
import { test } from 'node:test';
import { rule } from '../support/covers.mjs';

rule('add-goes-to-top', () => {
  test('a new todo appears above the older ones', () => { /* ... */ });
});
```

An unknown or `@planned` id throws immediately. Every `test()` in a behaviour
file must sit inside a `rule()` block.

**Unit tests are the only exemption**, and they are what make the rest
meaningful: without somewhere honest to put an internals test, coverage pressure
turns behaviour tests into filler. If a test does not answer to a Rule, it is a
unit test — put it in `tests/unit/`.

## The gates

```sh
npm run verify   # trace + test; this is what CI runs
npm run trace    # traceability, both directions
npm test         # tests + coverage gate
npm run serve    # http://localhost:8000
```

**Traceability** (`tools/trace.mjs`) fails on any of:

- a live Rule with no test referencing it;
- a behaviour test referencing a Rule that does not exist;
- a feature file with no test against any of its rules;
- a behaviour test outside a `rule()` block;
- a `@planned` Rule that *does* have a test — the tag should have come off.

**Coverage** (`tools/test.mjs`) requires **95%** lines, branches and functions
across `src/`. It reports itself INACTIVE while `src/` has no modules, rather
than passing on an empty measurement.

Both run on every push and PR via `.github/workflows/ci.yml`. Green `main`
deploys to <https://sargismarkosyan.github.io/todo-change/>.

## Issue tracking

GitHub Issues on `sargismarkosyan/todo-change`. Use `gh`.

Labels: `from-feedback` for anything out of a human testing session, then one of
`bug`, `enhancement`, `ux`, `accessibility`, `question`, plus `needs-spec` once
it is agreed to be built.

## Technical constraints

Deliberate. Do not "upgrade" them without a change spec:

- **No backend.** No server, no API, no database.
- **All data lives in `localStorage`**, and it is treated as untrusted input on
  every read.
- **The app ships zero dependencies.** Plain HTML, CSS, and ES modules, opened
  directly in a browser — no bundler, no framework, no build step. Dev tooling
  (`jsdom` for tests) is a different thing and is fine.
- **Single page.** `index.html` is the whole app.
- Logic that can be written without touching the DOM should be, so it can be
  tested and covered directly.

## Layout

```
index.html            the app — the only page
src/                  app modules and styles
specs/                see specs/README.md
tests/                unit and behaviour tests
tools/                the pipeline: gherkin.mjs, trace.mjs, test.mjs
.claude/skills/       project skills, including `feedback`
.github/workflows/    CI/CD
docs/screenshots/     the screenshot series, one per version
docs/feedback/        screenshots attached to issues
```

## Conventions

- **Commits** reference their change spec: `spec 0003: filter todos by status`,
  and close their issue with `Closes #12`.
- **Version numbers** are change spec numbers — "version 3" is the repo after
  spec 0003 shipped.
