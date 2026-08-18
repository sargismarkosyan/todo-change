// specs/features/todo/empty-state.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openAppWithList } from '../support/app.mjs';

rule('empty-state-on-first-visit', () => {
  test('opening the app for the first time', () => {
    const app = openApp();
    assert.deepEqual(app.list(), []);
    assert.equal(app.message(), 'Nothing to do yet.');
  });

  test('the message goes once there is something to do', () => {
    const app = openApp();
    app.add('Buy milk');
    assert.equal(app.message(), null);
  });
});

rule('empty-state-returns', () => {
  test('deleting the only todo', () => {
    const app = openAppWithList('Buy milk');
    app.deleteTodo('Buy milk');
    assert.equal(app.message(), 'Nothing to do yet.');
  });
});
