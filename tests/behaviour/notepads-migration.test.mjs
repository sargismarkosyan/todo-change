// specs/features/storage/notepads-migration.feature
//
// localStorage is seeded with the old key here — a bare array of todos, which
// is what every version before notepads wrote. `openApp` seeds exactly that,
// so these read the same string an upgrading browser would find.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openStore, storedList } from '../support/app.mjs';

rule('old-list-opens-as-one-notepad', () => {
  test('todos saved by the previous version', () => {
    const app = openApp(
      storedList(
        { id: 'a', text: 'Call the bank', done: false },
        { id: 'b', text: 'Buy milk', done: true },
      ),
    );

    assert.equal(app.openNotepad(), 'My list');
    assert.deepEqual(app.list(), ['Call the bank', 'Buy milk']);
    assert.equal(app.isDone('Buy milk'), true);
    assert.deepEqual(app.notepads(), ['My list']);
  });

  test('sub-todos come across with their parent', () => {
    const app = openApp(
      storedList({
        id: 'a',
        text: 'Sort out car insurance',
        done: false,
        subTodos: [{ id: 'b', text: 'Call current insurer', done: true }],
      }),
    );

    assert.deepEqual(app.subTodos('Sort out car insurance'), ['Call current insurer']);
    assert.equal(app.isDone('Call current insurer'), true);
  });

  test('an old key holding junk still opens a usable notepad', () => {
    const app = openApp('{not json');
    assert.equal(app.openNotepad(), 'My list');
    assert.deepEqual(app.list(), []);
    assert.equal(app.message(), 'Nothing to do yet.');
  });
});

rule('migration-happens-once', () => {
  test('reading it once and never again', () => {
    const app = openApp(storedList({ id: 'a', text: 'Buy milk', done: false }));

    assert.equal(app.storedLegacy(), null, 'the old key is gone once it has been read');
    assert.notEqual(app.stored(), null, 'and the list is under the new one');

    const reopened = app.reload();
    assert.equal(reopened.openNotepad(), 'My list');
    assert.deepEqual(reopened.list(), ['Buy milk']);
  });

  test('the notepads key wins when both are somehow there', () => {
    const app = openApp(storedList({ id: 'a', text: 'Buy milk', done: false }));
    app.makeNotepad('Home');
    app.add('Water plants');

    // Something puts the old key back — a second tab on an old version, say.
    const reopened = openStore(app.stored(), storedList({ id: 'z', text: 'Stale', done: false }));
    assert.equal(reopened.openNotepad(), 'Home');
    assert.deepEqual(reopened.list(), ['Water plants'], 'the old key is not read again');
  });
});
