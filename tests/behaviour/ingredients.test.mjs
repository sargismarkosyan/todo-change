// specs/features/recipes/ingredients.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

/** The Background: one recipe, open. */
function open() {
  const app = openAppWithContents('Apple cake');
  app.openRecipe('Apple cake');
  return app;
}

rule('ingredient-added-to-recipe', () => {
  test('the first thing it takes', () => {
    const app = open();
    app.addIngredient('Apple cake', '200g plain flour');

    assert.deepEqual(app.ingredients('Apple cake'), ['200g plain flour']);
    assert.deepEqual(app.method('Apple cake'), [], 'the method is a different group');
  });

  test('the recipe stays where it was in the contents', () => {
    const app = openAppWithContents('Lemon drizzle', 'Apple cake');
    app.openRecipe('Apple cake');
    app.addIngredient('Apple cake', '3 apples');

    assert.deepEqual(app.contents(), ['Lemon drizzle', 'Apple cake']);
  });
});

rule('ingredients-keep-typing-order', () => {
  test('three things, in the order they were read out', () => {
    const app = open();
    app.addIngredient('Apple cake', '200g plain flour');
    app.addIngredient('Apple cake', '3 apples');
    app.addIngredient('Apple cake', 'a good pinch of salt');

    assert.deepEqual(app.ingredients('Apple cake'), [
      '200g plain flour',
      '3 apples',
      'a good pinch of salt',
    ]);
  });
});

rule('ingredient-rejects-blank', () => {
  test('submitting only spaces', () => {
    const app = open();
    app.submitLine('Apple cake', 'ingredient', '   ');
    assert.deepEqual(app.ingredients('Apple cake'), []);
  });
});
