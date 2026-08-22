# The process

## What this project is for

`todo-change` is a **test bed for spec-driven development**. The todo app being
built matters less than the process being demonstrated: every change starts as a
written spec, gets implemented in one small step, and is captured as one commit.

The deliverable is a **series of screenshots** — one per version — showing the
product evolving change by change. That is why every commit must leave the app in
a state worth looking at.

## Who does what

**The human uses the app.** They run it, test it, break it, and say what they
found. They approve specs. They take the screenshots. They do not write code,
issues, or specs by hand.

**The AI writes everything else.** Issues, specs, code, tests. This repo has no
human-authored source.

That split is the point. It is also why the written artefacts have to be good:
they are the only channel between the person who knows what is wrong and the
thing that fixes it.

## The loop

1. **Human tests and reports.** In Claude chat, in their own words, with
   screenshots. Not in the app, not as a written issue.
2. **AI files issues** using the [`feedback`](skills.md#feedback) skill. It takes
   the report apart into distinct insights, investigates the code to find what is
   actually happening, and files researched GitHub issues. It does not fix.
3. **AI writes the spec** using the [`refine-spec`](skills.md#refine-spec) skill.
   It digs out the job behind the request, checks it against the persona and
   workflows, and writes Gherkin rules tagged `@planned` plus a numbered change
   spec. It does not implement.
4. **Human approves** the spec, or asks for changes.
5. **AI implements.** Removes the `@planned` tags, writes the tests referencing
   those rules, makes `npm run verify` green, commits.
6. **AI records the version** using the [`record-clip`](skills.md) skill — one
   animated GIF of the change, on the branch — and opens the pull request with it
   in the body.
7. **Human merges**, and uses the new version.
8. **AI closes the issue**, with a comment saying what was asked, what shipped,
   and why they differ. Back to 1.

Steps 2 and 3 are separate on purpose. Filing and specifying are different jobs
and get done badly when merged — filing wants breadth and evidence, specifying
wants focus and a decision.

**Step 6 used to be "human screenshots the new version",** and it moved when the
picture became an animated GIF recorded from the change spec's own shot list —
see [repository.md](repository.md#every-pull-request-carries-a-moving-picture).
The human still uses the version, which is step 7 and where the next round of
feedback comes from; what they stopped doing is producing the deliverable by
hand.

## The rules

- **One change spec = one step = one version.** Unrelated changes do not travel
  together, however small.
- **Spec before code.** No implementation without an approved change spec, and no
  change spec without `refine-spec` first. A request is not a spec.
- **A change to `workflows.md` or `persona.md` is confirmed on its own.** Those
  two files say what the product is and who it is for, and every other layer in
  `specs/` is downstream of them. **The reason this needs a rule is that such an
  edit never arrives on its own** — it rides inside a spec nominally about a
  button, where a single "approved" silently covers both, and the largest half
  is the half nobody was looking at. So it does not travel with the spec's
  approval: show that diff by itself, say in one line what it changes about who
  this is for or what they do, and get it confirmed *before* asking for approval
  of the spec. **If only one thing is reviewed in a round, it is this one.**
- **Feedback is never fixed on the spot.** It becomes an issue, then a spec, then
  a commit. Fixing something the moment it is mentioned is the fastest way to
  lose the record of why it changed.
- **No silent scope growth.** Found something else broken while working? File it
  as its own issue. Do not fix it inline.
- **Every version must run and be green.** Each commit is a screenshot candidate
  and must pass `npm run verify`.
- **Specs commit separately from implementations.** `spec 0004: <title>` lands
  first and is approved; the implementation follows in its own commit.
- **An issue is closed when its job is answered, not when its request is built.**
  The two are often different — a request is one proposed shape for a job, and
  `refine-spec` exists to tell them apart. Comment what was asked, what shipped,
  and why they differ; then close. Anything dropped goes in that comment, and
  gets a fresh issue if it is still wanted. See
  [repository.md](repository.md#closing-an-issue-by-hand).

## Versions

A version number is a change spec number. "Version 3" is the state of the repo
after spec `0003` shipped. Version 0 is the scaffold — process machinery, no app.

There are no semver tags and no releases. `git log` is the version history, and
`docs/screenshots/` is its visual counterpart.

## When the process gets in the way

It sometimes will — a one-word typo fix does not need a persona analysis. The
judgment call is whether the change alters **behaviour someone could notice**. If
it does, it needs a spec, however small it looks. If it does not (a comment, a
stale path in a doc, a broken link), fix it and say so.

When unsure, write the spec. The cost of an unnecessary small spec is a few
minutes. The cost of undocumented behaviour change is that the screenshot series
stops explaining itself.
