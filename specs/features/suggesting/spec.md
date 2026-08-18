# Suggesting — general spec

Everything else in `features/` describes an app that does exactly what it is
told. This folder is the one place a **model** is asked anything, and it is the
only part of the product that is not present in most browsers.

One use, and it is a large one: **drafting a recipe's ingredients and its
method**, both at once, from the name and whatever is already written down.

## The line this crosses

`../../persona.md` said, of importing a recipe from the web: *"typing it out is
how it ends up in your words."* Version 0009 takes that on directly, and the
honest thing is to say what changed rather than to find a reading of the old
sentence that lets this through.

**What that sentence was protecting was provenance, and it still holds where it
was aimed.** A recipe fetched from a URL is someone else's, in someone else's
words, arriving over a network from a machine you do not own — and the app has
no backend to fetch with, which is the other half of why it was ruled out. None
of that is true here. Nothing arrives from anywhere. The model is on the
machine, the recipe never leaves it, and there is no network involved at all
once the model is down.

**What it was not protecting is typing as a virtue.** Nobody's recipes are
better for having been typed twice. The thing the sentence was really defending
— that the book holds what *you* decided goes in it — is defended here by a
different mechanism: **nothing is written down until it is accepted, one line at
a time.** A draft you read, corrected, and took four lines of is as much yours
as one you typed; a draft you waved through is not, and that is a real risk this
version takes on rather than solves. See *What this costs* below.

The amendment is written into `../../persona.md` in the same change, rather than
left as a contradiction between two files.

## Why a model is here at all

`../../workflows.md` describes writing a recipe down as two things: the name, in
three seconds, and then "the ingredients and the method, one line each". The
first is fast and the app is good at it. The second is a dozen separate
submissions, and it is where a recipe stops.

A book of names with nothing under them is the failure this answers. It is
invisible in the specs because nothing is broken when it happens — the app did
what it was told, and the recipe is simply half a recipe forever.

## What a draft is

**A proposal, not a line.** The model is asked once and answers with both
groups: what the recipe takes and how it is made. None of it is stored. Each
proposed line is accepted on its own, and the ones not accepted are gone when
the draft is dismissed.

**Added, never written over.** A draft is put beside what is already there, not
in place of it: nothing is replaced, nothing is reordered, and a line the recipe
already holds is not proposed back to it.

That happens twice over, deliberately. The model is **told** what the recipe
already takes and how far the method has got, so it usually does not repeat
itself — and whatever it answers, the repeat is **filtered out anyway**, because
being told is not the same as having read it. Matching is by text, without case:
"3 Apples" against a recipe that already says "3 apples" is the same line
wearing a capital. It is not by meaning — "3 Bramley apples" beside "3 apples"
is a second proposal, because deciding those are the same thing is a guess this
app has no business making. Accepted lines append the way typed
ones do — oldest first, because a method is a sequence.

**Both groups at once, one press.** The alternative — a control per group, so
the method could be drafted from ingredients you had already approved — was
considered and dropped. It produces better steps and costs a second press and a
decision about ordering; it is a version of its own if the drafts turn out
weak.

**Once accepted, a line is a line.** It carries no mark and no memory of where
it came from. Nothing in the stored shape changes, and a drafted "3 apples" is
indistinguishable from a typed one. See *What this costs*.

## Which model, and why that is allowed

The browser's own: the **Prompt API**, `LanguageModel` in the global scope.

`../../setup/constraints.md` says the app ships zero dependencies, and this adds
none. The model belongs to the browser the way `localStorage` and `crypto` do.
There is nothing to install, nothing to keep current, nothing fetched from
anyone else's machine, and `index.html` is still the whole app.

The route that would have broken the constraint is the other one — bundling
Transformers.js or WebLLM, which is a runtime dependency plus a model download
measured in hundreds of megabytes, and a build step in practice. **That is ruled
out, permanently.** If the built-in model is not there, the answer is that
drafting is not there. It is never that the app grows a build step.

`No backend` survives for the same reason it always has: the model runs on the
machine. Nothing about a recipe leaves it. An API key or a hosted endpoint would
be a different product.

## What is actually there, as of writing

Verified against the current documentation rather than assumed.

- `LanguageModel` is a global, feature-detected with `'LanguageModel' in self`.
- `LanguageModel.availability()` resolves to one of four strings:
  **`"unavailable"`**, **`"downloadable"`**, **`"downloading"`**,
  **`"available"`** — and is asked about the *same session shape* `create()`
  will use. Asking whether some session could be made and then making a
  different one is how "available" turns into a failure on the first press.
- `LanguageModel.create()` takes `initialPrompts`, `expectedInputs` and
  `expectedOutputs` (declaring the language: Chrome warns without it, and an
  undeclared pairing can be refused), and a `monitor` reporting
  `downloadprogress`.
- `session.prompt(text, { responseConstraint })` takes a **JSON Schema**, which
  is what holds an answer to a list of lines instead of a paragraph about
  cooking.
- Secure contexts only. Both the deployed Pages URL and `npm run serve` on
  localhost qualify.

**Chrome 148 and later, on desktop only.** Not Edge, not Firefox, not Safari,
not Chrome on Android or iOS. And not every desktop Chrome either: it wants
roughly 22 GB free on the profile volume, and either more than 4 GB of VRAM or
16 GB of RAM with four cores.

Read that as: **the model is a minority, not a majority with gaps.** Every rule
in this folder is written for the app most people will actually open, which is
the one with no model in it.

## Transient user activation, and why the offer exists

`create()` needs a recent press when the model has to be downloaded, and
progress is only reported through the `monitor` handed to `create()` — there is
no watching a download you did not start.

Both facts point the same way: **accepting the offer is the gesture that starts
the fetch**, and the session that starts it is the one that can report on it. A
version that tried to begin a multi-gigabyte download with no press at all would
not work, not merely be rude.

## What is on screen, by what the machine can do and what it has been told

| | AI off | AI on |
|---|---|---|
| **no model, or `"unavailable"`** | nothing at all | nothing at all |
| **`"downloadable"` / `"downloading"`** | the way back on | the indicator, saying how far along |
| **`"available"`** | the way back on | the indicator, and the control on a recipe |

The top row is load-bearing. A disabled button, a greyed control, or a line
explaining that this browser cannot do something is **worse than nothing**:
permanent furniture advertising an absence, on a page whose whole argument is
that chrome earns its place or goes. The app with no model is not a degraded
app. It is the app, and writing a recipe out is how writing a recipe works in
it.

**Off is not the same as absent.** A machine with no model shows nothing. A
machine where it has been switched off shows the way back on and nothing else.

## Where the two pieces sit, and why

**Position follows how often a thing is used.**

- **The indicator** is read at a glance and never pressed, so it is a line of
  type in the masthead — high, because glancing is what it is for.
- **The switch** is pressed twice ever, so it is in the **colophon** at the foot
  of the page, under the same hairline that runs beneath every ingredient on a
  card. That is where a book puts its machinery, and it leaves the top corner to
  the book control, which `../books/spec.md` calls the thing that must never be
  hunted for.

## Instant, and the one exception

`../../spec.md` opens its promises with **"Instant. No loading states, no
spinners."** Fetching a model is not instant, and pretending otherwise would be
a frozen page. So this is a real amendment, bounded as tightly as it can be:

**Two things here are slow, not one.** Fetching the model is the obvious one.
Running it is the other, and it is the one that happens every time: asking for a
draft is inference, and inference takes seconds even on a model already on the
machine. An earlier draft of this file claimed only the fetch could be slow.
That was wrong, and a press that appears to do nothing for four seconds is the
worst version of it.

- **Both say so.** The fetch reports where it has got to in the masthead; the
  draft says it is being written, on the control that was pressed.
- **Neither blocks anything.** Writing a recipe down, opening one, filling one
  in by hand, and searching are unchanged and unblocked throughout — which is
  what the message on the control says out loud, because a person who does not
  know that will simply sit and wait.
- **Neither can be started twice.** The control cannot be pressed while it is
  working; a second press would be a second session and a second answer nobody
  asked for.
- **A model that never answers costs nothing.** There is no state in which the
  app is waiting to be usable.

## Its output is untrusted input

The same posture as `localStorage`, for a different reason: a model produces
plausible text, not correct text.

- **A proposal is not a line.** It is accepted one at a time, by hand.
- **Never as markup.** Model output reaches the page as text, never
  `innerHTML`. It is the one string in this app that arrives from something that
  can be talked into saying anything.

## What this costs

Worth writing down because it is not solved.

**A wrong quantity is worse than a wrong word.** Tagging something "chicken" by
mistake made a filter lie; "200g plain flour" where the recipe wanted 300g is a
cake that does not work, discovered an hour later with the oven on. Per-line
acceptance is the mitigation and it is a real one, but it depends on somebody
reading carefully at the moment they are trying to save time.

**Nothing marks what was drafted.** Once accepted, a line carries no memory of
where it came from — decided deliberately, so that an accepted line is an
ordinary line — which means months later there is no way to tell the quantities
you verified from the ones you waved through. The alternative was a stored field
and a mark on the card that never quite goes away.

**The archive premise softens.** `../../spec.md` says "some of what is in here
exists nowhere else", and that was the whole argument for how carefully this app
treats storage. A drafted recipe exists in a great many places. It does not make
the promise false — a grandmother's card is still in here — but the book is now
a mix of two things, and only the person reading it knows which is which.

## What this is not

- **Not importing.** No URL, no fetch, no backend. `../../persona.md` rules that
  out and it stays ruled out; the model is on the machine.
- **Not a chat.** There is no box to ask it something, no conversation, no
  history. One prompt exists, it is invisible, and it is about one recipe.
- **Not naming recipes or books.** The model is asked what a recipe you have
  already named takes and how it is made. It never proposes the name, and it
  never proposes a book — a book is an occasion somebody chose.
- **Not stored.** Proposals are not written down; accepted lines are. Re-running
  inference on every read would break Instant and make a recipe look different
  on a machine that cannot run a model.
- **Not a fallback to anything.** No hosted model, no key, no "cloud option".
  With no model on the machine there is no drafting, and that is the whole of
  the behaviour.

## How any of this is tested

The pipeline runs in jsdom, which has no model of any kind.

- **The model is handed in, not reached for.** `mountApp(doc, storage)` already
  takes the document and the storage as arguments rather than as globals; a
  model handle arrives the same way. Tests pass a fake, and CI never needs a
  real one.
- **No rule asserts what a model says.** `Then the ingredients read: | 3 apples |`
  as an assertion about a model's output would be asserting an LLM's behaviour,
  which is not stable and is not the app's to promise. The rules assert what the
  app does with an answer: that it can be accepted a line at a time or turned
  down, that only accepted lines are stored, that an unusable answer changes
  nothing, and that a browser with no model works.
- **The absent model is the default case in tests**, not the edge case, because
  it is the default case in the world.
