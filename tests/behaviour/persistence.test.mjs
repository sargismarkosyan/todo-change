// specs/features/storage/persistence.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

rule('persist-across-reload', () => {
  test('names and order both come back', () => {
    const app = openAppWithContents('Lemon drizzle', 'Apple cake');
    assert.deepEqual(app.reload().contents(), ['Lemon drizzle', 'Apple cake']);
  });
});

rule('persist-deletions', () => {
  test('deleting then reloading', () => {
    const app = openAppWithContents('Apple cake');
    app.deleteRecipe('Apple cake');
    assert.deepEqual(app.reload().contents(), []);
  });
});

rule('persist-sub-todos', () => {
  test('a whole recipe survives a reload', () => {
    const app = openAppWithContents('Apple cake');
    app.give('Apple cake', 'ingredient', ['200g plain flour', '3 apples']);
    app.give('Apple cake', 'step', ['Heat the oven to 180C', 'Peel and slice the apples']);

    const back = app.reload();
    back.openRecipe('Apple cake');

    assert.deepEqual(back.ingredients('Apple cake'), ['200g plain flour', '3 apples']);
    assert.deepEqual(back.method('Apple cake'), [
      'Heat the oven to 180C',
      'Peel and slice the apples',
    ]);
  });

  test('a reload opens the book on its contents, with everything closed', () => {
    const app = openAppWithContents('Apple cake');
    app.openRecipe('Apple cake');
    assert.equal(app.reload().isOpen('Apple cake'), false);
  });
});

rule('persist-notepads', () => {
  test('two books and a reload', () => {
    const app = openAppWithContents('Apple cake');
    app.renameBook('Sweets');
    app.makeBook('Dinner');
    app.writeDown('Roast chicken');

    const back = app.reload();
    assert.equal(back.openBook(), 'Dinner');
    assert.deepEqual(back.contents(), ['Roast chicken']);

    back.openBookNamed('Sweets');
    assert.deepEqual(back.contents(), ['Apple cake']);
  });
});
