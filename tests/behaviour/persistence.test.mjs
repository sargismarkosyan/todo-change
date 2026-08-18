// specs/features/storage/persistence.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithList } from '../support/app.mjs';

rule('persist-across-reload', () => {
  test('text, order and done state all come back', () => {
    const app = openAppWithList('Call the bank', 'Buy milk');
    app.tick('Buy milk');

    const reopened = app.reload();
    assert.deepEqual(reopened.list(), ['Call the bank', 'Buy milk']);
    assert.equal(reopened.isDone('Buy milk'), true);
    assert.equal(reopened.hasLineThrough('Buy milk'), true);
    assert.equal(reopened.isDone('Call the bank'), false);
  });

  test('unticking survives too, so the last word is the one that is kept', () => {
    const app = openAppWithList('Buy milk');
    app.tick('Buy milk');
    app.untick('Buy milk');
    assert.equal(app.reload().isDone('Buy milk'), false);
  });
});

rule('persist-deletions', () => {
  test('deleting then reloading', () => {
    const app = openAppWithList('Buy milk');
    app.deleteTodo('Buy milk');

    const reopened = app.reload();
    assert.deepEqual(reopened.list(), []);
    assert.equal(reopened.message(), 'Nothing to do yet.');
  });
});

rule('persist-sub-todos', () => {
  test('nesting survives a reload', () => {
    const app = openAppWithList('Sort out car insurance');
    app.addSub('Sort out car insurance', 'Call current insurer');
    app.addSub('Sort out car insurance', 'Compare two quotes');
    app.tick('Call current insurer');

    const reopened = app.reload();
    assert.deepEqual(reopened.list(), ['Sort out car insurance']);
    assert.deepEqual(reopened.subTodos('Sort out car insurance'), [
      'Call current insurer',
      'Compare two quotes',
    ]);
    assert.equal(reopened.isDone('Call current insurer'), true);
    assert.equal(reopened.isDone('Compare two quotes'), false);
    assert.equal(reopened.isDone('Sort out car insurance'), false);
  });

  test('a finished group comes back finished', () => {
    const app = openAppWithList('Sort out car insurance');
    app.addSub('Sort out car insurance', 'Call current insurer');
    app.tick('Sort out car insurance');

    const reopened = app.reload();
    assert.equal(reopened.isDone('Sort out car insurance'), true);
    assert.equal(reopened.isDone('Call current insurer'), true);
  });
});
