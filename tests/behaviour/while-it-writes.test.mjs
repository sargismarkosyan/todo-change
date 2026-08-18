// specs/features/suggesting/while-it-writes.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { drafts, fakeModel, openApp } from '../support/app.mjs';

/** The Background: "Sweets" open, "Apple pie" in it and open, the AI on. */
async function book(model) {
  const app = openApp(model);
  app.renameBook('Sweets');
  app.writeDown('Apple pie');
  await app.settle();
  if (app.offeredAi()) app.acceptOffer();
  app.openRecipe('Apple pie');
  return app;
}


rule('draft-says-it-is-thinking', () => {
  test('pressing, and waiting', async () => {
    const app = await book(fakeModel({ silent: true }));

    app.askForDraft('Apple pie');
    assert.equal(app.draftControl('Apple pie'), 'Drafting…');
    assert.equal(app.note(), 'Writing a draft. Nothing else has to wait.');
  });

  test('nothing else waits while it thinks', async () => {
    const app = await book(fakeModel({ silent: true }));
    app.askForDraft('Apple pie');

    app.addIngredient('Apple pie', '3 apples');
    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples']);

    app.writeDown('Bakewell tart');
    assert.deepEqual(app.contents(), ['Bakewell tart', 'Apple pie']);
  });

  test('it cannot be asked twice at once', async () => {
    const app = await book(fakeModel({ silent: true }));
    app.askForDraft('Apple pie');
    assert.equal(app.draftControlCanBePressed('Apple pie'), false);
  });

  test('the words go back when the answer lands', async () => {
    const app = await book(fakeModel({ drafts: drafts(['3 apples']) }));

    app.askForDraft('Apple pie');
    await app.settle();

    assert.equal(app.draftControl('Apple pie'), 'Draft this recipe');
    assert.equal(app.note(), null);
    assert.equal(app.draftControlCanBePressed('Apple pie'), true);
  });

  test('the words go back on a failure too', async () => {
    const app = await book(fakeModel({ fails: true }));

    app.askForDraft('Apple pie');
    await app.settle();

    assert.equal(app.draftControl('Apple pie'), 'Draft this recipe');
    assert.equal(app.note(), 'The draft could not be written.');
  });
});
