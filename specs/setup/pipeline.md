# The pipeline

Two gates: **traceability** and **coverage**. Coverage alone rewards tests that
touch code without asserting anything anyone asked for. Traceability alone
rewards tests that name a rule and check it shallowly. Together they are hard to
satisfy dishonestly.

## Commands

```sh
npm run verify   # trace + test — exactly what CI runs
npm run trace    # traceability only
npm test         # tests + coverage gate
npm run serve    # http://localhost:8000
```

Run `npm run verify` before every commit. CI runs the same thing, so a green
local run means a green build.

## Gate 1 — traceability (`tools/trace.mjs`)

Enforced in **both directions**:

```
rule  →  test     every live Rule must be claimed by a test
test  →  rule     every behaviour test must name the Rule it exists for
```

It fails on any of:

| Failure | What it means |
|---|---|
| a live Rule with no test referencing it | Behaviour was specced and never verified. Write the test, or tag the rule `@planned` if it is not built yet. |
| a test claiming a Rule id that does not exist | Usually a typo, or a rule id that was renamed. Rule ids are permanent — see below. |
| a feature file with no test against any of its rules | A whole component is unverified. |
| a `test()` outside a `rule()` block in a behaviour file | An untraced behaviour test. Move it inside a block, or into `tests/unit/`. |
| a behaviour file with no `rule()` at all | Same. This is the check that stops coverage filler. |
| a `@planned` Rule that *does* have a test | The tag should have come off in the change that made it true. |

It also warns, without failing, when a unit test claims a rule (it probably
belongs in `tests/behaviour/`), and when a feature file grows past its soft
limits.

The output is a per-feature matrix — `✓` traced, `✗` untraced, `·` planned —
followed by a count. It is worth reading even when green.

## The id system

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

- `@feature:<id>` on every Feature, `@rule:<id>` on every Rule, both unique
  across the whole repo.
- Every Rule needs at least one `Example:` / `Scenario:`.
- **Rule ids are permanent.** Reword a `Rule:` line as much as you like — it is
  the same rule. Changing its id orphans every test pointing at it, and the gate
  will report the test as claiming something that does not exist.
- `@planned` marks a rule that is specced but not built. Specs land before code,
  so this is the normal state of a new rule.

`tools/gherkin.mjs` is the reader — no dependencies, small enough to read in
one sitting. It also
enforces structure: one Feature per file, no scenario outside a Rule, no
duplicate ids, nothing unnamed. Soft limits of 120 lines and 6 rules per file
produce warnings, because small per-component files are the point.

## Gate 2 — coverage (`tools/test.mjs`)

**95% of lines, branches and functions across `src/`.** Node's built-in runner
and coverage; no external tooling.

The runner is a thin wrapper that exists to do one thing honestly: while `src/`
has no modules it prints `coverage gate: INACTIVE` and skips the thresholds,
rather than passing on a measurement of nothing. It arms itself automatically the
moment the first module lands.

All three thresholds matter. Line coverage alone is the weakest of the three —
V8 counts a function's declaration line as covered even when the body never runs,
so an uncalled function can still show 100% lines while function coverage
correctly reports 50%.

## CI/CD

`.github/workflows/ci.yml`, on every push to `main` and every pull request.

**`verify`** — checkout, Node 24 with npm cache, `npm ci`, `npm run trace`,
`npm test`.

**`deploy`** — only on `main`, only after `verify` passes. Publishes the repo
root to GitHub Pages at <https://sargismarkosyan.github.io/todo-change/>. Pages
is configured with `build_type: workflow`, so the workflow is the only thing that
can deploy. Concurrency is grouped per ref and does **not** cancel in progress —
a half-finished deploy is worse than a slow one.

The site serves the repo root, so `specs/` and `tests/` are published alongside
the app. They are public anyway, and it keeps the deploy step to one line.

## Both gates are verified to fire

They were tested against deliberate violations rather than assumed to work:

| Injected fault | Result |
|---|---|
| live rule with no test | fails |
| test names a nonexistent rule | fails |
| behaviour test outside `rule()` | fails |
| behaviour file with no `rule()` at all | fails |
| `@planned` rule that has a test | fails |
| module at 40% branch / 50% function coverage | fails |
| fully covered module | passes |

If you change either gate, re-check it the same way. A gate that has never failed
is not known to be a gate.
