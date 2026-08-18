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
   the human said, investigates the code to work out what is actually happening,
   and files researched **GitHub issues**.
3. **AI** picks up an open issue and writes a spec in `specs/` describing
   exactly what will change.
4. **Human** approves the spec (or asks for edits).
5. **AI** implements the spec in one focused commit, and closes the issue.
6. **Human** screenshots the new version. Back to step 1.

Rules that follow from this:

- **One spec = one step = one version.** Do not bundle unrelated changes.
- **Spec before code.** If asked to implement something with no spec, write the
  spec first and get it approved.
- **Feedback is never fixed on the spot.** It becomes an issue, then a spec,
  then a commit. The `feedback` skill files; it does not edit.
- **No silent scope growth.** Spotted something else broken? File it as its own
  issue instead of fixing it inline.
- **Every version must run.** Never commit a state where the app is broken —
  each commit is a screenshot candidate.

## Issue tracking

Issues live in **GitHub Issues** on `sargismarkosyan/todo-change`, not in this
repo as files. Use `gh` to read and write them.

Labels: `from-feedback` marks anything that came out of a human testing session.
Then one of `bug`, `enhancement`, `ux`, `accessibility`, `question`, plus
`needs-spec` once it is agreed to be built.

## Technical constraints

These are deliberate and should not be "upgraded" without a spec:

- **No backend.** There is no server, no API, no database.
- **All data lives in `localStorage`.** It is the single source of truth for
  user data and must survive a page reload.
- **No build step, no dependencies.** Plain HTML, CSS, and ES modules, opened
  directly in a browser. This keeps diffs readable and screenshots easy to take.
- **Single page.** `index.html` is the whole app.

## Layout

```
index.html            the app shell — the only page
src/                  app code (ES modules) and styles
specs/                one numbered markdown spec per change
.claude/skills/       project skills, including `feedback`
docs/screenshots/     the screenshot series, one per version
docs/feedback/        screenshots attached to issues
```

## Running it

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## Conventions

- **Specs** are numbered and kebab-cased: `specs/0003-filter-by-status.md`.
  Use `specs/TEMPLATE.md`.
- **Commits** reference their spec: `spec 0003: filter todos by status`, and
  close their issue with `Closes #12`.
- **Version numbers** are just the spec numbers — "version 3" is the state of
  the repo after spec 0003 shipped.
