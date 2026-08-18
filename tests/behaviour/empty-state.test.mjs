// specs/features/recipes/empty-state.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openAppWithContents } from '../support/app.mjs';

const MESSAGE = 'No recipes in this book yet.';

rule('empty-state-on-first-visit', () => {
  test('opening the app for the first time', () => {
    const app = openApp();
    assert.deepEqual(app.contents(), []);
    assert.equal(app.message(), MESSAGE);
  });
});

rule('empty-state-returns', () => {
  test('deleting the only recipe', () => {
    const app = openAppWithContents('Apple cake');
    assert.equal(app.message(), null, 'a book with something in it says nothing');
    app.deleteRecipe('Apple cake');
    assert.equal(app.message(), MESSAGE);
  });
});

rule('empty-state-is-per-notepad', () => {
  test('one book with recipes in it, one without', () => {
    const app = openAppWithContents('Apple cake');
    app.renameBook('Sweets');
    app.makeBook('Dinner');
    assert.equal(app.message(), MESSAGE);

    app.openBookNamed('Sweets');
    assert.equal(app.message(), null);
  });
});
