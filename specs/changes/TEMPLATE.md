# Spec NNNN: <short title>

- **Status:** proposed | approved | shipped
- **Issue:** #NN (or "none — direct request")

## Who this is for

Which persona, and which of *their* situations. Name the workflow from
[workflows.md](../workflows.md) this sits in, and where in it.

If this does not serve Rowan, say so here and argue for it anyway — that is a
legitimate move, but it has to be made out loud. See [persona.md](../persona.md).

## The job behind the request

What the person was actually trying to accomplish, stated without reference to
any solution. Not "add a clear-completed button" — "at the end of the day the
list is cluttered with things I already did, and clearing them one at a time is
tedious enough that I stop bothering."

## Why now

What is going wrong today, and what it costs. If nothing is going wrong, this is
a nice-to-have and should be labelled as one.

## The end value

What is true for them afterwards that is not true now. Written from their side
of the screen, not the code's. One or two sentences.

**How we would know it worked:** the observable thing that changes — a workflow
that got shorter, a mistake that stopped happening, a reason to distrust the app
that went away.

## What changes

The user-visible behaviour after this ships, concrete enough to check by looking
at the screen.

- ...

**Rules added or changed** — the `@rule:` ids in `specs/features/`:

| Rule id | Feature file | New or changed |
|---|---|---|
| `...` | `features/.../....feature` | new |

## What we are not doing

The scope this deliberately leaves out, and the near-miss alternatives that were
considered and dropped. This section is what keeps the step small.

- ...

## Data

Any change to the `localStorage` shape, and what happens to data already stored
in the old shape.

## Risks

What could go wrong, especially for workflow 5 (Return) — anything touching
storage deserves a line here.

## Acceptance checks

What the human does by hand to confirm it. Automated coverage is the pipeline's
job; this is the screenshot pass.

1. ...
