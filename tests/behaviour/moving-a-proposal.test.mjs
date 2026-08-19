// specs/features/suggesting/moving-a-proposal.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { at, drafts, fakeModel, openApp } from '../support/app.mjs';

/** The Background: "Apple pie" open, two steps in it, one drafted at the end. */
async function book() {
  const app = openApp(
    fakeModel({ drafts: drafts([], [at(2, 'Rub the butter into the flour')]) }),
  );
  app.renameBook('Sweets');
  app.writeDown('Apple pie');
  await app.settle();
  if (app.offeredAi()) app.acceptOffer();
  app.give('Apple pie', 'step', ['Heat the oven to 180C', 'Bake for 45 minutes']);
  app.openRecipe('Apple pie');
  app.askForDraft('Apple pie');
  await app.settle();
  return app;
}

rule('proposal-can-be-moved', () => {
  test('putting one where the model should have put it', async () => {
    const app = await book();
    app.moveLineUp('Rub the butter into the flour');

    assert.deepEqual(app.groupReads('Apple pie', 'steps'), [
      ['Heat the oven to 180C', 'mine'],
      ['Rub the butter into the flour', 'proposed'],
      ['Bake for 45 minutes', 'mine'],
    ]);
  });

  test('the arrow keys move it too', async () => {
    const app = await book();
    app.focusHandle('Rub the butter into the flour');
    app.pressArrow('ArrowUp');

    assert.deepEqual(app.groupReads('Apple pie', 'steps'), [
      ['Heat the oven to 180C', 'mine'],
      ['Rub the butter into the flour', 'proposed'],
      ['Bake for 45 minutes', 'mine'],
    ]);
  });

  test('moving it does not write it down', async () => {
    const app = await book();
    app.moveLineUp('Rub the butter into the flour');

    const back = app.reload();
    back.openRecipe('Apple pie');
    assert.deepEqual(back.method('Apple pie'), [
      'Heat the oven to 180C',
      'Bake for 45 minutes',
    ]);
  });

  test('moved, then taken, and it stays where it was put', async () => {
    const app = await book();
    app.moveLineUp('Rub the butter into the flour');
    app.acceptProposal('Rub the butter into the flour');

    assert.deepEqual(app.method('Apple pie'), [
      'Heat the oven to 180C',
      'Rub the butter into the flour',
      'Bake for 45 minutes',
    ]);
  });

  test('a line you wrote still moves, with a draft on screen', async () => {
    const app = await book();
    app.moveLineUp('Bake for 45 minutes');

    assert.deepEqual(app.method('Apple pie'), [
      'Bake for 45 minutes',
      'Heat the oven to 180C',
    ]);
  });
});
