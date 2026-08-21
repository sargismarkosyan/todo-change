# The repository

## Where it lives

- **GitHub:** <https://github.com/sargismarkosyan/todo-change> (public)
- **Live app:** <https://sargismarkosyan.github.io/todo-change/>, deployed from
  green `main` by GitHub Actions
- **Default branch:** `main`, and it is protected. Nothing lands on it except
  through a pull request — direct pushes are rejected for everyone, the author
  included. See [Branches and pull requests](#branches-and-pull-requests).

## Layout

```
index.html               the app — the only page
src/                     app modules and styles

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

## Branches and pull requests

`main` is protected. Work happens on a branch and arrives by pull request:

```sh
git switch -c spec-0004-clear-done
# ... commits ...
git push -u origin spec-0004-clear-done
gh pr create --fill
```

What the protection enforces:

| Setting | Effect |
|---|---|
| Pull request required | No direct push to `main`, ever |
| Required check: `Verify` | The CI job — traceability, tests, 95% coverage |
| Strict | The branch must be up to date with `main` before merging |
| Applies to admins | The repository owner has no bypass |
| No force pushes, no deletion | `main`'s history cannot be rewritten or removed |
| Conversation resolution required | Review threads get answered, not merged past |

**Approvals are set to zero.** There is one author, and GitHub does not let
anyone approve their own pull request — requiring one would lock the repository
against its only contributor. Zero still forces every change through a PR and
through `Verify`; it only drops the second pair of human eyes, which does not
exist here anyway.

The protection is the same gate as `npm run verify`, moved somewhere it cannot
be skipped in a hurry. If it ever needs lifting, that is a settings change and a
deliberate one — not a `--force`.

### Every pull request carries a moving picture

**A pull request that changes what the app looks like shows it, in the body.**
The deliverable here is a series of pictures — a description of a screen is not
one, and a reviewer should not have to check the branch out to see what a
version did.

**One animated GIF per version**, in `docs/screenshots/`, named for the change
spec: `v008-one-box-every-book.gif`. A still is not enough and is no longer
taken — half of what this app does is a thing *happening* (a recipe unfolding, a
line landing where it was dropped, a draft arriving a proposal at a time), and a
frozen frame of it is the part that does not carry.

It is recorded **on the branch, before the pull request is opened**, by the
[`record-clip`](skills.md) skill. That skill owns the how — viewport, frames,
stitching, what to put on screen — and this file does not repeat it.

Embed it with a **permanent** raw URL pinned to the commit rather than the
branch:

```sh
sha=$(git rev-parse HEAD)
echo "![...](https://raw.githubusercontent.com/<owner>/<repo>/$sha/docs/screenshots/vNNN-<slug>.gif)"
```

A branch URL is the obvious thing and it rots: branches are deleted on merge,
and the image in the pull request goes with them. Relative paths do not work at
all — GitHub does not resolve them in a pull request body. A raw `.gif` animates
in a pull request body, which is the whole reason this is the format.

**The PNGs already in `docs/screenshots/` stay.** Versions 8 to 12 shipped before
this rule and their stills are the record of those versions; nothing is
regenerated to match a convention that came later. Version 13's still went,
because it had not shipped yet — one version, one picture.

A change with nothing to see — tooling, a doc, a refactor — says so in a line
instead. That is the only exemption, and "it is hard to record" is not it.

## Commits

One change spec, one commit. Message format:

```
spec 0005: a paper ground and ink on it

<body: what changed and, more usefully, why this shape rather than the
alternatives — the reasoning that will not survive in the diff>

Closes #12

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

- Spec commits use the same prefix and land before their implementation.
- Setup and tooling commits do not have a spec number; describe them plainly
  (`add refine-spec skill, persona and workflows`).
- Never commit a state that fails `npm run verify`. `Verify` will catch it on the
  pull request, but finding out locally is cheaper.

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

### Closing an issue

Put `Closes #12` in the **pull request description**. Not only in a commit
message.

Both mechanisms exist and both close the issue when the work reaches `main`. The
difference is what they depend on. A keyword in a commit message relies on that
commit's text surviving the merge, which under squash merging depends on the
repository's squash-message setting — a setting someone can change later without
any sign that it broke issue closing. A keyword in the PR description fires on
merge whatever the strategy, and GitHub shows the link on the PR before it
merges, so you can see it is wired up rather than hope.

Write it in both if you like. Only the description is the mechanism.

**The keyword has to sit immediately before the reference.** `Closes #12` links;
`Closes the structural half of #12` does not — GitHub reads that as a plain
mention, nothing fires on merge, and the line still *reads* like a link, which is
how it goes unnoticed. Version 13 shipped that way. Check before merging rather
than after:

```sh
gh pr view <n> --json closingIssuesReferences
```

An empty list means no issue will close, whatever the description says.

### Closing an issue by hand

Two cases, and both need a comment before the close.

**The work shipped, but the resolution is not what was asked for.** Close it
anyway, as completed. An issue tracks a *job*, not a feature list, and the job
can be answered by something other than the thing requested. The comment is the
part that matters: **what was asked, what shipped, and why they differ.** A part
of the request that was dropped is recorded there with its reasoning — and if it
is still wanted later it gets a fresh issue, rather than living on as the stale
half of a finished one. Half-open issues rot, and nobody reads a tracker of
them.

This is the case the keyword cannot serve, and the reason to leave the keyword
out on purpose: a pull request that answers half of what an issue asked should
not close it silently on merge, before anybody has written down what happened.

**The issue turns out to be mistaken rather than fixed.** Close it with a comment
saying which — a tracker that does not distinguish "fixed" from "wasn't real"
stops being worth reading.

**Sweep the siblings.** A shipped change often answers more than the issue it was
written for. When one closes, read the others it touched: version 13 was written
for one issue and answered three, and the other two would have sat open for
nothing. Where it only half-answers one, say exactly what did not change and
invite a reopen.

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
