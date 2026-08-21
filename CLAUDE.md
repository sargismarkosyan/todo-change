# CLAUDE.md

`todo-change` is a **test bed for spec-driven development**. The app being built
— a recipe book since version 4, a todo list before it — matters less than the
process: every change starts as a written spec, gets implemented in one small
step, and is captured as one commit. The deliverable is a **series of
screenshots**, one per version.

The repo is written **only by AI**. The human uses the app, reports what they
find, and approves specs.

**Full detail lives in [`specs/setup/`](specs/setup/README.md). Read it before
working here.**

| | |
|---|---|
| The loop, and the rules | [specs/setup/process.md](specs/setup/process.md) |
| What lives where, git and GitHub conventions | [specs/setup/repository.md](specs/setup/repository.md) |
| No backend, localStorage, no build step — and why | [specs/setup/constraints.md](specs/setup/constraints.md) |
| The gates, and what each failure means | [specs/setup/pipeline.md](specs/setup/pipeline.md) |
| How to write a test the pipeline accepts | [specs/setup/testing.md](specs/setup/testing.md) |
| The `refine-spec` and `feedback` skills | [specs/setup/skills.md](specs/setup/skills.md) |
| How the spec layers fit together | [specs/README.md](specs/README.md) |
| Who the app is for | [specs/persona.md](specs/persona.md) |
| What they actually do with it | [specs/workflows.md](specs/workflows.md) |

## The loop

1. **Human** tests the app and reports what they found, in chat.
2. **AI** files researched GitHub issues — the `feedback` skill.
3. **AI** writes the spec — the `refine-spec` skill. Gherkin rules tagged
   `@planned`, plus a numbered change spec in `specs/changes/`.
4. **Human** approves it.
5. **AI** implements, drops the `@planned` tags, writes the tests, commits green.
6. **AI** records the version's GIF — the `record-clip` skill — and opens the PR
   with it in the body.
7. **Human** merges and uses it.
8. **AI** closes the issue, saying what was decided and why. Back to 1.

## Rules

- **Spec before code.** No implementation without an approved change spec, and no
  change spec without `refine-spec` first — a request is not a spec.
- **One change spec = one step = one version.** Never bundle unrelated changes.
- **Feedback is never fixed on the spot.** Issue, then spec, then commit.
- **No silent scope growth.** Found something else broken? File it as its own
  issue rather than fixing it inline.
- **Every commit must pass `npm run verify`.** Each one is a screenshot
  candidate.
- **Rule ids are permanent.** Reword a `Rule:` line freely; changing its
  `@rule:<id>` orphans every test pointing at it.
- **Never touch `src/` from a skill.** Both skills stop at the spec.
- **`main` is protected.** Branch, then land it by pull request — direct pushes
  are rejected for everyone. The `Verify` check must be green to merge.
- **Close the issue when the job is answered**, not when its literal request is
  built — those differ more often than not. Comment what was asked, what shipped
  and why they differ, then close; a dropped half goes in the comment and gets a
  fresh issue if it is still wanted, never a stale open one. Check the `Closes
  #N` link fired: the keyword only works immediately before the reference. Then
  `git rm` any `docs/feedback/` image the issue embedded — that folder holds
  evidence for open questions, not history.
- **A pull request shows what changed.** If the app looks different, the body
  carries an animated GIF from `docs/screenshots/`, recorded on the branch by the
  `record-clip` skill and embedded by a raw URL pinned to the commit. The
  deliverable is moving pictures; a description of a screen is not one, and
  neither is a frozen frame of something happening.
  See [repository.md](specs/setup/repository.md#every-pull-request-carries-a-moving-picture).

## Commands

```sh
npm run verify   # traceability + tests + 95% coverage — what CI runs
npm run trace    # traceability only
npm test         # tests + coverage gate
npm run serve    # http://localhost:8000
```

## Layout

```
index.html            the app — the only page
src/                  app modules and styles
specs/setup/          how this repo works — start here
specs/                persona, workflows, features (Gherkin), changes
tests/                unit/ and behaviour/
tools/                gherkin.mjs, trace.mjs, test.mjs
.claude/skills/       refine-spec, feedback
.github/workflows/    CI and Pages deploy
docs/screenshots/     the series — one animated GIF per version
```

Live: <https://sargismarkosyan.github.io/todo-change/> · Issues on
`sargismarkosyan/todo-change`, via `gh`.
