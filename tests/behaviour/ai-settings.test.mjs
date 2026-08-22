// specs/features/suggesting/settings.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { drafts, fakeModel, openApp } from '../support/app.mjs';

/** The Background: "Sweets" open with one recipe, and a model on the machine. */
async function book(model, answer = null) {
  const app = await openApp(model);
  await app.renameBook('Sweets');
  await app.writeDown('Apple pie');
  await app.settle();
  if (answer === 'on') await app.acceptOffer();
  if (answer === 'off') await app.dismissOffer();
  return app;
}

rule('ai-settings-is-a-popover', () => {
  test('it does not take the contents away', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');

    await app.openAiSettings();
    assert.deepEqual(await app.contents(), ['Apple pie'], 'the contents stays behind it');

    await app.openRecipe('Apple pie');
    assert.equal(await app.aiSettingsAreShut(), true, 'it shuts on the next click');
  });

  test('it holds two lines, which is the whole of the argument for it', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    assert.equal(
      await app.aiSettingsLines(),
      2,
      'a third line means this became the settings screen personas/nell.md rules out',
    );
  });

  test('the book menu and this one are never both open', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    await app.openAiSettings();
    await app.books();
    assert.equal(await app.aiSettingsAreShut(), true);
  });
});

rule('ai-turned-on-from-settings', () => {
  test('changing my mind a week later', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }), 'off');

    await app.toggleAi();
    assert.equal(await app.aiIs(), 'on');
    assert.equal(await app.indicator(), 'Downloading AI');
  });

  test('the way back is there even when everything else is not', async () => {
    const app = await book(fakeModel({ state: 'downloadable' }), 'off');
    assert.equal(await app.indicator(), null);
    assert.equal(await app.hasAiControl(), true);
  });
});

rule('ai-turned-off-from-settings', () => {
  test('switching it off once it is there', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');

    await app.toggleAi();
    assert.equal(await app.indicator(), null);
    await app.openRecipe('Apple pie');
    assert.equal(await app.offersDraft('Apple pie'), false);
  });

  test('what it wrote stays written', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    await app.addIngredient('Apple pie', '3 apples');

    await app.toggleAi();
    assert.deepEqual(
      await app.ingredients('Apple pie'),
      ['3 apples'],
      'a line does not know where it came from',
    );
  });

  test('a draft on screen goes with it', async () => {
    const app = await book(
      fakeModel({ state: 'available', drafts: drafts(['200g plain flour']) }),
      'on',
    );
    await app.askForDraft('Apple pie');
    await app.settle();
    assert.deepEqual(await app.proposed('ingredients'), ['200g plain flour']);

    await app.toggleAi();
    assert.deepEqual(await app.proposed('ingredients'), []);
  });
});

rule('ai-choice-is-remembered', () => {
  test('off stays off', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    await app.toggleAi();

    const back = await app.reload(fakeModel({ state: 'available' }));
    await back.settle();
    assert.equal(await back.aiIs(), 'off');
    assert.equal(await back.offeredAi(), false);
    assert.equal(await back.indicator(), null);
  });

  test('on stays on', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');

    const back = await app.reload(fakeModel({ state: 'available' }));
    await back.settle();
    assert.equal(await back.aiIs(), 'on');
    assert.equal(await back.indicator(), 'AI ready');
  });

  test('making a book does not lose the answer', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    await app.makeBook('Dinner');
    assert.equal(await app.aiIs(), 'on', 'the store is rebuilt here, and must carry it');
  });

  test('deleting a book does not lose it either', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    await app.makeBook('Dinner');
    await app.deleteBook();
    assert.equal(await app.aiIs(), 'on');
  });

  test('a junk value reads as never having been asked', async () => {
    const app = await book(fakeModel({ state: 'available' }), 'on');
    const bent = JSON.parse(await app.stored());
    bent.suggestions = 42;
    app.window.localStorage.setItem('todo-change.books', JSON.stringify(bent));

    const back = await app.reload(fakeModel({ state: 'available' }));
    await back.settle();
    assert.equal(await back.offeredAi(), true, 'read as never having been asked');
    assert.deepEqual(await back.contents(), ['Apple pie'], 'the books are untouched');

    await back.dismissOffer();
    assert.equal(await back.aiIs(), 'off', 'and the next answer is stored properly');
  });
});
