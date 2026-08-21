// specs/features/suggesting/moving-a-proposal.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { at, drafts, fakeModel, openApp } from '../support/app.mjs';

/** The Background: "Apple pie" open, two steps in it, one drafted at the end. */
async function book() {
  const app = await openApp(
    fakeModel({ drafts: drafts([], [at(2, 'Rub the butter into the flour')]) }),
  );
  await app.renameBook('Sweets');
  await app.writeDown('Apple pie');
  await app.settle();
  if (await app.offeredAi()) await app.acceptOffer();
  await app.give('Apple pie', 'step', ['Heat the oven to 180C', 'Bake for 45 minutes']);
  await app.openRecipe('Apple pie');
  await app.askForDraft('Apple pie');
  await app.settle();
  return app;
}

rule('proposal-can-be-moved', () => {
  test('putting one where the model should have put it', async () => {
    const app = await book();
    await app.moveLineUp('Rub the butter into the flour');

    assert.deepEqual(await app.groupReads('Apple pie', 'steps'), [
      ['Heat the oven to 180C', 'mine'],
      ['Rub the butter into the flour', 'proposed'],
      ['Bake for 45 minutes', 'mine'],
    ]);
  });

  test('the arrow keys move it too', async () => {
    const app = await book();
    await app.focusHandle('Rub the butter into the flour');
    await app.pressArrow('ArrowUp');

    assert.deepEqual(await app.groupReads('Apple pie', 'steps'), [
      ['Heat the oven to 180C', 'mine'],
      ['Rub the butter into the flour', 'proposed'],
      ['Bake for 45 minutes', 'mine'],
    ]);
  });

  test('moving it does not write it down', async () => {
    const app = await book();
    await app.moveLineUp('Rub the butter into the flour');

    const back = await app.reload();
    await back.openRecipe('Apple pie');
    assert.deepEqual(await back.method('Apple pie'), [
      'Heat the oven to 180C',
      'Bake for 45 minutes',
    ]);
  });

  test('moved, then taken, and it stays where it was put', async () => {
    const app = await book();
    await app.moveLineUp('Rub the butter into the flour');
    await app.acceptProposal('Rub the butter into the flour');

    assert.deepEqual(await app.method('Apple pie'), [
      'Heat the oven to 180C',
      'Rub the butter into the flour',
      'Bake for 45 minutes',
    ]);
  });

  test('a line you wrote still moves, with a draft on screen', async () => {
    const app = await book();
    await app.moveLineUp('Bake for 45 minutes');

    assert.deepEqual(await app.method('Apple pie'), [
      'Bake for 45 minutes',
      'Heat the oven to 180C',
    ]);
  });
});
