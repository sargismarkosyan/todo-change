# todo-change — product spec

## What it is

A single-page recipe book that runs entirely in the browser. You write recipes
down, keep them in named **books** — Sweets, Dinner, Chicken — and open one to
read what it takes and how to make it. That is the whole product.

The repository is still called `todo-change`, and so is the storage namespace.
It was a todo list for its first three versions; what it is now, and why it
stopped being one, is [change 0004](changes/0004-recipe-book.md).

## Who it is for

One person, on one device, keeping the recipes they actually cook — a few
books, a few dozen recipes. Not a team, not a meal planner, not something to
sync between machines.

## What it must always be

- **Instant.** No loading states, no spinners. Every action lands on the next
  frame, because nothing leaves the machine. **One exception**, added in version
  0009 and bounded there: fetching the browser's own model, once, on a press.
  It is the only thing in the app that can wait, and nothing else ever waits on
  it — see [features/suggesting/spec.md](features/suggesting/spec.md).
- **Trustworthy.** Anything on screen has been written to `localStorage`. If it
  is visible, it survives a refresh. Some of what is in here exists nowhere
  else.
- **Legible at a glance, and from a step back.** The contents is the interface,
  and an open recipe is read with your hands full. Chrome around either earns
  its place or it goes.
- **Kept, not cleared.** Nothing is finished, expires, or ages out. There is no
  tick box anywhere in this product.

## What it deliberately is not

No accounts, no sync, no sharing, no backend. No meal planning, no shopping
lists, no nutrition, no scaling, no importing from a URL. These are not "later"
— they are out of scope, and a spec proposing one is proposing a different
product.

## The storage contract

`localStorage`, key `todo-change.books`, holding the books and which one is
open:

```json
{
  "books": [
    {
      "id": "1739827000000-1a2b3c4d5e6f7a8b",
      "name": "Sweets",
      "recipes": [
        {
          "id": "1739827200000-9f2c41ab7e0d5c83",
          "name": "Apple cake",
          "ingredients": [
            { "id": "1739827210000-77c3e5b0d9124fae", "text": "200g plain flour" },
            { "id": "1739827220000-2ad1f9c40b6e8735", "text": "3 apples" }
          ],
          "steps": [
            { "id": "1739827230000-5e0b73da1c9f4820", "text": "Heat the oven to 180C" }
          ]
        }
      ]
    }
  ],
  "openId": "1739827000000-1a2b3c4d5e6f7a8b",
  "suggestions": "on"
}
```

A book has a non-empty `id`, a non-empty `name`, and a `recipes` array ordered
newest first. Books themselves sit oldest first. `openId` names the book on
screen; one that names nothing opens the first book.

A recipe has a non-empty `id` and a non-empty `name`. `ingredients` and `steps`
are optional arrays, each ordered oldest first; an entry without the key has
none. An ingredient and a step have the same shape as each other — a non-empty
`id` and a non-empty `text` — and neither holds anything of its own.

**There is no `done` anywhere in this shape.** A recipe is not finished, so
there is no state to store. A `done` found in stored data is ignored on read and
gone on the next write.

`suggestions` is whether the AI has been turned on: `"unasked"`, `"on"` or
`"off"`. Absent, or anything else, reads as `"unasked"`. It is the first thing
in this shape that is not a recipe — it is stored because it is an answer
somebody gave, and asking again is asking once too often.

Which recipe is open is not stored. It is where you are looking, not what you
have. Neither is a draft: a proposal nobody accepted is never written down.

### The older keys

Two keys came before this one, and both are read **only when
`todo-change.books` is absent**:

- `todo-change.notepads` — notepads of todos, written by version 0003. Each
  notepad opens as a book, each todo as a recipe of the same name, and a todo's
  sub-todos as that recipe's method. Ticks are dropped.
- `todo-change.todos` — a bare array of todos, written by version 0002 and
  earlier. It opens as a single book called "My book", the same way.

Either read writes `todo-change.books` and removes the key it came from. It
happens once. No two of these keys ever hold real data at the same time.

`localStorage` is not a database. It is a string that anyone with devtools can
edit, that a second tab can overwrite, and that the browser may clear without
asking. The app therefore treats it as **untrusted input on every read** and
must open on a usable screen no matter what it finds. See
`features/storage/recovery.feature`.

## Vocabulary

Used consistently in specs, code, and UI copy:

- **recipe** — one thing you can cook. Not "dish", not "card", not "entry", and
  never "todo" or "item".
- **book** — a named collection of recipes. Not "list", not "tab", not "folder",
  not "category", not "notepad".
- **the open book** — the one whose recipes are on screen. Not "active", not
  "current", not "selected".
- **the contents** — the recipe names in the open book, top to bottom. Always
  one book's worth. This is what the old product called "the list".
- **ingredient** — one line of what a recipe takes, amount included. Not
  "quantity", and never split into fields.
- **the method** — the steps of a recipe, in order. **step** — one line of it.
  Not "instruction", not "sub-recipe", not "sub-todo".
- **open / closed** — the two states of a *recipe on screen*, meaning whether it
  is being read. Never "done", "unfinished", "complete", or "checked": those
  described a state a thing carried, and nothing here carries one.
- **the box** — the text input a recipe name is typed into. Only that one.
- **the handle** — what a line is taken hold of by, to move it within its group.
  Dragged with a pointer or moved with the arrow keys; the same control either
  way. Not "the grip", not "the drag handle".
- **the search box** — the text input a recipe is looked for in, across every
  book. Never "the box", and never "filter" or "query".
- **the results** — what a search finds, shown in place of the contents, each
  one naming the book it is in. Not "hits", not "matches", not "search
  results".
- **AI** — the browser's own on-device model, named plainly and only where the
  machine itself is the subject: the thing downloaded, switched on, and reported
  on. Not "the model" in UI copy, not "Gemini", not "smart".
- **a draft** — what the AI proposes for one recipe: ingredients and steps
  together, none of them written down.
- **a proposal** — one line of a draft. It is not an ingredient or a step until
  it has been accepted, and it is never "generated". A proposal sits among the
  lines of its group rather than below them, and is moved the same way they
  are.
- **the offer** — the one question asked about the AI, on the first visit that
  could use it. Asked once and remembered.
- **the indicator** — the line in the masthead saying where the AI stands. Never
  there when the AI is off or absent.
- **the AI settings** — the popover in the colophon holding the switch. Never a
  screen, never a page, and never somewhere you have to go before using the
  app.

Retired with version 0004, and not to be reintroduced: **todo**, **sub-todo**,
**parent**, **done / unfinished**, **the list**, **notepad**.
