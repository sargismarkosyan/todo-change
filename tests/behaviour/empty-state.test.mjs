// specs/features/recipes/empty-state.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openAppWithContents } from '../support/app.mjs';

const MESSAGE = 'No recipes in this book yet.';

rule('empty-state-on-first-visit', () => {
  test('opening the app for the first time', async () => {
    const app = await openApp();
    assert.deepEqual(await app.contents(), []);
    assert.equal(await app.message(), MESSAGE);
  });
});

rule('empty-state-returns', () => {
  test('deleting the only recipe', async () => {
    const app = await openAppWithContents('Apple cake');
    assert.equal(await app.message(), null, 'a book with something in it says nothing');
    await app.deleteRecipe('Apple cake');
    assert.equal(await app.message(), MESSAGE);
  });
});

rule('empty-state-is-per-notepad', () => {
  test('one book with recipes in it, one without', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.renameBook('Sweets');
    await app.makeBook('Dinner');
    assert.equal(await app.message(), MESSAGE);

    await app.openBookNamed('Sweets');
    assert.equal(await app.message(), null);
  });
});
