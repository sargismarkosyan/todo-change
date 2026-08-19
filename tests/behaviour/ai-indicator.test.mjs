// specs/features/suggesting/indicator.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { drafts, fakeModel, openApp } from '../support/app.mjs';

/** The Background: "Sweets" open, one recipe in it. */
async function book(model) {
  const app = openApp(model);
  app.renameBook('Sweets');
  app.writeDown('Apple pie');
  await app.settle();
  return app;
}

rule('ai-indicator-says-where-it-stands', () => {
  test('watching it arrive', async () => {
    const model = fakeModel({ state: 'downloadable' });
    const app = await book(model);

    app.acceptOffer();
    assert.equal(app.indicator(), 'Downloading AI');

    model.reaches(0.4);
    assert.equal(app.indicator(), 'Downloading AI 40%');

    model.reaches(0.85);
    assert.equal(app.indicator(), 'Downloading AI 85%');

    model.arrives();
    await app.settle();
    assert.equal(app.indicator(), 'AI ready');
  });

  test('already there on a machine that has it', async () => {
    const app = await book(fakeModel({ state: 'available' }));
    app.acceptOffer();
    assert.equal(app.indicator(), 'AI ready');
  });

  test('a fetch that fails says so rather than saying nothing', async () => {
    const app = await book(fakeModel({ state: 'downloadable', fetchFails: true }));

    app.acceptOffer();
    await app.settle();
    assert.equal(app.indicator(), 'AI unavailable');
  });

  test('once it is ready the control on a recipe is there', async () => {
    const model = fakeModel({ state: 'downloadable' });
    const app = await book(model);
    app.acceptOffer();
    model.arrives();
    await app.settle();

    assert.equal(app.indicator(), 'AI ready');
    app.openRecipe('Apple pie');
    assert.equal(app.offersDraft('Apple pie'), true);
  });
});

rule('ai-indicator-only-when-on', () => {
  test('no model at all', async () => {
    const app = await book(null);
    assert.equal(app.indicator(), null);
  });

  test('a machine that cannot run one', async () => {
    const app = await book(fakeModel({ state: 'unavailable' }));
    assert.equal(app.indicator(), null);
  });

  test('turned off', async () => {
    const app = await book(fakeModel({ state: 'available' }));
    app.dismissOffer();
    assert.equal(app.indicator(), null);
  });

  test('not yet answered says nothing either', async () => {
    const app = await book(fakeModel({ state: 'available' }));
    assert.equal(app.indicator(), null, 'the offer is the question, not the indicator');
  });
});

rule('ai-indicator-is-not-a-loading-screen', () => {
  test('the app is the app while the model is coming', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }));
    app.acceptOffer();

    app.writeDown('Bakewell tart');
    assert.deepEqual(app.contents(), ['Bakewell tart', 'Apple pie']);

    app.search('apple');
    assert.deepEqual(app.results(), [['Apple pie', 'Sweets']]);
    assert.equal(app.indicator(), 'Downloading AI', 'still coming, still not in the way');
  });

  test('filling one in by hand does not wait either', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }));
    app.acceptOffer();

    app.addIngredient('Apple pie', '3 apples');
    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples']);
  });

  test('a model that never answers a draft blocks nothing', async () => {
    const app = await book(fakeModel({ state: 'available', silent: true }));
    app.acceptOffer();
    app.askForDraft('Apple pie');

    app.addIngredient('Apple pie', '3 apples');
    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples']);
  });
});
