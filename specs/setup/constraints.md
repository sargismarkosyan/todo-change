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

One key, `todo-change.todos`, holding a JSON array ordered newest first. The
shape is documented in [`../spec.md`](../spec.md).

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
Both are real; neither is reachable at the size of list this app is for. Each
needs its own spec if it ever becomes real.

## The app ships zero dependencies

Plain HTML, CSS, and ES modules, opened directly in a browser. No bundler, no
framework, no transpiler, no build step. `index.html` is the whole app.

**Why.** Diffs stay readable, which matters when the deliverable is a series of
screenshots with commits between them. There is no build output to explain, and
`index.html` opened from disk behaves the same as the deployed page.

**Dev tooling is a different thing.** `jsdom` is a devDependency, used by tests
only. Node's own test runner and coverage provide the rest, so there is no test
framework, no assertion library, and no coverage tool to keep current. Adding a
devDependency is a smaller decision than adding a runtime one, but it is still a
decision — prefer the standard library.

## Single page

`index.html` is the entire app. No routing, no second page, no view layer that
implies one.

## Logic stays out of the DOM where it can

Anything expressible without touching the DOM — the todo model, storage
serialisation, validation — belongs in a module that does not import from the
document. The DOM layer stays thin and does rendering and events only.

**Why.** It is directly testable and directly coverable. It also makes the 95%
coverage gate achievable without contorting tests: a thin DOM layer over
well-covered logic is easy to exercise through jsdom, whereas logic tangled into
event handlers is not.

## Vocabulary

Fixed across specs, code, and UI copy. Defined in [`../spec.md`](../spec.md):
**todo** (not task, item, or entry), **done / unfinished** (not complete,
checked, or archived), **the list**, **the box**.

**Why it is a constraint and not a style preference.** Gherkin rules are read by
a human as English and by tests as ids. When the same thing has three names, the
specs stop being greppable and rules start being written twice under different
words.
