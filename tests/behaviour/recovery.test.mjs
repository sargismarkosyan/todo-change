// specs/features/storage/recovery.feature
//
// localStorage is seeded with raw strings here on purpose: this is the one
// place where the input is whatever a devtools panel, a second tab, or a
// half-finished write left behind.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, storedList } from '../support/app.mjs';

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
