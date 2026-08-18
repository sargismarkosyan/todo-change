// specs/features/suggesting/tags.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { fakeModel, openApp } from '../support/app.mjs';

/**
 * The Background: one book, "Apple cake" with two ingredients, open.
 *
 * The model is always a fake — jsdom has none, and nothing here asserts what a
 * model says. What is asserted is what the app does with an answer.
 */
async function book(model) {
  const app = openApp(model);
  app.renameBook('Sweets');
  app.writeDown('Apple cake');
  app.give('Apple cake', 'ingredient', ['200g plain flour', '3 apples']);
  await app.settle();
  app.openRecipe('Apple cake');
  return app;
}

rule('suggestions-are-not-tags-until-accepted', () => {
  test('taking one of three', async () => {
    const app = await book(fakeModel({ proposes: ['apple', 'cake', 'flour'] }));

    app.askForTags('Apple cake');
    await app.settle();

    assert.deepEqual(app.suggestions(), ['apple', 'cake', 'flour']);
    assert.deepEqual(app.tags('Apple cake'), [], 'nothing proposed is a tag yet');

    app.acceptSuggestion('apple');
    assert.deepEqual(app.tags('Apple cake'), ['apple']);
  });

  test('an accepted word is written down, not just shown', async () => {
    const app = await book(fakeModel({ proposes: ['apple'] }));
    app.askForTags('Apple cake');
    await app.settle();
    app.acceptSuggestion('apple');

    assert.deepEqual(app.reload().tags('Apple cake'), ['apple']);
  });

  test('turning them all down', async () => {
    const app = await book(fakeModel({ proposes: ['apple', 'flour'] }));

    app.askForTags('Apple cake');
    await app.settle();
    app.dismissSuggestions();

    assert.deepEqual(app.suggestions(), []);
    assert.deepEqual(app.tags('Apple cake'), []);
  });

  test('a word already written down is not offered again', async () => {
    const app = await book(fakeModel({ proposes: ['apple', 'cake'] }));
    app.addTag('Apple cake', 'apple');

    app.askForTags('Apple cake');
    await app.settle();

    assert.deepEqual(app.suggestions(), ['cake']);
  });

  test('the same word twice in one answer is one word on offer', async () => {
    const app = await book(fakeModel({ proposes: ['apple', 'Apple', ' apple '] }));

    app.askForTags('Apple cake');
    await app.settle();

    assert.deepEqual(app.suggestions(), ['apple']);
  });

  test('what was proposed for one recipe does not follow the reader', async () => {
    const app = await book(fakeModel({ proposes: ['apple'] }));
    app.writeDown('Lemon drizzle');
    app.openRecipe('Apple cake');
    app.askForTags('Apple cake');
    await app.settle();
    assert.deepEqual(app.suggestions(), ['apple']);

    app.openRecipe('Lemon drizzle');
    assert.deepEqual(app.suggestions(), []);
  });
});

rule('suggesting-needs-a-model', () => {
  test('a browser that will never have one', async () => {
    const app = await book(null);

    assert.equal(app.offersSuggest('Apple cake'), false);
    assert.equal(app.mentionsModel(), false, 'no control, and nothing explaining its absence');
  });

  test('a browser that has the API but cannot run it', async () => {
    const app = await book(fakeModel({ state: 'unavailable' }));

    assert.equal(app.offersSuggest('Apple cake'), false);
    assert.equal(app.mentionsModel(), false);
  });

  test('tagging by hand is untouched', async () => {
    const app = await book(null);
    app.addTag('Apple cake', 'apple');
    assert.deepEqual(app.tags('Apple cake'), ['apple']);
  });

  test('filtering by hand-written tags is untouched', async () => {
    const app = await book(null);
    app.addTag('Apple cake', 'apple');
    app.pickTag('apple');
    assert.deepEqual(app.results(), [['Apple cake', 'Sweets']]);
  });

  test('a model that cannot say what it can do offers nothing', async () => {
    const app = await book(fakeModel({ cannotSay: true }));

    assert.equal(app.offersSuggest('Apple cake'), false);
    assert.equal(app.mentionsModel(), false);
    app.addTag('Apple cake', 'apple');
    assert.deepEqual(app.tags('Apple cake'), ['apple'], 'the app is otherwise untouched');
  });

  test('a model that has to be fetched still offers the control', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }));
    assert.equal(app.offersSuggest('Apple cake'), true);
  });
});

rule('suggesting-says-when-it-cannot', () => {
  test('nothing came back', async () => {
    const app = await book(fakeModel({ proposes: [] }));

    app.askForTags('Apple cake');
    await app.settle();

    assert.equal(app.note(), 'No tags suggested.');
    assert.deepEqual(app.tags('Apple cake'), []);
  });

  test('nothing usable came back', async () => {
    const app = await book(fakeModel({ proposes: ['', '   '] }));

    app.askForTags('Apple cake');
    await app.settle();

    assert.equal(app.note(), 'No tags suggested.');
    assert.deepEqual(app.tags('Apple cake'), []);
  });

  test('the model failed', async () => {
    const app = await book(fakeModel({ fails: true }));

    app.askForTags('Apple cake');
    await app.settle();

    assert.equal(app.note(), 'Tags could not be suggested.');
    assert.deepEqual(app.tags('Apple cake'), []);
    assert.deepEqual(app.ingredients('Apple cake'), ['200g plain flour', '3 apples']);
  });

  test('a failure leaves the recipe writable by hand', async () => {
    const app = await book(fakeModel({ fails: true }));
    app.askForTags('Apple cake');
    await app.settle();

    app.addTag('Apple cake', 'apple');
    assert.deepEqual(app.tags('Apple cake'), ['apple']);
  });
});

rule('the-model-is-the-one-slow-thing', () => {
  test('the first ask on a fresh browser', async () => {
    const app = await book(fakeModel({ state: 'downloadable', silent: true }));

    app.askForTags('Apple cake');
    assert.equal(app.note(), 'Fetching the model…');

    app.addTag('Apple cake', 'apple');
    assert.deepEqual(app.tags('Apple cake'), ['apple'], 'the page did not wait');
  });

  test('a model already there says nothing about fetching', async () => {
    const app = await book(fakeModel({ state: 'available', silent: true }));

    app.askForTags('Apple cake');
    assert.equal(app.note(), null);
  });

  test('nothing else on the page waits on it', async () => {
    const app = await book(fakeModel({ state: 'downloading', silent: true }));
    app.askForTags('Apple cake');

    app.writeDown('Bakewell tart');
    assert.deepEqual(app.contents(), ['Bakewell tart', 'Apple cake']);

    app.search('bake');
    assert.deepEqual(app.results(), [['Bakewell tart', 'Sweets']]);
  });
});
