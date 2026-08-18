// specs/features/suggesting/settings.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { fakeModel, openApp } from '../support/app.mjs';

/** The Background: "Sweets" open with one recipe, and a model on the machine. */
async function book(model, answer = null) {
  const app = openApp(model);
  app.renameBook('Sweets');
  app.writeDown('Apple pie');
  await app.settle();
  if (answer === 'on') app.acceptOffer();
  if (answer === 'off') app.dismissOffer();
  return app;
}

rule('ai-settings-is-a-popover', () => {
  test('it does not take the contents away', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');

    app.openAiSettings();
    assert.deepEqual(app.contents(), ['Apple pie'], 'the contents stays behind it');

    app.openRecipe('Apple pie');
    assert.equal(app.aiSettingsAreShut(), true, 'it shuts on the next click');
  });

  test('it holds two lines, which is the whole of the argument for it', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    assert.equal(
      app.aiSettingsLines(),
      2,
      'a third line means this became the settings screen persona.md rules out',
    );
  });

  test('the book menu and this one are never both open', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    app.openAiSettings();
    app.books();
    assert.equal(app.aiSettingsAreShut(), true);
  });
});

rule('ai-turned-on-from-settings', () => {
  test('changing my mind a week later', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }), 'off');

    app.toggleAi();
    assert.equal(app.aiIs(), 'on');
    assert.equal(app.indicator(), 'Downloading AI');
  });

  test('the way back is there even when everything else is not', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }), 'off');
    assert.equal(app.indicator(), null);
    assert.equal(app.hasAiControl(), true);
  });
});

rule('ai-turned-off-from-settings', () => {
  test('switching it off once it is there', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');

    app.toggleAi();
    assert.equal(app.indicator(), null);
    app.openRecipe('Apple pie');
    assert.equal(app.offersDraft('Apple pie'), false);
  });

  test('what it wrote stays written', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    app.addIngredient('Apple pie', '3 apples');

    app.toggleAi();
    assert.deepEqual(
      app.ingredients('Apple pie'),
      ['3 apples'],
      'a line does not know where it came from',
    );
  });

  test('a draft on screen goes with it', async () => {
    const app = await book(
      fakeModel({ state: 'available', drafts: { ingredients: ['200g plain flour'], steps: [] } }),
      'on',
    );
    app.askForDraft('Apple pie');
    await app.settle();
    assert.deepEqual(app.proposed('ingredients'), ['200g plain flour']);

    app.toggleAi();
    assert.deepEqual(app.proposed('ingredients'), []);
  });
});

rule('ai-choice-is-remembered', () => {
  test('off stays off', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    app.toggleAi();

    const back = app.reload(fakeModel({ state: 'available' }));
    await back.settle();
    assert.equal(back.aiIs(), 'off');
    assert.equal(back.offeredAi(), false);
    assert.equal(back.indicator(), null);
  });

  test('on stays on', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');

    const back = app.reload(fakeModel({ state: 'available' }));
    await back.settle();
    assert.equal(back.aiIs(), 'on');
    assert.equal(back.indicator(), 'AI ready');
  });

  test('making a book does not lose the answer', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    app.makeBook('Dinner');
    assert.equal(app.aiIs(), 'on', 'the store is rebuilt here, and must carry it');
  });

  test('deleting a book does not lose it either', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    app.makeBook('Dinner');
    app.deleteBook();
    assert.equal(app.aiIs(), 'on');
  });

  test('a junk value reads as never having been asked', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    const bent = JSON.parse(app.stored());
    bent.suggestions = 42;
    app.window.localStorage.setItem('todo-change.books', JSON.stringify(bent));

    const back = app.reload(fakeModel({ state: 'available' }));
    await back.settle();
    assert.equal(back.offeredAi(), true, 'read as never having been asked');
    assert.deepEqual(back.contents(), ['Apple pie'], 'the books are untouched');

    back.dismissOffer();
    assert.equal(back.aiIs(), 'off', 'and the next answer is stored properly');
  });
});
