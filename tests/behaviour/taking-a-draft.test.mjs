// specs/features/suggesting/taking-a-draft.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { at, drafts, fakeModel, openApp } from '../support/app.mjs';

/** The Background: "Apple pie" open, with two steps already in it. */
async function book(model, { method = ['Heat the oven to 180C', 'Bake for 45 minutes'] } = {}) {
  const app = await openApp(model);
  await app.renameBook('Sweets');
  await app.writeDown('Apple pie');
  await app.settle();
  if (await app.offeredAi()) await app.acceptOffer();
  if (method.length > 0) await app.give('Apple pie', 'step', method);
  await app.openRecipe('Apple pie');
  return app;
}

rule('draft-taken-whole', () => {
  test('a bare recipe, filled in at once', async () => {
    const app = await book(
      fakeModel({
        drafts: drafts([], ['Heat the oven to 180C', 'Peel and slice the apples', 'Bake for 45 minutes']),
      }),
      { method: [] },
    );

    await app.askForDraft('Apple pie');
    await app.settle();
    await app.takeWholeDraft();

    assert.deepEqual(await app.method('Apple pie'), [
      'Heat the oven to 180C',
      'Peel and slice the apples',
      'Bake for 45 minutes',
    ]);
    assert.equal(await app.hasProposals(), false);
  });

  test('the ones in the middle stay in the middle', async () => {
    const app = await book(
      fakeModel({
        drafts: drafts([], [at(1, 'Rub the butter into the flour'), at(1, 'Peel and slice the apples')]),
      }),
    );

    await app.askForDraft('Apple pie');
    await app.settle();
    await app.takeWholeDraft();

    assert.deepEqual(await app.method('Apple pie'), [
      'Heat the oven to 180C',
      'Rub the butter into the flour',
      'Peel and slice the apples',
      'Bake for 45 minutes',
    ]);
  });

  test('it takes both groups in one press', async () => {
    const app = await book(
      fakeModel({ drafts: drafts([at(0, '200g plain flour')], [at(2, 'Dust it with sugar')]) }),
    );

    await app.askForDraft('Apple pie');
    await app.settle();
    await app.takeWholeDraft();

    assert.deepEqual(await app.ingredients('Apple pie'), ['200g plain flour']);
    assert.deepEqual(await app.method('Apple pie'), [
      'Heat the oven to 180C',
      'Bake for 45 minutes',
      'Dust it with sugar',
    ]);
  });

  test('what it wrote is written down, not just shown', async () => {
    const app = await book(fakeModel({ drafts: drafts([], [at(1, 'Peel and slice the apples')]) }));

    await app.askForDraft('Apple pie');
    await app.settle();
    await app.takeWholeDraft();

    const back = await app.reload();
    await back.openRecipe('Apple pie');
    assert.deepEqual(await back.method('Apple pie'), [
      'Heat the oven to 180C',
      'Peel and slice the apples',
      'Bake for 45 minutes',
    ]);
  });
});
