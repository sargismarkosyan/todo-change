# Specs

This folder holds two different things. **[`setup/`](setup/README.md) describes
how the repository works** — the process, the gates, the skills. Everything else
describes the product.

What follows is about the product.

Four layers, four jobs. They are not alternatives — a change usually touches
several.

| Layer | Where | Answers | Lifetime |
|---|---|---|---|
| **Who and what for** | `persona.md`, `workflows.md` | *Who is this for, and what are they doing?* | Living — rarely, and deliberately |
| **General spec** | `spec.md` files | *Why does this exist, and what is it for?* | Living — edited as understanding changes |
| **Feature spec** | `features/**/*.feature` | *What must be true?* | Living — the current contract |
| **Change spec** | `changes/NNNN-*.md` | *What is changing in this one step?* | Frozen once shipped |

## Who and what for — `persona.md`, `workflows.md`

The fixed points. [`persona.md`](persona.md) names who the app is built for and,
just as usefully, who it is not for. [`workflows.md`](workflows.md) describes the
five things that person actually does with it.

Every change spec must name the persona and the workflow step it serves. These
two files are what makes that a real check rather than a box to tick, and the
`refine-spec` skill measures every incoming request against them.

They change rarely. When one does change, it is a decision about what the product
*is*, and belongs in a change spec of its own — and **that edit is confirmed on
its own**, separately and before the spec carrying it is approved. It is the
largest thing a change can do and the easiest to approve without noticing. See
[setup/process.md](setup/process.md#the-rules).

## General specs — `spec.md`

Prose. One per area, sitting next to that area's feature files. Context,
vocabulary, and the reasoning behind decisions. Nothing here is directly
testable; if a statement *is* testable it belongs in a `.feature` file.

## Feature specs — `features/**/*.feature`

[Gherkin](https://cucumber.io/docs/gherkin/). This is the contract the tests are
checked against, and the only layer the pipeline enforces.

Folders group by area and may nest. **Keep files small — one behaviour per file,
never one component.** A file describing "recipes" is too big; `writing.feature`,
`reading.feature`, and `deleting.feature` are right, because they are the things
Nell does.

Splitting by UI part instead — `recipe-card.feature`, `menu.feature` — looks
tidier and is a trap. "A recipe row renders a delete button" is an implementation
detail in spec costume, and since tests bind to rule ids, component rules breed
component tests wearing behaviour badges. That is the coverage filler
[setup/pipeline.md](setup/pipeline.md) exists to reject, and neither gate can
tell the difference — only this naming rule can. Reusable components are a
`src/` concern; the contract should not know the UI has parts.

When a file does outgrow itself, split by sub-behaviour: `writing.feature` into
`writing.feature` and `writing-multiline.feature`.

Soft limits, warned about by `npm run trace`: 120 lines and 6 rules per file.
The truer signal comes earlier — a `Background:` that individual rules keep
overriding means the shared setup has stopped fitting the rules under it.

Watch also for the same truth asserted in two areas under two ids. Both will
have tests, both will pass, and they can drift apart silently; no gate catches
it.

Required tags — traceability is built on them:

```gherkin
@feature:recipe-writing
Feature: Writing a recipe down

  @rule:add-goes-to-top
  Rule: A new recipe goes to the top of the contents

    Example: writing one down in an empty book
      When I write down "Apple cake"
      Then the contents reads:
        | Apple cake |
```

- `@feature:<id>` on every Feature. Unique across the repo.
- `@rule:<id>` on every Rule. Unique across the repo. **This id is what tests
  reference**, so it must stay stable — reword a `Rule:` line freely, but
  changing its id breaks the link.
- Every Rule needs at least one `Example:` / `Scenario:`.
- `@planned` marks a Rule that is specced but not built yet. Specs land before
  code, so this is normal — the traceability gate exempts planned rules from
  needing a test, and fails if a planned rule *does* have one (the tag should
  have come off in the same change).

## Change specs — `changes/NNNN-*.md`

One numbered markdown file per version, from `changes/TEMPLATE.md`. This is the
increment: what is being added *now*, what is deliberately out of scope, and how
to check it by hand. Once shipped it is history and is not edited.

**Read them on demand, never in bulk.** Nothing indexes this folder — neither
gate reads it, and neither skill reads it for background. Open the current one
to implement it, or an old one when the question is specifically "why is it like
this." Reading the series to get oriented is the one thing it is not for: what
is true *now* is in `features/`, and why the product is shaped this way is in
the prose specs. This folder only grows, and it is the one part of `specs/` that
is safe to leave unread.

The template opens with four sections — who it is for, the job behind the
request, why now, and the end value — before it gets anywhere near what changes.
That order is deliberate: a change spec that cannot fill them in is a solution
in search of a problem.

The change spec is also where feature files get their `@planned` tags removed.

## The gates

```sh
npm run verify     # both of the below
npm run trace      # traceability
npm test           # tests + 95% coverage
```

`npm run trace` enforces, in both directions:

- every live Rule has at least one test referencing it;
- every behaviour test references a Rule that exists;
- every feature file has at least one test against it;
- no behaviour test sits outside a `rule()` block.

Unit tests in `tests/unit/` are exempt — they cover internals no Rule describes.
That exemption is the whole reason the other direction is enforced: without it,
coverage could be satisfied by tests that assert nothing anyone asked for.
