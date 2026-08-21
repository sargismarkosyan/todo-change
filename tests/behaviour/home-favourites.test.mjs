// specs/features/home/favourites.feature

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
 * one. Starring happens in a book too, so it is done here and the front door is
 * opened onto the shelf afterwards.
 */
async function shelf(...starred) {
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

  // A star is pressed on a row of the contents, so each one is starred in the
  // book that holds it.
  for (const name of starred) {
    await app.openBookNamed(SHELF[name]);
    await app.star(name);
  }
  return app;
}

const frontDoor = async (starred = [], day = '2026-08-21') =>
  await openHome(await (await shelf(...starred)).stored(), { day });

rule('favourites-lead-the-home', () => {
  test('what gets cooked most weeks, at the front door', async () => {
    const app = await frontDoor(['Apple cake', 'Roast chicken']);

    assert.deepEqual(await app.favourites(), [
      ['Apple cake', 'Sweets'],
      ['Roast chicken', 'Dinner'],
    ]);
    assert.equal(await app.favouritesComeFirst(), true, 'above the picks');
    assert.deepEqual(await app.headings(), ['Favourites', 'Somewhere to start']);
  });

  test('starting from one', async () => {
    const shelved = await shelf('Roast chicken');
    await shelved.give('Roast chicken', 'step', ['Heat the oven to 200C']);
    const app = await openHome(await shelved.stored());

    await app.openFavourite('Roast chicken');

    assert.equal(await app.addressNamesTheOpenBook(), true, `the address reads ${await app.address()}`);
    assert.equal(await app.openBook(), 'Dinner');
    assert.equal(await app.isOpen('Roast chicken'), true);
    assert.deepEqual(await app.method('Roast chicken'), ['Heat the oven to 200C']);
  });

  test('one that has since been deleted is not offered', async () => {
    const shelved = await shelf('Apple cake', 'Roast chicken');
    await shelved.openBookNamed('Sweets');
    await shelved.deleteRecipe('Apple cake');

    const app = await openHome(await shelved.stored());

    assert.deepEqual(await app.favourites(), [['Roast chicken', 'Dinner']]);
  });
});

rule('the-picks-do-not-repeat-a-favourite', () => {
  test('three picks, none of them a favourite', async () => {
    const app = await frontDoor(['Apple cake', 'Roast chicken']);

    const picks = await app.picks();
    assert.equal(picks.length, 3);
    const starred = await (await app.favourites()).map(([name]) => name);
    for (const [name] of picks) {
      assert.equal(starred.includes(name), false, `"${name}" is not already starred`);
    }
  });

  test('everything written down is a favourite', async () => {
    const app = await frontDoor([
      'Apple cake',
      'Lemon drizzle',
      'Bakewell tart',
      'Roast chicken',
      'Lemon chicken',
      'Thursday casserole',
    ]);

    assert.deepEqual(await app.picks(), []);
    assert.equal((await app.favourites()).length, 6, 'and all of them are on screen');
    assert.equal(await app.message(), null, 'the shelf is not empty, so nothing says it is');
  });
});

rule('nothing-starred-is-the-home-as-it-was', () => {
  test('a book nobody has starred anything in', async () => {
    const app = await frontDoor();

    assert.deepEqual(await app.favourites(), []);
    assert.equal((await app.picks()).length, 3);
    assert.deepEqual(await app.headings(), [], 'and no heading over either');
  });

  test('unstarring the last one puts the home back', async () => {
    const shelved = await shelf('Apple cake');
    await shelved.openBookNamed('Sweets');

    await shelved.star('Apple cake');
    const app = await openHome(await shelved.stored(), { day: '2026-08-21' });

    assert.deepEqual(await app.favourites(), []);
    assert.deepEqual(await app.headings(), [], 'no heading over what is left');
    assert.equal((await app.picks()).length, 3);
  });
});

rule('a-search-covers-the-favourites-too', () => {
  test('typing, then changing my mind', async () => {
    const app = await frontDoor(['Apple cake']);
    const picksBefore = await app.picks();

    await app.search('lemon');
    assert.deepEqual(await app.results(), [
      ['Lemon drizzle', 'Sweets'],
      ['Lemon chicken', 'Dinner'],
    ]);
    assert.deepEqual(await app.favourites(), [], 'the favourites step aside');
    assert.deepEqual(await app.picks(), []);
    assert.deepEqual(await app.headings(), [], 'and their headings with them');

    await app.clearSearch();
    assert.deepEqual(await app.favourites(), [['Apple cake', 'Sweets']]);
    assert.deepEqual(await app.picks(), picksBefore, 'and the same three come back');
  });
});
