// The DOM layer: rendering and events, and nothing else.
//
// Everything it needs to decide anything lives in todos.mjs, notepads.mjs and
// storage.mjs, none of which knows a document exists. Keeping this layer thin is
// what makes the rest directly testable. See specs/setup/constraints.md.

import { addSubTodo, addTodo, removeTodo, subTodosOf, toggleTodo } from './todos.mjs';
import {
  addNotepad,
  openNotepad,
  openTodos,
  removeNotepad,
  renameNotepad,
  switchTo,
  withOpenTodos,
} from './notepads.mjs';
import { readStore, writeStore } from './storage.mjs';

/**
 * Wire the markup in `doc` to the notepads in `storage`, and render what is
 * there.
 *
 * Both are arguments rather than globals reached for, so a test can mount a
 * fresh document against a fresh store without either leaking into the next one.
 */
export function mountApp(doc, storage) {
  const form = doc.getElementById('composer');
  const box = doc.getElementById('new-todo');
  const listEl = doc.getElementById('list');
  const emptyEl = doc.getElementById('empty');
  const notepadsEl = doc.getElementById('notepads');
  const openEl = doc.getElementById('notepad-open');
  const menuEl = doc.getElementById('notepad-menu');

  let store = readStore(storage);

  // Which todo has its sub-todo box open, if any. Rendering replaces the list
  // wholesale, so this is the one piece of screen state that has to outlive it.
  let openFor = null;

  // The notepad menu: shut, listing the notepads, taking a new name, or asking
  // about a delete. Screen state too — none of it is worth storing.
  let menu = { open: false, mode: 'list' };

  const shutMenu = () => {
    menu = { open: false, mode: 'list' };
  };

  // The todos on screen are the open notepad's, and never anything else's.
  const todos = () => openTodos(store);

  // Every mutation goes through here: store first, then paint. Anything on
  // screen has been written, which is the whole promise of the app.
  const commit = (next) => {
    store = next;
    writeStore(storage, store);
    render();
  };

  /** The same, for a change to the list inside the open notepad. */
  const commitTodos = (next) => commit(withOpenTodos(store, next));

  // A parent row and a sub-todo row are the same three controls under different
  // class names. `kind` is the block half of each one.
  function checkbox(todo, kind) {
    const check = doc.createElement('input');
    check.type = 'checkbox';
    check.className = `${kind}__check`;
    check.id = `check-${todo.id}`;
    check.checked = todo.done;
    check.addEventListener('change', () => commitTodos(toggleTodo(todos(), todo.id)));
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
    remove.addEventListener('click', () => commitTodos(removeTodo(todos(), todo.id)));
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
      const next = addSubTodo(todos(), todo.id, subBox.value);
      subBox.value = '';
      // Left open on purpose: steps arrive in threes more often than in ones,
      // and render() puts the caret back for the next one.
      commitTodos(next);
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

  // ---- the notepad menu ----------------------------------------------------
  //
  // A popover over the one page, not a screen to navigate to: the list stays
  // where it is behind it, and it shuts on the next click. Switching is the
  // only thing here that happens more than rarely, so it is the only thing that
  // is one click deep. See specs/features/notepads/spec.md.

  function menuButton(className, label, onClick) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function switchRow(notepad) {
    const item = doc.createElement('li');
    const button = menuButton('notepads__switch', notepad.name, () => {
      shutMenu();
      commit(switchTo(store, notepad.id));
    });
    if (notepad.id === store.openId) button.setAttribute('aria-current', 'true');
    item.append(button);
    return item;
  }

  /** A one-line form, used for both naming a new notepad and renaming this one. */
  function nameForm({ className, id, label, value, placeholder, action, onSubmit }) {
    const formEl = doc.createElement('form');
    formEl.className = className;

    const nameBox = doc.createElement('input');
    nameBox.type = 'text';
    nameBox.className = `${className}-box`;
    nameBox.id = id;
    nameBox.value = value;
    nameBox.placeholder = placeholder;
    nameBox.autocomplete = 'off';
    nameBox.setAttribute('aria-label', label);

    const submit = doc.createElement('button');
    submit.type = 'submit';
    submit.className = `${className}-add`;
    submit.textContent = action;

    formEl.addEventListener('submit', (event) => {
      event.preventDefault();
      onSubmit(nameBox.value);
      nameBox.value = '';
    });

    formEl.append(nameBox, submit);
    return formEl;
  }

  function newNotepadForm() {
    return nameForm({
      className: 'notepads__new',
      id: 'new-notepad',
      label: 'Name a new notepad',
      value: '',
      placeholder: 'Name a new notepad',
      action: 'Add',
      onSubmit: (name) => {
        const next = addNotepad(store, name);
        // Nothing was named, so nothing happened and the menu stays as it is.
        if (next === store) return;
        shutMenu();
        commit(next);
      },
    });
  }

  function renameForm() {
    return nameForm({
      className: 'notepads__rename',
      id: 'rename-notepad',
      label: 'Rename this notepad',
      value: openNotepad(store).name,
      placeholder: openNotepad(store).name,
      action: 'Rename',
      onSubmit: (name) => {
        const next = renameNotepad(store, store.openId, name);
        shutMenu();
        commit(next);
      },
    });
  }

  /** "3 todos", "1 todo" — the number is the whole reason the question exists. */
  const counted = (n) => `${n} ${n === 1 ? 'todo' : 'todos'}`;

  function deleteConfirmation() {
    const asking = doc.createElement('div');
    asking.className = 'notepads__confirm';

    const question = doc.createElement('p');
    question.className = 'notepads__question';
    question.textContent =
      `Delete "${openNotepad(store).name}" and its ${counted(todos().length)}?`;

    const yes = menuButton('notepads__confirm-yes', 'Delete', () => {
      shutMenu();
      commit(removeNotepad(store, store.openId));
    });
    const no = menuButton('notepads__confirm-no', 'Keep it', () => {
      menu = { open: true, mode: 'list' };
      render();
    });

    asking.append(question, yes, no);
    return asking;
  }

  function menuActions() {
    const actions = doc.createElement('div');
    actions.className = 'notepads__actions';
    actions.append(
      newNotepadForm(),
      menuButton('notepads__rename-open', 'Rename this notepad', () => {
        menu = { open: true, mode: 'renaming' };
        render();
      }),
    );

    // The last notepad does not go — there is always somewhere for a todo to be.
    if (store.notepads.length > 1) {
      actions.append(
        menuButton('notepads__delete', 'Delete this notepad', () => {
          // Nothing is at stake in an empty one, and asking anyway is the
          // confirmation dialog persona.md complains about.
          if (todos().length === 0) {
            shutMenu();
            commit(removeNotepad(store, store.openId));
            return;
          }
          menu = { open: true, mode: 'confirming' };
          render();
        }),
      );
    }

    return actions;
  }

  function renderMenu() {
    openEl.textContent = openNotepad(store).name;
    openEl.setAttribute('aria-label', `Notepad: ${openNotepad(store).name}`);
    openEl.setAttribute('aria-expanded', String(menu.open));
    menuEl.hidden = !menu.open;

    if (!menu.open) {
      menuEl.replaceChildren();
      return;
    }

    const list = doc.createElement('ul');
    list.className = 'notepads__list';
    list.append(...store.notepads.map(switchRow));

    menuEl.replaceChildren(
      list,
      menu.mode === 'confirming'
        ? deleteConfirmation()
        : menu.mode === 'renaming'
          ? renameForm()
          : menuActions(),
    );
  }

  function render() {
    renderMenu();
    listEl.replaceChildren(...todos().map(row));
    emptyEl.hidden = todos().length > 0;
    // The repaint threw away the box that had the caret in it. Put it back, so
    // adding three steps in a row costs three lines of typing and nothing else.
    if (openFor !== null) doc.getElementById(`sub-box-${openFor}`)?.focus();
    if (menu.mode === 'renaming') doc.getElementById('rename-notepad')?.focus();
  }

  openEl.addEventListener('click', () => {
    menu = menu.open ? { open: false, mode: 'list' } : { open: true, mode: 'list' };
    render();
  });

  // A popover, so anything else being clicked shuts it — including a checkbox,
  // which is the click most likely to follow "show me the other list".
  //
  // On the way down rather than the way up, and repainting only the menu: by
  // the time a click has bubbled back up here, whatever was clicked may have
  // repainted itself out of the document, and a detached target reads as
  // "outside". Going first also leaves the clicked control in place to handle
  // its own click — shutting the menu must never swallow a tick.
  doc.addEventListener(
    'click',
    (event) => {
      if (!menu.open || notepadsEl.contains(event.target)) return;
      shutMenu();
      renderMenu();
    },
    true,
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const next = addTodo(todos(), box.value);
    // Cleared either way: what did not become a todo was whitespace, and the
    // box has to be ready for the next thought without a decision.
    box.value = '';
    commitTodos(next);
  });

  render();
}
