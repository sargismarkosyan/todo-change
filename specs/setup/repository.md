# The repository

## Where it lives

- **GitHub:** <https://github.com/sargismarkosyan/todo-change> (public)
- **Live app:** <https://sargismarkosyan.github.io/todo-change/>, deployed from
  green `main` by GitHub Actions
- **Default branch:** `main`. Work commits directly to it — there is one author
  and every commit is gated by CI.

## Layout

```
index.html               the app — the only page
src/                     app modules and styles (empty until version 1)

specs/
  spec.md                product-level prose: why, vocabulary, storage contract
  persona.md             who the app is for, and who it is not for
  workflows.md           the five things that person actually does
  README.md              how the spec layers fit together
  setup/                 this folder — how the repo works
  features/<area>/
    spec.md              area-level prose
    *.feature            Gherkin, the enforced contract
  changes/
    TEMPLATE.md          the change spec template
    NNNN-*.md            one numbered change spec per version

tests/
  unit/                  internals; exempt from rule references
  behaviour/             must reference a Gherkin rule
  support/covers.mjs     the rule() helper

tools/
  gherkin.mjs            dependency-free .feature reader
  trace.mjs              the traceability gate
  test.mjs               the test runner and coverage gate

.claude/skills/          project skills: refine-spec, feedback
.github/workflows/ci.yml CI and Pages deploy
docs/screenshots/        the screenshot series, one per version
docs/feedback/           screenshots attached to issues
```

## Key files, and what to read when

| You want to know | Read |
|---|---|
| How work flows through the repo | [process.md](process.md) |
| Why there is no backend | [constraints.md](constraints.md) |
| Why CI failed | [pipeline.md](pipeline.md) |
| How to write a test it accepts | [testing.md](testing.md) |
| What the skills do | [skills.md](skills.md) |
| How specs are layered | [`../README.md`](../README.md) |
| Who the app is for | [`../persona.md`](../persona.md) |
| What "done" means for a workflow | [`../workflows.md`](../workflows.md) |

## Commits

One change spec, one commit. Message format:

```
spec 0003: filter todos by status

<body: what changed and, more usefully, why this shape rather than the
alternatives — the reasoning that will not survive in the diff>

Closes #12

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

- Spec commits use the same prefix and land before their implementation.
- Setup and tooling commits do not have a spec number; describe them plainly
  (`add refine-spec skill, persona and workflows`).
- Never commit a state that fails `npm run verify`.

## Issues

GitHub Issues, via `gh`. There is no issue directory in the repo — an earlier
version had one and it was removed rather than run two trackers in parallel.

Labels:

| Label | Meaning |
|---|---|
| `from-feedback` | Came out of a human testing session. Applied to everything the `feedback` skill files. |
| `bug` | Behaviour that contradicts a spec, or a crash. |
| `enhancement` | Something new. |
| `ux` | Usability friction, layout, or wording. |
| `accessibility` | A barrier for someone using assistive technology. |
| `question` | Needs an answer before it can be classified. |
| `needs-spec` | Agreed to be built; waiting on a change spec. |

Issues are closed by the commit that implements the fix (`Closes #12`), not
before.

## Screenshots

`docs/screenshots/` holds one image per version — the actual deliverable of the
project. `docs/feedback/` holds images attached to issues, which are evidence
rather than product.

Images pasted directly into chat cannot be written to disk. For a screenshot to
end up in either folder it has to be handed over as a **file path**.

## Local setup

```sh
git clone https://github.com/sargismarkosyan/todo-change
cd todo-change
npm install         # jsdom, for tests — the app itself needs nothing
npm run serve       # http://localhost:8000
npm run verify      # the same gates CI runs
```

Node 24 or newer (`engines` in `package.json`); CI runs 24. The only dependency
in the whole repo is `jsdom`, and it is a devDependency — see
[constraints.md](constraints.md).
