// specs/features/suggesting/turning-a-draft-down.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { drafts, fakeModel, openApp } from '../support/app.mjs';

/** The Background: "Sweets" open, "Apple pie" in it and open. */
async function book(model, { on = true } = {}) {
  const app = openApp(model);
  app.model = model;
  app.renameBook('Sweets');
  app.writeDown('Apple pie');
  await app.settle();
  if (app.offeredAi()) {
    if (on) app.acceptOffer();
    else app.dismissOffer();
  }
  app.openRecipe('Apple pie');
  return app;
}


rule('draft-dismissed-changes-nothing', () => {
  test('none of it was any good', async () => {
    const app = await book(fakeModel({ drafts: drafts(['200g plain flour'], ['Heat the oven']) }));

    app.askForDraft('Apple pie');
    await app.settle();
    app.dismissDraft();

    assert.deepEqual(app.proposed('ingredients'), []);
    assert.deepEqual(app.proposed('steps'), []);
    assert.deepEqual(app.ingredients('Apple pie'), []);
    assert.deepEqual(app.method('Apple pie'), []);
  });

  test('what was taken before dismissing stays taken', async () => {
    const app = await book(fakeModel({ drafts: drafts(['200g plain flour', '3 apples']) }));

    app.askForDraft('Apple pie');
    await app.settle();
    app.acceptProposal('3 apples');
    app.dismissDraft();

    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples']);
  });

  test('closing the recipe puts the draft away with it', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples']) }));
    app.askForDraft('Apple pie');
    await app.settle();

    app.closeRecipe('Apple pie');
    app.openRecipe('Apple pie');
    assert.deepEqual(app.proposed('ingredients'), []);
  });
});

rule('draft-can-fail', () => {
  test('nothing came back', async () => {
    const app = await book(fakeModel({ drafts: drafts([], []) }));

    app.askForDraft('Apple pie');
    await app.settle();

    assert.equal(app.note(), 'Nothing drafted.');
    assert.deepEqual(app.ingredients('Apple pie'), []);
  });

  test('nothing usable came back', async () => {
    const app = await book(fakeModel({ drafts: drafts(['', '   '], [null]) }));

    app.askForDraft('Apple pie');
    await app.settle();

    assert.equal(app.note(), 'Nothing drafted.');
    assert.deepEqual(app.ingredients('Apple pie'), []);
  });

  test('the model failed', async () => {
    const app = await book(fakeModel({ fails: true }));

    app.askForDraft('Apple pie');
    await app.settle();

    assert.equal(app.note(), 'The draft could not be written.');
    assert.deepEqual(app.ingredients('Apple pie'), []);
  });

  test('a failure leaves the recipe writable by hand', async () => {
    const app = await book(fakeModel({ fails: true }));
    app.askForDraft('Apple pie');
    await app.settle();

    app.addIngredient('Apple pie', '3 apples');
    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples']);
  });

  test('an answer for a recipe that has gone lands nowhere', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples']), holds: true }));

    app.askForDraft('Apple pie');
    app.deleteRecipe('Apple pie');
    app.model.answers();
    await app.settle();

    assert.deepEqual(app.contents(), []);
  });

  test('an answer that arrives after the AI is switched off is dropped', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples']), holds: true }));

    app.askForDraft('Apple pie');
    app.toggleAi();
    app.model.answers();
    await app.settle();

    app.openRecipe('Apple pie');
    assert.equal(app.hasProposals(), false);
    assert.deepEqual(app.ingredients('Apple pie'), []);
  });
});

rule('draft-needs-the-ai-on', () => {
  test('a browser that will never have one', async () => {
    const app = await book(null);

    assert.equal(app.offersDraft('Apple pie'), false);
    assert.equal(app.mentionsModel(), false, 'nothing explains the absence either');
  });

  test('a machine that cannot run it', async () => {
    const app = await book(fakeModel({ state: 'unavailable' }));
    assert.equal(app.offersDraft('Apple pie'), false);
  });

  test('switched off', async () => {
    const app = await book(fakeModel({ state: 'available' }), { on: false });
    assert.equal(app.offersDraft('Apple pie'), false);
  });

  test('writing it out by hand is untouched', async () => {
    const app = await book(null);

    app.addIngredient('Apple pie', '3 apples');
    app.addStep('Apple pie', 'Heat the oven to 180C');

    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples']);
    assert.deepEqual(app.method('Apple pie'), ['Heat the oven to 180C']);
  });
});
