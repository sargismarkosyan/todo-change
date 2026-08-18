// The DOM layer: rendering and events, and nothing else.
//
// Everything it needs to decide anything lives in recipes.mjs, books.mjs and
// storage.mjs, none of which knows a document exists. Keeping this layer thin is
// what makes the rest directly testable. See specs/setup/constraints.md.

import { addIngredient, addRecipe, addStep, linesOf, removeFrom } from './recipes.mjs';
import { findRecipes } from './finding.mjs';
import {
  addBook,
  openBook,
  openRecipes,
  removeBook,
  renameBook,
  switchTo,
  withOpenRecipes,
} from './books.mjs';
import { readStore, writeStore } from './storage.mjs';

/** The two groups inside a recipe, in the order they are read. */
const GROUPS = [
  { key: 'ingredients', block: 'ingredient', heading: 'Ingredients', placeholder: 'What does it take?' },
  { key: 'steps', block: 'step', heading: 'Method', placeholder: 'And then?' },
];

const ADD_LINE = { ingredients: addIngredient, steps: addStep };

/**
 * The two things the message under the contents can say. They are one element
 * apart and one is much worse to misread: a person told "No recipes in this
 * book yet." during a search thinks the book emptied itself.
 */
const NO_RECIPES = 'No recipes in this book yet.';
const NO_MATCHES = 'No recipe matches that.';

/**
 * Wire the markup in `doc` to the books in `storage`, and render what is there.
 *
 * Both are arguments rather than globals reached for, so a test can mount a
 * fresh document against a fresh store without either leaking into the next one.
 */
export function mountApp(doc, storage) {
  const form = doc.getElementById('composer');
  const box = doc.getElementById('new-recipe');
  const contentsEl = doc.getElementById('contents');
  const resultsEl = doc.getElementById('results');
  const emptyEl = doc.getElementById('empty');
  const findEl = doc.getElementById('find-recipe');
  const booksEl = doc.getElementById('books');
  const openEl = doc.getElementById('book-open');
  const menuEl = doc.getElementById('book-menu');

  let store = readStore(storage);

  // Which recipe is being read, if any. One at a time, so that there is always
  // a contents page to read down — see specs/features/recipes/spec.md. It is
  // not stored: it is where the reader is looking, not something they own.
  let readingId = null;

  // Which of the open recipe's two boxes had the caret, so a repaint can put it
  // back. Screen state, like the above.
  let typingIn = null;

  // What is being looked for, across every book. Screen state as well, and the
  // reason nothing about this version touches storage: a search is a way of
  // looking, not something anyone owns. See specs/features/finding/spec.md.
  let finding = '';

  const searching = () => finding.trim() !== '';

  // Everything that follows a search ends it: the contents has to come back, or
  // it is covered by results while the book underneath changes.
  const stopFinding = () => {
    finding = '';
    findEl.value = '';
  };

  // The book menu: shut, listing the books, taking a new name, or asking about
  // a delete. Screen state too — none of it is worth storing.
  let menu = { open: false, mode: 'list' };

  const shutMenu = () => {
    menu = { open: false, mode: 'list' };
  };

  // The contents on screen is the open book's, and never anything else's.
  const recipes = () => openRecipes(store);

  // Every mutation goes through here: store first, then paint. Anything on
  // screen has been written, which is the whole promise of the app.
  const commit = (next) => {
    store = next;
    writeStore(storage, store);
    render();
  };

  /** The same, for a change to the contents of the open book. */
  const commitRecipes = (next) => commit(withOpenRecipes(store, next));

  function deleteButton(block, id, label) {
    const remove = doc.createElement('button');
    remove.type = 'button';
    remove.className = `${block}__delete`;
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${label}`);
    remove.addEventListener('click', () => commitRecipes(removeFrom(recipes(), id)));
    return remove;
  }

  // ---- an open recipe ------------------------------------------------------
  //
  // Ingredients, then the method. That order is not decoration: the ingredients
  // answer "can I make this tonight", which is the question asked at the
  // contents, and the method answers "what do I do now".

  function lineRow(line, block) {
    const item = doc.createElement('li');
    item.className = block;
    item.dataset.id = line.id;

    const text = doc.createElement('span');
    text.className = `${block}__text`;
    text.textContent = line.text;

    item.append(text, deleteButton(block, line.id, line.text));
    return item;
  }

  function lineComposer(recipe, group) {
    const composer = doc.createElement('form');
    composer.className = `${group.block}-composer`;

    const lineBox = doc.createElement('input');
    lineBox.type = 'text';
    lineBox.className = `${group.block}-composer__box`;
    lineBox.id = `${group.block}-box-${recipe.id}`;
    lineBox.placeholder = group.placeholder;
    lineBox.autocomplete = 'off';
    lineBox.setAttribute('aria-label', `New ${group.block} for ${recipe.name}`);

    const add = doc.createElement('button');
    add.type = 'submit';
    add.className = `${group.block}-composer__add`;
    add.textContent = 'Add';

    composer.addEventListener('submit', (event) => {
      event.preventDefault();
      const next = ADD_LINE[group.key](recipes(), recipe.id, lineBox.value);
      lineBox.value = '';
      // The caret stays here on purpose: ingredients arrive six at a time, and
      // render() puts it back for the next one.
      typingIn = group.block;
      commitRecipes(next);
    });

    composer.append(lineBox, add);
    return composer;
  }

  function group(recipe, spec) {
    const section = doc.createElement('div');
    section.className = `recipe__group recipe__${spec.key}`;

    const heading = doc.createElement('h2');
    heading.className = 'recipe__heading';
    heading.textContent = spec.heading;

    const lines = doc.createElement('ul');
    lines.className = `recipe__${spec.key}-lines`;
    lines.append(...linesOf(recipe, spec.key).map((line) => lineRow(line, spec.block)));

    section.append(heading, lines, lineComposer(recipe, spec));
    return section;
  }

  // ---- the contents --------------------------------------------------------

  function row(recipe) {
    const item = doc.createElement('li');
    const reading = recipe.id === readingId;
    item.className = reading ? 'recipe recipe--open' : 'recipe';
    item.dataset.id = recipe.id;

    const main = doc.createElement('div');
    main.className = 'recipe__row';

    // A button, not a label: opening a recipe is the click this page is for,
    // and there is nothing to tick.
    const name = doc.createElement('button');
    name.type = 'button';
    name.className = 'recipe__name';
    name.textContent = recipe.name;
    name.setAttribute('aria-expanded', String(reading));
    name.addEventListener('click', () => {
      readingId = reading ? null : recipe.id;
      typingIn = null;
      render();
    });

    main.append(name, deleteButton('recipe', recipe.id, recipe.name));
    item.append(main);

    if (reading) {
      const body = doc.createElement('div');
      body.className = 'recipe__body';
      body.append(...GROUPS.map((spec) => group(recipe, spec)));
      item.append(body);
    }

    return item;
  }

  // ---- the results ---------------------------------------------------------
  //
  // What a search finds, in place of the contents. A result is a way to get
  // somewhere: it names the recipe and the book it is in, and offers nothing
  // else — no delete, nothing to type into. See specs/features/finding/spec.md.

  function resultRow({ recipe, book, line }) {
    const item = doc.createElement('li');
    item.className = 'result';
    item.dataset.id = recipe.id;

    // The whole result is the target, because all of it is one answer.
    const open = doc.createElement('button');
    open.type = 'button';
    open.className = 'result__open';

    const name = doc.createElement('span');
    name.className = 'result__name';
    name.textContent = recipe.name;

    // The book is the thing the person searching did not know. Without it,
    // "regardless of which book" has not actually been answered.
    const where = doc.createElement('span');
    where.className = 'result__book';
    where.textContent = book.name;

    open.append(name, where);

    // Only when the name did not match — otherwise the name already says why
    // this is here, and repeating a line under it is noise.
    if (line !== null) {
      const matched = doc.createElement('span');
      matched.className = 'result__line';
      matched.textContent = line;
      open.append(matched);
    }

    open.addEventListener('click', () => {
      // The whole way: the book it lives in opens, and the recipe opens in it.
      // Anything less leaves a recipe on screen with no book behind it, and the
      // box at the top writes into whichever book is open.
      readingId = recipe.id;
      typingIn = null;
      stopFinding();
      commit(switchTo(store, book.id));
    });

    item.append(open);
    return item;
  }

  // ---- the book menu -------------------------------------------------------
  //
  // A popover over the one page, not a screen to navigate to: the contents
  // stays where it is behind it, and it shuts on the next click. Switching is
  // the only thing here that happens more than rarely, so it is the only thing
  // that is one click deep. See specs/features/books/spec.md.

  function menuButton(className, label, onClick) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function switchRow(book) {
    const item = doc.createElement('li');
    const button = menuButton('books__switch', book.name, () => {
      shutMenu();
      // Another book is another contents page, read from the top.
      readingId = null;
      stopFinding();
      commit(switchTo(store, book.id));
    });
    if (book.id === store.openId) button.setAttribute('aria-current', 'true');
    item.append(button);
    return item;
  }

  /** A one-line form, used for both naming a new book and renaming this one. */
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

  function newBookForm() {
    return nameForm({
      className: 'books__new',
      id: 'new-book',
      label: 'Name a new book',
      value: '',
      placeholder: 'Name a new book',
      action: 'Add',
      onSubmit: (name) => {
        const next = addBook(store, name);
        // Nothing was named, so nothing happened and the menu stays as it is.
        if (next === store) return;
        shutMenu();
        readingId = null;
        stopFinding();
        commit(next);
      },
    });
  }

  function renameForm() {
    return nameForm({
      className: 'books__rename',
      id: 'rename-book',
      label: 'Rename this book',
      value: openBook(store).name,
      placeholder: openBook(store).name,
      action: 'Rename',
      onSubmit: (name) => {
        const next = renameBook(store, store.openId, name);
        shutMenu();
        commit(next);
      },
    });
  }

  /** "3 recipes", "1 recipe" — the number is the whole reason the question exists. */
  const counted = (n) => `${n} ${n === 1 ? 'recipe' : 'recipes'}`;

  function deleteConfirmation() {
    const asking = doc.createElement('div');
    asking.className = 'books__confirm';

    const question = doc.createElement('p');
    question.className = 'books__question';
    question.textContent =
      `Delete "${openBook(store).name}" and its ${counted(recipes().length)}?`;

    const yes = menuButton('books__confirm-yes', 'Delete', () => {
      shutMenu();
      readingId = null;
      stopFinding();
      commit(removeBook(store, store.openId));
    });
    const no = menuButton('books__confirm-no', 'Keep it', () => {
      menu = { open: true, mode: 'list' };
      render();
    });

    asking.append(question, yes, no);
    return asking;
  }

  function menuActions() {
    const actions = doc.createElement('div');
    actions.className = 'books__actions';
    actions.append(
      newBookForm(),
      menuButton('books__rename-open', 'Rename this book', () => {
        menu = { open: true, mode: 'renaming' };
        render();
      }),
    );

    // The last book does not go — there is always somewhere for a recipe to be.
    if (store.books.length > 1) {
      actions.append(
        menuButton('books__delete', 'Delete this book', () => {
          // Nothing is at stake in an empty one, and asking anyway is the
          // confirmation dialog persona.md complains about.
          if (recipes().length === 0) {
            shutMenu();
            readingId = null;
            stopFinding();
            commit(removeBook(store, store.openId));
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
    openEl.textContent = openBook(store).name;
    openEl.setAttribute('aria-label', `Book: ${openBook(store).name}`);
    openEl.setAttribute('aria-expanded', String(menu.open));
    menuEl.hidden = !menu.open;

    if (!menu.open) {
      menuEl.replaceChildren();
      return;
    }

    const list = doc.createElement('ul');
    list.className = 'books__list';
    list.append(...store.books.map(switchRow));

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

    const found = searching() ? findRecipes(store.books, finding) : [];
    contentsEl.hidden = searching();
    resultsEl.hidden = !searching();

    contentsEl.replaceChildren(...recipes().map(row));
    resultsEl.replaceChildren(...found.map(resultRow));

    // One message, two things it can say. A search that found nothing says so
    // about the search, never about the book — the book is not empty and has
    // not been touched.
    emptyEl.textContent = searching() ? NO_MATCHES : NO_RECIPES;
    emptyEl.hidden = searching() ? found.length > 0 : recipes().length > 0;

    // The repaint threw away the box that had the caret in it. Put it back, so
    // typing out six ingredients costs six lines of typing and nothing else.
    if (typingIn !== null) doc.getElementById(`${typingIn}-box-${readingId}`)?.focus();
    if (menu.mode === 'renaming') doc.getElementById('rename-book')?.focus();
  }

  // Live, on every keystroke: nothing is submitted and nothing loads, because
  // nothing leaves the machine. There is no Add button beside it either — the
  // one risk this change carries is a recipe name typed in here by mistake, and
  // a box that can only ever find things is the answer to it.
  findEl.addEventListener('input', () => {
    finding = findEl.value;
    render();
  });

  openEl.addEventListener('click', () => {
    menu = menu.open ? { open: false, mode: 'list' } : { open: true, mode: 'list' };
    render();
  });

  // A popover, so anything else being clicked shuts it — including a recipe's
  // name, which is the click most likely to follow "show me the other book".
  //
  // On the way down rather than the way up, and repainting only the menu: by
  // the time a click has bubbled back up here, whatever was clicked may have
  // repainted itself out of the document, and a detached target reads as
  // "outside". Going first also leaves the clicked control in place to handle
  // its own click — shutting the menu must never swallow it.
  doc.addEventListener(
    'click',
    (event) => {
      if (!menu.open || booksEl.contains(event.target)) return;
      shutMenu();
      renderMenu();
    },
    true,
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const next = addRecipe(recipes(), box.value);
    // workflows.md promises a new recipe is visibly there, at the top of the
    // contents — which it cannot be while results are covering the contents.
    stopFinding();
    // Cleared either way: what did not become a recipe was whitespace, and the
    // box has to be ready for the next one without a decision.
    box.value = '';
    commitRecipes(next);
  });

  render();
}
