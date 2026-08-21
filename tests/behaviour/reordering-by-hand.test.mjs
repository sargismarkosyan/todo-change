// specs/features/recipes/reordering-by-hand.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { at, drafts, fakeModel, openApp } from '../support/app.mjs';

/** The Background: "Apple pie" open, with two steps in it. */
async function book(model = null) {
  const app = await openApp(model);
  await app.renameBook('Sweets');
  await app.writeDown('Apple pie');
  await app.settle();
  if (await app.offeredAi()) await app.acceptOffer();
  await app.give('Apple pie', 'step', ['Heat the oven to 190C', 'Bake for 45 minutes']);
  await app.openRecipe('Apple pie');
  return app;
}

rule('a-line-is-dragged-by-its-grip', () => {
  test('the words are not a handle', async () => {
    const app = await book();

    assert.equal(await app.canBeDraggedByItsWords('Bake for 45 minutes'), false);
    assert.equal(await app.canBeDraggedByItsGrip('Bake for 45 minutes'), true);
  });

  test('an ingredient is the same', async () => {
    const app = await book();
    await app.addIngredient('Apple pie', '3 apples');

    assert.equal(await app.canBeDraggedByItsWords('3 apples'), false);
    assert.equal(await app.canBeDraggedByItsGrip('3 apples'), true);
  });

  test('a proposal is the same', async () => {
    const app = await book(
      fakeModel({ drafts: drafts([], [at(1, 'Peel and slice the apples')]) }),
    );
    await app.askForDraft('Apple pie');
    await app.settle();

    assert.equal(await app.canBeDraggedByItsWords('Peel and slice the apples'), false);
    assert.equal(await app.canBeDraggedByItsGrip('Peel and slice the apples'), true);
  });
});

rule('the-grip-does-not-wait-to-be-found', () => {
  test('reading the method without touching anything', async () => {
    const app = await book();

    assert.ok(await app.everyRowShowsItsGrip('Apple pie', 'steps'));
    assert.equal(
      await app.gripSolidity('Bake for 45 minutes'),
      '1',
      'the step number is drawn by the grip, so a grip that faded would take it',
    );
  });

  test('an ingredient has one too', async () => {
    const app = await book();
    await app.addIngredient('Apple pie', '3 apples');

    assert.ok(await app.everyRowShowsItsGrip('Apple pie', 'ingredients'));
  });
});
