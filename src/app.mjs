// The DOM layer: rendering and events, and nothing else.
//
// Everything it needs to decide anything lives in recipes.mjs, books.mjs and
// storage.mjs, none of which knows a document exists. Keeping this layer thin is
// what makes the rest directly testable. See specs/setup/constraints.md.

import {
  addIngredient,
  addRecipe,
  addStep,
  linesOf,
  makeLine,
  newId,
  removeFrom,
  setGroup,
} from './recipes.mjs';
import { findRecipes } from './finding.mjs';
import { HOME, addressOf, dayOf, picksForDay, routeOf } from './home.mjs';
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
// The one library this app ships. Vendored, not installed — see
// vendor/sortable/README.md and specs/setup/constraints.md.
import Sortable from '../vendor/sortable/sortable.core.esm.js';

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
 * The third thing that element can say, and the only one about the app rather
 * than about a book: the front door of a shelf with nothing on it. Whoever
 * reads this has never written a recipe down, so it must not talk about "this
 * book" — they have not chosen one.
 */
const NOTHING_YET = 'Nothing written down yet.';

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
export function mountApp(doc, storage, model = null, now = () => new Date()) {
  const form = doc.getElementById('composer');
  const box = doc.getElementById('new-recipe');
  const contentsEl = doc.getElementById('contents');
  const resultsEl = doc.getElementById('results');
  const emptyEl = doc.getElementById('empty');
  const findEl = doc.getElementById('find-recipe');
  const picksEl = doc.getElementById('picks');
  const homeEl = doc.querySelector('.app__home');
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

  // ---- where we are --------------------------------------------------------
  //
  // The address is the state, and it is read back rather than kept: Back,
  // Forward and anybody typing in the bar all change it without asking this app
  // first. See specs/features/home/spec.md.

  const view = () => doc.defaultView;
  const route = () => routeOf(view().location.hash, store.books);
  const atHome = () => route().at === 'home';

  /**
   * Put the open book in step with the address, without writing anything.
   *
   * A route change is not an action — it says where the reader is looking, the
   * same as which recipe is open — so it moves `openId` in memory and leaves the
   * write to the next real change. Opening the app would otherwise write to
   * storage before anybody had done anything, which nothing in here has ever
   * done. See specs/features/storage/spec.md.
   */
  const followRoute = () => {
    const { at, id } = route();
    if (at === 'book' && id !== store.openId) store = switchTo(store, id);
  };

  /** Go somewhere, and draw what is there. */
  const goTo = (address) => {
    view().location.hash = address;
    render();
  };

  /**
   * Go into a book: the address changes, and the stored open book keeps up.
   *
   * The write is the one that switching books has always done. What is new is
   * only that the address goes with it, so a reload lands here again.
   */
  const goToBook = (id) => {
    store = switchTo(store, id);
    writeStore(storage, store);
    goTo(addressOf(id));
  };

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

  // Which grip to put focus back on after a repaint. Screen state: where a hand
  // is, not what anybody owns.
  let focusedHandle = null;

  // The Sortable instances currently attached, one per group on screen. They
  // are thrown away and remade on every repaint, because render() rebuilds the
  // lists and the elements they were watching no longer exist.
  let sorting = [];

  // The lists built during a repaint, waiting to be handed over once it lands.
  let sortable = [];

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
    const moved = next.openId !== store.openId;
    store = next;
    writeStore(storage, store);
    // The address always names the book on screen, so an action that moves the
    // open book takes the address with it: making a book opens it, and deleting
    // one opens its neighbour. Without this the next repaint would read the old
    // address back and undo the move.
    if (moved) view().location.hash = addressOf(store.openId);
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

  // ---- one list, lines and proposals together ------------------------------
  //
  // A group on screen is a single ordered list: the lines the recipe holds and
  // the ones being proposed, in one run of numbers. The list *is* the view —
  // what is drawn, what the numbers count, and what accepting reads a position
  // out of. See specs/features/suggesting/placing-a-draft.feature.

  const isDrafting = (recipe) => drafted !== null && drafted.recipeId === recipe.id;

  /**
   * The entries of one group, reconciled against what is actually stored.
   *
   * A line typed by hand while a draft is on screen is not in the draft's list,
   * so it joins at the bottom — which is where typing lands anyway. A line
   * deleted while a draft is up drops out.
   */
  function entriesOf(recipe, spec) {
    const lines = linesOf(recipe, spec.key);
    if (!isDrafting(recipe)) return lines.map((line) => ({ kind: 'line', id: line.id }));

    const held = new Set(lines.map((line) => line.id));
    const kept = drafted[spec.key].filter(
      (entry) => entry.kind === 'proposal' || held.has(entry.id),
    );
    const mentioned = new Set(kept.filter((entry) => entry.kind === 'line').map((e) => e.id));
    const missing = lines
      .filter((line) => !mentioned.has(line.id))
      .map((line) => ({ kind: 'line', id: line.id }));
    return [...kept, ...missing];
  }

  /** The stored group implied by a list of entries, in the order they sit. */
  const linesFrom = (entries, lines) => {
    const byId = new Map(lines.map((line) => [line.id, line]));
    return entries
      .filter((entry) => entry.kind === 'line')
      .map((entry) => byId.get(entry.id))
      .filter((line) => line !== undefined);
  };

  /** Put `entries` back on the draft, when one is on screen for this recipe. */
  const withEntries = (recipe, spec, entries) => {
    if (isDrafting(recipe)) drafted = { ...drafted, [spec.key]: entries };
  };

  /**
   * Take some proposals into the recipe, each where it sits.
   *
   * One path for taking one and for taking the lot: a proposal becomes a line
   * in place, and the group is rewritten in the order the view already shows.
   */
  function accept(recipe, spec, wanted) {
    const lines = linesOf(recipe, spec.key);
    const byId = new Map(lines.map((line) => [line.id, line]));
    const next = [];
    const entries = [];

    for (const entry of entriesOf(recipe, spec)) {
      if (entry.kind === 'line') {
        const line = byId.get(entry.id);
        if (line) {
          next.push(line);
          entries.push(entry);
        }
        continue;
      }
      if (!wanted.has(entry)) {
        entries.push(entry);
        continue;
      }
      const made = makeLine(entry.text);
      next.push(made);
      entries.push({ kind: 'line', id: made.id });
    }

    withEntries(recipe, spec, entries);
    return setGroup(recipes(), recipe.id, spec.key, next);
  }

  /**
   * Put a group into a new order.
   *
   * The one place an order changes, whichever hand did it. Storage takes the
   * line order out of the new view, so moving a proposal writes nothing at all:
   * no line changed places.
   */
  const reorder = (recipe, spec, next, focus) => {
    focusedHandle = focus;
    typingIn = null;
    withEntries(recipe, spec, next);
    commitRecipes(
      setGroup(recipes(), recipe.id, spec.key, linesFrom(next, linesOf(recipe, spec.key))),
    );
  };

  /** Move one entry to sit at a position, which is what a dropped row gives. */
  const moveTo = (recipe, spec, from, to) => {
    const entries = entriesOf(recipe, spec);
    const moved = entries[from];
    if (!moved || from === to) return;
    const rest = entries.filter((entry, at) => at !== from);
    reorder(recipe, spec, [...rest.slice(0, to), moved, ...rest.slice(to)], moved.id);
  };

  /**
   * What a line is taken hold of by. One control, two ways to use it: dragged
   * with a pointer, or focused and moved with the arrow keys. Arrows sitting
   * beside a drag handle would be two controls doing one job.
   */
  function handle(recipe, spec, id, label) {
    const grip = doc.createElement('button');
    grip.type = 'button';
    grip.className = 'line-handle';
    grip.dataset.handle = id;
    grip.setAttribute('aria-label', `Move ${label}`);

    const dots = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dots.setAttribute('viewBox', '0 0 10 16');
    dots.setAttribute('aria-hidden', 'true');
    dots.setAttribute('focusable', 'false');
    dots.setAttribute('fill', 'currentColor');
    for (const [cx, cy] of [[3, 4], [7, 4], [3, 8], [7, 8], [3, 12], [7, 12]]) {
      const dot = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', String(cx));
      dot.setAttribute('cy', String(cy));
      dot.setAttribute('r', '1.1');
      dots.append(dot);
    }
    grip.append(dots);

    grip.addEventListener('keydown', (event) => {
      const step = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
      if (step === 0) return;
      event.preventDefault();
      const entries = entriesOf(recipe, spec);
      const from = entries.findIndex((entry) => entry.id === id);
      // The ends hold: nothing above the first, nothing below the last.
      if (entries[from + step] === undefined) return;
      moveTo(recipe, spec, from, from + step);
    });

    return grip;
  }

  /**
   * The shell every row in a group shares — a line's and a proposal's alike,
   * because both are moved the same way and both sit in the same numbering.
   *
   * It carries no drag handling of its own. That belongs to SortableJS now,
   * which is attached to the list rather than to each row; all a row owes it is
   * an id to be identified by afterwards.
   */
  function rowFrame(recipe, spec, id, className) {
    const item = doc.createElement('li');
    item.className = className;
    item.dataset.id = id;
    return item;
  }

  function lineRow(recipe, spec, line) {
    const item = rowFrame(recipe, spec, line.id, spec.block);

    const text = doc.createElement('span');
    text.className = `${spec.block}__text`;
    text.textContent = line.text;

    item.append(
      handle(recipe, spec, line.id, line.text),
      text,
      deleteButton(spec.block, line.id, line.text),
    );
    return item;
  }

  /**
   * One proposed line, sitting in the list where it belongs.
   *
   * Dashed all through, because it is on the page and not in the book — a wrong
   * quantity is not a wrong word, and there is no undo anywhere here. It is
   * moved like any other row and takes its place in the numbering, which is the
   * whole point: the group reads as it would read if the draft were taken.
   */
  function proposalRow(recipe, spec, entry) {
    const item = rowFrame(recipe, spec, entry.id, `${spec.block} proposal`);

    const take = doc.createElement('button');
    take.type = 'button';
    take.className = 'proposal__take';
    take.textContent = entry.text;
    take.setAttribute('aria-label', `Add ${entry.text} to ${recipe.name}`);
    take.addEventListener('click', () => {
      typingIn = null;
      commitRecipes(accept(recipe, spec, new Set([entry])));
    });

    item.append(handle(recipe, spec, entry.id, entry.text), take);
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

    const held = new Map(linesOf(recipe, spec.key).map((line) => [line.id, line]));
    const lines = doc.createElement('ul');
    lines.className = `recipe__${spec.key}-lines`;
    // Picked up after the repaint, when this list is actually in the document.
    sortable.push({ list: lines, recipe, spec });
    lines.append(
      ...entriesOf(recipe, spec).map((entry) =>
        entry.kind === 'line'
          ? lineRow(recipe, spec, held.get(entry.id))
          : proposalRow(recipe, spec, entry),
      ),
    );

    section.append(heading, lines, lineComposer(recipe, spec));
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

    if (!working && isDrafting(recipe)) {
      // Taking the lot is the press to be honest about: per-line acceptance is
      // what keeps an unread quantity out of the book, and this is the way
      // round it. A second control, never the default.
      const all = doc.createElement('button');
      all.type = 'button';
      all.className = 'drafting__take-all';
      all.textContent = 'Take all';
      all.addEventListener('click', () => {
        typingIn = null;
        let next = recipes();
        for (const spec of GROUPS) {
          const wanted = new Set(
            entriesOf(recipe, spec).filter((entry) => entry.kind === 'proposal'),
          );
          const taken = accept(recipe, spec, wanted).find((each) => each.id === recipe.id);
          // Each group folds onto the last, so the whole draft is one write.
          next = setGroup(next, recipe.id, spec.key, linesOf(taken, spec.key));
        }
        commitRecipes(next);
      });

      const drop = doc.createElement('button');
      drop.type = 'button';
      drop.className = 'drafting__dismiss';
      drop.textContent = 'No thanks';
      drop.addEventListener('click', () => {
        drafted = null;
        render();
      });
      bar.append(all, drop);
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

    const draft = usableDraft(proposed, current, newId);
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
      goToBook(book.id);
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
      goToBook(book.id);
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
    // The masthead says which book is open; now that a book has an address, the
    // control that names it carries the id that address is built from.
    openEl.dataset.book = openBook(store).id;
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

    // At the front door the menu is the way into a book and nothing more.
    // Making, renaming and deleting are about the book on screen, and at the
    // front door there is not one — see specs/features/home/spec.md.
    if (atHome()) {
      menuEl.replaceChildren(list);
      return;
    }

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
    couldRunAi() && store.suggestions === 'unasked' && !atHome() && recipes().length > 0;

  /**
   * Hand the lists on screen to SortableJS, and take back what it did.
   *
   * Remade on every repaint rather than kept: `render()` rebuilds each list with
   * `replaceChildren`, so an instance from last time is watching elements that
   * are no longer in the document. Destroying first is what stops two of them
   * fighting over one row.
   *
   * The library moves the elements itself and then tells us where the row came
   * from and went to; the app puts its own state right and repaints, which is
   * what makes the DOM and the state agree again.
   *
   * A group name of its own per recipe and per group is what keeps an
   * ingredient out of the method: there is no other list to drop into.
   */
  function renderSorting() {
    for (const instance of sorting) instance.destroy();
    sorting = sortable.map(({ list, recipe, spec }) =>
      Sortable.create(list, {
        // The grip and nothing else. The words belong to a click.
        handle: '.line-handle',
        group: `${recipe.id}:${spec.key}`,
        animation: quiet() ? 0 : 150,
        ghostClass: 'line--landing',
        chosenClass: 'line--held',
        fallbackClass: 'line--moving',
        // Sortable's own pointer dragging rather than the browser's native
        // drag-and-drop. Native never starts here: the grip is a <button>, and
        // a browser will not begin a drag from a control that handles its own
        // press. It also puts the moving row back under our styling instead of
        // the browser's translucent snapshot — see specs/features/look/spec.md.
        forceFallback: true,
        // A press is a press until it has travelled. Without this a slow click
        // on the grip reads as a tiny drag.
        fallbackTolerance: 4,
        onEnd: (event) => moveTo(recipe, spec, event.oldIndex, event.newIndex),
      }),
    );
    sortable = [];
  }

  /** Whether the machine has asked for less movement. */
  const quiet = () =>
    doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  function render() {
    followRoute();
    const home = atHome();

    sortable = [];
    renderMenu();
    renderAi();
    askEl.hidden = !offering();

    const found = searching() ? findRecipes(store.books, finding) : [];
    // Worked out from the day, so the same three hold still through every
    // repaint — and this repaints on each letter typed into the search box.
    const picks = home && !searching() ? picksForDay(store.books, dayOf(now())) : [];

    // The box writes into the open book, and the home is not in one. What is on
    // screen there comes from every book at once, so there is no book for a name
    // typed at the front door to belong to — see specs/features/home/spec.md.
    form.hidden = home;
    contentsEl.hidden = home || searching();
    picksEl.hidden = !home || searching();
    resultsEl.hidden = !searching();

    contentsEl.replaceChildren(...(home ? [] : recipes().map(row)));
    // A pick is the shape of a result, so the same row draws it: a name, the
    // book it is in, and a way to get there.
    picksEl.replaceChildren(...picks.map(resultRow));
    resultsEl.replaceChildren(...found.map(resultRow));

    // One message, three things it can say, and the wrong one is worse than
    // none. A search that found nothing says so about the search, never about
    // the book — the book is not empty and has not been touched. The front door
    // of an app with nothing in it talks about neither.
    if (searching()) {
      emptyEl.textContent = NO_MATCHES;
      emptyEl.hidden = found.length > 0;
    } else if (home) {
      emptyEl.textContent = NOTHING_YET;
      emptyEl.hidden = picks.length > 0;
    } else {
      emptyEl.textContent = NO_RECIPES;
      emptyEl.hidden = recipes().length > 0;
    }

    // The repaint threw away the box that had the caret in it. Put it back, so
    // typing out six ingredients costs six lines of typing and nothing else.
    if (typingIn !== null) doc.getElementById(`${typingIn}-box-${readingId}`)?.focus();
    // The repaint threw away the handle that was moving a line. Put the focus
    // back on it, so it can be pressed again without being found again.
    if (focusedHandle !== null) {
      doc.querySelector(`[data-handle="${focusedHandle}"]`)?.focus();
      focusedHandle = null;
    }

    renderSorting();
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

  // The way out of a book, and the only navigation this version adds: the cover
  // goes back to the front door. It is a real link, so it can be opened in a
  // tab and reached by keyboard, and the press is handled here so the page is
  // drawn now rather than when the browser gets round to `hashchange`.
  homeEl.addEventListener('click', (event) => {
    event.preventDefault();
    readingId = null;
    stopFinding();
    goTo(HOME);
  });

  // Back, Forward, and anybody editing the address by hand. The app is not told
  // about any of them, so it reads where it is and draws that.
  view().addEventListener('hashchange', () => render());

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
