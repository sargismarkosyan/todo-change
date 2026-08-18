// specs/features/todo/deleting.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithList } from '../support/app.mjs';

rule('delete-removes-only-that-one', () => {
  test('deleting the middle of three', () => {
    const app = openAppWithList('Call the bank', 'Buy milk', 'Water plants');
    app.deleteTodo('Buy milk');
    assert.deepEqual(app.list(), ['Call the bank', 'Water plants']);
  });

  test('two todos reading the same thing are told apart', () => {
    const app = openAppWithList('Buy milk', 'Buy milk');
    app.deleteTodo('Buy milk');
    assert.deepEqual(app.list(), ['Buy milk'], 'exactly one should have gone');
  });
});

rule('delete-works-on-done-todos', () => {
  test('clearing something finished', () => {
    const app = openAppWithList('Buy milk');
    app.tick('Buy milk');
    app.deleteTodo('Buy milk');
    assert.deepEqual(app.list(), []);
  });
});
