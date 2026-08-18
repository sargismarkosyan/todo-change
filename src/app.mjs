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
  setSuggestions,
  switchTo,
  withOpenRecipes,
} from './books.mjs';
import { isEmptyDraft, usableDraft } from './suggesting.mjs';
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
 * What the line in the masthead can say. It answers one question — *would
 * waiting change this?* — and says nothing at all when the answer is no,
 * because there is no model or because the AI is off.
 */
const AI_DOWNLOADING = 'Downloading AI';
const AI_READY = 'AI ready';
const AI_UNAVAILABLE = 'AI unavailable';

/** The two ways a draft comes to nothing. Neither changes the recipe. */
const NOTHING_DRAFTED = 'Nothing drafted.';
const DRAFT_FAILED = 'The draft could not be written.';

/**
 * Running the model is the second slow thing, and the one that happens every
 * time — inference takes seconds even on a model already on the machine. The
 * message says what is happening *and* that nothing is blocked, because a
 * person who does not know that will sit and wait.
 */
const DRAFTING_NOW = 'Writing a draft. Nothing else has to wait.';

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
  const statusEl = doc.getElementById('ai-status');
  const settingsEl = doc.getElementById('settings');
  const settingsOpenEl = doc.getElementById('settings-open');
  const settingsMenuEl = doc.getElementById('settings-menu');
  const askEl = doc.getElementById('offer');
  const askYesEl = doc.getElementById('offer-yes');
  const askNoEl = doc.getElementById('offer-no');

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

  // What the browser can do, once it has said, and whether it has been told to.
  // Two different things: a machine that could run a model is not the same as
  // one that has been asked. See specs/features/suggesting/spec.md.
  let modelState = 'unavailable';
  const couldRunAi = () => model !== null && modelState !== 'unavailable';
  const aiIsOn = () => couldRunAi() && store.suggestions === 'on';

  // Where a fetch has got to. Screen state: the model belongs to the browser,
  // so none of this is worth writing down.
  let aiStatus = null;
  let progress = null;

  // The settings popover, in the colophon at the foot of the page.
  let aiMenu = false;

  // What the model proposed for one recipe, and the one line under the control.
  // **Not one word of a draft is stored** — it is on screen and nowhere else,
  // exactly like which recipe is open.
  let drafted = null;
  let note = null;

  // Which recipe the model is currently writing for, if any. Screen state, and
  // the reason the control cannot be pressed twice: a second press would be a
  // second session and a second answer nobody asked for.
  let thinking = null;

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

  /**
   * One proposed line. Dashed all through, because it is not a line yet — a
   * wrong quantity is not a wrong word, and there is no undo anywhere here.
   */
  function proposalRow(recipe, group, text) {
    const item = doc.createElement('li');
    item.className = 'proposal';

    const take = doc.createElement('button');
    take.type = 'button';
    take.className = 'proposal__take';
    take.textContent = text;
    take.setAttribute('aria-label', `Add ${text} to ${recipe.name}`);
    take.addEventListener('click', () => {
      // Taken out of the draft first, so the same line cannot be added twice
      // by a second click before the repaint lands.
      drafted = {
        ...drafted,
        [group]: drafted[group].filter((each) => each !== text),
      };
      typingIn = null;
      commitRecipes(ADD_LINE[group](recipes(), recipe.id, text));
    });

    item.append(take);
    return item;
  }

  /** The proposals for one group, or nothing when there are none. */
  function proposals(recipe, spec) {
    if (drafted === null || drafted.recipeId !== recipe.id) return null;
    const lines = drafted[spec.key];
    if (lines.length === 0) return null;

    const list = doc.createElement('ul');
    list.className = `proposals proposals--${spec.key}`;
    list.append(...lines.map((text) => proposalRow(recipe, spec.key, text)));
    return list;
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

    section.append(heading, lines);
    const proposed = proposals(recipe, spec);
    if (proposed !== null) section.append(proposed);
    section.append(lineComposer(recipe, spec));
    return section;
  }

  // ---- the draft -----------------------------------------------------------
  //
  // One press proposes the whole card — what it takes and how it is made — and
  // writes down neither. See specs/features/suggesting/spec.md.

  function drafting(recipe) {
    const bar = doc.createElement('div');
    bar.className = 'drafting';

    const working = thinking === recipe.id;

    const ask = doc.createElement('button');
    ask.type = 'button';
    ask.className = 'drafting__ask';
    ask.textContent = working ? 'Drafting…' : 'Draft this recipe';
    ask.disabled = working;
    ask.addEventListener('click', () => askForDraft(recipe.id));
    bar.append(ask);

    if (!working && drafted !== null && drafted.recipeId === recipe.id) {
      const drop = doc.createElement('button');
      drop.type = 'button';
      drop.className = 'drafting__dismiss';
      drop.textContent = 'No thanks';
      drop.addEventListener('click', () => {
        drafted = null;
        render();
      });
      bar.append(drop);
    }

    if (note !== null) {
      const line = doc.createElement('p');
      line.className = 'drafting__note';
      line.textContent = note;
      bar.append(line);
    }

    return bar;
  }

  /**
   * Ask the model for a draft, and put what comes back on offer.
   *
   * Nothing on the page waits on it: the repaint happens before the question is
   * asked, and the recipe stays writable by hand while it is out.
   */
  async function askForDraft(recipeId) {
    // One at a time. The control is disabled while it works, and this is the
    // guard behind that for anything that reaches here another way.
    if (thinking !== null) return;

    drafted = null;
    note = DRAFTING_NOW;
    thinking = recipeId;
    render();

    let proposed;
    try {
      proposed = await model.draft(recipes().find((recipe) => recipe.id === recipeId));
    } catch {
      thinking = null;
      note = DRAFT_FAILED;
      render();
      return;
    }
    thinking = null;

    // Re-read: the recipe may have been typed into, deleted, or the AI switched
    // off entirely while the model was out.
    const current = recipes().find((recipe) => recipe.id === recipeId);
    if (!current || !aiIsOn()) {
      note = null;
      render();
      return;
    }

    const draft = usableDraft(proposed, current);
    drafted = isEmptyDraft(draft) ? null : { recipeId, ...draft };
    note = isEmptyDraft(draft) ? NOTHING_DRAFTED : null;
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
      // What was drafted was drafted for the recipe being left.
      drafted = null;
      note = null;
      render();
    });

    main.append(name, deleteButton('recipe', recipe.id, recipe.name));
    item.append(main);

    if (reading) {
      const body = doc.createElement('div');
      body.className = 'recipe__body';
      // Drawn only where there is a model and it has been turned on. A disabled
      // control advertising an absence is worse than nothing.
      if (aiIsOn()) body.append(drafting(recipe));
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

  // ---- the AI: where it stands, and whether it is wanted -------------------

  /** The indicator's words, or null when there is nothing worth saying. */
  function statusText() {
    if (!aiIsOn() || aiStatus === null) return null;
    if (aiStatus === 'ready') return AI_READY;
    if (aiStatus === 'unavailable') return AI_UNAVAILABLE;
    return progress === null
      ? AI_DOWNLOADING
      : `${AI_DOWNLOADING} ${Math.round(progress * 100)}%`;
  }

  /**
   * Fetch the model, reporting how far along it is.
   *
   * Only ever from a press — `create()` needs recent user activation when a
   * download is involved, which is why the offer is the mechanism rather than
   * the manners.
   */
  async function fetchAi() {
    if (modelState === 'available') {
      aiStatus = 'ready';
      render();
      return;
    }
    aiStatus = 'downloading';
    progress = null;
    render();
    try {
      await model.prepare((loaded) => {
        progress = loaded;
        render();
      });
      modelState = 'available';
      aiStatus = 'ready';
      progress = null;
    } catch {
      // A fetch that fails and says nothing is the thing this removes.
      aiStatus = 'unavailable';
    }
    render();
  }

  /** Turning it on is a press, so it is also the activation the fetch needs. */
  function turnAiOn() {
    aiMenu = false;
    commit(setSuggestions(store, 'on'));
    fetchAi();
  }

  function turnAiOff() {
    aiMenu = false;
    aiStatus = null;
    progress = null;
    drafted = null;
    note = null;
    thinking = null;
    commit(setSuggestions(store, 'off'));
  }

  function aiSettings() {
    const panel = doc.createElement('div');
    panel.className = 'colophon__panel';

    const on = store.suggestions === 'on';
    panel.append(
      menuButton('colophon__toggle', on ? 'Turn the AI off' : 'Turn the AI on', () =>
        on ? turnAiOff() : turnAiOn(),
      ),
    );

    // Two lines. A third means this has become the settings screen persona.md
    // rules out, and the argument in spec 0009 was wrong.
    const line = doc.createElement('p');
    line.className = 'colophon__note';
    line.textContent = 'It runs on this machine. Nothing leaves it.';
    panel.append(line);

    return panel;
  }

  /**
   * Where the AI stands, and the switch for it — two things, drawn apart.
   *
   * The status is a readout and sits in the masthead: read at a glance, never
   * pressed. The switch is a control and sits in the colophon at the foot:
   * pressed twice ever, never read. Position follows how often a thing is used,
   * which is why the header corner is the book's alone.
   */
  function renderAi() {
    const status = statusText();
    statusEl.hidden = status === null;
    statusEl.textContent = status ?? '';

    settingsEl.hidden = !couldRunAi();
    if (!couldRunAi()) {
      settingsMenuEl.replaceChildren();
      settingsMenuEl.hidden = true;
      return;
    }

    settingsOpenEl.setAttribute('aria-expanded', String(aiMenu));
    settingsMenuEl.hidden = !aiMenu;
    settingsMenuEl.replaceChildren(...(aiMenu ? [aiSettings()] : []));
  }

  /**
   * The one question, asked once, and only where there is a recipe to fill in.
   * Offering to draft before there is anything to draft is a question with no
   * reason behind it yet.
   */
  const offering = () =>
    couldRunAi() && store.suggestions === 'unasked' && recipes().length > 0;

  function render() {
    renderMenu();
    renderAi();
    askEl.hidden = !offering();

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
    // Two popovers now, and never both at once.
    aiMenu = false;
    menu = menu.open ? { open: false, mode: 'list' } : { open: true, mode: 'list' };
    render();
  });

  settingsOpenEl.addEventListener('click', () => {
    shutMenu();
    aiMenu = !aiMenu;
    render();
  });

  // Accepting is the press the fetch needs, not a formality: a download cannot
  // begin without recent user activation.
  askYesEl.addEventListener('click', turnAiOn);

  // Off, and off the page: no indicator, no control on a recipe.
  askNoEl.addEventListener('click', () => commit(setSuggestions(store, 'off')));

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
      if (menu.open && !booksEl.contains(event.target)) {
        shutMenu();
        renderMenu();
      }
      if (aiMenu && !settingsEl.contains(event.target)) {
        aiMenu = false;
        renderAi();
      }
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

  // What the browser can do is asked once, and the answer only ever adds a
  // control. Anything going wrong leaves the app exactly as it is in a browser
  // with no model at all, which is the app most people open.
  if (model !== null) {
    model
      .availability()
      .then((state) => {
        modelState = state;
        // A choice already made is reflected, never acted on: starting a fetch
        // needs a press, and there has not been one yet this visit.
        if (store.suggestions === 'on') {
          if (state === 'available') aiStatus = 'ready';
          else if (state === 'downloading') aiStatus = 'downloading';
        }
        render();
      })
      .catch(() => {});
  }

  render();
}
