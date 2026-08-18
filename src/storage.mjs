// The only copy of the data.
//
// There is no server. localStorage is a string that anyone with devtools can
// edit and any second tab can overwrite, so every read is treated as untrusted
// input and every change is written immediately. See
// specs/features/storage/spec.md.

import { migrateList, migrateNotepads, sanitizeStore } from './books.mjs';

export const STORAGE_KEY = 'todo-change.books';

/**
 * The key version 0003 wrote: notepads of todos. Read only when `STORAGE_KEY`
 * is absent, and removed once it has been read.
 */
export const NOTEPADS_KEY = 'todo-change.notepads';

/**
 * The key every version before notepads wrote: a bare array of todos. Anyone
 * who has opened version 3 no longer has it; anyone whose last visit was
 * version 2 still does, and dropping the hop would lose their list in silence.
 */
export const LEGACY_KEY = 'todo-change.todos';

/** JSON, or null when someone has been editing it in devtools. */
function parse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * The stored books, or one empty book when what is there cannot be read.
 *
 * This never throws. A read that throws takes the whole page down with it,
 * because there is nothing else to render — and a blank screen here costs more
 * than any missing feature. What is behind it is no longer a list of today's
 * errands.
 *
 * It is also the only place in the app that writes without anything having
 * happened on screen: finding either older key converts it, writes the new one,
 * and removes the old. That happens once, on the first open after upgrading, so
 * no two of these keys ever hold real data at the same time.
 */
export function readStore(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw !== null) return sanitizeStore(parse(raw));

  const notepads = storage.getItem(NOTEPADS_KEY);
  if (notepads !== null) return moved(storage, NOTEPADS_KEY, migrateNotepads(parse(notepads)));

  const legacy = storage.getItem(LEGACY_KEY);
  if (legacy !== null) return moved(storage, LEGACY_KEY, migrateList(parse(legacy)));

  return sanitizeStore(null);
}

/** Write what an older key held under the new one, and take the old one away. */
function moved(storage, key, store) {
  writeStore(storage, store);
  storage.removeItem(key);
  return store;
}

/** Write the books. No save button and no debounce — a pending write is data a closed tab loses. */
export function writeStore(storage, store) {
  storage.setItem(STORAGE_KEY, JSON.stringify(store));
}
