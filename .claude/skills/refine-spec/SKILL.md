---
name: refine-spec
description: Refine a request into an approved-ready spec before any code is written. Use whenever someone asks for the todo-change app to be built, changed, added to, fixed, or improved — including small-sounding asks ("just add a button", "can it also…"), picking up a GitHub issue, or acting on feedback. Interrogates the request against the persona and workflows, works out the real job and the end value, then writes the Gherkin rules and the numbered change spec. Never implements.
---

# Refine the request into a spec

A request is not a spec. Someone hands you a **solution** — "add a clear-all
button" — and buried under it is a **job** — "the list gets cluttered and
clearing it one at a time is tedious enough that I stop bothering." The solution
they proposed is one answer to that job, and often not the best one.

Your work here is to find the job, check it against who this app is for, and
write the spec. **Not to build anything.** No `src/` edits in this skill, ever.

## Before anything else, read

- `specs/persona.md` — who Rowan is, and who this app is explicitly not for
- `specs/workflows.md` — the five things Rowan actually does
- `specs/spec.md` — product boundaries, the storage contract, and the vocabulary
- `specs/features/` — what is already specced, so you do not contradict or
  duplicate a live Rule
- the GitHub issue, if there is one (`gh issue view <n>`)

Do not skip this because the request seems obvious. The obvious-seeming ones are
where a spec quietly gets written for the wrong person.

## 1. Find the job

Separate what was asked from what is wanted.

- **The literal ask.** Their words, kept intact.
- **The job behind it.** What they were trying to accomplish, stated with no
  reference to any solution. If you cannot write this without naming a UI
  element, you have not found it yet.
- **The trigger.** What happened right before they wanted this. Jobs have
  moments; a job with no moment is usually a preference.
- **What they do today instead.** The workaround is the strongest evidence you
  have about how much this actually costs them.

Then ask whether the proposed solution is the best answer to that job. Say so if
it is not — with the alternative, not just the objection. A cheaper change that
serves the job better is the most valuable thing this skill produces.

## 2. Place it on the map

- **Which persona?** If it only pays off for someone who sets due dates and
  priorities, it is not for Rowan, and `persona.md` says that out loud. That does
  not kill it — but the spec must argue for the new persona explicitly instead of
  smuggling them in.
- **Which workflow, and where in it?** Name the step. A change that touches no
  workflow in `workflows.md` is either serving something undocumented (update
  `workflows.md` as part of the change) or serving nobody.
- **Does it make Capture or Complete shorter, or longer?** Adding a step to
  Capture to serve a once-a-month need is the single most common bad trade here.
- **Does it collide with a product boundary?** No backend, no accounts, no sync,
  no archives. If it does, say so plainly and stop for a decision.

## 3. Work out the end value

State what is true for them afterwards that is not true now, from their side of
the screen. Then the harder half: **how would we know it worked?** Something
observable — a workflow that got shorter, a mistake that stopped happening, a
reason to distrust the app that went away.

If you cannot name that, the change is decoration. Say so before writing it.

## 4. Ask what you cannot answer

Ask only where a different answer produces a *different spec*. Everything else,
decide yourself and record the assumption in the spec.

Batch the questions — one round, three or four at most, each with your
recommendation attached. Do not interview.

Good: "When the last unfinished todo is ticked, should the list look like the
empty state, or stay as it is? I lean toward staying — the ticked items are the
proof of a day's work, and hiding them takes the reward away."

Bad: "What color should the button be?"

## 5. Shrink it

The step must be small enough to be one screenshot's worth of change.

- What is the smallest version that delivers the end value? Spec that.
- What did you consider and drop? That goes in *What we are not doing* — the
  dropped alternatives are what stop this being relitigated next month.
- Does it split cleanly into two changes? Then it is two change specs, and only
  the first one is written now.

## 6. Write the spec

**Gherkin rules** in `specs/features/<area>/`, following `specs/README.md`:

- One component or behaviour per file, small. Add a new `.feature` file rather
  than growing one past its soft limits (120 lines, 6 rules).
- Every Feature gets `@feature:<id>`, every Rule gets `@rule:<id>`, unique
  repo-wide and stable — tests will point at those ids forever.
- Tag every new Rule `@planned`. It is not built yet. The tag comes off in the
  implementing change, not here.
- Every Rule needs at least one `Example:`. Write the examples in Rowan's terms
  and the repo's vocabulary — *todo*, *done*, *unfinished*, *the list*, *the box*
  — never "task", "item", or "complete".
- Changing existing behaviour? Edit the Rule in place and keep its id. A reworded
  Rule is the same Rule; a new id orphans every test pointing at it.

**The change spec** at `specs/changes/NNNN-<slug>.md`, from
`specs/changes/TEMPLATE.md`, numbered one past the highest existing. Fill in
*Who this is for*, *The job behind the request*, *Why now*, and *The end value*
properly — those four sections are the whole point of this skill, and a spec
that has them filled with restated feature description has failed.

**Prose specs.** If this changes a decision or adds vocabulary, update
`specs/spec.md`, the area `spec.md`, or `workflows.md` in the same pass. A prose
spec that contradicts a live feature file is worse than one that says nothing.

## 7. Check and hand back

```sh
npm run trace
```

Must stay green — new `@planned` rules are exempt from needing tests, so a
failure here means a real mistake: a duplicate id, a rule with no example, or a
`@planned` tag you forgot.

Then commit the spec on its own (`spec 0004: <title>` — specs commit separately
from implementations) and report back:

- the job you found, and how it differed from what was asked;
- which persona and workflow it serves;
- the end value and how we would know it worked;
- what you deliberately left out;
- anything you assumed because it was not worth blocking on.

**Then stop.** The spec needs approval before it is built. Implementing without
it breaks the rule this whole repo exists to demonstrate.
