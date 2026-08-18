# Spec 0009: a first draft

- **Status:** proposed
- **Issue:** none — direct request, replacing a version that was built and
  closed unmerged. See *What happened to the tags* below.

## Who this is for

Nell, in **Write it down** — [workflow 1](../workflows.md), at its second half.

That workflow has two parts and the app is only good at one of them. The name
lands in three seconds, with no mouse and no decisions, which is the thing this
product has protected since version 1. Then comes the rest: a dozen ingredients
and a method, one line and one submission at a time.

## The job behind the request

**Get a recipe I already know how to cook out of my head and onto the page
without typing every line of it.**

Stated with no solution in it, that is all of it. Note what is *not* in it:
nothing about discovering recipes, nothing about cooking something new. The
recipes in question are ones Nell can already make — the apple pie, the roast —
where the typing is transcription of something already known rather than
learning anything.

**What they do today instead:** type it out, or stop after the name. The second
is the common one and it is the interesting one.

## Why now

**A book of names with nothing under them is this app's quietest failure.**

Nothing is broken when it happens. The app did exactly what it was told: a name
was written down in three seconds, which is the promise. No error, no missing
data, no rule violated — and a recipe that is only a name is useless for
[workflow 3](../workflows.md), which is the workflow the whole change to a
recipe book was made for. You cannot cook from a name.

It is invisible in the specs for the same reason it is invisible on screen:
there is no state called *half-written*, because `features/recipes/spec.md` is
emphatic that nothing here is finished or unfinished. That was the right call
and it stays. But it means the app cannot tell you, and will never tell you,
that two thirds of your book cannot be cooked from.

The second reason is timing rather than need: the browser can now do this
locally. A year ago the only way to draft a recipe was somebody else's server,
which `setup/constraints.md` rules out and would still rule out.

## The end value

Nell writes down "Apple pie", presses once, and reads a draft of what it takes
and how it is made. They take the four lines that are right, fix one, ignore the
rest, and the recipe is a recipe.

**How we would know it worked:** the proportion of recipes that are only a name
goes down. The check that keeps it honest is the other direction — that writing
a recipe down still takes three seconds and still asks nothing, because the
moment drafting becomes a step in workflow 1 this has cost more than it bought.

## What changes

### The AI drafts a recipe

- **One press on an open recipe** proposes the whole card: the ingredients and
  the method, together, from the name and anything already written down.
- **Nothing is written down.** Proposals sit on screen, visibly not lines, until
  they are accepted.
- **Accepted one at a time.** Each proposal is taken on its own; a wrong
  quantity is not a wrong word, and there is no undo anywhere in this app.
- **Added, never written over.** Existing lines are untouched, nothing is
  reordered, and a line the recipe already holds is not proposed back to it.
- **Once accepted, a line is a line** — no mark, no stored field, edited and
  deleted like any other.
- **Turning the draft down costs nothing**, and a model that answers with
  nothing usable says so and changes nothing.
- **It never touches the name or the book.** A book is an occasion somebody
  chose, and the recipe was already named.

### It is offered once, before anything is downloaded

- **On the first visit where the browser could run it and there is a recipe to
  fill in** — not on an empty book, which is a question with no reason behind it
  yet. Asked **below the box**, never above it: the top of the page is the
  three-second capture.
- **Accepting starts the fetch**, and that press is not a formality — Chrome
  requires recent user activation before a download can begin.
- **Dismissing turns it off** and takes it off the page entirely.
- **Asked once.** The answer is remembered.

### A line saying where it stands, and a switch

- **The indicator** — "Downloading AI", then a percentage, then "AI ready", or
  "AI unavailable" if the fetch fails. In the masthead, because it is read at a
  glance. Nothing at all when there is no model or the AI is off.
- **The switch** — in a **colophon** at the foot of the page, under the same
  hairline that runs beneath every ingredient on a card. Pressed twice ever, so
  it gets the least prominent place on the page and leaves the top corner to the
  book control.
- **Nothing on the page ever waits on the model.**

**Rules added or changed** — the `@rule:` ids in `specs/features/`:

| Rule id | Feature file | New or changed |
|---|---|---|
| `draft-proposes-both-groups` | `features/suggesting/drafting.feature` | new |
| `draft-accepted-line-by-line` | `features/suggesting/drafting.feature` | new |
| `draft-does-not-touch-what-is-there` | `features/suggesting/drafting.feature` | new |
| `draft-dismissed-changes-nothing` | `features/suggesting/turning-a-draft-down.feature` | new |
| `draft-can-fail` | `features/suggesting/turning-a-draft-down.feature` | new |
| `draft-needs-the-ai-on` | `features/suggesting/turning-a-draft-down.feature` | new |
| `ai-offered-once` | `features/suggesting/turning-it-on.feature` | new |
| `ai-offer-accepted` | `features/suggesting/turning-it-on.feature` | new |
| `ai-offer-dismissed` | `features/suggesting/turning-it-on.feature` | new |
| `ai-not-offered-without-a-model` | `features/suggesting/turning-it-on.feature` | new |
| `ai-settings-is-a-popover` | `features/suggesting/settings.feature` | new |
| `ai-turned-on-from-settings` | `features/suggesting/settings.feature` | new |
| `ai-turned-off-from-settings` | `features/suggesting/settings.feature` | new |
| `ai-choice-is-remembered` | `features/suggesting/settings.feature` | new |
| `ai-indicator-says-where-it-stands` | `features/suggesting/indicator.feature` | new |
| `ai-indicator-only-when-on` | `features/suggesting/indicator.feature` | new |
| `ai-indicator-is-not-a-loading-screen` | `features/suggesting/indicator.feature` | new |

**No existing rule id changes and no existing rule is reworded.** Everything
here is additive to a page that already works.

Prose specs updated in the same pass: a new
[`features/suggesting/spec.md`](../features/suggesting/spec.md); the
"typing it out" line and the settings-screen line in
[`persona.md`](../persona.md); workflow 1 and workflow 5 in
[`workflows.md`](../workflows.md); the storage contract, the *Instant* promise
and seven vocabulary entries in [`spec.md`](../spec.md); a *Lines the machine
drafted* section in
[`features/recipes/spec.md`](../features/recipes/spec.md); and a new constraint
section plus *Popovers are not pages* in
[`setup/constraints.md`](../setup/constraints.md).

## What this argues against, out loud

**[`persona.md`](../persona.md): "typing it out is how it ends up in your
words."** The full argument is in
[`features/suggesting/spec.md`](../features/suggesting/spec.md); the short form
is that the sentence was protecting *provenance* and was aimed at fetching a
recipe from somebody else's site over a network. None of that applies to a model
on this machine proposing lines that are not stored until they are accepted. What
it does not survive is the claim that the typing itself is the point — nobody's
recipes are better for having been typed twice. Amended in the file rather than
quietly reinterpreted.

**[`persona.md`](../persona.md): "Read a settings screen" is in the never-list.**
A screen is a place you go to configure something before using it. This is a
switch in a popover, holding an answer already asked for once. **The check that
keeps it honest is the line count: two.** A third means it became the screen.

**[`spec.md`](../spec.md): "Instant."** Amended for one press, once, and
bounded: nothing else in the app ever waits on the model.

**[`setup/constraints.md`](../setup/constraints.md): zero dependencies** is
untouched. The model belongs to the browser. A bundled one is ruled out
permanently.

## What happened to the tags

A version numbered 0009 was written, built green, screenshotted and opened as a
pull request before this one, and then closed unmerged. It added **tags** to
recipes, filtering by them across books, and an AI that suggested tags.

It is recorded here because the reason it died is a design argument worth
keeping, not an accident:

- **A half-tagged book makes a filter lie by omission.** Its own *Risks* section
  said so, with no mitigation. Finding nothing is loud; finding three of the
  five recipes that take chicken looks like a complete answer.
- **Searching already answers the same job** from text that is stored anyway.
  A tag was a field somebody had to remember to maintain forever; matching what
  is already written costs nothing and cannot fall behind.
- **The AI was pointed at the wrong thing.** Proposing a word to file a recipe
  under saves one line of typing. Proposing the recipe saves twelve.

What survived from it and is re-specced here: the Prompt API adapter and its
verified session shape, the stored on/off answer, the offer, the indicator and
the settings switch. None of that depended on tags.

## What we are not doing

- **Searching the method.** Asked for in the same breath as this, and a real
  reversal of 0008's *Not the method* decision — but a separate version. It
  changes what a search means for every existing book, and it deserves its own
  argument about whether "oven" returning most of a baking book is a price worth
  paying.
- **Tags, in any form.** See above.
- **A control per group**, so the method could be drafted from ingredients you
  had already approved. Better steps, a second press, and a decision about what
  happens when the two disagree. A version of its own if the drafts turn out
  weak.
- **Marking drafted lines.** Considered and dropped: an accepted line is an
  ordinary line. The cost is written down rather than hidden.
- **Pasting a block of text and splitting it into lines.** Genuinely cheaper
  than this, needs no model, and serves the case where you already *have* the
  text — which is a different job from this one. Worth its own version, and it
  would help the majority of browsers rather than the minority.
- **Drafting the name, or the book.** The model is asked about a recipe you
  already named.
- **Editing a proposal before accepting it.** Take it and edit the line, or
  ignore it and type your own. An editable proposal is a second composer with
  different rules.
- **Re-drafting.** One draft at a time; dismiss it and press again.
- **Any of this without a model on the machine.** No hosted model, no key.

## Data

**The stored shape gains one optional key**, alongside `openId`:

```json
{ "books": [ … ], "openId": "…", "suggestions": "on" }
```

- **`"unasked"`, `"on"` or `"off"`.** Absent, or any other value, reads as
  `"unasked"` — so every book written by 0004–0008 opens with the offer still to
  come, which is exactly right.
- **Nothing else changes.** A recipe's shape is untouched: an accepted
  proposal is an ordinary ingredient or step, with an id and text like any
  other. Proposals themselves are never stored.
- **Untrusted on read like everything else.** A junk value reads as `"unasked"`
  and the books beside it are unaffected.

## Risks

- **A plausible recipe that is wrong.** The real risk, and it is not solved. A
  wrong tag made a filter lie; a wrong quantity is a cake that fails an hour
  later with the oven on. Per-line acceptance is the mitigation, and it depends
  on somebody reading carefully at the moment they are trying to save time.
  Written into `features/suggesting/spec.md` under *What this costs*.
- **The archive premise softens.** `spec.md` says "some of what is in here
  exists nowhere else", and that is the whole argument for how carefully this
  app treats storage. A drafted recipe exists in a great many places. Still true
  of the grandmother's card; no longer true of the book as a whole.
- **Workflow 1 must not gain a step, and does not.** Drafting is on an open
  recipe, never in the box. The check at the screenshot pass is that the box
  still takes a name and Enter and nothing else.
- **The offer is an interruption**, and this app has had exactly one of those.
  Mitigated by asking only where there is a recipe to fill in, by asking once,
  by sitting below the box, and by the dismissed path costing nothing.
- **The settings popover becomes the screen**, one line at a time. Two lines is
  the check, and it is written into `persona.md`.
- **Workflow 5 (Return): low.** Additive key, absent means unasked, no
  migration. The one visible change for an existing browser is being offered the
  AI once.
- **The pipeline cannot run a real model.** jsdom has none and neither will CI.
  The model is handed to `mountApp` the way the document and the storage are,
  tests pass a fake, and no rule asserts what a model says.

## Acceptance checks

Done in Chrome 148+ on a desktop that meets the model requirements, and then
repeated in Firefox or Safari — which is the more important half.

1. Clear storage. Open the app with an empty book. **Nothing offers the AI.**
2. Write down "Apple pie". The offer appears, below the box, once.
3. Dismiss it. No indicator, and an open recipe offers no way to ask for a
   draft. Reload — not asked again.
4. Open the AI settings in the colophon. Turn the AI on. The download starts.
5. Watch it: "Downloading AI", a percentage, "AI ready". While it runs, write a
   recipe down, search for something, and type an ingredient by hand —
   **nothing waits**.
6. Reload. "AI ready" is still there and nothing was asked again.
7. Open "Apple pie" and press for a draft. Ingredients and steps appear, plainly
   not written down. Reload without accepting — the recipe is still empty.
8. Press again, accept three lines, dismiss the rest. Only those three are
   there, in the order accepted. Reload: still there.
9. Type an ingredient by hand, then draft again. What you typed is untouched,
   and it is not proposed back to you.
10. Delete a line you accepted. It goes like any other.
11. Turn the AI off in settings. The draft control goes; every line already
    accepted stays. Reload — still off, still not asked.
12. **In Firefox or Safari:** no offer, no indicator, no colophon, no draft
    control, and the whole app works. This is what most people see.
13. In devtools, set `suggestions` to `42`, then to `"maybe"`. Reload each time:
    the app opens normally and behaves as though unasked.
