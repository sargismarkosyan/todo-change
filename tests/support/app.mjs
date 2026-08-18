// Opens the real app in jsdom and reads it back in the vocabulary the Gherkin
// uses: the contents, a recipe, its ingredients, its method, the open book.
//
// Tests drive this rather than the modules directly, so that a rule about what
// Nell sees is checked against what is actually on screen. index.html and
// styles.css are the real files — a test asking whether anything on screen
// offers a tick box is asking the same page the browser gets.

import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { mountApp } from '../../src/app.mjs';
import { LEGACY_KEY, NOTEPADS_KEY, STORAGE_KEY } from '../../src/storage.mjs';

const HTML = readFileSync('index.html', 'utf8');
const CSS = readFileSync('src/styles.css', 'utf8');

// jsdom does not fetch subresources, so the stylesheet is inlined; and the
// module script is dropped because each test mounts the app itself.
const PAGE = HTML.replace(
  '<link rel="stylesheet" href="src/styles.css">',
  `<style>${CSS}</style>`,
).replace(/<script type="module">[\s\S]*?<\/script>/, '');

/**
 * A fresh browser with a fresh store, holding nothing at all.
 *
 * `model` stands in for the browser's own, and is null by default because that
 * is what most browsers have. jsdom has none of any kind, and no rule asserts
 * what a model says — see specs/features/suggesting/spec.md.
 */
export const openApp = (model = null) => open({}, model);

/** The same, with the current key already holding `books`. */
export const openStore = (books, model = null) => open({ [STORAGE_KEY]: books }, model);

/** The same, seeded with the key version 0003 wrote. */
export const openNotepads = (notepads) => open({ [NOTEPADS_KEY]: notepads });

/** The same, seeded with the bare array every version before that wrote. */
export const openLegacy = (todos) => open({ [LEGACY_KEY]: todos });

/** For the cases that care about more than one key being there at once. */
export const openWith = (seed) => open(seed);

function open(seed, model = null) {
  const dom = new JSDOM(PAGE, { url: 'http://localhost/' });
  const { window } = dom;
  const doc = window.document;

  for (const [key, value] of Object.entries(seed)) {
    if (value !== undefined && value !== null) window.localStorage.setItem(key, value);
  }
  mountApp(doc, window.localStorage, model);

  const recipeEls = () => [...doc.querySelectorAll('.recipe')];
  const nameEl = (el) => el.querySelector(':scope > .recipe__row > .recipe__name');
  const contents = () => recipeEls().map((el) => nameEl(el).textContent);

  const recipe = (name) => {
    const found = recipeEls().find((el) => nameEl(el).textContent === name);
    if (!found) {
      throw new Error(
        `no recipe called "${name}" — the contents reads: ${contents().join(', ')}`,
      );
    }
    return found;
  };

  const isOpen = (name) => recipe(name).classList.contains('recipe--open');
  const groupEl = (name, group) => recipe(name).querySelector(`.recipe__${group}-lines`);
  const rows = (name, group) =>
    groupEl(name, group) === null ? [] : [...groupEl(name, group).children];

  /** What the recipe actually holds — proposals are on the page, not in it. */
  const lines = (name, group) =>
    rows(name, group)
      .filter((el) => !el.classList.contains('proposal'))
      .map((el) => el.querySelector('[class$="__text"]').textContent);

  /** Every row of either group on screen, line or proposal alike. */
  const lineEls = () => [...doc.querySelectorAll('.ingredient, .step')];
  const textOf = (el) =>
    el.querySelector('[class$="__text"]')?.textContent ??
    el.querySelector('.proposal__take')?.textContent ??
    '';
  const line = (text) => {
    const found = lineEls().find((el) => textOf(el) === text);
    if (!found) throw new Error(`nothing on screen reads "${text}"`);
    return found;
  };

  const composer = (name, block) =>
    recipe(name).querySelector(`.${block}-composer`);

  const resultEls = () => [...doc.querySelectorAll('.result')];
  const resultEl = (name) => {
    const found = resultEls().find(
      (el) => el.querySelector('.result__name').textContent === name,
    );
    if (!found) {
      throw new Error(
        `no result called "${name}" — the results read: ` +
          resultEls().map((el) => el.querySelector('.result__name').textContent).join(', '),
      );
    }
    return found;
  };

  const menu = () => doc.getElementById('book-menu');
  const openMenu = () => {
    if (menu().hidden) doc.getElementById('book-open').click();
  };
  const switchControl = (name) => {
    const found = [...menu().querySelectorAll('.books__switch')].find(
      (el) => el.textContent === name,
    );
    if (!found) {
      throw new Error(
        `no book called "${name}" — the menu reads: ` +
          [...menu().querySelectorAll('.books__switch')].map((el) => el.textContent).join(', '),
      );
    }
    return found;
  };

  return {
    window,
    document: doc,

    // ---- writing a recipe down ------------------------------------------

    /** Type a name into the box and press Enter — the whole of workflow 1. */
    writeDown(name) {
      this.type(name);
      this.submit();
    },
    type(name) {
      doc.getElementById('new-recipe').value = name;
    },
    submit() {
      doc.getElementById('composer').requestSubmit();
    },
    /** What the box currently holds. */
    box: () => doc.getElementById('new-recipe').value,

    /** What the cover says. */
    masthead: () => doc.querySelector('.app__title').textContent,

    /** The recipe names in the open book, top to bottom. */
    contents,

    // ---- reading one -----------------------------------------------------

    /** Click a recipe's name, unless it is already open. */
    openRecipe(name) {
      if (!isOpen(name)) nameEl(recipe(name)).click();
    },
    /** The same click, the other way. */
    closeRecipe(name) {
      if (isOpen(name)) nameEl(recipe(name)).click();
    },
    isOpen,

    /** What an open recipe shows. A closed one shows neither group. */
    ingredients: (name) => lines(name, 'ingredients'),
    method: (name) => lines(name, 'steps'),

    /** Whether the ingredients are drawn above the method, which is the point. */
    ingredientsComeFirst(name) {
      const groups = [...recipe(name).querySelectorAll('.recipe__group')];
      return (
        groups.length === 2 &&
        groups[0].classList.contains('recipe__ingredients') &&
        groups[1].classList.contains('recipe__steps')
      );
    },

    /** Whether anything at all on the page can be ticked. Nothing should be. */
    offersTickBox: () => doc.querySelector('input[type="checkbox"]') !== null,

    /** Whether a step or ingredient offers anything to type under it. */
    offersAnythingUnder(text) {
      const el = line(text);
      return el.querySelector('form') !== null || el.querySelector('input') !== null;
    },

    // ---- filling one in --------------------------------------------------

    addIngredient(name, text) {
      this.submitLine(name, 'ingredient', text);
    },
    addStep(name, text) {
      this.submitLine(name, 'step', text);
    },
    /** Kept separate for the rules about text that is not a line. */
    submitLine(name, block, text) {
      this.openRecipe(name);
      composer(name, block).querySelector(`.${block}-composer__box`).value = text;
      composer(name, block).requestSubmit();
    },

    /** Setup: a recipe that already holds these, left closed as it was found. */
    give(name, block, texts) {
      const wasOpen = isOpen(name);
      for (const text of texts) this.submitLine(name, block, text);
      if (!wasOpen) this.closeRecipe(name);
    },

    // ---- putting a line where it belongs ---------------------------------
    //
    // jsdom does not implement dragging, so these drive the events the app
    // actually listens for. That checks the app's handling and not the
    // browser's gesture — the real-browser pass covers the rest.

    handleOf(text) {
      const grip = line(text).querySelector('.line-handle');
      if (!grip) throw new Error(`"${text}" has no handle`);
      return grip;
    },

    /**
     * Drag one line onto another. `before` says which half of the target row it
     * was dropped on, which is what the app reads out of the pointer position:
     * every rect is zero-sized in jsdom, so a negative clientY is the top half.
     */
    dragOnto(text, targetText, before) {
      this.handleOf(text).dispatchEvent(new window.Event('dragstart', { bubbles: true }));
      const target = line(targetText);
      target.dispatchEvent(new window.MouseEvent('dragover', { bubbles: true, cancelable: true }));
      target.dispatchEvent(
        new window.MouseEvent('drop', {
          bubbles: true,
          cancelable: true,
          clientY: before ? -1 : 1,
        }),
      );
    },

    /** Pick a line up and let go of it over nothing at all. */
    dragAndAbandon(text) {
      const grip = this.handleOf(text);
      grip.dispatchEvent(new window.Event('dragstart', { bubbles: true }));
      grip.dispatchEvent(new window.Event('dragend', { bubbles: true }));
    },

    dragAbove(text, targetText) {
      this.dragOnto(text, targetText, true);
    },
    dragBelow(text, targetText) {
      this.dragOnto(text, targetText, false);
    },

    /** Put focus on a handle, the way tabbing to it does. */
    focusHandle(text) {
      this.handleOf(text).focus();
    },

    /** Press an arrow on whatever handle has focus. */
    pressArrow(key) {
      doc.activeElement.dispatchEvent(
        new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
    },

    /** Whether the handle for this line currently has focus. */
    handleHasFocus(text) {
      return doc.activeElement === line(text).querySelector('.line-handle');
    },

    // ---- throwing things out ---------------------------------------------

    deleteRecipe: (name) => recipe(name).querySelector('.recipe__delete').click(),
    deleteLine: (text) => line(text).querySelector('[class$="__delete"]').click(),

    /** The empty-book message if it is on screen, otherwise null. */
    message() {
      const el = doc.getElementById('empty');
      return window.getComputedStyle(el).display === 'none' ? null : el.textContent;
    },

    // ---- finding one in any book -----------------------------------------

    /** Type into the search box. Live, so there is nothing to submit. */
    search(term) {
      const findBox = doc.getElementById('find-recipe');
      findBox.value = term;
      findBox.dispatchEvent(new window.Event('input', { bubbles: true }));
    },

    /** Empty it again, the way the native clear does. */
    clearSearch() {
      this.search('');
    },

    /** What the search box currently holds. */
    searchBox: () => doc.getElementById('find-recipe').value,

    /**
     * The results, top to bottom, as the Gherkin tables read them: the recipe
     * and the book it is in.
     */
    results: () =>
      resultEls().map((el) => [
        el.querySelector('.result__name').textContent,
        el.querySelector('.result__book').textContent,
      ]),

    /** The line a result matched on, or null when it was the name that matched. */
    resultLine: (name) => resultEl(name).querySelector('.result__line')?.textContent ?? null,

    /** Open one — the book it lives in opens, with the recipe open in it. */
    openResult: (name) => resultEl(name).querySelector('.result__open').click(),

    /** Whether the contents is the thing on screen, or the results are. */
    contentsIsShowing: () => !doc.getElementById('contents').hidden,

    // ---- turning the AI on, and where it stands --------------------------

    /** Whether the one question is on screen. */
    offeredAi: () => !doc.getElementById('offer').hidden,

    /** Say yes. This press is also the activation the fetch needs. */
    acceptOffer() {
      if (!this.offeredAi()) throw new Error('nothing is offering the AI');
      doc.getElementById('offer-yes').click();
    },

    /** Say no. */
    dismissOffer() {
      if (!this.offeredAi()) throw new Error('nothing is offering the AI');
      doc.getElementById('offer-no').click();
    },

    /** The answer that was kept, as it is stored. */
    aiIs: () => JSON.parse(window.localStorage.getItem(STORAGE_KEY)).suggestions,

    /** The readout in the masthead, or null when there is nothing to say. */
    indicator: () =>
      doc.getElementById('ai-status').hidden
        ? null
        : doc.getElementById('ai-status').textContent,

    /** Whether the colophon is on the page — it is not, with no model. */
    hasAiControl: () => !doc.getElementById('settings').hidden,

    openAiSettings() {
      if (!this.hasAiControl()) throw new Error('there is no AI settings control');
      if (doc.getElementById('settings-menu').hidden) {
        doc.getElementById('settings-open').click();
      }
    },

    aiSettingsAreShut: () => doc.getElementById('settings-menu').hidden,

    /** The one switch in there. */
    toggleAi() {
      this.openAiSettings();
      doc.querySelector('.colophon__toggle').click();
    },

    /** How many lines the popover holds — the check that keeps it a popover. */
    aiSettingsLines() {
      this.openAiSettings();
      return doc.getElementById('settings-menu').querySelectorAll('button, p').length;
    },

    /** Whether anything on screen mentions a model at all. */
    mentionsModel: () =>
      doc.querySelector(
        '.drafting, .colophon:not([hidden]), .app__ai:not([hidden])',
      ) !== null,

    // ---- the draft -------------------------------------------------------

    /** Whether an open recipe offers to be drafted. */
    offersDraft: (name) => recipe(name).querySelector('.drafting__ask') !== null,

    /** Press for one. The answer arrives later, so `settle()` follows. */
    askForDraft(name) {
      this.openRecipe(name);
      const control = recipe(name).querySelector('.drafting__ask');
      if (!control) throw new Error(`"${name}" offers no way to ask for a draft`);
      control.click();
    },

    /** What is on offer in a group — not one line of it written down. */
    proposed(group, name = null) {
      const of = name ?? contents()[0];
      return rows(of, group)
        .filter((el) => el.classList.contains('proposal'))
        .map((el) => el.querySelector('.proposal__take').textContent);
    },

    /**
     * A whole group as it reads on screen, saying which rows are written down
     * and which are only proposed — the one list this version is about.
     */
    groupReads(name, group) {
      return rows(name, group).map((el) => [
        textOf(el),
        el.classList.contains('proposal') ? 'proposed' : 'mine',
      ]);
    },

    /** Take the lot in one press. */
    takeWholeDraft: () => doc.querySelector('.drafting__take-all').click(),

    /** Take one line. */
    acceptProposal(text) {
      const found = [...doc.querySelectorAll('.proposal__take')].find(
        (el) => el.textContent === text,
      );
      if (!found) throw new Error(`nothing proposed reads "${text}"`);
      found.click();
    },

    /** Turn the whole draft down. */
    dismissDraft: () => doc.querySelector('.drafting__dismiss').click(),

    /** Whether anything at all is being proposed. */
    hasProposals: () => doc.querySelector('.proposal') !== null,

    /** What the control says right now — it says so while the model writes. */
    draftControl: (name) => recipe(name).querySelector('.drafting__ask')?.textContent ?? null,

    /** Whether it can be pressed. It cannot, while it is already working. */
    draftControlCanBePressed: (name) =>
      recipe(name).querySelector('.drafting__ask')?.disabled === false,

    /** The one line under the control, or null when there is nothing to say. */
    note: () => doc.querySelector('.drafting__note')?.textContent ?? null,

    /** Let anything the model was asked come back. */
    settle: () => new Promise((resolve) => setTimeout(resolve, 0)),

    // ---- what is stored --------------------------------------------------

    /** The raw stored string, exactly as a devtools panel would show it. */
    stored: () => window.localStorage.getItem(STORAGE_KEY),
    storedNotepads: () => window.localStorage.getItem(NOTEPADS_KEY),
    storedLegacy: () => window.localStorage.getItem(LEGACY_KEY),

    /**
     * Close the tab and open it again. A new window, the same stored string —
     * and the same browser, so the model is handed in again.
     */
    reload: (model = null) => openStore(window.localStorage.getItem(STORAGE_KEY), model),

    // ---- books -----------------------------------------------------------
    //
    // Everything below reaches through the menu, because that is where Nell
    // reaches. Reading what books exist opens it, the way looking at them does.

    /** The name of the book on screen, as the header shows it. */
    openBook: () => doc.getElementById('book-open').textContent,

    /** The books in the menu, top to bottom. */
    books() {
      openMenu();
      return [...menu().querySelectorAll('.books__switch')].map((el) => el.textContent);
    },

    /** Switch to another book — one click, once the menu is open. */
    openBookNamed(name) {
      openMenu();
      switchControl(name).click();
    },

    /** Name a new book and press Enter. */
    makeBook(name) {
      openMenu();
      doc.getElementById('new-book').value = name;
      menu().querySelector('.books__new').requestSubmit();
    },

    /** Rename the book on screen. */
    renameBook(name) {
      openMenu();
      menu().querySelector('.books__rename-open').click();
      doc.getElementById('rename-book').value = name;
      menu().querySelector('.books__rename').requestSubmit();
    },

    /** Ask to delete the book on screen. */
    deleteBook() {
      openMenu();
      const control = menu().querySelector('.books__delete');
      if (!control) throw new Error('the menu offers no way to delete this book');
      control.click();
    },

    /** Whether the menu offers a delete at all. */
    offersBookDelete() {
      openMenu();
      return menu().querySelector('.books__delete') !== null;
    },

    /** The delete question if it is on screen, otherwise null. */
    askedAbout: () => menu().querySelector('.books__question')?.textContent ?? null,

    /** Answer it. */
    agree: () => menu().querySelector('.books__confirm-yes').click(),
    decline: () => menu().querySelector('.books__confirm-no').click(),

    /** Whether the menu is on screen. */
    menuIsOpen: () => !menu().hidden,
  };
}

/**
 * An app whose contents already reads exactly these recipes, top to bottom —
 * the mirror of Gherkin's `Given the contents reads:`. Built through the box, so
 * the setup is the same path Nell takes; newest-first means writing in reverse.
 */
export function openAppWithContents(...names) {
  const app = openApp();
  for (const name of [...names].reverse()) app.writeDown(name);
  return app;
}

/** The stored form of an old bare list, for tests that seed localStorage directly. */
export const storedList = (...todos) => JSON.stringify(todos);

/** The stored form of the 0003 notepads key. */
export const storedNotepads = (notepads, openId) => JSON.stringify({ notepads, openId });

/** The stored form of the current key. */
export const storedBooks = (books, openId) => JSON.stringify({ books, openId });

/**
 * A stand-in for the browser's model.
 *
 * Never a real one: the pipeline runs in jsdom, which has none, and asserting
 * what an LLM says is not the app's promise to keep. What the rules check is
 * what the app does with an answer. See specs/features/suggesting/spec.md.
 */
/**
 * A drafted line and the place it asked for. Pass a nonsense index, or none, to
 * exercise a model that gives no usable place.
 */
export const at = (index, text) => ({ index, text });

/** Turn a plain string into a line that asked for the place it was written in. */
const placed = (lines) =>
  lines.map((line, index) => (typeof line === 'string' ? { text: line, index } : line));

/**
 * A drafted recipe. Plain strings take the places they are written in, which is
 * what most rules want; use `at(index, text)` where the place is the point.
 */
export const drafts = (ingredients = [], steps = []) => ({
  ingredients: placed(ingredients),
  steps: placed(steps),
});

export function fakeModel({
  state = 'available',
  drafts = { ingredients: [], steps: [] },
  fails = false,
  cannotSay = false,
  silent = false,
  holds = false,
  fetchFails = false,
} = {}) {
  const never = () => new Promise(() => {});
  const gaveUp = () => Promise.reject(new Error('the model gave up'));

  // A fetch the test drives: `reaches` reports progress, `arrives` finishes it.
  let report = null;
  let finish = null;
  // A draft the test drives, for what happens while one is still out.
  let answer = null;

  return {
    availability: () => (cannotSay ? gaveUp() : Promise.resolve(state)),
    prepare(onProgress) {
      report = onProgress;
      if (fetchFails) return gaveUp();
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    draft: () => {
      if (fails) return gaveUp();
      if (silent) return never();
      if (holds) return new Promise((resolve) => { answer = () => resolve(drafts); });
      return Promise.resolve(drafts);
    },

    /** Let a held draft come back. */
    answers: () => answer?.(),

    /** Drive the download from the test. */
    reaches: (loaded) => report?.(loaded),
    arrives: () => finish?.(),
  };
}
