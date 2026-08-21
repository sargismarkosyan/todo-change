// specs/features/suggesting/turning-a-draft-down.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { drafts, fakeModel, openApp } from '../support/app.mjs';

/** The Background: "Sweets" open, "Apple pie" in it and open. */
async function book(model, { on = true } = {}) {
  const app = await openApp(model);
  app.model = model;
  await app.renameBook('Sweets');
  await app.writeDown('Apple pie');
  await app.settle();
  if (await app.offeredAi()) {
    if (on) await app.acceptOffer();
    else await app.dismissOffer();
  }
  await app.openRecipe('Apple pie');
  return app;
}


rule('draft-dismissed-changes-nothing', () => {
  test('none of it was any good', async () => {
    const app = await book(fakeModel({ drafts: drafts(['200g plain flour'], ['Heat the oven']) }));

    await app.askForDraft('Apple pie');
    await app.settle();
    await app.dismissDraft();

    assert.deepEqual(await app.proposed('ingredients'), []);
    assert.deepEqual(await app.proposed('steps'), []);
    assert.deepEqual(await app.ingredients('Apple pie'), []);
    assert.deepEqual(await app.method('Apple pie'), []);
  });

  test('what was taken before dismissing stays taken', async () => {
    const app = await book(fakeModel({ drafts: drafts(['200g plain flour', '3 apples']) }));

    await app.askForDraft('Apple pie');
    await app.settle();
    await app.acceptProposal('3 apples');
    await app.dismissDraft();

    assert.deepEqual(await app.ingredients('Apple pie'), ['3 apples']);
  });

  test('closing the recipe puts the draft away with it', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples']) }));
    await app.askForDraft('Apple pie');
    await app.settle();

    await app.closeRecipe('Apple pie');
    await app.openRecipe('Apple pie');
    assert.deepEqual(await app.proposed('ingredients'), []);
  });
});

rule('draft-can-fail', () => {
  test('nothing came back', async () => {
    const app = await book(fakeModel({ drafts: drafts([], []) }));

    await app.askForDraft('Apple pie');
    await app.settle();

    assert.equal(await app.note(), 'Nothing drafted.');
    assert.deepEqual(await app.ingredients('Apple pie'), []);
  });

  test('nothing usable came back', async () => {
    const app = await book(fakeModel({ drafts: drafts(['', '   '], [null]) }));

    await app.askForDraft('Apple pie');
    await app.settle();

    assert.equal(await app.note(), 'Nothing drafted.');
    assert.deepEqual(await app.ingredients('Apple pie'), []);
  });

  test('the model failed', async () => {
    const app = await book(fakeModel({ fails: true }));

    await app.askForDraft('Apple pie');
    await app.settle();

    assert.equal(await app.note(), 'The draft could not be written.');
    assert.deepEqual(await app.ingredients('Apple pie'), []);
  });

  test('a failure leaves the recipe writable by hand', async () => {
    const app = await book(fakeModel({ fails: true }));
    await app.askForDraft('Apple pie');
    await app.settle();

    await app.addIngredient('Apple pie', '3 apples');
    assert.deepEqual(await app.ingredients('Apple pie'), ['3 apples']);
  });

  test('an answer for a recipe that has gone lands nowhere', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples']), holds: true }));

    await app.askForDraft('Apple pie');
    await app.deleteRecipe('Apple pie');
    app.model.answers();
    await app.settle();

    assert.deepEqual(await app.contents(), []);
  });

  test('an answer that arrives after the AI is switched off is dropped', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples']), holds: true }));

    await app.askForDraft('Apple pie');
    await app.toggleAi();
    app.model.answers();
    await app.settle();

    await app.openRecipe('Apple pie');
    assert.equal(await app.hasProposals(), false);
    assert.deepEqual(await app.ingredients('Apple pie'), []);
  });
});

rule('draft-needs-the-ai-on', () => {
  test('a browser that will never have one', async () => {
    const app = await book(null);

    assert.equal(await app.offersDraft('Apple pie'), false);
    assert.equal(await app.mentionsModel(), false, 'nothing explains the absence either');
  });

  test('a machine that cannot run it', async () => {
    const app = await book(fakeModel({ state: 'unavailable' }));
    assert.equal(await app.offersDraft('Apple pie'), false);
  });

  test('switched off', async () => {
    const app = await book(fakeModel({ state: 'available' }), { on: false });
    assert.equal(await app.offersDraft('Apple pie'), false);
  });

  test('writing it out by hand is untouched', async () => {
    const app = await book(null);

    await app.addIngredient('Apple pie', '3 apples');
    await app.addStep('Apple pie', 'Heat the oven to 180C');

    assert.deepEqual(await app.ingredients('Apple pie'), ['3 apples']);
    assert.deepEqual(await app.method('Apple pie'), ['Heat the oven to 180C']);
  });
});
