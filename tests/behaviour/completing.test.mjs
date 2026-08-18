// specs/features/todo/completing.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithList } from '../support/app.mjs';

rule('complete-marks-done', () => {
  test('ticking the checkbox', () => {
    const app = openAppWithList('Buy milk');
    app.tick('Buy milk');
    assert.equal(app.isDone('Buy milk'), true);
    assert.equal(app.hasLineThrough('Buy milk'), true, 'expected a line through the text');
  });

  test('the line falls only on the done todo', () => {
    const app = openAppWithList('Call the bank', 'Buy milk');
    app.tick('Buy milk');
    assert.equal(app.hasLineThrough('Call the bank'), false);
  });
});

rule('complete-is-reversible', () => {
  test('changing my mind', () => {
    const app = openAppWithList('Buy milk');
    app.tick('Buy milk');
    app.untick('Buy milk');
    assert.equal(app.isDone('Buy milk'), false);
    assert.equal(app.hasLineThrough('Buy milk'), false, 'expected the line to be gone');
  });
});

rule('complete-keeps-position', () => {
  test('a done todo stays where it was', () => {
    const app = openAppWithList('Call the bank', 'Buy milk');
    app.tick('Call the bank');
    assert.deepEqual(app.list(), ['Call the bank', 'Buy milk']);
  });
});
