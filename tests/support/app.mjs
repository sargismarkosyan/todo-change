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
import { STORAGE_KEY } from '../../src/storage.mjs';

const HTML = readFileSync('index.html', 'utf8');
const CSS = readFileSync('src/styles.css', 'utf8');

// jsdom does not fetch subresources, so the stylesheet is inlined; and the
// module script is dropped because each test mounts the app itself.
const PAGE = HTML.replace(
  '<link rel="stylesheet" href="src/styles.css">',
  `<style>${CSS}</style>`,
).replace(/<script type="module">[\s\S]*?<\/script>/, '');

/**
 * A fresh browser with a fresh store, with `stored` already in localStorage.
 * Pass nothing for a browser that has never opened the app.
 */
export function openApp(stored) {
  const dom = new JSDOM(PAGE, { url: 'http://localhost/' });
  const { window } = dom;
  const doc = window.document;

  if (stored !== undefined && stored !== null) {
    window.localStorage.setItem(STORAGE_KEY, stored);
  }
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

    /** Close the tab and open it again. A new window, the same stored string. */
    reload: () => openApp(window.localStorage.getItem(STORAGE_KEY)),
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

/** The stored form of a list, for tests that seed localStorage directly. */
export const storedList = (...todos) => JSON.stringify(todos);
