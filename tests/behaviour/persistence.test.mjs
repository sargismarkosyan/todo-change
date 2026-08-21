// specs/features/storage/persistence.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

rule('persist-across-reload', () => {
  test('names and order both come back', async () => {
    const app = await openAppWithContents('Lemon drizzle', 'Apple cake');
    assert.deepEqual(await (await app.reload()).contents(), ['Lemon drizzle', 'Apple cake']);
  });
});

rule('persist-deletions', () => {
  test('deleting then reloading', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.deleteRecipe('Apple cake');
    assert.deepEqual(await (await app.reload()).contents(), []);
  });
});

rule('persist-sub-todos', () => {
  test('a whole recipe survives a reload', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.give('Apple cake', 'ingredient', ['200g plain flour', '3 apples']);
    await app.give('Apple cake', 'step', ['Heat the oven to 180C', 'Peel and slice the apples']);

    const back = await app.reload();
    await back.openRecipe('Apple cake');

    assert.deepEqual(await back.ingredients('Apple cake'), ['200g plain flour', '3 apples']);
    assert.deepEqual(await back.method('Apple cake'), [
      'Heat the oven to 180C',
      'Peel and slice the apples',
    ]);
  });

  test('a reload opens the book on its contents, with everything closed', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.openRecipe('Apple cake');
    assert.equal(await (await app.reload()).isOpen('Apple cake'), false);
  });
});

rule('persist-notepads', () => {
  test('two books and a reload', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.renameBook('Sweets');
    await app.makeBook('Dinner');
    await app.writeDown('Roast chicken');

    const back = await app.reload();
    assert.equal(await back.openBook(), 'Dinner');
    assert.deepEqual(await back.contents(), ['Roast chicken']);

    await back.openBookNamed('Sweets');
    assert.deepEqual(await back.contents(), ['Apple cake']);
  });
});
