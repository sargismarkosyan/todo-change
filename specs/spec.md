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
[
  { "id": "1739827200000-9f2c41ab7e0d5c83", "text": "Buy milk", "done": false },
  {
    "id": "1739827100000-4b8e02fa19d7c6a1",
    "text": "Sort out car insurance",
    "done": false,
    "subTodos": [
      { "id": "1739827110000-77c3e5b0d9124fae", "text": "Call current insurer", "done": true }
    ]
  }
]
```

`subTodos` is optional and holds at most one level — a sub-todo never carries a
`subTodos` of its own. An entry without the key is a todo with no sub-todos,
which is what every todo written before this key existed reads as. There is no
migration and nothing to rewrite.

A parent that has sub-todos is done exactly when all of them are done. Stored
data can disagree, because stored data is untrusted; the invariant is restored
on read rather than believed.

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
- **sub-todo** — a todo nested under another one. Not "subtask", not "step" in
  UI copy, though prose may call them steps when explaining why they exist.
- **parent** — a todo that has sub-todos. A todo with none is just a todo.
- **the list** — the ordered set of todos on screen.
- **the box** — the text input a todo is typed into.
