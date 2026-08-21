// Internals of the book model: the parts no Gherkin rule describes on its own —
// reading untrusted shapes, converting the two older ones, and which book is
// left open after one goes.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOK_COLOURS,
  DEFAULT_COLOUR,
  DEFAULT_NAME,
  addBook,
  colourBook,
  colourOf,
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
const recipe = (id, name) => ({ id, name, ingredients: [], steps: [] });
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

// ---- what a book is bound in ---------------------------------------------
//
// The swatches offer six and nothing else, so the guard below is unreachable
// from the page. It is here because "a colour this app does not offer changes
// nothing" is the promise that keeps a stored book from ever holding one.

test('the six are named, and the first is the one nothing is written down for', () => {
  assert.deepEqual(BOOK_COLOURS, ['red', 'ochre', 'green', 'teal', 'blue', 'plum']);
  assert.equal(DEFAULT_COLOUR, 'red');
});

test('colourOf reads anything at all as one of the six', () => {
  assert.equal(colourOf(book('a', 'One')), 'red');
  assert.equal(colourOf({ ...book('a', 'One'), colour: 'plum' }), 'plum');
  assert.equal(colourOf({ ...book('a', 'One'), colour: 'chartreuse' }), 'red');
  assert.equal(colourOf({ ...book('a', 'One'), colour: 42 }), 'red');
  assert.equal(colourOf(undefined), 'red');
});

test('a colour this app does not offer changes nothing', () => {
  const store = { books: [book('a', 'One')], openId: 'a' };
  assert.equal(colourBook(store, 'a', 'chartreuse'), store);
  assert.equal(colourBook(store, 'a', undefined), store);
});

test('an id that is not there changes nothing either', () => {
  const store = { books: [book('a', 'One')], openId: 'a' };
  assert.deepEqual(colourBook(store, 'gone', 'plum').books, store.books);
});

test('choosing the red takes the key back out rather than writing it down', () => {
  const store = { books: [book('a', 'One'), book('b', 'Two')], openId: 'a' };

  const plum = colourBook(store, 'a', 'plum');
  assert.equal(plum.books[0].colour, 'plum');
  // The other book is untouched, and keeps its identity rather than a copy.
  assert.equal(plum.books[1], store.books[1]);

  const back = colourBook(plum, 'a', 'red');
  assert.equal('colour' in back.books[0], false);
  assert.equal(colourOf(back.books[0]), 'red');
});

test('a stored colour is read as untrusted as every other field', () => {
  const read = (colour) =>
    sanitizeStore({ books: [{ ...book('a', 'One'), colour }], openId: 'a' }).books[0];

  assert.equal(read('teal').colour, 'teal');
  // Not one of the six, the default written down, and not a string at all: all
  // three are a book with no colour, which is what red means.
  assert.equal('colour' in read('chartreuse'), false);
  assert.equal('colour' in read('red'), false);
  assert.equal('colour' in read({ hex: '#4e7a3a' }), false);
});
