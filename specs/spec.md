# todo-change — product spec

## What it is

A single-page todo list that runs entirely in the browser. You type things you
need to do, tick them off, and delete them. There can be more than one list — a
**notepad** is a named list, and exactly one is open at a time. That is the
whole product.

## Who it is for

One person, on one device, keeping a short list — or a few short lists that are
better off not being looked at together. Not a team, not a project tracker, not
something to sync between machines.

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

`localStorage`, key `todo-change.notepads`, holding the notepads and which one
is open:

```json
{
  "notepads": [
    {
      "id": "1739827000000-1a2b3c4d5e6f7a8b",
      "name": "My list",
      "todos": [
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
    }
  ],
  "openId": "1739827000000-1a2b3c4d5e6f7a8b"
}
```

A notepad has a non-empty `id`, a non-empty `name`, and a `todos` array ordered
newest first. Notepads themselves sit oldest first. `openId` names the notepad
on screen; one that names nothing opens the first notepad.

A todo is unchanged in shape. `subTodos` is optional and holds at most one level
— a sub-todo never carries a `subTodos` of its own. An entry without the key is
a todo with no sub-todos.

A parent that has sub-todos is done exactly when all of them are done. Stored
data can disagree, because stored data is untrusted; the invariant is restored
on read rather than believed.

### The old key

`todo-change.todos` — a bare array of todos — is what every version before
notepads wrote. It is read **only when `todo-change.notepads` is absent**: its
todos open as a single notepad called "My list", the new key is written, and the
old key is removed. That first read is the one write in this app not caused by a
change on screen, and it happens once. The two keys never both hold real data.

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
- **the list** — the ordered set of todos on screen. Always one notepad's worth.
- **the box** — the text input a todo is typed into.
- **notepad** — a named list of todos. Not "list" on its own, not "tab", not
  "folder", not "category".
- **the open notepad** — the one whose todos are on screen. Not "active", not
  "current", not "selected".
