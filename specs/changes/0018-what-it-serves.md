# Spec 0018: what it serves

- **Status:** approved
- **Issue:** [#35](https://github.com/sargismarkosyan/todo-change/issues/35) —
  "I am not sure if we have mechanisms to enforce their update… I insist to make
  workflows separate files, and reusing Gherkin in it."

> **Nothing on screen moves in this version.** It is the second such change
> after 0016, and unlike 0016 it does not touch `src/` at all. What it changes
> is which claims in `specs/` a machine is allowed to believe without checking.

## Who this is for

**Not Nell**, and saying so plainly is the template's rule. No workflow of
theirs gets shorter, no mistake stops, and the app they open tomorrow is the app
they closed tonight.

**It is for the next spec.** This repo's whole claim is that a written spec,
approved before code, produces a better product than a request does. That claim
rests on two files — who this is for, and what they do — and for seventeen
versions those two have been held current by *a habit*: the `refine-spec` skill
reads them first because its own prose says to. Nothing else does. A habit that
has held sixteen times is indistinguishable, from the inside, from one about to
fail.

The workflow this sits in is therefore none of the six. It sits in
[`setup/process.md`](../setup/process.md) and
[`setup/pipeline.md`](../setup/pipeline.md), which say what a version has to
survive before it counts.

## The job behind the request

**Stated with no solution in it: a spec layer nobody can check is a spec layer
that is true until it quietly is not, and the person relying on it finds out
last.**

The literal ask was a mechanism — separate files, Gherkin, tags in both
directions. That is a good answer, and it is not the job. The job is the worry
underneath it, quoted in the issue: *"we started as todo app and now it's a
recipe book app and I wonder how they keep track of the changes and if they are
up to date."*

**What is done today instead.** Nothing, deliberately, and it has worked. Ten of
seventeen change specs edited `persona.md` or `workflows.md`, every edit landed
inside its `spec NNNN:` commit rather than being retrofitted, and the 0004
todo→recipe pivot is the best-documented moment in the repo. The mechanism is
four sentences in `refine-spec/SKILL.md` and one heading in
`changes/TEMPLATE.md`.

**Was the proposed solution the best answer?** Yes, and it is stronger than the
counter-proposal that was argued for first. The objection on the record was that
`@workflow:write-it-down` on a feature is a bare token a gate can only
string-match, satisfiable by pasting a plausible word — so gating the existing
hand-written `Specs.` lists would be cheaper. Gherkin dissolves that: a workflow
with a trigger, an end state and walkable examples has **wrong answers**.
`look/paper` under `name-a-recipe` is visibly absurd; `@workflow:write-it-down`
on it was not. And `gherkin.mjs` already parses every part of it — `tagValue()`
reads `@feature:` and `@rule:` today, and `@workflow:`, `@persona:`,
`@guarantee:` and `@journey:` are the same code path.

## Why now

Three things have already gone wrong, and none of them was reported by anything.

**1. Nine of thirty-five feature files are claimed by nobody.** Each workflow in
`workflows.md` ends with a hand-maintained `Specs.` list. Twenty-six files are
listed:

| Workflow | Features listed |
|---|---|
| 1. Write it down | 6 |
| 2. Browse | 11 |
| 3. Cook from it | 1 |
| 4. Tidy | 6 |
| 5. Return | 4 |
| **claimed by nobody** | **9** |

Seven of the nine orphans are the whole `suggesting/` area — three versions of
work, 0009 through 0011, that no workflow ever admitted to serving.
`recipes/reordering-by-hand` is missing while both its siblings are listed.
`look/paper` has never been referenced by anything, in twelve versions.

**2. The numbers were a symptom of a modelling error, not sloppiness.** Workflow
3 held one file because there is nothing to put in a non-workflow. Workflow 2
held eleven because it was the only real "find something" bucket. Workflow 4
held six unrelated ones because it was a category. That analysis, and the
six-workflow model that replaces it, is confirmed separately and already written
— see [`workflows/README.md`](../workflows/README.md).

**3. `features/look/` is a folder that exists because a redesign happened.** A
visual change either alters an existing behaviour, produces a new one, or — if
it is genuinely stylistic — produces neither. It does not produce a feature area
of its own, any more than a refactor does. `look/` was created in 0005 and has
been the home for anything that did not fit since, which is what an unowned
bucket becomes.

**What it costs.** Nothing yet. That is the honest answer, and it is why this is
worth doing now rather than after it has cost something: the failure mode is a
spec that describes a product two versions ago, cited in good faith by the skill
that is supposed to be the check.

## The end value

**Afterwards, every claim in `specs/` about who this is for and what they do is
either checked by `npm run trace` or explicitly marked as the kind that cannot
be.** A feature cannot exist without saying what it serves; a workflow cannot
exist that nothing implements; a persona cannot exist that nobody does anything
as; and none of it can be satisfied by pasting a word, because the thing on the
other end of the tag is a file with a trigger, an end state, and a test walking
it.

**How we would know it worked:** the gate fails on its first run against today's
repo. Not as a bug — as the evidence. Nine orphans, a folder with no owner, and
one product guarantee (`instant`) that seventeen versions have claimed on the
front page of `spec.md` with **nothing anywhere asserting it**. If the gate came
up green on day one it would have been built wrong.

## What changes

Nothing user-visible. Everything below is `specs/`, `tools/` and `tests/`.

### The layers get files and tags

Already written and confirmed, listed here for completeness:

```
specs/
  personas/
    README.md                     index, and the tester who deliberately has no tag
    nell.md                       @persona:nell
    rowan.md                      @persona:rowan @retired
  journeys/
    README.md                     index, and the warning-hygiene norm
    keeping-what-you-cook.md      @journey:… @persona:nell — prose, never asserted
  workflows/
    README.md                     the map, the gates, what became of the five
    name-a-recipe.feature         @workflow:… @persona:nell @journey:…
    fill-a-recipe-in.feature
    find-a-recipe.feature
    correct-a-line.feature
    throw-something-out.feature
    organise-the-books.feature
  persona.md                      tombstone → personas/
  workflows.md                    tombstone → workflows/
```

The tombstones stay because thirty-two links in frozen change specs point at
those two paths, and history that stops resolving stops being evidence — the job
[`features/RETIRED.md`](../features/RETIRED.md) already does for spent rule ids.

**Journeys are Markdown, never Gherkin.** A journey is not testable and must not
wear the costume. What it carries — the arc across months, and the *seams*
between workflows — is the part no per-workflow file can hold. "A book of names
with nothing under them" is not a defect in `name-a-recipe` and not a defect in
`fill-a-recipe-in`; it is the gap between them, and it is live in the seed data
today.

### Guarantees become a tag, not a folder

A guarantee is a property every workflow holds: no trigger, no attempt, nothing
to walk. Filing them under `workflows/` would say otherwise, and giving them
`Given/When/Then` would be writing fiction. **The ids already exist** — they are
the bullets in [`spec.md`](../spec.md) under *What it must always be* — and this
change does no more than tag them and gate them.

| Bullet in `spec.md` | Tag | Asserted today by |
|---|---|---|
| Instant | `@guarantee:instant` `@planned` | **nothing** |
| Trustworthy | `@guarantee:survives-return` | `storage/` (3 files), `home/routes` |
| Legible at a glance | `@guarantee:readable-while-cooking` | `guarantees/paper`, `recipes/reading` |
| Kept, not cleared | `@guarantee:nothing-is-finished` | `recipes/reading` |
| **Within reach** — new bullet | `@guarantee:within-reach` | `guarantees/within-reach` |

**`@planned` on `instant` means exactly what it means on a Rule**: declared, not
yet asserted one layer down. It keeps the build green while leaving the hole
visible in the file rather than hidden in the tool, and it is the one place this
change makes a new claim rather than writing down an old one.

**The fifth bullet is an assumption, and the one to overturn if any.** Version
0017 shipped four rules it described in its own words as *"guarantees about who
can reach the page"* — hit targets, the announcer, focus after a delete,
relative type — and never wrote that claim into the always-list. Folding them
into *Legible at a glance* would quietly widen what that id means; focus
management is not legibility. So it gets its own bullet, which is the drift this
issue is about, caught by the gate on its first run.

### `features/look/` is retired

The folder and its `spec.md` go. Every `@rule:` and `@feature:` id survives
untouched, so **no test moves and no test changes** — only paths.

| Was | Becomes | Carries |
|---|---|---|
| `look/paper.feature` | `guarantees/paper.feature` | `@guarantee:readable-while-cooking` |
| `look/within-reach.feature` | `guarantees/within-reach.feature` | `@guarantee:within-reach` |
| `look/telling-books-apart.feature` | `books/telling-books-apart.feature` | `@workflow:find-a-recipe` `@workflow:organise-the-books` |
| `look/spec.md` | `guarantees/spec.md` + the contrast argument into `books/spec.md`; a tombstone left at the old path | — |

Change specs 0005 through 0017 link to the old paths and were **not** rewritten:
a frozen change spec says what was true when it shipped, and repointing its links
after the fact edits history to match what we now think. So `look/spec.md` stays
as a **tombstone** — the third in this change, after `persona.md` and
`workflows.md`, and for the same reason: eleven links in eight frozen specs, and
history that stops resolving stops being evidence. A folder holding one gravestone
and no feature files is not a feature area, which is the point. The move is also
recorded in [`features/RETIRED.md`](../features/RETIRED.md), which already exists
to answer "why is this gone" and now answers it for an area as well as a rule id.

**Feature ids keep their `look-` prefix** — `look-paper`, `look-within-reach`,
`look-telling-books-apart` — for the reason `RETIRED.md` already gives about
rule ids: *"An id is a handle, not a description; churning twenty of them to
match new wording would have been the largest orphaning risk in the change, for
no gain."*

**`features/guarantees/` is a folder of features, not of guarantees**, and the
distinction is the one the issue drew when it dropped `workflows/guarantees/`.
These two files are ordinary feature files with ordinary rules and ordinary
tests; what they have in common is that their subject is the whole page rather
than one thing on it.

### Every feature says what it serves

All thirty-five files gain a `@workflow:` or `@guarantee:` tag — or both, where
both are true.

| Serves | Feature files |
|---|---|
| `name-a-recipe` | `recipes/writing` |
| `fill-a-recipe-in` | `recipes/ingredients`, `recipes/method`, all nine of `suggesting/` |
| `find-a-recipe` | `home/starting-from`, `home/favourites`, `home/routes`, `finding/searching`, `finding/leaving-a-search`, `books/switching`, `books/telling-books-apart`, `recipes/favourites`, `recipes/empty-state` |
| `correct-a-line` | `recipes/reordering`, `recipes/reordering-by-hand`, `recipes/reordering-by-keyboard` |
| `throw-something-out` | `recipes/deleting`, `books/deleting` |
| `organise-the-books` | `books/creating`, `books/renaming`, `books/colouring`, `books/telling-books-apart` |
| `readable-while-cooking` | `guarantees/paper`, `recipes/reading` |
| `nothing-is-finished` | `recipes/reading` |
| `survives-return` | `storage/persistence`, `storage/recovery`, `storage/books-migration`, `home/routes` |
| `within-reach` | `guarantees/within-reach` |
| `instant` | — `@planned` |

Thirty-five files, none unclaimed.

### The gates

All in `tools/trace.mjs`, all reusing `gherkin.mjs`. `parseFeature` gains an
options argument so a workflow file can be parsed without `Rule:` blocks; the
folder walk, the tag parse, the id-uniqueness check and the `@planned` exemption
are the code that already exists.

| Check | Level |
|---|---|
| every feature names ≥1 live `@workflow:` or `@guarantee:` | error |
| every `@workflow:`/`@guarantee:`/`@persona:`/`@journey:` names something that exists | error |
| every workflow is claimed by ≥1 feature | error |
| every workflow names ≥1 live `@persona:` | error |
| every persona is named by ≥1 workflow, or is `@retired` | error |
| every guarantee is claimed by ≥1 feature, or is `@planned` | error |
| **every workflow is walked by ≥1 end-to-end test** | error |
| a workflow naming no journey | warning |

**The seventh is not in the issue's table and is the largest thing here.** A
workflow's `Example:` scenarios that nothing runs are the wallpaper this whole
issue exists to remove — a `.feature` file is a costume unless something walks
it, which is the exact argument the issue used to keep journeys in Markdown. So
`tests/support/covers.mjs` gains a `workflow(id, fn)` beside `rule(id, fn)`, and
`tests/workflows/` gains six tests, one per workflow, each walking its trigger
to its end state through the existing jsdom harness and **ending by reloading
and finding everything as it was left**. That last assertion is
`survives-return` checked six times rather than once, and it is what makes a
guarantee stronger as a tag than it would have been as a file of its own.

It is also, directly, what
[0016's fifth acceptance check](0016-somebody-elses-frame.md) asked a human to
do by hand after every version.

### Prose, and the docs that describe the process

- **`spec.md`** — the five guarantee ids, tagged in place in *What it must always
  be*, and `within-reach` added as the fifth bullet.
- **`setup/process.md`** — under *When the process gets in the way*: **a
  technical change that produces no feature and touches no workflow is correct,
  not a gap.** 0016 is the worked example — it served none of the workflows and
  added no feature file, and that was the honest outcome for a change whose whole
  requirement was that nothing visible move. Written down so the absence stops
  looking like an escape hatch.
- **`setup/pipeline.md`** — the new gates, and what each failure means.
- **`specs/README.md`** — the four layers become five, and the table of which are
  asserted.
- **`CLAUDE.md`, `setup/skills.md`, `setup/repository.md`, `setup/constraints.md`,
  `README.md`, `refine-spec/SKILL.md`, `record-clip/SKILL.md`, the four area
  `spec.md` files, `src/app.mjs`'s one comment** — every path that pointed at
  `specs/workflows.md` or `specs/persona.md`.

**Rules added or changed** — none. This change adds no `@rule:` id, retires
none, and rewords none. It is pipeline machinery, and no Gherkin Rule describes
the pipeline — the same reason `tests/unit/gherkin.test.mjs` carries no `rule()`
block today.

## What we are not doing

- **The three git-based drift warnings.** Co-edit, the concentration warning
  (*"N features added under this workflow since its file was last touched"*), and
  *"a workflow was added or removed and no journey was touched"*. These are the
  only checks in the design that would report something nobody already knew, and
  they are deferred for a reason that is not size: **CI runs
  `actions/checkout@v7` at its default `fetch-depth: 1`**, so `git log -- <path>`
  returns nothing on the one machine whose opinion counts. Every one of these
  checks would silently pass forever. Turning that on is a CI change with its own
  argument and it does not belong buried inside a folder restructure. Its own
  issue, and version 0019.
- **A feature file asserting `@guarantee:instant`.** The gate makes the hole
  visible; filling it is a real piece of work — nothing here currently measures a
  frame — and inventing it inside this change would be the scope growth this repo
  files issues about. `@planned` marks it. Its own issue.
- **Executing the Gherkin.** The six workflow tests are ordinary `node:test`
  files bound to a workflow id, exactly as behaviour tests are bound to a rule
  id. Nothing parses `Given/When/Then` into step definitions, here or anywhere
  else in this repo, and adding a step-definition layer to get there would be a
  much larger change than this one.
- **Splitting `organise-the-books` in two.** Creating and renaming are
  housekeeping and colouring pays off in `find-a-recipe`; the split is
  defensible. One won: the trigger is the same moment — you are looking at the
  shelf and it is wrong.
- **`@persona:` on feature files.** Only workflows carry it. Every feature
  reaches a persona through its workflow, and a second path to the same fact is a
  second thing to keep true.
- **Rehoming `within-reach`'s four rules individually.** Two of them (the
  announcer, focus after a delete) are behaviour that arguably belongs in
  `finding/searching` and `recipes/deleting`. Kept whole because all four answer
  one question — can every hand reach this page — and shredding a coherent file
  across three areas to satisfy a filing rule is how the `look/` folder happened
  in the first place.
- **Renaming feature ids to match their new folders.** See above.

## Data

**None.** `localStorage` is untouched: no key, no shape, no migration. Nothing in
this change reaches `src/`.

## Risks

**To `survives-return` — none, and this is the version where that is easiest to
claim.** No application code is edited, no storage key is read or written, and
the six new tests each end by reloading the app and asserting it came back as it
was. The change makes that guarantee *more* checked than it is today, not less.

**The real risks are to the pipeline, and they are these:**

- **A gate that is green because it measured nothing.** The failure mode
  `tools/test.mjs` already guards against by name for coverage. Mitigated by the
  first acceptance check: the gates are run against the repo *before* the tags
  are added, and must report exactly the nine known orphans. A gate that comes up
  green on an untagged repo is broken.
- **Warnings becoming wallpaper.** `npm run trace` already prints one standing
  warning nobody has acted on for five versions. The norm written into
  `journeys/README.md` — **a warning that survives two versions either becomes an
  error or gets deleted** — is the answer, and this change adds exactly one new
  warning rather than four.
- **Six e2e tests that duplicate the behaviour suite.** A workflow test that
  re-asserts what `recipes/writing.feature`'s tests already assert is cost with
  no cover. They are walkthroughs on purpose: trigger to end state in one
  sequence, plus the reload. Any single-rule assertion in one of them belongs in
  a behaviour test instead.
- **Feature files moving.** Three move. Rule ids and feature ids are unchanged,
  so `npm run trace` proves this one on its own: if a move broke a link, the
  rule→test direction fails.

## Acceptance checks

The screenshot pass, by hand. There is no screenshot — nothing on screen changes
— so these are the pipeline's equivalent.

1. **The gate names the nine orphans, and nothing else.** Stripping every tag
   proves nothing — it reports all thirty-five. The real check is to restore the
   claim set the old hand-written `Specs.` lists actually held at version 0017:
   untag exactly the nine files no workflow listed, and run `npm run trace`. It
   must name those nine and no others. **Run, and it does** — seven
   `suggesting/`, `recipes/reordering-by-hand`, and `paper`, which is the list in
   issue #35. `@guarantee:instant` shows as `·` planned in the map either way.
2. **`npm run verify` is green on the finished branch**, with the standing
   `reordering.feature: 125 lines` warning and the new `@planned` note on
   `instant`, and no others.
3. **Break each gate on purpose, one at a time, and read the message.** Delete a
   `@workflow:` tag from a feature; point one at a workflow that does not exist;
   delete `@retired` from `rowan.md`; delete a workflow test. Five edits, five
   failures, each naming the file and what to do about it. Then `git checkout`.
4. **No line of the app changed.** `git diff main -- src/ index.html vendor/`
   comes back as six one-line comment edits in `src/app.mjs` and one link in
   `src/fonts/README.md`, all of them paths this change moved — `persona.md` →
   `personas/nell.md`, `features/look/` → `features/guarantees/`. Nothing else:
   no statement, no selector, no markup.

   **This is a correction to what this spec said before it was approved**, which
   claimed byte-identical. The claim was made before the references were counted,
   and a stale path in a comment is the case
   [process.md](../setup/process.md#when-the-process-gets-in-the-way) says to fix
   and say so. `src/app.mjs:190` pointed at
   `specs/features/look/within-reach.feature`, which after this change is a path
   that does not exist.
5. **Every link resolves.** Open `specs/persona.md` and `specs/workflows.md` —
   the tombstones — and follow them through to `personas/nell.md` and
   `workflows/README.md`. Then open the oldest change spec that links to either
   ([0001](0001-core-todo-list.md)) and confirm its links still land.
6. **Read `workflows/README.md` and disagree with it.** It is the map, it is
   evaluative, and it is the one file here whose value cannot be gated. If the
   sentence *"most bad changes add a field to the writing to serve something that
   happens once a year"* has stopped being true of this product, that is worth
   more than any of the above.
