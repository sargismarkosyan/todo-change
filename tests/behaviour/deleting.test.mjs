// specs/features/recipes/deleting.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

rule('delete-removes-only-that-one', () => {
  test('deleting the middle of three recipes', () => {
    const app = openAppWithContents('Lemon drizzle', 'Apple cake', 'Roast chicken');
    app.deleteRecipe('Apple cake');
    assert.deepEqual(app.contents(), ['Lemon drizzle', 'Roast chicken']);
  });

  test('deleting one ingredient out of a recipe', () => {
    const app = openAppWithContents('Apple cake');
    app.give('Apple cake', 'ingredient', ['200g plain flour', '3 apples']);
    app.openRecipe('Apple cake');
    app.deleteLine('3 apples');
    assert.deepEqual(app.ingredients('Apple cake'), ['200g plain flour']);
  });

  test('deleting one step leaves the rest of the method', () => {
    const app = openAppWithContents('Apple cake');
    app.give('Apple cake', 'step', ['Heat the oven to 180C', 'Bake for forty minutes']);
    app.openRecipe('Apple cake');
    app.deleteLine('Heat the oven to 180C');
    assert.deepEqual(app.method('Apple cake'), ['Bake for forty minutes']);
  });
});

rule('delete-parent-deletes-sub-todos', () => {
  test('the whole thing goes at once', () => {
    const app = openAppWithContents('Apple cake');
    app.give('Apple cake', 'ingredient', ['200g plain flour']);
    app.give('Apple cake', 'step', ['Heat the oven to 180C']);

    app.deleteRecipe('Apple cake');
    assert.deepEqual(app.contents(), []);
    assert.equal(
      app.stored().includes('200g plain flour'),
      false,
      'the ingredients went with it',
    );
  });
});
