# todo-change — product spec

## What it is

A single-page todo list that runs entirely in the browser. You type things you
need to do, tick them off, and delete them. That is the whole product.

## Who it is for

One person, on one device, keeping a short list. Not a team, not a project
tracker, not something to sync between machines.

## What it must always be

- **Instant.** No loading states, no spinners. Every action lands on the next
  frame, because nothing leaves the machine.
- **Trustworthy.** Anything on screen has been written to `localStorage`. If it
  is visible, it survives a refresh.
- **Legible at a glance.** The list is the interface. Chrome around it earns its
  place or it goes.

## What it deliberately is not

No accounts, no sync, no sharing, no backend. These are not "later" — they are
out of scope, and a spec proposing one is proposing a different product.

## The storage contract

`localStorage`, key `todo-change.todos`, holding a JSON array ordered newest
first:

```json
[{ "id": "1739827200000-a1b2", "text": "Buy milk", "done": false }]
```

`localStorage` is not a database. It is a string that anyone with devtools can
edit, that a second tab can overwrite, and that the browser may clear without
asking. The app therefore treats it as **untrusted input on every read** and
must open on a usable screen no matter what it finds. See
`features/storage/recovery.feature`.

## Vocabulary

Used consistently in specs, code, and UI copy:

- **todo** — one item. Not "task", not "item", not "entry".
- **done / unfinished** — the two states of a todo. Not "complete", not
  "checked", not "archived".
- **the list** — the ordered set of todos on screen.
- **the box** — the text input a todo is typed into.
