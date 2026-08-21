// specs/features/suggesting/drafting.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { at, drafts, fakeModel, openApp } from '../support/app.mjs';

/**
 * The Background: "Sweets" open, "Apple pie" in it and open, the AI on.
 *
 * The model is always a fake — jsdom has none, and nothing here asserts what a
 * model says. What is asserted is what the app does with an answer.
 */
async function book(model) {
  const app = await openApp(model);
  await app.renameBook('Sweets');
  await app.writeDown('Apple pie');
  await app.settle();
  if (await app.offeredAi()) await app.acceptOffer();
  await app.openRecipe('Apple pie');
  return app;
}


rule('draft-proposes-both-groups', () => {
  test('a bare name, filled in', async () => {
    const app = await book(
      fakeModel({ drafts: drafts(['200g plain flour', '3 apples'], ['Heat the oven to 180C']) }),
    );

    await app.askForDraft('Apple pie');
    await app.settle();

    assert.deepEqual(await app.proposed('ingredients'), ['200g plain flour', '3 apples']);
    assert.deepEqual(await app.proposed('steps'), ['Heat the oven to 180C']);
    assert.deepEqual(await app.ingredients('Apple pie'), [], 'not one line is written down');
    assert.deepEqual(await app.method('Apple pie'), []);
  });

  test('a proposal is not written down, so it does not survive the tab', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples']) }));
    await app.askForDraft('Apple pie');
    await app.settle();

    const back = await app.reload();
    await back.openRecipe('Apple pie');
    assert.deepEqual(await back.ingredients('Apple pie'), []);
  });

  test('a line the model repeats is offered once', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples', '3 apples', ' 3 apples ']) }));
    await app.askForDraft('Apple pie');
    await app.settle();
    assert.deepEqual(await app.proposed('ingredients'), ['3 apples']);
  });
});

rule('draft-accepted-line-by-line', () => {
  test('taking one of two', async () => {
    const app = await book(fakeModel({ drafts: drafts(['200g plain flour', '3 apples']) }));

    await app.askForDraft('Apple pie');
    await app.settle();
    await app.acceptProposal('3 apples');

    assert.deepEqual(await app.ingredients('Apple pie'), ['3 apples']);
    assert.deepEqual(await app.proposed('ingredients'), ['200g plain flour']);
  });

  test('taking one out of the middle leaves it in the middle', async () => {
    const app = await book(
      fakeModel({ drafts: drafts([], [at(1, 'Peel and slice the apples')]) }),
    );
    await app.give('Apple pie', 'step', ['Heat the oven to 180C', 'Bake for 45 minutes']);
    await app.openRecipe('Apple pie');

    await app.askForDraft('Apple pie');
    await app.settle();
    await app.acceptProposal('Peel and slice the apples');

    assert.deepEqual(await app.method('Apple pie'), [
      'Heat the oven to 180C',
      'Peel and slice the apples',
      'Bake for 45 minutes',
    ]);
  });

  test('taken out of order, they still land in the drafted order', async () => {
    const app = await book(
      fakeModel({ drafts: drafts([], ['Heat the oven to 180C', 'Peel and slice the apples']) }),
    );

    await app.askForDraft('Apple pie');
    await app.settle();
    await app.acceptProposal('Peel and slice the apples');
    await app.acceptProposal('Heat the oven to 180C');

    assert.deepEqual(await app.method('Apple pie'), [
      'Heat the oven to 180C',
      'Peel and slice the apples',
    ]);
  });

  test('once taken it is an ordinary line, and goes the ordinary way', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples']) }));
    await app.askForDraft('Apple pie');
    await app.settle();
    await app.acceptProposal('3 apples');

    await app.deleteLine('3 apples');
    assert.deepEqual(await app.ingredients('Apple pie'), []);
  });

  test('an accepted line is written down, not just shown', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples']) }));
    await app.askForDraft('Apple pie');
    await app.settle();
    await app.acceptProposal('3 apples');

    const back = await app.reload();
    await back.openRecipe('Apple pie');
    assert.deepEqual(await back.ingredients('Apple pie'), ['3 apples']);
  });
});
