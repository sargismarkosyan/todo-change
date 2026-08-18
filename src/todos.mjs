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

/** A todo with nothing on it but the three fields a todo has. */
function strip({ id, text, done }) {
  return { id, text, done };
}

/**
 * The sub-todos under a todo. Absent and empty mean the same thing, so this is
 * the only way anything should reach for them.
 */
export function subTodosOf(todo) {
  return todo.subTodos ?? [];
}

/**
 * `todo` carrying exactly `subTodos`, with its done state settled against them.
 *
 * The invariant lives here and nowhere else: **a parent is done exactly when
 * all of its sub-todos are done**. Every path that can change a group — ticking
 * either end, adding a step, deleting one, reading the lot back out of storage
 * — comes through this function, so there is one place the two can agree and no
 * second place for them to drift.
 *
 * A todo left with no sub-todos loses the key and keeps the done state it had.
 * It is an ordinary todo again, and an empty group is not grounds for calling
 * something finished that nobody ticked.
 */
function withSubTodos(todo, subTodos) {
  const { subTodos: _dropped, ...rest } = todo;
  if (subTodos.length === 0) return rest;
  return { ...rest, done: subTodos.every((sub) => sub.done), subTodos };
}

/**
 * Everything in `value` that is a todo, in the order found, stripped of any
 * other properties. Anything that is not an array at all yields an empty list.
 *
 * Malformed entries are dropped rather than failing the whole read: throwing
 * away someone's real todos because a neighbour got mangled is the worse of the
 * two failures. That applies one level down too — a junk sub-todo costs its
 * parent nothing, and a `subTodos` that is not a list reads as no sub-todos.
 *
 * Sub-todos are stripped, so one carrying `subTodos` of its own arrives flat.
 * Depth is capped at one on the way in as well as in the UI, which means no
 * stored string can describe a list the screen cannot draw.
 *
 * A parent's stored `done` is recomputed rather than believed. Storage is
 * untrusted input, and a struck-through parent above an open step would make
 * the list lie at a glance.
 */
export function sanitizeTodos(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(isTodo).map((todo) => {
    const stored = todo.subTodos;
    const subTodos = Array.isArray(stored) ? stored.filter(isTodo).map(strip) : [];
    return withSubTodos(strip(todo), subTodos);
  });
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

/**
 * `todos` with a sub-todo added to the bottom of `parentId`'s group, or `todos`
 * unchanged when there is nothing to add.
 *
 * Oldest first here, against the newest-first list above. A sub-todo's box sits
 * at the bottom of its group, so appending is what puts the new one under the
 * eye — and steps carry a sequence that reversing would fight. See
 * specs/features/todo/spec.md.
 *
 * The new sub-todo is unfinished, so adding one to a done parent reopens it.
 */
export function addSubTodo(todos, parentId, text) {
  const trimmed = text.trim();
  if (trimmed === '') return todos;
  const made = { id: newId(), text: trimmed, done: false };
  return todos.map((todo) =>
    todo.id === parentId ? withSubTodos(todo, [...subTodosOf(todo), made]) : todo,
  );
}

/**
 * `todos` with one todo's done state flipped, wherever in the group it sits.
 * Nothing moves.
 *
 * Ticking a parent ticks every sub-todo under it, and unticking clears them —
 * the group goes together. Ticking a sub-todo settles the parent instead, so
 * the last open step closes the thing itself.
 */
export function toggleTodo(todos, id) {
  return todos.map((todo) => {
    const subTodos = subTodosOf(todo);
    if (todo.id === id) {
      const done = !todo.done;
      return withSubTodos({ ...todo, done }, subTodos.map((sub) => ({ ...sub, done })));
    }
    if (!subTodos.some((sub) => sub.id === id)) return todo;
    return withSubTodos(
      todo,
      subTodos.map((sub) => (sub.id === id ? { ...sub, done: !sub.done } : sub)),
    );
  });
}

/**
 * `todos` without the one carrying `id`, parent or sub-todo. Todos are addressed
 * by id, never by index.
 *
 * Deleting a parent takes its sub-todos with it, because they are inside it —
 * the group is the unit. Deleting a sub-todo settles the parent against what is
 * left, so removing the only open step closes it.
 */
export function removeTodo(todos, id) {
  return todos
    .filter((todo) => todo.id !== id)
    .map((todo) => {
      const subTodos = subTodosOf(todo);
      if (!subTodos.some((sub) => sub.id === id)) return todo;
      return withSubTodos(todo, subTodos.filter((sub) => sub.id !== id));
    });
}
