// Internals of the notepad model: the parts no Gherkin rule describes on its
// own — reading untrusted shapes, and which notepad is left open after one goes.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NAME,
  addNotepad,
  emptyStore,
  isNotepad,
  migrateList,
  openNotepad,
  openTodos,
  removeNotepad,
  renameNotepad,
  sanitizeStore,
  switchTo,
  withOpenTodos,
} from '../../src/notepads.mjs';

const notepad = (id, name, todos = []) => ({ id, name, todos });
const todo = (id, text, done = false) => ({ id, text, done });

test('a fresh store is one empty notepad, open', () => {
  const store = emptyStore();
  assert.equal(store.notepads.length, 1);
  assert.equal(store.notepads[0].name, DEFAULT_NAME);
  assert.equal(store.openId, store.notepads[0].id);
  assert.deepEqual(openTodos(store), []);
});

test('isNotepad wants an id, a name and a list of todos', () => {
  assert.equal(isNotepad(notepad('a', 'Home')), true);
  assert.equal(isNotepad(null), false);
  assert.equal(isNotepad('Home'), false);
  assert.equal(isNotepad({ id: '', name: 'Home', todos: [] }), false);
  assert.equal(isNotepad({ id: 'a', name: '', todos: [] }), false);
  assert.equal(isNotepad({ id: 'a', name: 'Home' }), false);
  assert.equal(isNotepad({ id: 'a', name: 'Home', todos: 'nope' }), false);
});

test('sanitizeStore keeps the good notepads and their good todos', () => {
  const store = sanitizeStore({
    notepads: [
      notepad('a', 'Home', [todo('t', 'Buy milk'), { nonsense: true }]),
      { nonsense: true },
      notepad('b', 'Work'),
    ],
    openId: 'b',
  });

  assert.deepEqual(
    store.notepads.map((pad) => pad.name),
    ['Home', 'Work'],
  );
  assert.deepEqual(store.notepads[0].todos, [todo('t', 'Buy milk')]);
  assert.equal(store.openId, 'b');
});

test('sanitizeStore falls back to one empty notepad', () => {
  for (const value of [null, 'nope', 42, [], { notepads: 'nope' }, { notepads: [] }]) {
    const store = sanitizeStore(value);
    assert.equal(store.notepads.length, 1, `for ${JSON.stringify(value)}`);
    assert.equal(store.notepads[0].name, DEFAULT_NAME);
  }
});

test('an openId naming nothing opens the first notepad', () => {
  const store = sanitizeStore({ notepads: [notepad('a', 'Home'), notepad('b', 'Work')] });
  assert.equal(store.openId, 'a');
});

test('migrateList wraps an old bare list in one notepad', () => {
  const store = migrateList([todo('t', 'Buy milk'), { nonsense: true }]);
  assert.equal(store.notepads.length, 1);
  assert.equal(store.notepads[0].name, DEFAULT_NAME);
  assert.deepEqual(store.notepads[0].todos, [todo('t', 'Buy milk')]);
  assert.equal(store.openId, store.notepads[0].id);
});

test('migrateList survives anything that is not a list', () => {
  assert.deepEqual(migrateList(null).notepads[0].todos, []);
});

test('openNotepad falls back to the first when openId has drifted', () => {
  const store = { notepads: [notepad('a', 'Home')], openId: 'gone' };
  assert.equal(openNotepad(store).name, 'Home');
});

test('withOpenTodos only touches the open notepad', () => {
  const store = { notepads: [notepad('a', 'Home'), notepad('b', 'Work')], openId: 'b' };
  const next = withOpenTodos(store, [todo('t', 'Buy milk')]);
  assert.deepEqual(next.notepads[0].todos, []);
  assert.deepEqual(next.notepads[1].todos, [todo('t', 'Buy milk')]);
});

test('switchTo ignores an id that is not there', () => {
  const store = { notepads: [notepad('a', 'Home')], openId: 'a' };
  assert.equal(switchTo(store, 'gone'), store);
  assert.equal(switchTo(store, 'a').openId, 'a');
});

test('addNotepad appends and opens, and trims the name', () => {
  const store = addNotepad(emptyStore(), '  Home  ');
  assert.deepEqual(
    store.notepads.map((pad) => pad.name),
    [DEFAULT_NAME, 'Home'],
  );
  assert.equal(openNotepad(store).name, 'Home');
});

test('addNotepad on a blank name changes nothing', () => {
  const store = emptyStore();
  assert.equal(addNotepad(store, '   '), store);
});

test('renameNotepad trims, and ignores a blank name or an unknown id', () => {
  const store = { notepads: [notepad('a', 'Home')], openId: 'a' };
  assert.equal(renameNotepad(store, 'a', '  House  ').notepads[0].name, 'House');
  assert.equal(renameNotepad(store, 'a', '  '), store);
  assert.deepEqual(renameNotepad(store, 'gone', 'House').notepads, store.notepads);
});

test('removeNotepad leaves the one before it open', () => {
  const store = {
    notepads: [notepad('a', 'One'), notepad('b', 'Two'), notepad('c', 'Three')],
    openId: 'b',
  };
  const next = removeNotepad(store, 'b');
  assert.deepEqual(
    next.notepads.map((pad) => pad.name),
    ['One', 'Three'],
  );
  assert.equal(openNotepad(next).name, 'One');
});

test('removing the first one opens what is now first', () => {
  const store = { notepads: [notepad('a', 'One'), notepad('b', 'Two')], openId: 'a' };
  assert.equal(openNotepad(removeNotepad(store, 'a')).name, 'Two');
});

test('removing one that is not open leaves the open one alone', () => {
  const store = { notepads: [notepad('a', 'One'), notepad('b', 'Two')], openId: 'b' };
  assert.equal(openNotepad(removeNotepad(store, 'a')).name, 'Two');
});

test('the last notepad does not go, and neither does an unknown one', () => {
  const alone = emptyStore();
  assert.equal(removeNotepad(alone, alone.openId), alone);

  const store = { notepads: [notepad('a', 'One'), notepad('b', 'Two')], openId: 'a' };
  assert.equal(removeNotepad(store, 'gone'), store);
});
