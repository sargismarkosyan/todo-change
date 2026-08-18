# Spec 0001: core todo list

- **Status:** proposed
- **Closes issue:** none — first feature

## Why

The app has no function yet. Someone testing it needs the smallest thing that is
actually a todo app: a way to write down tasks, tick them off, and find them
still there tomorrow.

## What changes

`index.html` becomes a working todo list, replacing the version 0 placeholder.

- A text input and an **Add** button at the top. Pressing Enter also adds.
- Submitting adds the task to the top of a list below and clears the input.
- Empty or whitespace-only input adds nothing.
- Each row shows a checkbox and the task text. Ticking it marks the task done:
  the text goes muted and struck through. Unticking reverses it.
- Each row has a delete control that removes that task.
- When there are no tasks, the list area shows a short empty-state message
  instead of a blank box.
- Everything persists: reloading the page restores the same tasks in the same
  order with the same done states.

## Out of scope

Deliberately left for later specs: editing task text, filtering by status,
clearing all completed, reordering, due dates, counts, keyboard shortcuts
beyond Enter, animations.

## Data

New key in `localStorage`: `todo-change.todos`, holding a JSON array, newest
first:

```json
[{ "id": "1739827200000-a1b2", "text": "Buy milk", "done": false }]
```

There is no existing stored data to migrate. If the key is missing or does not
parse, the app starts with an empty list rather than erroring.

## Acceptance checks

1. Open `index.html`. The empty-state message is visible.
2. Type "Buy milk", press Enter. It appears in the list; the input is empty.
3. Add "Call the bank". It appears above "Buy milk".
4. Tick "Buy milk". It shows as done.
5. Reload the page. Both tasks are still there, "Buy milk" still ticked.
6. Delete "Call the bank". It disappears; reload confirms it stays gone.
7. Press Enter on an empty input. Nothing is added.
