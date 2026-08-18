// The DOM layer: rendering and events, and nothing else.
//
// Everything it needs to decide anything lives in todos.mjs and storage.mjs,
// neither of which knows a document exists. Keeping this layer thin is what
// makes the rest directly testable. See specs/setup/constraints.md.

import { addSubTodo, addTodo, removeTodo, subTodosOf, toggleTodo } from './todos.mjs';
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

  // Which todo has its sub-todo box open, if any. Rendering replaces the list
  // wholesale, so this is the one piece of screen state that has to outlive it.
  let openFor = null;

  // Every mutation goes through here: store first, then paint. Anything on
  // screen has been written, which is the whole promise of the app.
  const commit = (next) => {
    todos = next;
    writeTodos(storage, todos);
    render();
  };

  // A parent row and a sub-todo row are the same three controls under different
  // class names. `kind` is the block half of each one.
  function checkbox(todo, kind) {
    const check = doc.createElement('input');
    check.type = 'checkbox';
    check.className = `${kind}__check`;
    check.id = `check-${todo.id}`;
    check.checked = todo.done;
    check.addEventListener('change', () => commit(toggleTodo(todos, todo.id)));
    return check;
  }

  // A label, so the text itself is part of the tick target.
  function textLabel(todo, kind) {
    const text = doc.createElement('label');
    text.className = `${kind}__text`;
    text.htmlFor = `check-${todo.id}`;
    text.textContent = todo.text;
    return text;
  }

  function deleteButton(todo, kind) {
    const remove = doc.createElement('button');
    remove.type = 'button';
    remove.className = `${kind}__delete`;
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${todo.text}`);
    remove.addEventListener('click', () => commit(removeTodo(todos, todo.id)));
    return remove;
  }

  // No add control here: a sub-todo cannot have sub-todos, and the cheapest way
  // to guarantee that is to give the second level nothing to click.
  function subRow(sub) {
    const item = doc.createElement('li');
    item.className = sub.done ? 'sub-todo sub-todo--done' : 'sub-todo';
    item.dataset.id = sub.id;
    item.append(checkbox(sub, 'sub-todo'), textLabel(sub, 'sub-todo'), deleteButton(sub, 'sub-todo'));
    return item;
  }

  function subComposer(todo) {
    const composer = doc.createElement('form');
    composer.className = 'sub-composer';

    const subBox = doc.createElement('input');
    subBox.type = 'text';
    subBox.className = 'sub-composer__box';
    subBox.id = `sub-box-${todo.id}`;
    subBox.placeholder = 'And then?';
    subBox.autocomplete = 'off';
    subBox.setAttribute('aria-label', `New sub-todo under ${todo.text}`);

    const add = doc.createElement('button');
    add.type = 'submit';
    add.className = 'sub-composer__add';
    add.textContent = 'Add';

    composer.addEventListener('submit', (event) => {
      event.preventDefault();
      const next = addSubTodo(todos, todo.id, subBox.value);
      subBox.value = '';
      // Left open on purpose: steps arrive in threes more often than in ones,
      // and render() puts the caret back for the next one.
      commit(next);
    });

    composer.append(subBox, add);
    return composer;
  }

  function row(todo) {
    const item = doc.createElement('li');
    item.className = todo.done ? 'todo todo--done' : 'todo';
    item.dataset.id = todo.id;

    const main = doc.createElement('div');
    main.className = 'todo__row';

    const openSub = doc.createElement('button');
    openSub.type = 'button';
    openSub.className = 'todo__add-sub';
    openSub.textContent = '+';
    openSub.setAttribute('aria-label', `Add a sub-todo to ${todo.text}`);
    openSub.addEventListener('click', () => {
      openFor = openFor === todo.id ? null : todo.id;
      render();
    });

    main.append(
      checkbox(todo, 'todo'),
      textLabel(todo, 'todo'),
      openSub,
      deleteButton(todo, 'todo'),
    );
    item.append(main);

    const subs = subTodosOf(todo);
    if (subs.length > 0) {
      const subList = doc.createElement('ul');
      subList.className = 'todo__subs';
      subList.append(...subs.map(subRow));
      item.append(subList);
    }

    if (openFor === todo.id) item.append(subComposer(todo));
    return item;
  }

  function render() {
    listEl.replaceChildren(...todos.map(row));
    emptyEl.hidden = todos.length > 0;
    // The repaint threw away the box that had the caret in it. Put it back, so
    // adding three steps in a row costs three lines of typing and nothing else.
    if (openFor !== null) doc.getElementById(`sub-box-${openFor}`)?.focus();
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
