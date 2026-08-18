// Internals of the book model: the parts no Gherkin rule describes on its own —
// reading untrusted shapes, converting the two older ones, and which book is
// left open after one goes.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NAME,
  addBook,
  emptyStore,
  isBook,
  migrateList,
  migrateNotepads,
  openBook,
  openRecipes,
  removeBook,
  renameBook,
  sanitizeStore,
  switchTo,
  withOpenRecipes,
} from '../../src/books.mjs';

const book = (id, name, recipes = []) => ({ id, name, recipes });
const recipe = (id, name) => ({ id, name, tags: [], ingredients: [], steps: [] });
const todo = (id, text, done = false) => ({ id, text, done });

test('a fresh store is one empty book, open', () => {
  const store = emptyStore();
  assert.equal(store.books.length, 1);
  assert.equal(store.books[0].name, DEFAULT_NAME);
  assert.equal(store.openId, store.books[0].id);
  assert.deepEqual(openRecipes(store), []);
});

test('isBook wants an id, a name and a list of recipes', () => {
  assert.equal(isBook(book('a', 'Sweets')), true);
  assert.equal(isBook(null), false);
  assert.equal(isBook('Sweets'), false);
  assert.equal(isBook({ id: '', name: 'Sweets', recipes: [] }), false);
  assert.equal(isBook({ id: 'a', name: '', recipes: [] }), false);
  assert.equal(isBook({ id: 'a', name: 'Sweets' }), false);
  assert.equal(isBook({ id: 'a', name: 'Sweets', recipes: 'nope' }), false);
});

test('sanitizeStore keeps the good books and their good recipes', () => {
  const store = sanitizeStore({
    books: [
      book('a', 'Sweets', [{ id: 'r', name: 'Apple cake' }, { nonsense: true }]),
      { nonsense: true },
      book('b', 'Dinner'),
    ],
    openId: 'b',
  });

  assert.deepEqual(store.books.map((one) => one.name), ['Sweets', 'Dinner']);
  assert.deepEqual(store.books[0].recipes, [recipe('r', 'Apple cake')]);
  assert.equal(store.openId, 'b');
});

test('sanitizeStore falls back to one empty book', () => {
  for (const value of [null, 'nope', 42, [], { books: 'nope' }, { books: [] }]) {
    const store = sanitizeStore(value);
    assert.equal(store.books.length, 1, `for ${JSON.stringify(value)}`);
    assert.equal(store.books[0].name, DEFAULT_NAME);
  }
});

test('an openId naming nothing opens the first book', () => {
  const store = sanitizeStore({ books: [book('a', 'Sweets'), book('b', 'Dinner')] });
  assert.equal(store.openId, 'a');
});

test('migrateNotepads turns notepads into books and todos into recipes', () => {
  const store = migrateNotepads({
    notepads: [
      {
        id: 'n1',
        name: 'Dinner',
        todos: [
          { ...todo('t1', 'Roast chicken', true), subTodos: [todo('s1', 'Heat the oven')] },
          { nonsense: true },
        ],
      },
      { nonsense: true },
    ],
    openId: 'n1',
  });

  assert.deepEqual(store.books.map((one) => one.name), ['Dinner']);
  assert.deepEqual(store.books[0].recipes, [
    {
      id: 't1',
      name: 'Roast chicken',
      tags: [],
      ingredients: [],
      steps: [{ id: 's1', text: 'Heat the oven' }],
    },
  ]);
  assert.equal(store.openId, 'n1');
});

test('migrateNotepads keeps a notepad whose todos are junk, as an empty book', () => {
  const store = migrateNotepads({ notepads: [{ id: 'n1', name: 'Dinner', todos: [] }] });
  assert.deepEqual(store.books[0].recipes, []);
  assert.equal(store.openId, 'n1');
});

test('migrateNotepads survives anything that is not a store', () => {
  for (const value of [null, 'nope', 42, { notepads: 'nope' }, { notepads: [] }]) {
    assert.equal(migrateNotepads(value).books[0].name, DEFAULT_NAME);
  }
});

test('a todo whose subTodos are not a list becomes a recipe with no method', () => {
  const store = migrateNotepads({
    notepads: [{ id: 'n1', name: 'Dinner', todos: [{ ...todo('t1', 'Fish pie'), subTodos: 'nope' }] }],
  });
  assert.deepEqual(store.books[0].recipes[0].steps, []);
});

test('migrateList wraps an old bare list in one book', () => {
  const store = migrateList([todo('t', 'Apple cake'), { nonsense: true }]);
  assert.equal(store.books.length, 1);
  assert.equal(store.books[0].name, DEFAULT_NAME);
  assert.deepEqual(store.books[0].recipes, [recipe('t', 'Apple cake')]);
  assert.equal(store.openId, store.books[0].id);
});

test('migrateList survives anything that is not a list', () => {
  assert.deepEqual(migrateList(null).books[0].recipes, []);
});

test('openBook falls back to the first when openId has drifted', () => {
  const store = { books: [book('a', 'Sweets')], openId: 'gone' };
  assert.equal(openBook(store).name, 'Sweets');
});

test('withOpenRecipes only touches the open book', () => {
  const store = { books: [book('a', 'Sweets'), book('b', 'Dinner')], openId: 'b' };
  const next = withOpenRecipes(store, [recipe('r', 'Fish pie')]);
  assert.deepEqual(next.books[0].recipes, []);
  assert.deepEqual(next.books[1].recipes, [recipe('r', 'Fish pie')]);
});

test('switchTo ignores an id that is not there', () => {
  const store = { books: [book('a', 'Sweets')], openId: 'a' };
  assert.equal(switchTo(store, 'gone'), store);
  assert.equal(switchTo(store, 'a').openId, 'a');
});

test('addBook appends and opens, and trims the name', () => {
  const store = addBook(emptyStore(), '  Sweets  ');
  assert.deepEqual(store.books.map((one) => one.name), [DEFAULT_NAME, 'Sweets']);
  assert.equal(openBook(store).name, 'Sweets');
});

test('addBook on a blank name changes nothing', () => {
  const store = emptyStore();
  assert.equal(addBook(store, '   '), store);
});

test('renameBook trims, and ignores a blank name or an unknown id', () => {
  const store = { books: [book('a', 'Sweets')], openId: 'a' };
  assert.equal(renameBook(store, 'a', '  Puddings  ').books[0].name, 'Puddings');
  assert.equal(renameBook(store, 'a', '  '), store);
  assert.deepEqual(renameBook(store, 'gone', 'Puddings').books, store.books);
});

test('removeBook leaves the one before it open', () => {
  const store = {
    books: [book('a', 'One'), book('b', 'Two'), book('c', 'Three')],
    openId: 'b',
  };
  const next = removeBook(store, 'b');
  assert.deepEqual(next.books.map((one) => one.name), ['One', 'Three']);
  assert.equal(openBook(next).name, 'One');
});

test('removing the first one opens what is now first', () => {
  const store = { books: [book('a', 'One'), book('b', 'Two')], openId: 'a' };
  assert.equal(openBook(removeBook(store, 'a')).name, 'Two');
});

test('removing one that is not open leaves the open one alone', () => {
  const store = { books: [book('a', 'One'), book('b', 'Two')], openId: 'b' };
  assert.equal(openBook(removeBook(store, 'a')).name, 'Two');
});

test('the last book does not go, and neither does an unknown one', () => {
  const alone = emptyStore();
  assert.equal(removeBook(alone, alone.openId), alone);

  const store = { books: [book('a', 'One'), book('b', 'Two')], openId: 'a' };
  assert.equal(removeBook(store, 'gone'), store);
});
