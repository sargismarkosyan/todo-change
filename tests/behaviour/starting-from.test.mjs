// specs/features/home/starting-from.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openHome } from '../support/app.mjs';

/** The book each recipe is in, as the Background writes them down. */
const SHELF = {
  'Apple cake': 'Sweets',
  'Lemon drizzle': 'Sweets',
  'Bakewell tart': 'Sweets',
  'Roast chicken': 'Dinner',
  'Lemon chicken': 'Dinner',
  'Thursday casserole': 'Dinner',
};

/**
 * The Background: two books of three, built through the box the way Nell builds
 * one — which happens in a book, so the front door is opened onto the shelf
 * afterwards.
 */
async function shelf() {
  const app = await openApp();
  await app.renameBook('Sweets');
  await app.makeBook('Dinner');
  await app.writeDown('Thursday casserole');
  await app.writeDown('Lemon chicken');
  await app.writeDown('Roast chicken');
  await app.openBookNamed('Sweets');
  await app.writeDown('Bakewell tart');
  await app.writeDown('Lemon drizzle');
  await app.writeDown('Apple cake');
  return app;
}

/** Two books holding one recipe each, for the rules that name one. */
async function twoRecipes() {
  const app = await openApp();
  await app.renameBook('Sweets');
  await app.writeDown('Apple cake');
  await app.makeBook('Dinner');
  await app.writeDown('Roast chicken');
  return app;
}

const frontDoor = async (day = null) => await openHome(await (await shelf()).stored(), { day });

rule('picks-reach-every-book', () => {
  test('three to start from', async () => {
    const picks = await (await frontDoor('2026-08-19')).picks();
    assert.equal(picks.length, 3);
    for (const [name, book] of picks) {
      assert.equal(SHELF[name] !== undefined, true, `"${name}" is a recipe on the shelf`);
      assert.equal(book, SHELF[name], `and "${name}" names the book it is in`);
    }
  });

  test('the book last open is not left out', async () => {
    const shelved = await openApp();
    await shelved.renameBook('Sweets');
    await shelved.writeDown('Apple cake');
    await shelved.makeBook('Dinner');
    await shelved.openBookNamed('Sweets');
    const app = await openHome(await shelved.stored());
    assert.equal(await app.openBook(), 'Sweets', 'the book last open');
    assert.deepEqual(await app.picks(), [['Apple cake', 'Sweets']]);
  });
});

rule('picks-hold-still-all-day', () => {
  test('opened twice before lunch', async () => {
    const stored = await (await shelf()).stored();
    const morning = await (await openHome(stored, { day: '2026-08-19' })).picks();
    const again = await (await openHome(stored, { day: '2026-08-19' })).picks();
    assert.deepEqual(again, morning);
    assert.equal(morning.length, 3);
  });

  test('it is not the same three every day', async () => {
    const stored = await (await shelf()).stored();
    const seen = new Set();
    for (const day of [19, 20, 21, 22, 23, 24, 25]) {
      seen.add(JSON.stringify(await (await openHome(stored, { day: `2026-08-${day}` })).picks()));
    }
    assert.equal(seen.size > 1, true, `one week gave ${seen.size} set(s) of three`);
  });
});

rule('picks-open-where-they-live', () => {
  test('starting from one', async () => {
    const shelved = await twoRecipes();
    await shelved.give('Roast chicken', 'step', ['Heat the oven to 200C']);
    const app = await openHome(await shelved.stored());

    await app.openPick('Roast chicken');

    assert.equal(await app.addressNamesTheOpenBook(), true, `the address reads ${await app.address()}`);
    assert.equal(await app.openBook(), 'Dinner');
    assert.equal(await app.isOpen('Roast chicken'), true);
    assert.deepEqual(await app.method('Roast chicken'), ['Heat the oven to 200C']);
  });
});

rule('picks-give-what-there-is', () => {
  test('two recipes altogether', async () => {
    const app = await openHome(await (await twoRecipes()).stored());
    assert.deepEqual(await app.picks(), [
      ['Apple cake', 'Sweets'],
      ['Roast chicken', 'Dinner'],
    ]);
  });

  test('nothing written down anywhere yet', async () => {
    const shelved = await openApp();
    await shelved.renameBook('Sweets');
    await shelved.makeBook('Dinner');
    const app = await openHome(await shelved.stored());
    assert.deepEqual(await app.picks(), []);
    assert.equal(await app.message(), 'Nothing written down yet.');
  });

  test('a browser that has never opened the app', async () => {
    const app = await openHome();
    assert.deepEqual(await app.picks(), []);
    assert.equal(await app.message(), 'Nothing written down yet.');
  });
});

rule('picks-step-aside-for-the-results', () => {
  test('typing, then changing my mind', async () => {
    const app = await frontDoor('2026-08-19');
    const before = await app.picks();

    await app.search('lemon');
    assert.deepEqual(await app.results(), [
      ['Lemon drizzle', 'Sweets'],
      ['Lemon chicken', 'Dinner'],
    ]);
    assert.deepEqual(await app.picks(), [], 'the picks step aside');

    await app.clearSearch();
    assert.deepEqual(await app.picks(), before, 'and come back unshuffled');
  });
});
