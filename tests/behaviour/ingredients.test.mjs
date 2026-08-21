// specs/features/recipes/ingredients.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

/** The Background: one recipe, open. */
async function open() {
  const app = await openAppWithContents('Apple cake');
  await app.openRecipe('Apple cake');
  return app;
}

rule('ingredient-added-to-recipe', () => {
  test('the first thing it takes', async () => {
    const app = await open();
    await app.addIngredient('Apple cake', '200g plain flour');

    assert.deepEqual(await app.ingredients('Apple cake'), ['200g plain flour']);
    assert.deepEqual(await app.method('Apple cake'), [], 'the method is a different group');
  });

  test('the recipe stays where it was in the contents', async () => {
    const app = await openAppWithContents('Lemon drizzle', 'Apple cake');
    await app.openRecipe('Apple cake');
    await app.addIngredient('Apple cake', '3 apples');

    assert.deepEqual(await app.contents(), ['Lemon drizzle', 'Apple cake']);
  });
});

rule('ingredients-keep-typing-order', () => {
  test('three things, in the order they were read out', async () => {
    const app = await open();
    await app.addIngredient('Apple cake', '200g plain flour');
    await app.addIngredient('Apple cake', '3 apples');
    await app.addIngredient('Apple cake', 'a good pinch of salt');

    assert.deepEqual(await app.ingredients('Apple cake'), [
      '200g plain flour',
      '3 apples',
      'a good pinch of salt',
    ]);
  });
});

rule('ingredient-rejects-blank', () => {
  test('submitting only spaces', async () => {
    const app = await open();
    await app.submitLine('Apple cake', 'ingredient', '   ');
    assert.deepEqual(await app.ingredients('Apple cake'), []);
  });
});
