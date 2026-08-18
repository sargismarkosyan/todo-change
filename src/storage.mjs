// The only copy of the data.
//
// There is no server. localStorage is a string that anyone with devtools can
// edit and any second tab can overwrite, so every read is treated as untrusted
// input and every change is written immediately. See
// specs/features/storage/spec.md.

import { migrateList, sanitizeStore } from './notepads.mjs';

export const STORAGE_KEY = 'todo-change.notepads';

/**
 * The key every version before notepads wrote: a bare array of todos.
 *
 * It is read only when `STORAGE_KEY` is absent, and removed once it has been
 * read, so the two never both hold real data and there is no question of which
 * one wins.
 */
export const LEGACY_KEY = 'todo-change.todos';

/**
 * The stored notepads, or one empty notepad when what is there cannot be read.
 *
 * This never throws. A read that throws takes the whole page down with it,
 * because there is nothing else to render — and a blank screen here costs more
 * than any missing feature.
 *
 * It is also the one place in the app that writes without anything having
 * happened on screen: finding a list left by an older version moves it into a
 * notepad called "My list" and clears the old key. That happens once, on the
 * first open after upgrading.
 */
export function readStore(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw !== null) {
    try {
      return sanitizeStore(JSON.parse(raw));
    } catch {
      return sanitizeStore(null);
    }
  }

  const legacy = storage.getItem(LEGACY_KEY);
  if (legacy === null) return sanitizeStore(null);

  let store;
  try {
    store = migrateList(JSON.parse(legacy));
  } catch {
    store = migrateList(null);
  }
  writeStore(storage, store);
  storage.removeItem(LEGACY_KEY);
  return store;
}

/** Write the notepads. No save button and no debounce — a pending write is data a closed tab loses. */
export function writeStore(storage, store) {
  storage.setItem(STORAGE_KEY, JSON.stringify(store));
}
