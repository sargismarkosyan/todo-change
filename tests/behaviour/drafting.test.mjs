// specs/features/suggesting/drafting.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { fakeModel, openApp } from '../support/app.mjs';

/**
 * The Background: "Sweets" open, "Apple pie" in it and open, the AI on.
 *
 * The model is always a fake — jsdom has none, and nothing here asserts what a
 * model says. What is asserted is what the app does with an answer.
 */
async function book(model) {
  const app = openApp(model);
  app.renameBook('Sweets');
  app.writeDown('Apple pie');
  await app.settle();
  if (app.offeredAi()) app.acceptOffer();
  app.openRecipe('Apple pie');
  return app;
}

const drafts = (ingredients, steps = []) => ({ ingredients, steps });

rule('draft-proposes-both-groups', () => {
  test('a bare name, filled in', async () => {
    const app = await book(
      fakeModel({ drafts: drafts(['200g plain flour', '3 apples'], ['Heat the oven to 180C']) }),
    );

    app.askForDraft('Apple pie');
    await app.settle();

    assert.deepEqual(app.proposed('ingredients'), ['200g plain flour', '3 apples']);
    assert.deepEqual(app.proposed('steps'), ['Heat the oven to 180C']);
    assert.deepEqual(app.ingredients('Apple pie'), [], 'not one line is written down');
    assert.deepEqual(app.method('Apple pie'), []);
  });

  test('a proposal is not written down, so it does not survive the tab', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples']) }));
    app.askForDraft('Apple pie');
    await app.settle();

    const back = app.reload();
    back.openRecipe('Apple pie');
    assert.deepEqual(back.ingredients('Apple pie'), []);
  });

  test('a line the model repeats is offered once', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples', '3 apples', ' 3 apples ']) }));
    app.askForDraft('Apple pie');
    await app.settle();
    assert.deepEqual(app.proposed('ingredients'), ['3 apples']);
  });
});

rule('draft-accepted-line-by-line', () => {
  test('taking one of two', async () => {
    const app = await book(fakeModel({ drafts: drafts(['200g plain flour', '3 apples']) }));

    app.askForDraft('Apple pie');
    await app.settle();
    app.acceptProposal('3 apples');

    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples']);
    assert.deepEqual(app.proposed('ingredients'), ['200g plain flour']);
  });

  test('the method takes the order they were accepted in', async () => {
    const app = await book(
      fakeModel({ drafts: drafts([], ['Heat the oven to 180C', 'Peel and slice the apples']) }),
    );

    app.askForDraft('Apple pie');
    await app.settle();
    app.acceptProposal('Peel and slice the apples');
    app.acceptProposal('Heat the oven to 180C');

    assert.deepEqual(app.method('Apple pie'), [
      'Peel and slice the apples',
      'Heat the oven to 180C',
    ]);
  });

  test('once taken it is an ordinary line, and goes the ordinary way', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples']) }));
    app.askForDraft('Apple pie');
    await app.settle();
    app.acceptProposal('3 apples');

    app.deleteLine('3 apples');
    assert.deepEqual(app.ingredients('Apple pie'), []);
  });

  test('an accepted line is written down, not just shown', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples']) }));
    app.askForDraft('Apple pie');
    await app.settle();
    app.acceptProposal('3 apples');

    const back = app.reload();
    back.openRecipe('Apple pie');
    assert.deepEqual(back.ingredients('Apple pie'), ['3 apples']);
  });
});

rule('draft-does-not-touch-what-is-there', () => {
  test('a recipe already half typed', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples', '200g plain flour']) }));
    app.addIngredient('Apple pie', '3 apples');

    app.askForDraft('Apple pie');
    await app.settle();

    assert.deepEqual(app.proposed('ingredients'), ['200g plain flour']);
    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples']);
  });

  test('what was typed stays where it was typed', async () => {
    const app = await book(fakeModel({ drafts: drafts(['200g plain flour']) }));
    app.addIngredient('Apple pie', '3 apples');

    app.askForDraft('Apple pie');
    await app.settle();
    app.acceptProposal('200g plain flour');

    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples', '200g plain flour']);
  });

  test('a line already there is not proposed back, whatever case it wears', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 Apples', '200g plain flour']) }));
    app.addIngredient('Apple pie', '3 apples');

    app.askForDraft('Apple pie');
    await app.settle();

    assert.deepEqual(app.proposed('ingredients'), ['200g plain flour']);
  });

  test('the method is left alone while the ingredients are drafted', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples'], []) }));
    app.addStep('Apple pie', 'Heat the oven to 180C');

    app.askForDraft('Apple pie');
    await app.settle();

    assert.deepEqual(app.method('Apple pie'), ['Heat the oven to 180C']);
    assert.deepEqual(app.proposed('steps'), []);
  });
});
