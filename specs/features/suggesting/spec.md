# Suggesting — general spec

Everything else in `features/` describes an app that does exactly what it is
told. This folder is the one place a **model** is asked anything, and it is the
only part of the product that is not present in most browsers.

Two uses, both small, both optional:

- **Proposing tags for a recipe** — reading the name and the ingredients that
  are already written down, and offering the words to find it by.
  `tags.feature`.
- **Relating a typed word to the tags in use** — "pig" pointing at the tag
  "pork" you already wrote. `related-words.feature`.

Neither is the feature. Tags are the feature, and both of these are ways of not
having to type them.

## Why a model is here at all

`persona.md` names **"retyping something they already wrote down"** first among
what annoys Nell, and a tag is exactly that: "2 free-range chicken thighs" is on
the screen, and tagging asks for "chicken" to be typed underneath it.

That is the honest case against tags, and it is why suggestion is not a later
version. Tags without it are filing, and filing is the thing this app has said
no to since version 0004 — a book is an occasion, not a category, and nothing
here has ever asked to be marked as anything.

So the model is not an accelerator bolted onto a finished feature. It is the
answer to the strongest objection to the feature.

## Which model, and why that is allowed

The browser's own: the **Prompt API**, `LanguageModel` in the global scope.

`setup/constraints.md` says the app ships zero dependencies, and this adds none.
The model belongs to the browser the way `localStorage` and `crypto` do. There
is nothing to install, nothing to keep current, nothing fetched from anyone
else's machine, and `index.html` is still the whole app.

The route that would have broken the constraint is the other one — bundling
Transformers.js or WebLLM, which is a runtime dependency plus a model download
measured in hundreds of megabytes, and a build step in practice. **That is ruled
out, permanently.** If the built-in model is not there, the answer is that
suggestion is not there. It is never that the app grows a build step.

`No backend` survives for the same reason it always has: the model runs on the
machine. Nothing about a recipe leaves it. An API key or a hosted endpoint would
be a different product, and `setup/constraints.md` already says so.

## What is actually there, as of writing

Verified against the current documentation rather than assumed — issue #9 asked
for exactly this check, because these APIs moved for two years before settling.

- `LanguageModel` is a global, feature-detected with `'LanguageModel' in self`.
- `LanguageModel.availability()` resolves to one of four strings:
  **`"unavailable"`**, **`"downloadable"`**, **`"downloading"`**,
  **`"available"`**.
- `LanguageModel.create()` takes `initialPrompts`, and a `monitor` that reports
  `downloadprogress`. Creating a session needs recent user interaction with the
  page when a download is involved.
- `session.prompt(text, { responseConstraint })` takes a **JSON Schema**, which
  is what holds an answer to a list of words instead of a paragraph about
  cooking.
- Secure contexts only. Both the deployed Pages URL and `npm run serve` on
  localhost qualify.

**Chrome 148 and later, on desktop only.** Not Edge, not Firefox, not Safari,
not Chrome on Android or iOS. And not every desktop Chrome either: it wants
roughly 22 GB free on the profile volume, and either more than 4 GB of VRAM or
16 GB of RAM with four cores.

Read that as: **the model is a minority, not a majority with gaps.** Every rule
in this folder is written for the app that most people will actually open, which
is the one with no model in it.

## The four states, on screen

| `availability()` | What is on screen |
|---|---|
| absent, or `"unavailable"` | Nothing. No control, no message, no explanation. |
| `"downloadable"`, `"downloading"` | The control, and — once asked — that the model is being fetched. |
| `"available"` | The control, answering on the spot. |

The first row is the important one. A disabled button, a greyed control, or a
line explaining that this browser cannot do something is **worse than nothing**:
it is permanent furniture advertising an absence, on a page whose whole argument
is that chrome earns its place or goes. The app with no model is not a degraded
app. It is the app, and tagging by hand is how tagging works in it.

## Instant, and the one exception

`spec.md` opens its promises with **"Instant. No loading states, no spinners.
Every action lands on the next frame, because nothing leaves the machine."**

Fetching a model is not instant, and pretending otherwise would be a frozen
page. So this is a real amendment, and it is bounded as tightly as it can be:

- **Only asking for suggestions can be slow**, and only when the model has yet
  to be fetched. It is a thing you press, once, deliberately.
- **Nothing else ever waits on a model.** Writing a recipe down, opening one,
  searching, and picking a tag are unchanged and unblocked. The related words in
  the tag box are strictly additive: the letters answer immediately and are
  never held back, and a related word appears underneath if one arrives.
- **A model that never answers costs nothing.** There is no state in which the
  app is waiting to be usable.

The amendment is written into `spec.md` in the same change, rather than left as
a contradiction between two files.

## Its output is untrusted input

The same posture as `localStorage`, for a different reason: a model produces
plausible text, not correct text.

- **A proposed tag is not a tag.** It is accepted one word at a time, by hand.
  Auto-tagging would make the filter lie quietly, and there is no undo anywhere
  in this app.
- **A related word must already be a tag in use.** The model's job is to point
  at one of your words, never to mint one, so a proposal that matches no
  existing tag is dropped. A door onto nothing is worse than no door.
- **Never as markup.** Model output reaches the page as text, never `innerHTML`.
  It is the one string in this app that arrives from something that can be
  talked into saying anything.

Together these mean the worst a wrong answer can do is offer a word that is not
useful, next to a word that is.

## How any of this is tested

The pipeline runs in jsdom, which has no model of any kind, and every rule needs
a test.

- **The model is handed in, not reached for.** `mountApp(doc, storage)` already
  takes the document and the storage as arguments rather than as globals, for
  precisely this reason; a model handle arrives the same way. Tests pass a fake,
  and CI never needs a real one.
- **No rule asserts what a model says.** `Then the tags read: | chicken |` would
  be asserting an LLM's behaviour, which is not stable and is not the app's to
  promise. The rules assert what the app does with an answer: that it can be
  accepted or turned down, that only accepted words are stored, that an
  unusable answer changes nothing, and that a browser with no model works.
- **The absent model is the default case in tests**, not the edge case, because
  it is the default case in the world.

## What this is not

- **Not writing recipes.** The model never proposes an ingredient, a step, a
  recipe name, or a book. It reads what you wrote and offers a word to file it
  under. Anything that generates the content of a recipe is a different product,
  and it is the one `persona.md` describes as "typing it out is how it ends up
  in your words".
- **Not a chat.** There is no box to ask it something, no conversation, no
  history. Two prompts exist, both invisible, both about tags.
- **Not stored.** Suggestions are not written down, accepted tags are — see
  `../recipes/spec.md`. Re-running inference on every read would break Instant
  and would make the contents depend on a model being present just to draw, and
  then a book would look different on a machine that cannot run it.
- **Not a fallback to anything.** No hosted model, no key, no "cloud option".
  With no model on the machine there is no suggestion, and that is the whole of
  the behaviour.
