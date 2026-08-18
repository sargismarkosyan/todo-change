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

  const rows = () => [...doc.querySelectorAll('.todo')];
  const find = (text) => {
    const row = rows().find((el) => el.querySelector('.todo__text').textContent === text);
    if (!row) throw new Error(`no todo reading "${text}" — the list reads: ${list().join(', ')}`);
    return row;
  };
  const list = () => rows().map((el) => el.querySelector('.todo__text').textContent);

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

    /** The todos on screen, top to bottom. */
    list,
    tick: (text) => find(text).querySelector('.todo__check').click(),
    untick: (text) => find(text).querySelector('.todo__check').click(),
    deleteTodo: (text) => find(text).querySelector('.todo__delete').click(),

    isDone: (text) => find(text).querySelector('.todo__check').checked,
    hasLineThrough: (text) =>
      window.getComputedStyle(find(text).querySelector('.todo__text')).textDecorationLine ===
      'line-through',

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
