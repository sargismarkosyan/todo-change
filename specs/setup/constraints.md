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

## The app ships zero dependencies

Plain HTML, CSS, and ES modules, served as static files. No bundler, no
framework, no transpiler, no build step. `index.html` is the whole app.

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

**Dev tooling is a different thing.** `jsdom` is a devDependency, used by tests
only. Node's own test runner and coverage provide the rest, so there is no test
framework, no assertion library, and no coverage tool to keep current. Adding a
devDependency is a smaller decision than adding a runtime one, but it is still a
decision — prefer the standard library.

## Single page

`index.html` is the entire app. No routing, no second page, no view layer that
implies one.

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
**the contents**, **ingredient**, **the method** and its **steps**, **the box**.

Version 0004 replaced the whole of it — the app used to be a todo list, and
**todo**, **sub-todo**, **done / unfinished**, **the list** and **notepad** are
retired words that must not come back. That change is exactly why this is a
constraint: a half-renamed vocabulary is worse than either name.

**Why it is a constraint and not a style preference.** Gherkin rules are read by
a human as English and by tests as ids. When the same thing has three names, the
specs stop being greppable and rules start being written twice under different
words.
