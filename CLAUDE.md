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
problems, and log them. The loop is:

1. **Human** runs the app, tests it, and writes an issue in `issues/open/`
   (a bug report, or a request for a new feature).
2. **AI** picks up an open issue, writes or updates a spec in `specs/`
   describing exactly what will change.
3. **Human** approves the spec (or asks for edits).
4. **AI** implements the spec, in one focused commit.
5. **AI** moves the issue to `issues/closed/` and notes the version.
6. **Human** takes a screenshot of the new version. Back to step 1.

Rules that follow from this:

- **One spec = one step = one version.** Do not bundle unrelated changes.
- **Spec before code.** If asked to implement something with no spec, write the
  spec first and get it approved.
- **No silent scope growth.** Spotted something else broken? Log it as a new
  issue in `issues/open/` instead of fixing it inline.
- **Every version must run.** Never commit a state where the app is broken —
  each commit is a screenshot candidate.

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
index.html          the app shell — the only page
src/                app code (ES modules) and styles
specs/              one numbered markdown spec per change
issues/open/        problems and requests logged by the human
issues/closed/      issues that have shipped
docs/screenshots/   the screenshot series, one per version
```

## Running it

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## Conventions

- **Specs** are numbered and kebab-cased: `specs/0003-filter-by-status.md`.
  Use `specs/TEMPLATE.md`.
- **Issues** are numbered and kebab-cased: `issues/open/0007-checkbox-misaligned.md`.
  Use `issues/TEMPLATE.md`.
- **Commits** reference their spec: `spec 0003: filter todos by status`.
- **Version numbers** are just the spec numbers — "version 3" is the state of
  the repo after spec 0003 shipped.
