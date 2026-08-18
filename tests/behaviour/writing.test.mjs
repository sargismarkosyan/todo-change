// specs/features/recipes/writing.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openAppWithContents } from '../support/app.mjs';

rule('add-goes-to-top', () => {
  test('writing one down in an empty book', () => {
    const app = openApp();
    app.writeDown('Apple cake');
    assert.deepEqual(app.contents(), ['Apple cake']);
  });

  test('it goes above what is already there', () => {
    const app = openAppWithContents('Lemon drizzle');
    app.writeDown('Apple cake');
    assert.deepEqual(app.contents(), ['Apple cake', 'Lemon drizzle']);
  });
});

rule('add-clears-the-box', () => {
  test('the box is ready for the next one', () => {
    const app = openApp();
    app.writeDown('Apple cake');
    assert.equal(app.box(), '');
  });
});

rule('add-rejects-blank', () => {
  test('pressing Enter on an empty box', () => {
    const app = openApp();
    app.type('');
    app.submit();
    assert.deepEqual(app.contents(), []);
  });

  test('submitting only spaces', () => {
    const app = openApp();
    app.type('   ');
    app.submit();
    assert.deepEqual(app.contents(), []);
  });
});
