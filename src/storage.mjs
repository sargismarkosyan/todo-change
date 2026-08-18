// The only copy of the data.
//
// There is no server. localStorage is a string that anyone with devtools can
// edit and any second tab can overwrite, so every read is treated as untrusted
// input and every change is written immediately. See
// specs/features/storage/spec.md.

import { sanitizeTodos } from './todos.mjs';

export const STORAGE_KEY = 'todo-change.todos';

/**
 * The stored list, or an empty one when what is there cannot be read as todos.
 *
 * This never throws. A read that throws takes the whole page down with it,
 * because there is nothing else to render — and a blank screen here costs more
 * than any missing feature.
 */
export function readTodos(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  try {
    return sanitizeTodos(JSON.parse(raw));
  } catch {
    return [];
  }
}

/** Write the list. No save button and no debounce — a pending write is data a closed tab loses. */
export function writeTodos(storage, todos) {
  storage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
