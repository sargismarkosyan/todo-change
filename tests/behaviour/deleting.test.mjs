// specs/features/recipes/deleting.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

rule('delete-removes-only-that-one', () => {
  test('deleting the middle of three recipes', async () => {
    const app = await openAppWithContents('Lemon drizzle', 'Apple cake', 'Roast chicken');
    await app.deleteRecipe('Apple cake');
    assert.deepEqual(await app.contents(), ['Lemon drizzle', 'Roast chicken']);
  });

  test('deleting one ingredient out of a recipe', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.give('Apple cake', 'ingredient', ['200g plain flour', '3 apples']);
    await app.openRecipe('Apple cake');
    await app.deleteLine('3 apples');
    assert.deepEqual(await app.ingredients('Apple cake'), ['200g plain flour']);
  });

  test('deleting one step leaves the rest of the method', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.give('Apple cake', 'step', ['Heat the oven to 180C', 'Bake for forty minutes']);
    await app.openRecipe('Apple cake');
    await app.deleteLine('Heat the oven to 180C');
    assert.deepEqual(await app.method('Apple cake'), ['Bake for forty minutes']);
  });
});

rule('delete-parent-deletes-sub-todos', () => {
  test('the whole thing goes at once', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.give('Apple cake', 'ingredient', ['200g plain flour']);
    await app.give('Apple cake', 'step', ['Heat the oven to 180C']);

    await app.deleteRecipe('Apple cake');
    assert.deepEqual(await app.contents(), []);
    assert.equal(
      await (await app.stored()).includes('200g plain flour'),
      false,
      'the ingredients went with it',
    );
  });
});
