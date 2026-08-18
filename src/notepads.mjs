// The notepad model.
//
// A notepad is a named list of todos. There is always at least one, exactly one
// is open, and the list on screen is the open one's. Pure, like todos.mjs —
// nothing here touches the document or localStorage. See
// specs/features/notepads/spec.md.

import { newId, sanitizeTodos } from './todos.mjs';

/**
 * What the first notepad is called: the one a fresh browser starts on, and the
 * one an old bare list is moved into. Naming it here rather than at each call
 * site is what keeps those two the same notepad from the reader's side.
 */
export const DEFAULT_NAME = 'My list';

/** A notepad with nothing in it. */
export function makeNotepad(name) {
  return { id: newId(), name, todos: [] };
}

/** The store an app opens on when nothing usable was found: one empty notepad. */
export function emptyStore() {
  const notepad = makeNotepad(DEFAULT_NAME);
  return { notepads: [notepad], openId: notepad.id };
}

/**
 * Whether a value read back out of storage is a notepad.
 *
 * The same bet as `isTodo`: `id` and `name` must be non-empty strings and
 * `todos` an array. A `todos` that is not a list is not a notepad missing its
 * todos, it is not a notepad — dropping it keeps its neighbours, which is the
 * better of the two failures.
 */
export function isNotepad(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    value.id !== '' &&
    typeof value.name === 'string' &&
    value.name !== '' &&
    Array.isArray(value.todos)
  );
}

/**
 * Everything in `value` that is a notepad, with its todos read the way they
 * always were, plus which one is open.
 *
 * Untrusted at both levels: a junk notepad is dropped and its neighbours kept,
 * exactly as a junk todo is. Nothing usable at all opens one empty notepad
 * rather than a blank screen, and an `openId` naming a notepad that is not
 * there opens the first one — no reachable stored string leaves the app with
 * nothing to draw.
 */
export function sanitizeStore(value) {
  if (typeof value !== 'object' || value === null) return emptyStore();
  const found = Array.isArray(value.notepads) ? value.notepads : [];
  const notepads = found
    .filter(isNotepad)
    .map(({ id, name, todos }) => ({ id, name, todos: sanitizeTodos(todos) }));
  if (notepads.length === 0) return emptyStore();
  const open = notepads.some((notepad) => notepad.id === value.openId);
  return { notepads, openId: open ? value.openId : notepads[0].id };
}

/**
 * A bare array of todos — everything written before notepads existed — read as
 * a store holding one notepad called "My list".
 *
 * Anything that is not a list of todos lands on the same empty notepad the rest
 * of the read path does, so an upgrade can never be the thing that shows a
 * blank screen.
 */
export function migrateList(value) {
  const todos = sanitizeTodos(value);
  const notepad = { ...makeNotepad(DEFAULT_NAME), todos };
  return { notepads: [notepad], openId: notepad.id };
}

/** The notepad on screen. */
export function openNotepad(store) {
  return store.notepads.find((notepad) => notepad.id === store.openId) ?? store.notepads[0];
}

/** The todos on screen: the open notepad's, and never anything else's. */
export function openTodos(store) {
  return openNotepad(store).todos;
}

/** `store` with `todos` as the open notepad's list. Every list change lands here. */
export function withOpenTodos(store, todos) {
  return {
    ...store,
    notepads: store.notepads.map((notepad) =>
      notepad.id === store.openId ? { ...notepad, todos } : notepad,
    ),
  };
}

/** `store` showing another notepad. An id that is not there changes nothing. */
export function switchTo(store, id) {
  if (!store.notepads.some((notepad) => notepad.id === id)) return store;
  return { ...store, openId: id };
}

/**
 * `store` with a new notepad at the end, open, or `store` unchanged when there
 * is nothing to name it.
 *
 * Appended rather than put on top: notepads are made once and then navigated by
 * remembered position, so the first one stays first. Trimming is what makes an
 * all-whitespace name impossible.
 */
export function addNotepad(store, name) {
  const trimmed = name.trim();
  if (trimmed === '') return store;
  const notepad = makeNotepad(trimmed);
  return { notepads: [...store.notepads, notepad], openId: notepad.id };
}

/** `store` with one notepad renamed. A blank name is not a rename. */
export function renameNotepad(store, id, name) {
  const trimmed = name.trim();
  if (trimmed === '') return store;
  return {
    ...store,
    notepads: store.notepads.map((notepad) =>
      notepad.id === id ? { ...notepad, name: trimmed } : notepad,
    ),
  };
}

/**
 * `store` without one notepad, and its todos with it.
 *
 * The last notepad does not go: there is always somewhere for a todo to be, so
 * there is no empty state below the empty state. Deleting the open one leaves
 * the notepad before it open, or the first one — the eye lands where the
 * deleted one was, rather than somewhere it has to look for.
 */
export function removeNotepad(store, id) {
  if (store.notepads.length < 2) return store;
  const at = store.notepads.findIndex((notepad) => notepad.id === id);
  if (at === -1) return store;
  const notepads = store.notepads.filter((notepad) => notepad.id !== id);
  if (store.openId !== id) return { ...store, notepads };
  return { notepads, openId: notepads[Math.max(at - 1, 0)].id };
}
