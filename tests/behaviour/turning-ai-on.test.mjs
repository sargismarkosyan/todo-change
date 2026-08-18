// specs/features/suggesting/turning-it-on.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { drafts, fakeModel, openApp } from '../support/app.mjs';

/** The Background: "Sweets" open, one recipe in it to fill in. */
async function book(model) {
  const app = openApp(model);
  app.renameBook('Sweets');
  app.writeDown('Apple pie');
  await app.settle();
  return app;
}

rule('ai-offered-once', () => {
  test('the first visit with something to fill in', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }));
    assert.equal(app.offeredAi(), true);

    app.dismissOffer();
    const back = app.reload(fakeModel({ state: 'downloadable' }));
    await back.settle();
    assert.equal(back.offeredAi(), false, 'asked twice is asked once too often');
  });

  test('an empty book is not the moment to ask', async () => {
    const app = openApp(fakeModel({ state: 'downloadable' }));
    await app.settle();
    assert.deepEqual(app.contents(), []);
    assert.equal(app.offeredAi(), false);
  });

  test('writing the first recipe down is the moment', async () => {
    const app = openApp(fakeModel({ state: 'downloadable' }));
    await app.settle();
    assert.equal(app.offeredAi(), false);

    app.writeDown('Apple pie');
    assert.equal(app.offeredAi(), true);
  });

  test('it does not push the box down', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }));
    const order = [...app.document.querySelectorAll('.composer, .offer')].map(
      (el) => el.className,
    );
    assert.deepEqual(order, ['composer', 'offer'], 'the box comes first, always');
  });
});

rule('ai-offer-accepted', () => {
  test('saying yes', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }));

    app.acceptOffer();
    assert.equal(app.aiIs(), 'on');
    assert.equal(app.indicator(), 'Downloading AI');
    assert.equal(app.offeredAi(), false, 'the question is answered');
  });

  test('the page is the page while it comes', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }));
    app.acceptOffer();

    app.writeDown('Bakewell tart');
    assert.deepEqual(app.contents(), ['Bakewell tart', 'Apple pie']);
  });

  test('a machine that already has one is ready at once', async () => {
    const app = await book(fakeModel({ state: 'available' }));
    app.acceptOffer();
    assert.equal(app.indicator(), 'AI ready');
  });
});

rule('ai-offer-dismissed', () => {
  test('saying no', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }));

    app.dismissOffer();
    assert.equal(app.aiIs(), 'off');
    assert.equal(app.indicator(), null);

    app.openRecipe('Apple pie');
    assert.equal(app.offersDraft('Apple pie'), false);
  });

  test('nothing else is different', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }));
    app.dismissOffer();

    app.addIngredient('Apple pie', '3 apples');
    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples']);
  });

  test('the way back on is still there, and it is all that is there', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }));
    app.dismissOffer();

    assert.equal(app.hasAiControl(), true, 'off is not the same as absent');
    assert.equal(app.indicator(), null);
  });
});

rule('ai-not-offered-without-a-model', () => {
  test('nothing to offer', async () => {
    const app = await book(null);

    assert.equal(app.offeredAi(), false);
    assert.equal(app.indicator(), null);
    assert.equal(app.hasAiControl(), false);
  });

  test('the API is there but the machine cannot run it', async () => {
    const app = await book(fakeModel({ state: 'unavailable' }));

    assert.equal(app.offeredAi(), false);
    assert.equal(app.indicator(), null);
    assert.equal(app.hasAiControl(), false);
  });

  test('a model that cannot say what it can do offers nothing', async () => {
    const app = await book(fakeModel({ cannotSay: true }));

    assert.equal(app.offeredAi(), false);
    assert.equal(app.hasAiControl(), false);
    app.addIngredient('Apple pie', '3 apples');
    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples'], 'otherwise untouched');
  });
});
