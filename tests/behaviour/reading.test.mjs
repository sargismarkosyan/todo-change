// specs/features/recipes/reading.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

/** The book of the Background: two recipes, one of them written out in full. */
function book() {
  const app = openAppWithContents('Apple cake', 'Lemon drizzle');
  app.give('Apple cake', 'ingredient', ['200g plain flour', '3 apples']);
  app.give('Apple cake', 'step', ['Heat the oven to 180C', 'Peel and slice the apples']);
  return app;
}

rule('recipe-opens-to-be-read', () => {
  test('looking up the apple cake', () => {
    const app = book();
    app.openRecipe('Apple cake');

    assert.equal(app.isOpen('Apple cake'), true);
    assert.deepEqual(app.ingredients('Apple cake'), ['200g plain flour', '3 apples']);
    assert.deepEqual(app.method('Apple cake'), [
      'Heat the oven to 180C',
      'Peel and slice the apples',
    ]);
    assert.equal(
      app.ingredientsComeFirst('Apple cake'),
      true,
      'the ingredients answer "can I make this tonight" and go first',
    );
  });

  test('a closed recipe is only its name', () => {
    const app = book();
    app.give('Lemon drizzle', 'ingredient', ['2 lemons']);

    assert.equal(app.isOpen('Lemon drizzle'), false);
    assert.deepEqual(app.ingredients('Lemon drizzle'), []);
    assert.deepEqual(app.method('Lemon drizzle'), []);
  });
});

rule('one-recipe-open-at-a-time', () => {
  test('changing your mind at the contents', () => {
    const app = book();
    app.openRecipe('Apple cake');
    app.openRecipe('Lemon drizzle');

    assert.equal(app.isOpen('Lemon drizzle'), true);
    assert.equal(app.isOpen('Apple cake'), false);
  });

  test('closing the one you opened leaves the contents whole', () => {
    const app = book();
    app.openRecipe('Apple cake');
    app.closeRecipe('Apple cake');

    assert.equal(app.isOpen('Apple cake'), false);
    assert.deepEqual(app.contents(), ['Apple cake', 'Lemon drizzle']);
  });
});

rule('nothing-is-ticked-off', () => {
  test('a recipe is kept, not finished', () => {
    const app = book();
    app.openRecipe('Apple cake');
    assert.equal(app.offersTickBox(), false, 'nothing in a book can be ticked off');
  });

  test('nor is anything inside one', () => {
    const app = book();
    app.openRecipe('Apple cake');
    app.addIngredient('Apple cake', 'a good pinch of salt');
    app.addStep('Apple cake', 'Bake for forty minutes');
    assert.equal(app.offersTickBox(), false);
  });
});
