// specs/features/suggesting/placing-a-draft.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { at, drafts, fakeModel, openApp } from '../support/app.mjs';

/** The Background: "Apple pie" open, with two steps already in it. */
async function book(model) {
  const app = openApp(model);
  app.renameBook('Sweets');
  app.writeDown('Apple pie');
  await app.settle();
  if (app.offeredAi()) app.acceptOffer();
  app.give('Apple pie', 'step', ['Heat the oven to 180C', 'Bake for 45 minutes']);
  app.openRecipe('Apple pie');
  return app;
}

rule('draft-lands-where-the-model-put-it', () => {
  test('between two lines that are already there', async () => {
    const app = await book(fakeModel({ drafts: drafts([], [at(1, 'Rub the butter into the flour')]) }));

    app.askForDraft('Apple pie');
    await app.settle();

    assert.deepEqual(app.groupReads('Apple pie', 'steps'), [
      ['Heat the oven to 180C', 'mine'],
      ['Rub the butter into the flour', 'proposed'],
      ['Bake for 45 minutes', 'mine'],
    ]);
  });

  test('at the very top', async () => {
    const app = await book(fakeModel({ drafts: drafts([], [at(0, 'Weigh everything out')]) }));

    app.askForDraft('Apple pie');
    await app.settle();

    assert.deepEqual(app.groupReads('Apple pie', 'steps'), [
      ['Weigh everything out', 'proposed'],
      ['Heat the oven to 180C', 'mine'],
      ['Bake for 45 minutes', 'mine'],
    ]);
  });

  test('several at one place, in the order they were drafted', async () => {
    const app = await book(
      fakeModel({
        drafts: drafts([], [at(1, 'Rub the butter into the flour'), at(1, 'Peel and slice the apples')]),
      }),
    );

    app.askForDraft('Apple pie');
    await app.settle();

    assert.deepEqual(app.groupReads('Apple pie', 'steps'), [
      ['Heat the oven to 180C', 'mine'],
      ['Rub the butter into the flour', 'proposed'],
      ['Peel and slice the apples', 'proposed'],
      ['Bake for 45 minutes', 'mine'],
    ]);
  });
});

rule('draft-index-out-of-range-lands-last', () => {
  test('past the end', async () => {
    const app = await book(fakeModel({ drafts: drafts([], [at(9, 'Dust it with sugar')]) }));

    app.askForDraft('Apple pie');
    await app.settle();

    assert.deepEqual(app.groupReads('Apple pie', 'steps'), [
      ['Heat the oven to 180C', 'mine'],
      ['Bake for 45 minutes', 'mine'],
      ['Dust it with sugar', 'proposed'],
    ]);
  });

  test('no place at all, or a nonsense one', async () => {
    const app = await book(
      fakeModel({
        drafts: drafts([], [{ text: 'Dust it with sugar' }, at('no', 'Grease the tin')]),
      }),
    );

    app.askForDraft('Apple pie');
    await app.settle();

    assert.deepEqual(app.groupReads('Apple pie', 'steps'), [
      ['Heat the oven to 180C', 'mine'],
      ['Bake for 45 minutes', 'mine'],
      ['Dust it with sugar', 'proposed'],
      ['Grease the tin', 'proposed'],
    ]);
  });
});

rule('draft-does-not-touch-what-is-there', () => {
  test('a recipe already half typed', async () => {
    const app = await book(
      fakeModel({ drafts: drafts([at(0, '3 apples'), at(1, '200g plain flour')]) }),
    );
    app.addIngredient('Apple pie', '3 apples');

    app.askForDraft('Apple pie');
    await app.settle();

    assert.deepEqual(app.proposed('ingredients'), ['200g plain flour']);
    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples']);
  });

  test('a line already there is not proposed back, whatever case it wears', async () => {
    const app = await book(
      fakeModel({ drafts: drafts([at(0, '3 Apples'), at(1, '200g plain flour')]) }),
    );
    app.addIngredient('Apple pie', '3 apples');

    app.askForDraft('Apple pie');
    await app.settle();

    assert.deepEqual(app.proposed('ingredients'), ['200g plain flour']);
  });
});
