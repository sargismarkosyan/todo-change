# Spec 0016: somebody else's frame

- **Status:** shipped
- **Issue:** [#15](https://github.com/sargismarkosyan/todo-change/issues/15) —
  "Let's rebuild using Vue.js" · "After this one I need a recording of working
  every workflow every feature to make sure no regression"

> **This is the second time this repo has bent the dependency constraint, and
> the first time it has bent it for a reason that is not about the app.** 0012
> vendored SortableJS because a drag written by hand was broken in ways a
> library had already solved. This one changes nothing a person can see. The
> argument is made in the open below rather than dressed up as a benefit to
> anybody using the app, because it is not one.

## Who this is for

**Not Nell.** Saying so plainly, as [persona.md](../persona.md) and the template
require: there is no situation of theirs this improves, no workflow step it
shortens, and no mistake it stops. After this ships, every one of the five
workflows in [workflows.md](../workflows.md) has exactly the shape it has today,
and that is the requirement rather than a shortcoming.

**It is for the organisation that owns the code.** The decision to standardise
on Vue.js was taken outside this repository and is not a technical question this
spec gets to reopen. What this spec decides is the *shape* of the compliance:
which Vue, how much of it, what it is allowed to cost, and how we prove nothing
broke.

The workflow this touches is therefore none of the five. It touches
[constraints.md](../setup/constraints.md), which is the file that says what this
app is allowed to be built out of, and that file states its own amendment
procedure: *"Changing any of them needs a numbered change spec arguing for it."*
This is that spec.

## The job behind the request

**Code that is not on the organisation's standard framework is code the
organisation cannot staff, review, or move people between.**

Stated with no solution in it, that is the whole of it, and it is a real job —
it is simply not a job the person using the app has. A codebase's second
audience is the people who have to work on it, and an organisation that has
picked one view layer is making a claim about that audience, not about the
screen.

**What was proposed alongside it, and why it is the sharper half.** The issue's
second sentence — *"After this one I need a recording of working every workflow
every feature to make sure no regression"* — is the request that understands its
own risk. A rewrite that changes nothing visible is the one kind of change where
"it looks fine" is indistinguishable from "it is fine", and the only honest
answer is to show every workflow running. That recording is not an extra; it is
this change's acceptance criterion, and it is written into
[Acceptance checks](#acceptance-checks) below.

**What is done today instead.** Nothing, because nothing is wrong. Fifteen
versions have shipped, `npm run verify` is green, 106 rules are traced, and
`src/` sits at 100% line coverage. This spec is not fixing a fault and does not
claim to be.

**Was the proposed solution the best answer to the job?** For the job as stated
— be on Vue — it is the only answer, since the job names the framework. The
objection that belongs on the record is a different one, and it is about what
Vue buys *this* codebase:

`src/app.mjs` already has the architecture Vue sells. One `render()` at
[app.mjs:1157](../../src/app.mjs) rebuilds the page from state on every change;
roughly forty small functions — `row`, `resultRow`, `starButton`, `group`,
`swatchStrip` — each return an element for a piece of it; every event handler
mutates plain state and calls `render()`. That is a declarative view layer with
a full repaint, written by hand and owing nothing to anyone. Adopting Vue
replaces a hand-written version of the thing with a maintained version of the
same thing.

**The one place it is a genuine improvement**, stated in its favour: the repaint
throws away the focused node, so `typingIn` and `focusedHandle` exist to put the
caret and the keyboard focus back afterwards
([app.mjs:1219](../../src/app.mjs)). A keyed diff keeps those nodes and makes
both unnecessary. That is six lines that currently work, so it is a small prize
— but it is a real one and it is the only one.

## Why now

**Because the mandate arrived, and nothing else.** This section normally says
what is going wrong today and what it costs. Nothing is going wrong today. This
is not a nice-to-have either — a nice-to-have is optional — it is an external
requirement, and labelling it accurately matters more than finding it a benefit
it does not have.

There is one honest argument for doing it *now* rather than later, and it is
about cost rather than value: every version adds screen to migrate, and this is
the cheapest this migration will ever be.

## The end value

**For Nell: nothing, and that is the specification.** Every screen, every
keystroke, every animation and every stored byte is what it was before. If
anything about the app is observably different afterwards, this change has
failed, and that is the opposite of how the other fifteen specs read.

**For the organisation:** the app is built on the framework it has standardised
on, and the exception is recorded in `constraints.md` with its cost quoted
rather than hidden.

**How we would know it worked:** all 106 rules still pass with no rule
rewritten, `npm run verify` is green at the same coverage, and a single
recording walks all five workflows end to end showing behaviour identical to
version 0015. Any rule that has to be *changed* to make the suite pass is a
regression that has been renamed, and is the one outcome this change is not
allowed to produce.

## What changes

Nothing on screen. What changes is underneath it.

- **Vue 3 is vendored** at `vendor/vue/`, beside SortableJS and under the same
  terms: the pre-built runtime-only ES module, committed as it came, imported by
  the browser as it stands. No CDN, no bundler, no build step, no npm dependency
  at deploy time. `vendor/vue/README.md` records the version, the source URL, the
  licence and the date, exactly as `vendor/sortable/README.md` does.
- **`src/app.mjs` becomes a Vue application.** `createApp` mounted on the app
  root, the store and the screen state in `reactive`/`ref`, and the page
  described by components with `render()` functions built from `h()`. The
  existing element-returning functions are what become those components — the
  conversion is close to one-for-one, which is the point made above.
- **Templates are render functions, not template strings or SFCs.** Single-file
  components need a build step, which is ruled out and stays ruled out; runtime
  template strings need Vue's compiler in the browser, which is a bigger
  vendored file to do a job `h()` already does.
- **`index.html` becomes the mount point** — see *What came out different*
  below. It is still the one page and still the whole app.
- **`typingIn` goes**, along with its focus-restoring block at the end of
  `render()`. A keyed diff keeps the node the caret is in, so there is nothing
  to put back.
- **`focusedHandle` stays** — see *What came out different* below.
- **`constraints.md` is amended in three places**: *The app ships almost no
  dependencies*, *A vendored library* — which becomes two, with a second bar to
  clear — and *One page, two addresses*, whose "what stays ruled out" list names
  a component tree and a framework and no longer honestly can.
- **`tests/support/app.mjs` absorbs the scheduler.** Vue batches updates on a
  microtask where `render()` was synchronous, so the driver's actions become
  async and its readers stay as they are. This is the one change that reaches
  the test suite, and it reaches it through a single file by design.

**Rules added or changed** — none.

| Rule id | Feature file | New or changed |
|---|---|---|
| — | — | none |

**That empty table is the specification, not an omission.** A framework is not
behaviour, `specs/features/` describes what must be true for the person using
the app, and nothing about what must be true has moved. Adding a rule here to
make the change look substantial would put an implementation detail in spec
costume — the exact thing [`specs/README.md`](../README.md) warns about. The 106
existing rules are the contract this change is measured against, and they are
measured unchanged.

## What came out different

Two things this spec promised turned out to be wrong once it was built. Both are
recorded here rather than quietly delivered, because a change whose whole claim
is *nothing moved* has to be exact about what did.

**`focusedHandle` stays, and the reasoning above it was half right.** The claim
was that a keyed diff keeps the node the caret is in, so nothing has to be put
back. That holds for a repaint *around* an element — the box an ingredient is
typed into keeps its node, its text and its focus, so `typingIn` really is gone.
It does not hold for an element the diff **moves**: a browser blurs a node taken
out of the document and put back elsewhere, and moving a line is exactly that.
Dropping `focusedHandle` would have broken
`@rule:line-moved-by-keyboard` — *the handle keeps focus, so it can be pressed
again* — which is the rule that lets a line be walked up a list with repeated
presses. It is kept, and it is now three lines rather than six: the node is the
same one, so it is found again by its id after the repaint lands.

**`index.html` does not keep the static shell.** The spec said the shell would
stay in the page with Vue mounting over it. Vue clears the element it mounts
into, so what that would actually have produced is two copies of the same
markup — one served, one drawn over the top of it a moment later — that no gate
reads and nothing keeps in step. That is a silent drift waiting to happen, and
it is worse than either alternative. `<main class="app">` is now empty in the
document and the page is described once, in `src/app.mjs`. What the constraint
was protecting survives: one file, one page, no build step, and what the browser
runs is byte for byte what is in the repo.

**One thing was added that this spec did not ask for**, and it is a test rather
than behaviour: a new `Example:` under the existing `@rule:line-moved-within-its-group`
that drops a line instead of walking it with the arrow keys. Nothing exercised
the end of a drag before — it was one line of delegation and now it is the app
undoing what the library did to the page. It adds no rule and changes none.

## What we are not doing

- **Not using Vue as a plain renderer.** `import { h, render } from 'vue'`,
  keeping the existing explicit `render()` calls and plain state, would have been
  the smaller change by a wide margin: synchronous, so not one test file moves,
  and it still buys the keyed diff. It is dropped because it is Vue-the-DOM-
  library rather than Vue-the-framework, and would not satisfy the mandate that
  prompted this. **If the mandate is ever read as satisfied by it, this is the
  cheaper spec to write instead**, and it is written down here so that is a
  decision somebody can make rather than rediscover.
- **Not migrating area by area.** Mounting Vue on the book menu first, the
  contents next, and so on, would give five or six versions each of which runs.
  Dropped: a half-migrated app is two paradigms at once, which is worse to read
  than either, and each of those versions would be a screenshot of nothing. This
  is one step because the intermediate states are not worth shipping.
- **Not adding a build step, a bundler, or SFCs.** Not now and not as a
  follow-up. This spec bends the dependency constraint; it does not touch the
  no-build-step one, which is what keeps what the browser runs byte-for-byte
  identical to what is in the repo.
- **Not adopting Vue Router.** The app has two addresses and `hashchange`
  already answers them ([0013](0013-a-front-door.md)). A router library is a
  second dependency for something written in a dozen lines, and
  `constraints.md` sets that bar explicitly.
- **Not adopting Pinia or any store library.** The store is one `localStorage`
  key read and written by `src/storage.mjs`. Same argument.
- **Not moving the pure modules.** `books.mjs`, `recipes.mjs`, `finding.mjs`,
  `home.mjs`, `storage.mjs` and `suggesting.mjs` import nothing from the
  document and are not touched. *Logic stays out of the DOM where it can* is
  unaffected by which library draws the DOM, and those six files at 100%
  coverage are what makes the rewrite checkable at all.
- **Not rewriting a single Gherkin rule.** See the empty table above.
- **Not changing the look.** No Vue transitions, no component library, no
  restyling. `src/styles.css` is untouched, and every class name the stylesheet
  and the tests depend on is emitted exactly as it is today.

## Data

**No change to the `localStorage` shape.** The key, the books, `openId`,
`colour`, `favourite`, `suggestions` and both legacy keys are read and written
by `src/storage.mjs` and the pure modules, none of which this change touches. A
book written by version 0015 is read by version 0016 and vice versa, and the
migration paths from `todo-change.notepads` and `todo-change.todos` run exactly
as before.

## Risks

**This is the largest step this repository has taken, and the riskiest, and it
delivers nothing anyone using the app can see. Those three facts belong
together.**

- **Workflow 5 — Return — is the one to watch, as always.** The storage layer is
  untouched, which is the strongest thing that can be said for it. The real
  exposure is mount-time: a Vue app that throws while mounting leaves the page
  showing the static shell from `index.html` and looking deceptively fine — the
  same failure mode `constraints.md` describes for `file://`, which is exactly
  how it went unnoticed in version 1. A bad read must still open a usable book.
- **Silent behaviour drift is the whole risk of the change.** 106 rules is a
  good net and it is not a complete one: focus order, caret position, the
  reduced-motion path, SortableJS's teardown and re-init per repaint, and the
  order in which the AI's proposals arrive are all things the suite touches
  lightly or through jsdom, which has no layout. The full-workflow recording in
  a real browser is the mitigation, and it is the reason the issue asked for it.
- **SortableJS is now attached to nodes Vue owns.** The library mutates the DOM
  during a drag and Vue's diff assumes it owns its children. `renderSorting()`
  currently re-initialises on every repaint because the nodes are always new;
  with a keyed diff they will not be. Getting this wrong breaks reordering by
  pointer, which jsdom cannot catch — see `vendor/sortable/README.md`, which
  already says the gate cannot check a drag.
- **A vendored Vue receives no security fixes.** This is the cost
  `constraints.md` quotes for SortableJS and it is larger here: Vue is bigger,
  more exposed, and updated more often. Nothing will remind anybody. The
  amendment must say so in the same words rather than softening them.
- **Coverage is held at 95% on `src/**` and Vue lives in `vendor/`**, the same
  as SortableJS and for the same reason. If any Vue code ends up under `src/`,
  the gate is either sunk or gamed.

## Acceptance checks

The first four are the usual pass. The fifth is what issue #15 actually asked
for and is the one that matters here.

1. **Open the deployed page in a browser with an empty `localStorage`.** The
   home draws: the search box, no favourites, no picks, the empty line. Nothing
   in the console.
2. **Workflow 1 — write it down.** Open a book, type a name, press Enter. It is
   at the top of the contents in one frame. Open it, type six ingredients and
   four steps one after another without touching the mouse — the caret stays in
   the box between submissions, which is the thing the focus-restoring code did
   by hand and the diff now does by itself.
3. **Workflow 4 — put a line right.** Drag an ingredient into place with the
   pointer, then move a step with the arrow keys. Both work, and the second is
   this app's own code rather than the library's.
4. **Workflow 5 — return.** Refresh. Same book, same recipes, same order, same
   colour, same address. Then corrupt `todo-change.books` in devtools to
   something that is valid JSON of the wrong shape and refresh again: a usable
   book, not a blank page.
5. **The regression recording.** One clip, recorded by `record-clip`, walking
   all five workflows and every feature in one pass: write a recipe down and
   fill it in, browse the contents, open one and read it, search across books,
   star one and see it on the home, switch books, colour a book, rename one,
   reorder a line by pointer and by keyboard, delete a recipe, delete a book,
   and return to the front door. It ships in the pull request body as the
   version's picture. **A version whose screenshot is identical to the last one
   is exactly right here** — that identity is the deliverable, and it is what
   "no regression" looks like when you can see it.
