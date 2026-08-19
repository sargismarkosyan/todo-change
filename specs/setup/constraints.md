# Technical constraints

These are decisions, not defaults. Each one closes off options on purpose.
Changing any of them needs a numbered change spec arguing for it — "it would be
easier with a framework" is not that argument.

## No backend

No server, no API, no database, no accounts, no sync.

**Why.** The project is a demonstration of a *process*, and a backend would
double the surface area while adding nothing to what is being demonstrated. It
also keeps the app deployable as static files, which is what makes every version
screenshot-able from a live URL.

**What this rules out.** Anything requiring a shared source of truth: multi-user
lists, sharing, cross-device sync, server-side validation, real authentication.
A request for one of those is a request for a different product.

## All data lives in `localStorage`

One key, `todo-change.books`, holding the books and which one is open. The shape
is documented in [`../spec.md`](../spec.md). Two older keys —
`todo-change.notepads` and `todo-change.todos` — are read once and removed; see
[`../features/storage/spec.md`](../features/storage/spec.md).

**It is treated as untrusted input on every read.** `localStorage` is a string
that anyone with devtools can edit, that a second tab can overwrite, and that the
browser can clear without asking. Every read must survive the key being missing,
the value not parsing, and the value being valid JSON of the wrong shape — and
still open on a usable screen.

**Why this is strict.** There is no server to fall back on and no export. A read
that throws takes the whole page down, because there is nothing else to render.
That failure ends trust in the tool in a way no missing feature does — see
workflow 5 in [`../workflows.md`](../workflows.md).

**Known gaps**, documented rather than solved: two tabs will overwrite each other
(nothing listens for the `storage` event), and a full quota will throw on write.
Both are real; neither is reachable at the size of book this app is for, which is
text only. Each needs its own spec if it ever becomes real.

## The app ships almost no dependencies

Plain HTML, CSS, and ES modules, served as static files. No bundler, no
framework, no transpiler, no build step. `index.html` is the whole app.

**One exception, added in version 0012: SortableJS**, vendored in `vendor/`.
The heading used to read "zero dependencies" and it no longer honestly can. The
argument for the exception, and the three questions any future one has to
answer, are under *A vendored library* below.

**Why.** Diffs stay readable, which matters when the deliverable is a series of
screenshots with commits between them. There is no build output to explain, and
what the browser runs is byte for byte what is in the repo.

**It does need a server** — `npm run serve`, or the deployed Pages URL. A
module's `import` is a fetch, and over `file://` the origin is opaque, so the
import is blocked and nothing mounts; the page renders its empty shell and looks
deceptively fine. That is the price of `src/` holding real modules rather than
one inline script, and it was paid in version 1. Before then this file claimed
opening from disk behaved the same as the deployed page, which stopped being
true the moment there was a module to import.

**A static asset is not a dependency.** `src/fonts/` holds one self-hosted
typeface, under a licence that travels with it. It adds no build step, no
runtime fetch to anyone else's machine, and nothing to keep current — which is
what this constraint is actually protecting. A `<link>` to a font host would
fail all three and is ruled out; see `../features/look/spec.md`.

## A vendored library

**SortableJS**, MIT, no dependencies of its own, at `vendor/sortable/`. It is
the only one, and the bar for a second is this section.

**Why the rule bent.** Reordering a line was written by hand in 0011 because
this file forbade the alternative, and it was quietly broken: no
`dataTransfer.setData`, so Firefox never began a drag at all; no indicator, so
the drop landed somewhere the person could not predict; dead space between rows
that swallowed a release. Those are not polish. They are the parts of a drag
that a library exists to have already solved, and writing them badly is worse
than depending on somebody who wrote them well.

**It answers two of the three questions the font answers, and fails one.**

- *No build step.* SortableJS ships a pre-built ES module; the browser imports
  the file as it stands.
- *No runtime fetch to anyone else's machine.* It is committed here, not linked
  from a CDN. A CDN import would add a second origin to every load, which this
  file already refused for a font host.
- *Nothing to keep current* — **failed, and this is the real cost.** A typeface
  is finished; a library gets bug and security fixes, and a vendored copy does
  not receive them. The version and where it came from are recorded beside it in
  `vendor/sortable/README.md`, and updating is a deliberate act somebody has to
  remember. That is the price of the exception and it should be quoted at
  anybody proposing the next one.

**It lives outside `src/`** so the coverage gate keeps measuring what this repo
wrote. `src/**` is held at 95%, and a minified bundle inside it would either
sink the gate or force it to be gamed; neither is worth doing to code nobody
here is testing.

**What this does not open.** Not a framework, not a bundler, not a build step,
not a package installed at deploy time, and not a second library for something
that can be written in twenty lines. The test a candidate has to pass is the one
above: pre-built ESM, committed here, and worth being stuck on a version of.

**Dev tooling is a different thing.** `jsdom` is a devDependency, used by tests
only. Node's own test runner and coverage provide the rest, so there is no test
framework, no assertion library, and no coverage tool to keep current. Adding a
devDependency is a smaller decision than adding a runtime one, but it is still a
decision — prefer the standard library.

## A model, if the browser has one, and never otherwise

Version 0009 asks the browser's built-in model to draft a recipe. This does not
loosen the constraint above, and the distinction is worth being exact about.

**What is allowed.** The Prompt API — `LanguageModel` in the global scope,
Chrome 148 and later, desktop only. It adds no dependency, because the model
belongs to the browser the way `localStorage` and `crypto` do: nothing to
install, nothing to bundle, nothing to keep current, no build step, and no
request to anyone else's machine. `index.html` is still the whole app.

**What is not, and will not be.** A bundled model — Transformers.js, WebLLM, or
anything like them — is a runtime dependency plus a model download measured in
hundreds of megabytes, and a build step in practice. It contradicts this
constraint rather than bending it. A hosted model behind a key contradicts *No
backend*. **With no model on the machine there is no drafting**, and that is the
end of it; the app never grows a build step to get one.

**It is a minority feature and must be built as one.** Not Edge, Firefox or
Safari; not Chrome on Android or iOS; and not every desktop Chrome either — it
wants roughly 22 GB free on the profile volume and either more than 4 GB of VRAM
or 16 GB of RAM with four cores. Everything the model touches is an addition to
a screen that already works without it, and the browser that has no model shows
no trace of one: no disabled control, no explanatory line. See
[`../features/suggesting/spec.md`](../features/suggesting/spec.md).

**Its output is untrusted**, in the same posture as `localStorage` and for a
different reason — it is plausible rather than correct. Nothing it proposes is
stored until a person accepts it, and it reaches the page as text, never as
markup.

## Single page

`index.html` is the entire app. No routing, no second page, no view layer that
implies one.

**Popovers are not pages.** The book menu and the AI settings both open over the
contents and shut on the next click; nothing is navigated to and nothing is
navigated back from. A "settings page" would break this constraint and
`../persona.md` at once, which is why neither of them is one.

## Logic stays out of the DOM where it can

Anything expressible without touching the DOM — the recipe model, storage
serialisation, validation — belongs in a module that does not import from the
document. The DOM layer stays thin and does rendering and events only.

**Why.** It is directly testable and directly coverable. It also makes the 95%
coverage gate achievable without contorting tests: a thin DOM layer over
well-covered logic is easy to exercise through jsdom, whereas logic tangled into
event handlers is not.

## Vocabulary

Fixed across specs, code, and UI copy. Defined in [`../spec.md`](../spec.md):
**recipe** (not dish, card, or entry), **book** (not list, folder, or category),
**the contents**, **ingredient**, **the method** and its **steps**, **the box**,
**the search box**, **AI**, **a draft**, **a proposal**.

**AI** is the one word here that names the machine rather than what Nell gets,
added in version 0009 for the thing that is downloaded, switched on and reported
on. A **proposal** is what comes out of it, and it is never "generated" — see
`../features/suggesting/spec.md`.

Version 0004 replaced the whole of it — the app used to be a todo list, and
**todo**, **sub-todo**, **done / unfinished**, **the list** and **notepad** are
retired words that must not come back. That change is exactly why this is a
constraint: a half-renamed vocabulary is worse than either name.

**Why it is a constraint and not a style preference.** Gherkin rules are read by
a human as English and by tests as ids. When the same thing has three names, the
specs stop being greppable and rules start being written twice under different
words.
