// The DOM layer: rendering and events, and nothing else.
//
// Everything it needs to decide anything lives in recipes.mjs, books.mjs and
// storage.mjs, none of which knows a document exists. Keeping this layer thin is
// what makes the rest directly testable. See specs/setup/constraints.md.

import {
  addIngredient,
  addRecipe,
  addStep,
  addTag,
  linesOf,
  removeFrom,
  removeTag,
  tagsOf,
} from './recipes.mjs';
import { filterByTags, findRecipes, offerTags, tagsInUse } from './finding.mjs';
import { usableRelated, usableSuggestions } from './suggesting.mjs';
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
const NO_CARRIERS = 'No recipe takes all of those.';

/**
 * The three things the line under the suggest control can say. Two of them are
 * failures and neither changes the recipe; the third is the one place in this
 * app where something is being waited for.
 */
const NO_SUGGESTIONS = 'No tags suggested.';
const SUGGEST_FAILED = 'Tags could not be suggested.';
const FETCHING_MODEL = 'Fetching the model…';

/**
 * Wire the markup in `doc` to the books in `storage`, and render what is there.
 *
 * Both are arguments rather than globals reached for, so a test can mount a
 * fresh document against a fresh store without either leaking into the next one.
 */
export function mountApp(doc, storage, model = null) {
  const form = doc.getElementById('composer');
  const box = doc.getElementById('new-recipe');
  const contentsEl = doc.getElementById('contents');
  const resultsEl = doc.getElementById('results');
  const emptyEl = doc.getElementById('empty');
  const findEl = doc.getElementById('find-recipe');
  const booksEl = doc.getElementById('books');
  const openEl = doc.getElementById('book-open');
  const menuEl = doc.getElementById('book-menu');
  const tagBoxEl = doc.getElementById('tagbox');
  const pickedEl = doc.getElementById('picked-tags');
  const termEl = doc.getElementById('tag-term');
  const offerEl = doc.getElementById('tag-offer');
  const relatedEl = doc.getElementById('tag-related');
  const relatedListEl = doc.getElementById('tag-related-list');

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

  // What has been picked out of the tags in use, and what is being typed to
  // narrow the offer. Screen state as well: a filter is a way of looking, the
  // same as a search. See specs/features/finding/spec.md.
  let picked = [];
  let term = '';

  // Tags the model says are related to what is being typed. Never anything but
  // a tag that already exists, and never waited for.
  let related = [];

  // What the model proposed for one recipe, and the one line under the control.
  // Nothing here is written down until a word is accepted.
  let suggested = null;
  let note = null;

  // What the browser can do, once it has said. Nothing until it has: the
  // control is drawn for a model that is there, and most browsers have none.
  let modelState = 'unavailable';
  const hasModel = () => model !== null && modelState !== 'unavailable';

  const searching = () => finding.trim() !== '';
  const filtering = () => picked.length > 0;

  /** Whether the results stand in place of the contents, either way round. */
  const looking = () => searching() || filtering();

  // Everything that follows a search ends it: the contents has to come back, or
  // it is covered by results while the book underneath changes.
  const stopFinding = () => {
    finding = '';
    findEl.value = '';
  };

  /** The same for a filter, and for the same reason. */
  const stopFiltering = () => {
    picked = [];
    term = '';
    related = [];
    termEl.value = '';
  };

  /** Both, for the things that end any way of looking at all. */
  const stopLooking = () => {
    stopFinding();
    stopFiltering();
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

  // ---- what a recipe is found by -------------------------------------------
  //
  // Tags sit under the name, on the card as much as on an open recipe: being
  // readable without opening anything is the whole of what a tag is for. They
  // come off only on an open one, because the contents is read down rather than
  // edited in passing. See specs/features/recipes/spec.md.

  function tagChip(recipe, tag, reading) {
    const item = doc.createElement('li');
    item.className = 'tag';

    const text = doc.createElement('span');
    text.className = 'tag__text';
    text.textContent = tag;
    item.append(text);

    if (reading) {
      const remove = doc.createElement('button');
      remove.type = 'button';
      remove.className = 'tag__remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove the tag ${tag} from ${recipe.name}`);
      remove.addEventListener('click', () => commitRecipes(removeTag(recipes(), recipe.id, tag)));
      item.append(remove);
    }

    return item;
  }

  function tagList(recipe, reading) {
    const list = doc.createElement('ul');
    list.className = 'recipe__tags';
    list.append(...tagsOf(recipe).map((tag) => tagChip(recipe, tag, reading)));
    return list;
  }

  function tagComposer(recipe) {
    const composer = doc.createElement('form');
    composer.className = 'tag-composer';

    const tagBox = doc.createElement('input');
    tagBox.type = 'text';
    tagBox.className = 'tag-composer__box';
    tagBox.id = `tag-box-${recipe.id}`;
    tagBox.placeholder = 'Find it by?';
    tagBox.autocomplete = 'off';
    tagBox.setAttribute('aria-label', `New tag for ${recipe.name}`);

    const add = doc.createElement('button');
    add.type = 'submit';
    add.className = 'tag-composer__add';
    add.textContent = 'Add';

    composer.addEventListener('submit', (event) => {
      event.preventDefault();
      const next = addTag(recipes(), recipe.id, tagBox.value);
      tagBox.value = '';
      typingIn = 'tag';
      commitRecipes(next);
    });

    composer.append(tagBox, add);
    return composer;
  }

  /**
   * What the model proposed, on offer. Not one of these is a tag: a wrong tag
   * nobody approved makes the filter lie quietly, and there is no undo anywhere
   * in this app. See specs/features/suggesting/spec.md.
   */
  function suggestions(recipe) {
    const panel = doc.createElement('div');
    panel.className = 'suggestions';

    for (const word of suggested.words) {
      const take = doc.createElement('button');
      take.type = 'button';
      take.className = 'suggestions__take';
      take.textContent = word;
      take.setAttribute('aria-label', `Tag ${recipe.name} with ${word}`);
      take.addEventListener('click', () => {
        suggested = { ...suggested, words: suggested.words.filter((each) => each !== word) };
        if (suggested.words.length === 0) suggested = null;
        commitRecipes(addTag(recipes(), recipe.id, word));
      });
      panel.append(take);
    }

    const dismiss = doc.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'suggestions__dismiss';
    dismiss.textContent = 'No thanks';
    dismiss.addEventListener('click', () => {
      suggested = null;
      render();
    });
    panel.append(dismiss);

    return panel;
  }

  function tagging(recipe) {
    const section = doc.createElement('div');
    // Deliberately not a `recipe__group`: those two are what a recipe is read
    // by, in the order they are read, and the tagging is neither of them.
    section.className = 'recipe__tagging';

    const heading = doc.createElement('h2');
    heading.className = 'recipe__heading';
    heading.textContent = 'Found by';

    section.append(heading, tagList(recipe, true), tagComposer(recipe));

    // Drawn only where there is a model. A disabled control or a line
    // explaining what this browser cannot do would be permanent furniture
    // advertising an absence — see specs/setup/constraints.md.
    if (hasModel()) {
      const ask = doc.createElement('button');
      ask.type = 'button';
      ask.className = 'tagging__suggest';
      ask.textContent = 'Suggest tags';
      ask.addEventListener('click', () => askForTags(recipe.id));
      section.append(ask);
    }

    if (suggested !== null && suggested.recipeId === recipe.id) {
      section.append(suggestions(recipe));
    }

    if (note !== null && (suggested === null || suggested.recipeId === recipe.id)) {
      const line = doc.createElement('p');
      line.className = 'tagging__note';
      line.textContent = note;
      section.append(line);
    }

    return section;
  }

  /**
   * Ask the model, and put what comes back on offer.
   *
   * The only thing in this app that can take a moment, and only when the model
   * has yet to be fetched. Nothing else waits on it: the page is repainted
   * before the question is asked and stays usable while it is out, so a tag can
   * still be typed by hand in the meantime.
   */
  async function askForTags(recipeId) {
    suggested = null;
    note = modelState === 'available' ? null : FETCHING_MODEL;
    render();

    let proposed;
    try {
      proposed = await model.suggestTags(recipes().find((recipe) => recipe.id === recipeId));
    } catch {
      note = SUGGEST_FAILED;
      render();
      return;
    }

    // Re-read: the recipe may have been tagged by hand while the model was out.
    const current = recipes().find((recipe) => recipe.id === recipeId);
    if (!current) return;

    const words = usableSuggestions(proposed, tagsOf(current));
    suggested = words.length > 0 ? { recipeId, words } : null;
    note = words.length > 0 ? null : NO_SUGGESTIONS;
    modelState = 'available';
    render();
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
      // What was proposed was proposed for the recipe being left.
      suggested = null;
      note = null;
      render();
    });

    main.append(name, deleteButton('recipe', recipe.id, recipe.name));
    item.append(main);

    // On a closed recipe the tags are all there is beyond the name, and only
    // when there are any — an untagged recipe is still just its name.
    if (!reading && tagsOf(recipe).length > 0) item.append(tagList(recipe, false));

    if (reading) {
      const body = doc.createElement('div');
      body.className = 'recipe__body';
      body.append(tagging(recipe), ...GROUPS.map((spec) => group(recipe, spec)));
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
      stopLooking();
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
      stopLooking();
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
        stopLooking();
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
      stopLooking();
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
            stopLooking();
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

  // ---- the tag box ---------------------------------------------------------
  //
  // Picked from rather than typed into: at the fridge there is no recipe in
  // mind, so there is nothing to remember and nothing to type. The offer is the
  // list of doors. See specs/features/finding/spec.md.

  function tagButton(className, tag, label, onClick) {
    const item = doc.createElement('li');
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = tag;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', onClick);
    item.append(button);
    return item;
  }

  const pick = (tag) => {
    if (!picked.includes(tag)) picked = [...picked, tag];
    term = '';
    related = [];
    termEl.value = '';
    // Two ways of looking at once would need the screen to say which of them is
    // narrowing, and this app has one page.
    stopFinding();
    render();
  };

  function renderTagBox() {
    const inUse = tagsInUse(store.books);

    // Nothing tagged anywhere means nothing to pick from, and a picker with
    // nothing in it is furniture. Anything picked is picked no longer.
    if (inUse.length === 0) {
      if (filtering() || term !== '') stopFiltering();
      tagBoxEl.hidden = true;
      pickedEl.replaceChildren();
      offerEl.replaceChildren();
      relatedEl.hidden = true;
      return;
    }

    tagBoxEl.hidden = false;

    pickedEl.replaceChildren(
      ...picked.map((tag) =>
        tagButton('tag-picked', tag, `Stop filtering by ${tag}`, () => {
          picked = picked.filter((each) => each !== tag);
          render();
        }),
      ),
    );

    const offered = offerTags(
      inUse.filter((tag) => !picked.includes(tag)),
      term,
    );
    offerEl.replaceChildren(
      ...offered.map((tag) => tagButton('tag-offer', tag, `Filter by ${tag}`, () => pick(tag))),
    );

    const alsoRelated = related.filter((tag) => !offered.includes(tag) && !picked.includes(tag));
    relatedEl.hidden = alsoRelated.length === 0;
    relatedListEl.replaceChildren(
      ...alsoRelated.map((tag) =>
        tagButton('tag-related', tag, `Filter by ${tag}`, () => pick(tag)),
      ),
    );
  }

  function render() {
    renderMenu();
    renderTagBox();

    const found = searching()
      ? findRecipes(store.books, finding)
      : filterByTags(store.books, picked);
    contentsEl.hidden = looking();
    resultsEl.hidden = !looking();

    contentsEl.replaceChildren(...recipes().map(row));
    resultsEl.replaceChildren(...found.map(resultRow));

    // One message, three things it can say. Neither way of looking says
    // anything about the book when it finds nothing — the book is not empty and
    // has not been touched.
    emptyEl.textContent = searching() ? NO_MATCHES : filtering() ? NO_CARRIERS : NO_RECIPES;
    emptyEl.hidden = looking() ? found.length > 0 : recipes().length > 0;

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
    // Only a real search puts the picked tags away. Emptying the box is leaving
    // a search, not starting one, and it must not throw away a filter as well.
    if (finding.trim() !== '') stopFiltering();
    render();
  });

  // The letters answer first and are never held back. A related word arrives
  // underneath them if and when it does, so a slow model costs nothing and a
  // browser without one shows the same box with one group missing.
  termEl.addEventListener('input', () => {
    term = termEl.value;
    related = [];
    render();
    askRelated(term);
  });

  async function askRelated(asked) {
    if (!hasModel() || asked.trim() === '') return;
    const inUse = tagsInUse(store.books);
    let proposed;
    try {
      proposed = await model.relate(asked, inUse);
    } catch {
      return;
    }
    // The box may have moved on while the model was out; that answer is stale.
    if (term !== asked) return;
    related = usableRelated(proposed, inUse, offerTags(inUse, asked));
    render();
  }

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
    stopLooking();
    // Cleared either way: what did not become a recipe was whitespace, and the
    // box has to be ready for the next one without a decision.
    box.value = '';
    commitRecipes(next);
  });

  // What the browser can do is asked once, and the answer only ever adds a
  // control. Anything going wrong leaves the app exactly as it is in a browser
  // with no model at all, which is the app most people open.
  if (model !== null) {
    model
      .availability()
      .then((state) => {
        modelState = state;
        render();
      })
      .catch(() => {});
  }

  render();
}
