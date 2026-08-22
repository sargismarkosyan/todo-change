# todo-change — product spec

## What it is

A single-page recipe book that runs entirely in the browser. You write recipes
down, keep them in named **books** — Sweets, Dinner, Chicken — and open one to
read what it takes and how to make it. That is the whole product.

One page, two addresses since version 0013: `#/` is **the home**, a search box
with the recipes you starred and three more to start from, and `#/book/<id>` is
one book's contents. See
[features/home/spec.md](features/home/spec.md).

The repository is still called `todo-change`, and so is the storage namespace.
It was a todo list for its first three versions; what it is now, and why it
stopped being one, is [change 0004](changes/0004-recipe-book.md).

## Who it is for

One person, on one device, keeping the recipes they actually cook — a few
books, a few dozen recipes. Not a team, not a meal planner, not something to
sync between machines.

## What it must always be

**These five are the guarantees**, and since version 0018 they are ids a feature
file can be answerable to. A guarantee is a property every workflow holds — no
trigger, no attempt, nothing to walk — which is why it is a tag here rather than
a file in [`workflows/`](workflows/README.md). Every one must be claimed by at
least one feature, or carry `@planned`; `npm run trace` fails otherwise. See
[features/guarantees/spec.md](features/guarantees/spec.md).

- `@guarantee:instant` `@planned` — **Instant.** No loading states, no spinners.
  Every action lands on the next frame, because nothing leaves the machine.
  **One exception**, added in version 0009 and bounded there: fetching the
  browser's own model, once, on a press. It is the only thing in the app that
  can wait, and nothing else ever waits on it — see
  [features/suggesting/spec.md](features/suggesting/spec.md).

  **`@planned` means no feature file asserts this**, which is what the gate
  found on its first run: seventeen versions have claimed it here with nothing
  anywhere checking it. The tag says so out loud rather than letting the silence
  read as coverage. It comes off when a feature file claims it.
- `@guarantee:survives-return` — **Trustworthy.** Anything on screen has been
  written to `localStorage`. If it is visible, it survives a refresh. Some of
  what is in here exists nowhere else, which is why this one outranks every
  workflow — see [personas/nell.md](personas/nell.md). Asserted at the end of all
  six workflow walkthroughs as well as by `features/storage/`.
- `@guarantee:readable-while-cooking` — **Legible at a glance, and from a step
  back.** The contents is the interface of a book, and an open recipe is read
  with your hands full. Chrome around either earns its place or it goes. The home
  is the one other thing to look at, and it holds a box and a short column of
  names for the same reason.
- `@guarantee:nothing-is-finished` — **Kept, not cleared.** Nothing is finished,
  expires, or ages out. There is no tick box anywhere in this product.
- `@guarantee:within-reach` — **Reachable by every hand.** A control drawn small
  still offers a fingertip to hit, what changes off screen is said aloud, focus
  is never dropped on the floor, and every size is relative so the browser's own
  setting reaches every word. Version 0017 shipped all four and called them
  guarantees in its own words; this bullet is where that claim should have been
  written down, and 0018's gate is what noticed it was not.

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
      "colour": "green",
      "recipes": [
        {
          "id": "1739827200000-9f2c41ab7e0d5c83",
          "name": "Apple cake",
          "favourite": true,
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

`colour` is what a book is bound in: one of `"red"`, `"ochre"`, `"green"`,
`"teal"`, `"blue"` or `"plum"`. It is a **name, not a value** — the hexes are the
stylesheet's business, so the palette can be retuned without touching a stored
book. Absent, or anything else, reads as `"red"`, which is what every book was
drawn in before 0015; the default is not written down, so there is nothing to
clear.

Since 0013 **the address is what puts a book on screen**, and going to one sets
`openId` — the two never disagree, because one follows the other. On the home no
book is on screen and `openId` is simply the last one that was.

A recipe has a non-empty `id` and a non-empty `name`. `favourite` is optional
and present only when it is `true`: a recipe nobody has starred has no key, and
anything that is not exactly `true` reads as not a favourite. It is the only
state a recipe carries, added in 0014, and it points the opposite way to the
`done` below it — a star means come back to this, not this can go away. Every
recipe written by every earlier version reads as not a favourite, so there is
nothing to migrate.

`ingredients` and `steps` are optional arrays, each ordered oldest first; an
entry without the key has none. An ingredient and a step have the same shape as
each other — a non-empty `id` and a non-empty `text` — and neither holds
anything of its own.

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
- **a book's colour** — which of the six a book is bound in, named rather than
  numbered: *red*, *ochre*, *green*, *teal*, *blue*, *plum*. Not "the theme", not
  "an accent", not "a tag", and never "a category" — a book is not one, and a
  colour on it does not make it one.
- **the ribbon** — the band of the open book's colour down the binding edge of
  the page, sewn in at the head and hanging past the foot. What says which book
  is on screen without being read. Not "the accent bar", not "the stripe".
- **the swatches** — the strip of six in the book menu, one press each, that
  colours the open book. Not "the palette" — that word is the stylesheet's — and
  never "the colour picker", which is the thing they exist instead of.
- **the contents** — the recipe names in the open book, top to bottom. Always
  one book's worth. This is what the old product called "the list".
- **ingredient** — one line of what a recipe takes, amount included. Not
  "quantity", and never split into fields.
- **the method** — the steps of a recipe, in order. **step** — one line of it.
  Not "instruction", not "sub-recipe", not "sub-todo".
- **open / closed** — the two states of a *recipe on screen*, meaning whether it
  is being read. Never "done", "unfinished", "complete", or "checked": those
  described a state a thing carried on the way to being got rid of, and nothing
  here is got rid of by being done. A favourite is the one thing a recipe does
  carry, and it runs the other way — see below.
- **the box** — the text input a recipe name is typed into. Only that one.
- **the grip** — what a line is taken hold of by, to move it within its group.
  Dragged with a pointer or moved with the arrow keys; the same control either
  way. Not "the handle", not "the drag handle". A drag starts here and nowhere
  else on the line.
- **the search box** — the text input a recipe is looked for in, across every
  book. Never "the box", and never "filter" or "query".
- **the results** — what a search finds, shown in place of the contents, or of
  the picks, each one naming the book it is in. Not "hits", not "matches", not
  "search results".
- **the home** — the front door at `#/`: the search box, the favourites and the
  picks, with no contents and no box. Not "the dashboard", not "the landing
  page", not "the start page", and never "the index".
- **a favourite** — a recipe marked as one of the handful actually cooked. Not
  "starred" as a noun, not "pinned", not "bookmarked", and never "liked" or
  "rated". One bit and no scale.
- **the star** — the control on a row of the contents that marks a recipe and
  unmarks it. Never "the favourite button", and never a tick — there is still no
  tick box in this product.
- **the picks** — the three recipes offered on the home as somewhere to start,
  from any book, the same all day. Not "suggestions" — that word belongs to the
  AI — and never "recommendations", "featured", or "popular".
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
- **the announcer** — the one off-screen line that says what just changed, for
  whatever reads the page aloud. Never visible, never more than one, and never
  saying anything the screen does not already show. Not "a toast", not "a
  notification".

Retired with version 0004, and not to be reintroduced: **todo**, **sub-todo**,
**parent**, **done / unfinished**, **the list**, **notepad**.
