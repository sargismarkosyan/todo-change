// specs/features/recipes/reading.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

/** The book of the Background: two recipes, one of them written out in full. */
async function book() {
  const app = await openAppWithContents('Apple cake', 'Lemon drizzle');
  await app.give('Apple cake', 'ingredient', ['200g plain flour', '3 apples']);
  await app.give('Apple cake', 'step', ['Heat the oven to 180C', 'Peel and slice the apples']);
  return app;
}

rule('recipe-opens-to-be-read', () => {
  test('looking up the apple cake', async () => {
    const app = await book();
    await app.openRecipe('Apple cake');

    assert.equal(await app.isOpen('Apple cake'), true);
    assert.deepEqual(await app.ingredients('Apple cake'), ['200g plain flour', '3 apples']);
    assert.deepEqual(await app.method('Apple cake'), [
      'Heat the oven to 180C',
      'Peel and slice the apples',
    ]);
    assert.equal(
      await app.ingredientsComeFirst('Apple cake'),
      true,
      'the ingredients answer "can I make this tonight" and go first',
    );
  });

  test('a closed recipe is only its name', async () => {
    const app = await book();
    await app.give('Lemon drizzle', 'ingredient', ['2 lemons']);

    assert.equal(await app.isOpen('Lemon drizzle'), false);
    assert.deepEqual(await app.ingredients('Lemon drizzle'), []);
    assert.deepEqual(await app.method('Lemon drizzle'), []);
  });
});

rule('one-recipe-open-at-a-time', () => {
  test('changing your mind at the contents', async () => {
    const app = await book();
    await app.openRecipe('Apple cake');
    await app.openRecipe('Lemon drizzle');

    assert.equal(await app.isOpen('Lemon drizzle'), true);
    assert.equal(await app.isOpen('Apple cake'), false);
  });

  test('closing the one you opened leaves the contents whole', async () => {
    const app = await book();
    await app.openRecipe('Apple cake');
    await app.closeRecipe('Apple cake');

    assert.equal(await app.isOpen('Apple cake'), false);
    assert.deepEqual(await app.contents(), ['Apple cake', 'Lemon drizzle']);
  });
});

rule('nothing-is-ticked-off', () => {
  test('a recipe is kept, not finished', async () => {
    const app = await book();
    await app.openRecipe('Apple cake');
    assert.equal(await app.offersTickBox(), false, 'nothing in a book can be ticked off');
  });

  test('nor is anything inside one', async () => {
    const app = await book();
    await app.openRecipe('Apple cake');
    await app.addIngredient('Apple cake', 'a good pinch of salt');
    await app.addStep('Apple cake', 'Bake for forty minutes');
    assert.equal(await app.offersTickBox(), false);
  });
});
