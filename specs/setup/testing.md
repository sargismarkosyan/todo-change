# Writing tests

## The two kinds

```
tests/behaviour/    answers to a Gherkin rule. Everything user-visible.
tests/unit/         internals. The one exemption from rule references.
tests/support/      helpers. Not tests; not run.
```

Files must be named `*.test.mjs` — that is the discovery pattern
(`tests/**/*.test.mjs`).

## Behaviour tests

Every behaviour test declares the rule it exists for:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';

rule('add-goes-to-top', () => {
  test('a new recipe appears above the older ones', () => {
    // ...
    assert.deepEqual(app.contents(), ['Apple cake', 'Lemon drizzle']);
  });
});
```

`rule()` looks the id up in `specs/features/` and throws immediately if it does
not exist, or if it is still tagged `@planned`. The error lists the ids that do
exist, which is usually enough to spot the typo.

It wraps `describe()`, so the rule id and its text appear in the test output:

```
▶ [add-goes-to-top] A new recipe goes to the top of the contents
  ✔ a new recipe appears above the older ones
```

Every `test()` in a behaviour file must sit **inside** a `rule()` block. One at
the top level is an untraced behaviour test and the gate rejects it.

One rule may have several tests, and one file may cover several rules — but a
file should stay recognisably about one component, like the feature file it
mirrors.

### Write them against the rule, not the implementation

The Gherkin `Example:` blocks are the specification of what to assert. If the
rule says the contents reads `Apple cake` then `Lemon drizzle`, assert the
rendered order — not that a sort function was called. A behaviour test that
passes while the screen is wrong is worse than no test, because it costs the
gate its meaning.

`ruleText(id)` from the same helper returns the parsed rule if a test wants to
read its text.

## Unit tests

For internals no Gherkin rule describes: a parser, a serialiser, an id
generator, the pipeline tooling itself. No `rule()` call, no reference.

**This exemption is the reason the rest works.** Without an honest place to put
an internals test, coverage pressure turns behaviour tests into filler that names
a rule and asserts nothing. The rule of thumb: if you cannot name the Gherkin
rule it answers to, it is a unit test — and if you can, it does not belong here.

The gate warns when a unit test claims a rule, which usually means the file is in
the wrong folder.

## The DOM

Tests run under Node, not a browser. `jsdom` provides `document` and
`localStorage`:

```js
import { JSDOM } from 'jsdom';

const dom = new JSDOM(html, { url: 'http://localhost/' });
// dom.window.document, dom.window.localStorage
```

The `url` option matters — `localStorage` is unavailable on an opaque origin, so
without it the storage tests fail in a confusing way.

Build a fresh `JSDOM` per test rather than sharing one. `localStorage` persists
across tests in the same window, and a leaked key from an earlier test is a
genuinely nasty failure to diagnose.

Everything that can be tested without the DOM should be — see
[constraints.md](constraints.md).

## Coverage

95% lines, branches and functions across `src/`. Some practical notes:

- Aim at branches first. Lines follow; branches are where the untested paths
  hide, and V8's line counting is generous about function declarations.
- The error-handling paths in storage reads are real behaviour with real rules
  behind them, not coverage chores. Corrupt the stored value and assert the app
  still opens on a usable book.
- If a branch is genuinely unreachable, it should not be there. Deleting it is a
  better fix than a test that pretends to reach it.

## A test that fails sometimes is worse than no test

Both gates are only worth what their reliability is worth. A test that fails two
runs in five teaches everyone to press re-run, and from then on a real failure
looks like the usual noise.

**No test may depend on chance, timing, or ordering to pass.** The usual
sources, in the order they tend to appear:

- an assertion resting on a probability rather than a guarantee — that generated
  values will not collide, that a sample falls within a range;
- a timeout, or anything assuming one operation completes before another;
- state left behind by an earlier test, so the suite passes in order and the
  file fails on its own.

When an assertion is probabilistic, the fix is almost never a looser threshold
or a retry. Either the code should offer a guarantee strong enough that the
probability stops mattering, or the test is asking a question that cannot be
answered reliably and needs to ask a different one.

The tell is a test that passes locally and fails on CI, or that passes on a
re-run with nothing changed. Treat it as a defect in the test, at the same
priority as a defect in the code, because a gate nobody trusts is not a gate.

## Before committing

```sh
npm run verify
```

Both gates, the same as CI. See [pipeline.md](pipeline.md) for what each failure
means.
