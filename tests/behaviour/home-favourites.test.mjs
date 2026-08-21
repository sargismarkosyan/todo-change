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
function shelf(...starred) {
  const app = openApp();
  app.renameBook('Sweets');
  app.makeBook('Dinner');
  app.writeDown('Thursday casserole');
  app.writeDown('Lemon chicken');
  app.writeDown('Roast chicken');
  app.openBookNamed('Sweets');
  app.writeDown('Bakewell tart');
  app.writeDown('Lemon drizzle');
  app.writeDown('Apple cake');

  // A star is pressed on a row of the contents, so each one is starred in the
  // book that holds it.
  for (const name of starred) {
    app.openBookNamed(SHELF[name]);
    app.star(name);
  }
  return app;
}

const frontDoor = (starred = [], day = '2026-08-21') =>
  openHome(shelf(...starred).stored(), { day });

rule('favourites-lead-the-home', () => {
  test('what gets cooked most weeks, at the front door', () => {
    const app = frontDoor(['Apple cake', 'Roast chicken']);

    assert.deepEqual(app.favourites(), [
      ['Apple cake', 'Sweets'],
      ['Roast chicken', 'Dinner'],
    ]);
    assert.equal(app.favouritesComeFirst(), true, 'above the picks');
    assert.deepEqual(app.headings(), ['Favourites', 'Somewhere to start']);
  });

  test('starting from one', () => {
    const shelved = shelf('Roast chicken');
    shelved.give('Roast chicken', 'step', ['Heat the oven to 200C']);
    const app = openHome(shelved.stored());

    app.openFavourite('Roast chicken');

    assert.equal(app.addressNamesTheOpenBook(), true, `the address reads ${app.address()}`);
    assert.equal(app.openBook(), 'Dinner');
    assert.equal(app.isOpen('Roast chicken'), true);
    assert.deepEqual(app.method('Roast chicken'), ['Heat the oven to 200C']);
  });

  test('one that has since been deleted is not offered', () => {
    const shelved = shelf('Apple cake', 'Roast chicken');
    shelved.openBookNamed('Sweets');
    shelved.deleteRecipe('Apple cake');

    const app = openHome(shelved.stored());

    assert.deepEqual(app.favourites(), [['Roast chicken', 'Dinner']]);
  });
});

rule('the-picks-do-not-repeat-a-favourite', () => {
  test('three picks, none of them a favourite', () => {
    const app = frontDoor(['Apple cake', 'Roast chicken']);

    const picks = app.picks();
    assert.equal(picks.length, 3);
    const starred = app.favourites().map(([name]) => name);
    for (const [name] of picks) {
      assert.equal(starred.includes(name), false, `"${name}" is not already starred`);
    }
  });

  test('everything written down is a favourite', () => {
    const app = frontDoor([
      'Apple cake',
      'Lemon drizzle',
      'Bakewell tart',
      'Roast chicken',
      'Lemon chicken',
      'Thursday casserole',
    ]);

    assert.deepEqual(app.picks(), []);
    assert.equal(app.favourites().length, 6, 'and all of them are on screen');
    assert.equal(app.message(), null, 'the shelf is not empty, so nothing says it is');
  });
});

rule('nothing-starred-is-the-home-as-it-was', () => {
  test('a book nobody has starred anything in', () => {
    const app = frontDoor();

    assert.deepEqual(app.favourites(), []);
    assert.equal(app.picks().length, 3);
    assert.deepEqual(app.headings(), [], 'and no heading over either');
  });

  test('unstarring the last one puts the home back', () => {
    const shelved = shelf('Apple cake');
    shelved.openBookNamed('Sweets');

    shelved.star('Apple cake');
    const app = openHome(shelved.stored(), { day: '2026-08-21' });

    assert.deepEqual(app.favourites(), []);
    assert.deepEqual(app.headings(), [], 'no heading over what is left');
    assert.equal(app.picks().length, 3);
  });
});

rule('a-search-covers-the-favourites-too', () => {
  test('typing, then changing my mind', () => {
    const app = frontDoor(['Apple cake']);
    const picksBefore = app.picks();

    app.search('lemon');
    assert.deepEqual(app.results(), [
      ['Lemon drizzle', 'Sweets'],
      ['Lemon chicken', 'Dinner'],
    ]);
    assert.deepEqual(app.favourites(), [], 'the favourites step aside');
    assert.deepEqual(app.picks(), []);
    assert.deepEqual(app.headings(), [], 'and their headings with them');

    app.clearSearch();
    assert.deepEqual(app.favourites(), [['Apple cake', 'Sweets']]);
    assert.deepEqual(app.picks(), picksBefore, 'and the same three come back');
  });
});
