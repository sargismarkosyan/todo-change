// specs/workflows/correct-a-line.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workflow } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

const dictatedOutOfOrder = async () => {
  const app = await openAppWithContents('Apple cake');
  await app.give('Apple cake', 'step', ['Cream the butter and sugar', 'Heat the oven to 180C']);
  return app;
};

workflow('correct-a-line', () => {
  test('a step dictated out of order is put first', async () => {
    const app = await dictatedOutOfOrder();

    await app.openRecipe('Apple cake');
    await app.moveLineUp('Heat the oven to 180C');

    assert.deepEqual(await app.method('Apple cake'), [
      'Heat the oven to 180C',
      'Cream the butter and sugar',
    ]);
  });

  test('the correction survives being closed', async () => {
    const app = await dictatedOutOfOrder();
    await app.openRecipe('Apple cake');
    await app.moveLineUp('Heat the oven to 180C');

    const back = await app.reload();
    await back.openRecipe('Apple cake');

    assert.deepEqual(await back.method('Apple cake'), [
      'Heat the oven to 180C',
      'Cream the butter and sugar',
    ]);
  });

  test('a line stays in its own group', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.give('Apple cake', 'ingredient', ['200g plain flour', '3 apples']);
    await app.give('Apple cake', 'step', ['Heat the oven to 180C']);

    await app.openRecipe('Apple cake');
    await app.moveLineDown('3 apples');

    assert.deepEqual(await app.ingredients('Apple cake'), ['200g plain flour', '3 apples']);
    assert.deepEqual(await app.method('Apple cake'), ['Heat the oven to 180C']);
  });
});
