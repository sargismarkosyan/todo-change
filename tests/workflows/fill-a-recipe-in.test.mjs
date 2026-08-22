// specs/workflows/fill-a-recipe-in.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workflow } from '../support/covers.mjs';
import { openAppWithContents, openStore, storedBooks, drafts, fakeModel } from '../support/app.mjs';

workflow('fill-a-recipe-in', () => {
  test('a recipe stops being a name only', async () => {
    const app = await openAppWithContents('Apple cake');

    await app.openRecipe('Apple cake');
    await app.addIngredient('Apple cake', '200g plain flour');
    await app.addIngredient('Apple cake', '3 apples');
    await app.addStep('Apple cake', 'Heat the oven to 180C');

    assert.deepEqual(await app.ingredients('Apple cake'), ['200g plain flour', '3 apples']);
    assert.deepEqual(await app.method('Apple cake'), ['Heat the oven to 180C']);
  });

  test('it is still filled in next time', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.give('Apple cake', 'ingredient', ['3 apples']);

    const back = await app.reload();
    await back.openRecipe('Apple cake');

    assert.deepEqual(await back.ingredients('Apple cake'), ['3 apples']);
  });

  test('the AI fills the long half in, a line at a time', async () => {
    const model = fakeModel({ drafts: drafts(['3 apples', '200g plain flour'], ['Heat the oven']) });
    const app = await openStore(
      storedBooks([{ id: 'b1', name: 'Sweets', recipes: [{ id: 'r1', name: 'Apple cake' }] }], 'b1'),
      model,
    );
    await app.acceptOffer();

    await app.openRecipe('Apple cake');
    await app.askForDraft('Apple cake');
    await app.acceptProposal('3 apples');

    assert.deepEqual(
      await app.ingredients('Apple cake'),
      ['3 apples'],
      'only the accepted line is written down',
    );

    const back = await app.reload();
    await back.openRecipe('Apple cake');
    assert.deepEqual(await back.ingredients('Apple cake'), ['3 apples']);
    assert.deepEqual(await back.method('Apple cake'), [], 'nothing nobody accepted survived');
  });
});
