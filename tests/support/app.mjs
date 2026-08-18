// Opens the real app in jsdom and reads it back in the vocabulary the Gherkin
// uses: the list, the box, done, unfinished.
//
// Tests drive this rather than the modules directly, so that a rule about what
// Rowan sees is checked against what is actually on screen. index.html and
// styles.css are the real files — a test asking whether a todo has a line
// through it is asking the same stylesheet the browser gets.

import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { mountApp } from '../../src/app.mjs';
import { LEGACY_KEY, STORAGE_KEY } from '../../src/storage.mjs';

const HTML = readFileSync('index.html', 'utf8');
const CSS = readFileSync('src/styles.css', 'utf8');

// jsdom does not fetch subresources, so the stylesheet is inlined; and the
// module script is dropped because each test mounts the app itself.
const PAGE = HTML.replace(
  '<link rel="stylesheet" href="src/styles.css">',
  `<style>${CSS}</style>`,
).replace(/<script type="module">[\s\S]*?<\/script>/, '');

/**
 * A fresh browser with a fresh store, with `stored` already under one key.
 *
 * `openApp` seeds the **old** key — a bare array of todos, which is what every
 * version before notepads wrote — so a test that hands it a list is opening a
 * browser that last used the previous version. `openStore` seeds the notepads
 * key instead. Pass nothing to either for a browser that has never opened the
 * app at all.
 */
export function openApp(stored) {
  return open(LEGACY_KEY, stored);
}

/** `legacy` seeds the old key alongside it, for the case where both are there. */
export function openStore(stored, legacy) {
  return open(STORAGE_KEY, stored, legacy);
}

function open(key, stored, legacy) {
  const dom = new JSDOM(PAGE, { url: 'http://localhost/' });
  const { window } = dom;
  const doc = window.document;

  if (stored !== undefined && stored !== null) {
    window.localStorage.setItem(key, stored);
  }
  if (legacy !== undefined) window.localStorage.setItem(LEGACY_KEY, legacy);
  mountApp(doc, window.localStorage);

  // A parent keeps its text one level down, inside the row; a sub-todo wears it
  // directly. Either way it is the row's own text and never a descendant's.
  const textOf = (el, kind) =>
    el.querySelector(`:scope > .${kind}__row > .${kind}__text`) ??
    el.querySelector(`:scope > .${kind}__text`);

  const rows = () => [...doc.querySelectorAll('.todo')];
  const list = () => rows().map((el) => textOf(el, 'todo').textContent);

  // Every row on screen, parents and sub-todos alike, paired with the block
  // name its controls carry. Ticking and deleting read the same in the Gherkin
  // whichever level they land on, so they resolve the same way here.
  const everyRow = () => [
    ...rows().map((el) => ({ el, kind: 'todo' })),
    ...[...doc.querySelectorAll('.sub-todo')].map((el) => ({ el, kind: 'sub-todo' })),
  ];

  const find = (text) => {
    const found = everyRow().find(({ el, kind }) => textOf(el, kind).textContent === text);
    if (!found) {
      throw new Error(
        `no todo reading "${text}" — the list reads: ${list().join(', ')}`,
      );
    }
    return found;
  };
  const control = (text, suffix) => {
    const { el, kind } = find(text);
    return el.querySelector(`.${kind}__${suffix}`);
  };

  const menu = () => doc.getElementById('notepad-menu');
  const openMenu = () => {
    if (menu().hidden) doc.getElementById('notepad-open').click();
  };
  const switchControl = (name) => {
    const found = [...menu().querySelectorAll('.notepads__switch')].find(
      (el) => el.textContent === name,
    );
    if (!found) {
      throw new Error(
        `no notepad called "${name}" — the menu reads: ` +
          [...menu().querySelectorAll('.notepads__switch')].map((el) => el.textContent).join(', '),
      );
    }
    return found;
  };

  /** The row of the parent reading `text`, for reaching into its group. */
  const parentRow = (text) => {
    const { el, kind } = find(text);
    if (kind !== 'todo') throw new Error(`"${text}" is a sub-todo, so it has no group`);
    return el;
  };

  return {
    window,
    document: doc,

    /** Type into the box and press Enter — the whole of Capture. */
    add(text) {
      this.type(text);
      this.submit();
    },
    type(text) {
      doc.getElementById('new-todo').value = text;
    },
    submit() {
      doc.getElementById('composer').requestSubmit();
    },
    /** What the box currently holds. */
    box: () => doc.getElementById('new-todo').value,

    /** The todos on screen, top to bottom. Sub-todos are not in the list. */
    list,

    /**
     * Open the sub-todo box on a row, type, and press Enter — the whole of
     * capturing a step. The box stays open, so a run of them is one call each.
     */
    addSub(parentText, text) {
      this.submitSub(parentText, text);
    },
    /** The same, kept separate for the rule about text that is not a sub-todo. */
    submitSub(parentText, text) {
      const row = parentRow(parentText);
      if (!row.querySelector('.sub-composer')) {
        row.querySelector('.todo__add-sub').click();
      }
      parentRow(parentText).querySelector('.sub-composer__box').value = text;
      parentRow(parentText).querySelector('.sub-composer').requestSubmit();
    },

    /** The sub-todos under a parent, top to bottom. */
    subTodos: (parentText) =>
      [...parentRow(parentText).querySelectorAll('.sub-todo')].map(
        (el) => el.querySelector('.sub-todo__text').textContent,
      ),

    /** Whether a row offers any way to add a sub-todo under it. */
    offersSubTodos: (text) => find(text).el.querySelector('.todo__add-sub') !== null,

    tick: (text) => control(text, 'check').click(),
    untick: (text) => control(text, 'check').click(),
    deleteTodo: (text) => control(text, 'delete').click(),

    isDone: (text) => control(text, 'check').checked,
    hasLineThrough(text) {
      const { el, kind } = find(text);
      return (
        window.getComputedStyle(textOf(el, kind)).textDecorationLine === 'line-through'
      );
    },

    /** The empty-list message if it is on screen, otherwise null. */
    message() {
      const el = doc.getElementById('empty');
      return window.getComputedStyle(el).display === 'none' ? null : el.textContent;
    },

    /** The raw stored string, exactly as a devtools panel would show it. */
    stored: () => window.localStorage.getItem(STORAGE_KEY),

    /** The same for the key the previous version wrote, which should be gone. */
    storedLegacy: () => window.localStorage.getItem(LEGACY_KEY),

    /** Close the tab and open it again. A new window, the same stored string. */
    reload: () => openStore(window.localStorage.getItem(STORAGE_KEY)),

    // ---- notepads --------------------------------------------------------
    //
    // Everything below reaches through the menu, because that is where Rowan
    // reaches. Reading what notepads exist opens it, the way looking at them
    // does.

    /** The name of the notepad on screen, as the header shows it. */
    openNotepad: () => doc.getElementById('notepad-open').textContent,

    /** The notepads in the menu, top to bottom. */
    notepads() {
      openMenu();
      return [...menu().querySelectorAll('.notepads__switch')].map((el) => el.textContent);
    },

    /** Switch to another notepad — one click, once the menu is open. */
    openNotepadNamed(name) {
      openMenu();
      switchControl(name).click();
    },

    /** Name a new notepad and press Enter. */
    makeNotepad(name) {
      openMenu();
      doc.getElementById('new-notepad').value = name;
      menu().querySelector('.notepads__new').requestSubmit();
    },

    /** Rename the notepad on screen. */
    renameNotepad(name) {
      openMenu();
      menu().querySelector('.notepads__rename-open').click();
      doc.getElementById('rename-notepad').value = name;
      menu().querySelector('.notepads__rename').requestSubmit();
    },

    /** Ask to delete the notepad on screen. */
    deleteNotepad() {
      openMenu();
      const control = menu().querySelector('.notepads__delete');
      if (!control) throw new Error('the menu offers no way to delete this notepad');
      control.click();
    },

    /** Whether the menu offers a delete at all. */
    offersNotepadDelete() {
      openMenu();
      return menu().querySelector('.notepads__delete') !== null;
    },

    /** The delete question if it is on screen, otherwise null. */
    askedAbout: () => menu().querySelector('.notepads__question')?.textContent ?? null,

    /** Answer it. */
    agree: () => menu().querySelector('.notepads__confirm-yes').click(),
    decline: () => menu().querySelector('.notepads__confirm-no').click(),

    /** Whether the menu is on screen. */
    menuIsOpen: () => !menu().hidden,
  };
}

/**
 * An app whose list already reads exactly these todos, top to bottom — the
 * mirror of Gherkin's `Given the list reads:`. Built through the box, so the
 * setup is the same path Rowan takes; newest-first means adding in reverse.
 */
export function openAppWithList(...texts) {
  const app = openApp();
  for (const text of [...texts].reverse()) app.add(text);
  return app;
}

/** The stored form of an old bare list, for tests that seed localStorage directly. */
export const storedList = (...todos) => JSON.stringify(todos);

/** The stored form of the notepads key. */
export const storedNotepads = (notepads, openId) => JSON.stringify({ notepads, openId });
