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

/** A fresh browser with a fresh store, holding nothing at all. */
export const openApp = () => open({});

/** The same, with the current key already holding `books`. */
export const openStore = (books) => open({ [STORAGE_KEY]: books });

/** The same, seeded with the key version 0003 wrote. */
export const openNotepads = (notepads) => open({ [NOTEPADS_KEY]: notepads });

/** The same, seeded with the bare array every version before that wrote. */
export const openLegacy = (todos) => open({ [LEGACY_KEY]: todos });

/** For the cases that care about more than one key being there at once. */
export const openWith = (seed) => open(seed);

function open(seed) {
  const dom = new JSDOM(PAGE, { url: 'http://localhost/' });
  const { window } = dom;
  const doc = window.document;

  for (const [key, value] of Object.entries(seed)) {
    if (value !== undefined && value !== null) window.localStorage.setItem(key, value);
  }
  mountApp(doc, window.localStorage);

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
  const lines = (name, group) =>
    groupEl(name, group) === null
      ? []
      : [...groupEl(name, group).children].map(
          (el) => el.querySelector('[class$="__text"]').textContent,
        );

  /** Every ingredient and step on screen, for the ones addressed by their text. */
  const lineEls = () => [...doc.querySelectorAll('.ingredient, .step')];
  const line = (text) => {
    const found = lineEls().find(
      (el) => el.querySelector('[class$="__text"]').textContent === text,
    );
    if (!found) throw new Error(`nothing on screen reads "${text}"`);
    return found;
  };

  const composer = (name, block) =>
    recipe(name).querySelector(`.${block}-composer`);

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

    // ---- throwing things out ---------------------------------------------

    deleteRecipe: (name) => recipe(name).querySelector('.recipe__delete').click(),
    deleteLine: (text) => line(text).querySelector('[class$="__delete"]').click(),

    /** The empty-book message if it is on screen, otherwise null. */
    message() {
      const el = doc.getElementById('empty');
      return window.getComputedStyle(el).display === 'none' ? null : el.textContent;
    },

    // ---- what is stored --------------------------------------------------

    /** The raw stored string, exactly as a devtools panel would show it. */
    stored: () => window.localStorage.getItem(STORAGE_KEY),
    storedNotepads: () => window.localStorage.getItem(NOTEPADS_KEY),
    storedLegacy: () => window.localStorage.getItem(LEGACY_KEY),

    /** Close the tab and open it again. A new window, the same stored string. */
    reload: () => openStore(window.localStorage.getItem(STORAGE_KEY)),

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
