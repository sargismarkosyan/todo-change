// The todo model.
//
// Pure: nothing here touches the document or localStorage, so it can be read,
// tested and reasoned about on its own. The DOM layer is app.mjs; the storage
// layer is storage.mjs. See specs/setup/constraints.md.

/**
 * A fresh id: when it was made, plus 64 bits of randomness.
 *
 * The randomness is the part that matters. Ids are how rows are addressed, so
 * two todos sharing one would mean ticking one ticks both. An earlier version
 * used four base36 characters from `Math.random()` — about 1.7 million values
 * against the ~265 ids that fit in a millisecond, which collided roughly two
 * runs in five. See issue #2.
 *
 * `getRandomValues` rather than `randomUUID`: the latter is undefined outside a
 * secure context, which would break the app entirely over plain http.
 */
export function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${Date.now()}-${suffix}`;
}

/**
 * Whether a value read back out of storage is a todo.
 *
 * localStorage is untrusted input — anyone with devtools can put anything in
 * it. `id` and `text` must be non-empty strings and `done` a boolean; a value
 * that is nearly a todo is not one. See specs/features/storage/spec.md.
 */
export function isTodo(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    value.id !== '' &&
    typeof value.text === 'string' &&
    value.text !== '' &&
    typeof value.done === 'boolean'
  );
}

/**
 * Everything in `value` that is a todo, in the order found, stripped of any
 * other properties. Anything that is not an array at all yields an empty list.
 *
 * Malformed entries are dropped rather than failing the whole read: throwing
 * away someone's real todos because a neighbour got mangled is the worse of the
 * two failures.
 */
export function sanitizeTodos(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(isTodo).map(({ id, text, done }) => ({ id, text, done }));
}

/**
 * `todos` with a new todo on top, or `todos` unchanged when there is nothing to
 * add. Newest first, always — the list never reorders itself.
 *
 * Trimming on the way in is what makes an all-whitespace todo impossible.
 */
export function addTodo(todos, text) {
  const trimmed = text.trim();
  if (trimmed === '') return todos;
  return [{ id: newId(), text: trimmed, done: false }, ...todos];
}

/** `todos` with one todo's done state flipped. Nothing moves. */
export function toggleTodo(todos, id) {
  return todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo));
}

/** `todos` without the one carrying `id`. Todos are addressed by id, never by index. */
export function removeTodo(todos, id) {
  return todos.filter((todo) => todo.id !== id);
}
