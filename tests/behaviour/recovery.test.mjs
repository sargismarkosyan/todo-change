// specs/features/storage/recovery.feature
//
// localStorage is seeded with raw strings here on purpose: this is the one
// place where the input is whatever a devtools panel, a second tab, or a
// half-finished write left behind.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openStore, storedList, storedNotepads } from '../support/app.mjs';

rule('recover-from-missing-key', () => {
  test('a browser that has never opened the app', () => {
    const app = openApp();
    assert.equal(app.stored(), null, 'nothing should have been stored yet');
    assert.deepEqual(app.list(), []);
    assert.equal(app.message(), 'Nothing to do yet.');
  });
});

rule('recover-from-unreadable-data', () => {
  test('the value is not valid JSON', () => {
    const app = openApp('{not json');
    assert.deepEqual(app.list(), []);
    assert.equal(app.message(), 'Nothing to do yet.');
  });

  test('the value is JSON but the wrong shape', () => {
    const app = openApp('{"todos":"nope"}');
    assert.deepEqual(app.list(), []);
  });

  test('one entry in the array is not a todo', () => {
    const app = openApp(
      storedList({ id: 'a', text: 'Buy milk', done: false }, { nonsense: true }),
    );
    assert.deepEqual(app.list(), ['Buy milk'], 'the good todo should have survived');
  });

  test('the app is still usable after a bad read', () => {
    const app = openApp('{not json');
    app.add('Buy milk');
    assert.deepEqual(app.list(), ['Buy milk']);
    assert.deepEqual(app.reload().list(), ['Buy milk']);
  });
});

rule('recover-from-bad-sub-todos', () => {
  test('subTodos holds something that is not a list', () => {
    const app = openApp(storedList({ id: 'a', text: 'Buy milk', done: false, subTodos: 'nope' }));
    assert.deepEqual(app.list(), ['Buy milk']);
    assert.deepEqual(app.subTodos('Buy milk'), []);
  });

  test('one sub-todo entry is not a todo', () => {
    const app = openApp(
      storedList({
        id: 'a',
        text: 'Sort out car insurance',
        done: false,
        subTodos: [{ id: 'b', text: 'Call current insurer', done: false }, { nonsense: true }],
      }),
    );
    assert.deepEqual(app.subTodos('Sort out car insurance'), ['Call current insurer']);
  });

  test('a parent stored as done over an unfinished sub-todo', () => {
    const app = openApp(
      storedList({
        id: 'a',
        text: 'Sort out car insurance',
        done: true,
        subTodos: [{ id: 'b', text: 'Call current insurer', done: false }],
      }),
    );
    assert.equal(
      app.isDone('Sort out car insurance'),
      false,
      'the screen must never show a struck-through parent over an open step',
    );
    assert.equal(app.hasLineThrough('Sort out car insurance'), false);
  });

  test('a list saved before sub-todos existed reads exactly as it did', () => {
    const app = openApp(
      storedList(
        { id: 'a', text: 'Buy milk', done: false },
        { id: 'b', text: 'Call the bank', done: true },
      ),
    );
    assert.deepEqual(app.list(), ['Buy milk', 'Call the bank']);
    assert.equal(app.isDone('Call the bank'), true);
    assert.deepEqual(app.subTodos('Buy milk'), []);
  });
});

rule('recover-from-bad-notepads', () => {
  test('the value is not valid JSON', () => {
    const app = openStore('{not json');
    assert.equal(app.openNotepad(), 'My list');
    assert.deepEqual(app.list(), []);
    assert.equal(app.message(), 'Nothing to do yet.');
  });

  test('the value is JSON but the wrong shape', () => {
    const app = openStore('{"notepads":"nope"}');
    assert.equal(app.openNotepad(), 'My list');
    assert.deepEqual(app.list(), []);
  });

  test('one entry in the notepads is not a notepad', () => {
    const app = openStore(
      storedNotepads([{ id: 'a', name: 'Home', todos: [] }, { nonsense: true }], 'a'),
    );
    assert.deepEqual(app.notepads(), ['Home']);
  });

  test('the notepad said to be open is not there', () => {
    const app = openStore(storedNotepads([{ id: 'a', name: 'Home', todos: [] }], 'gone'));
    assert.equal(app.openNotepad(), 'Home');
  });

  test('a junk todo inside a good notepad costs its neighbours nothing', () => {
    const app = openStore(
      storedNotepads(
        [
          {
            id: 'a',
            name: 'Home',
            todos: [{ id: 't', text: 'Buy milk', done: false }, { nonsense: true }],
          },
        ],
        'a',
      ),
    );
    assert.deepEqual(app.list(), ['Buy milk']);
  });

  test('the app is still usable after a bad read', () => {
    const app = openStore('{not json');
    app.add('Buy milk');
    assert.deepEqual(app.reload().list(), ['Buy milk']);
  });
});
