// specs/features/todo/adding.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openAppWithList } from '../support/app.mjs';

rule('add-goes-to-top', () => {
  test('adding to an empty list', () => {
    const app = openApp();
    app.add('Buy milk');
    assert.deepEqual(app.list(), ['Buy milk']);
  });

  test('adding above what is already there', () => {
    const app = openAppWithList('Call the bank');
    app.add('Buy milk');
    assert.deepEqual(app.list(), ['Buy milk', 'Call the bank']);
  });
});

rule('add-clears-the-box', () => {
  test('the box is ready for the next one', () => {
    const app = openApp();
    app.add('Buy milk');
    assert.equal(app.box(), '');
  });
});

rule('add-rejects-blank', () => {
  test('pressing Enter on an empty box', () => {
    const app = openApp();
    app.type('');
    app.submit();
    assert.deepEqual(app.list(), []);
  });

  test('submitting only spaces', () => {
    const app = openApp();
    app.type('   ');
    app.submit();
    assert.deepEqual(app.list(), []);
  });
});
