// The DOM layer: rendering and events, and nothing else.
//
// Everything it needs to decide anything lives in todos.mjs and storage.mjs,
// neither of which knows a document exists. Keeping this layer thin is what
// makes the rest directly testable. See specs/setup/constraints.md.

import { addTodo, removeTodo, toggleTodo } from './todos.mjs';
import { readTodos, writeTodos } from './storage.mjs';

/**
 * Wire the markup in `doc` to the todos in `storage`, and render what is there.
 *
 * Both are arguments rather than globals reached for, so a test can mount a
 * fresh document against a fresh store without either leaking into the next one.
 */
export function mountApp(doc, storage) {
  const form = doc.getElementById('composer');
  const box = doc.getElementById('new-todo');
  const listEl = doc.getElementById('list');
  const emptyEl = doc.getElementById('empty');

  let todos = readTodos(storage);

  // Every mutation goes through here: store first, then paint. Anything on
  // screen has been written, which is the whole promise of the app.
  const commit = (next) => {
    todos = next;
    writeTodos(storage, todos);
    render();
  };

  function row(todo) {
    const item = doc.createElement('li');
    item.className = todo.done ? 'todo todo--done' : 'todo';
    item.dataset.id = todo.id;

    const check = doc.createElement('input');
    check.type = 'checkbox';
    check.className = 'todo__check';
    check.id = `check-${todo.id}`;
    check.checked = todo.done;
    check.addEventListener('change', () => commit(toggleTodo(todos, todo.id)));

    // A label, so the text itself is part of the tick target.
    const text = doc.createElement('label');
    text.className = 'todo__text';
    text.htmlFor = check.id;
    text.textContent = todo.text;

    const remove = doc.createElement('button');
    remove.type = 'button';
    remove.className = 'todo__delete';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${todo.text}`);
    remove.addEventListener('click', () => commit(removeTodo(todos, todo.id)));

    item.append(check, text, remove);
    return item;
  }

  function render() {
    listEl.replaceChildren(...todos.map(row));
    emptyEl.hidden = todos.length > 0;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const next = addTodo(todos, box.value);
    // Cleared either way: what did not become a todo was whitespace, and the
    // box has to be ready for the next thought without a decision.
    box.value = '';
    commit(next);
  });

  render();
}
