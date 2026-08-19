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
function shelf() {
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
  return app;
}

/** Two books holding one recipe each, for the rules that name one. */
function twoRecipes() {
  const app = openApp();
  app.renameBook('Sweets');
  app.writeDown('Apple cake');
  app.makeBook('Dinner');
  app.writeDown('Roast chicken');
  return app;
}

const frontDoor = (day = null) => openHome(shelf().stored(), { day });

rule('picks-reach-every-book', () => {
  test('three to start from', () => {
    const picks = frontDoor('2026-08-19').picks();
    assert.equal(picks.length, 3);
    for (const [name, book] of picks) {
      assert.equal(SHELF[name] !== undefined, true, `"${name}" is a recipe on the shelf`);
      assert.equal(book, SHELF[name], `and "${name}" names the book it is in`);
    }
  });

  test('the book last open is not left out', () => {
    const shelved = openApp();
    shelved.renameBook('Sweets');
    shelved.writeDown('Apple cake');
    shelved.makeBook('Dinner');
    shelved.openBookNamed('Sweets');
    const app = openHome(shelved.stored());
    assert.equal(app.openBook(), 'Sweets', 'the book last open');
    assert.deepEqual(app.picks(), [['Apple cake', 'Sweets']]);
  });
});

rule('picks-hold-still-all-day', () => {
  test('opened twice before lunch', () => {
    const stored = shelf().stored();
    const morning = openHome(stored, { day: '2026-08-19' }).picks();
    const again = openHome(stored, { day: '2026-08-19' }).picks();
    assert.deepEqual(again, morning);
    assert.equal(morning.length, 3);
  });

  test('it is not the same three every day', () => {
    const stored = shelf().stored();
    const seen = new Set();
    for (const day of [19, 20, 21, 22, 23, 24, 25]) {
      seen.add(JSON.stringify(openHome(stored, { day: `2026-08-${day}` }).picks()));
    }
    assert.equal(seen.size > 1, true, `one week gave ${seen.size} set(s) of three`);
  });
});

rule('picks-open-where-they-live', () => {
  test('starting from one', () => {
    const shelved = twoRecipes();
    shelved.give('Roast chicken', 'step', ['Heat the oven to 200C']);
    const app = openHome(shelved.stored());

    app.openPick('Roast chicken');

    assert.equal(app.addressNamesTheOpenBook(), true, `the address reads ${app.address()}`);
    assert.equal(app.openBook(), 'Dinner');
    assert.equal(app.isOpen('Roast chicken'), true);
    assert.deepEqual(app.method('Roast chicken'), ['Heat the oven to 200C']);
  });
});

rule('picks-give-what-there-is', () => {
  test('two recipes altogether', () => {
    const app = openHome(twoRecipes().stored());
    assert.deepEqual(app.picks(), [
      ['Apple cake', 'Sweets'],
      ['Roast chicken', 'Dinner'],
    ]);
  });

  test('nothing written down anywhere yet', () => {
    const shelved = openApp();
    shelved.renameBook('Sweets');
    shelved.makeBook('Dinner');
    const app = openHome(shelved.stored());
    assert.deepEqual(app.picks(), []);
    assert.equal(app.message(), 'Nothing written down yet.');
  });

  test('a browser that has never opened the app', () => {
    const app = openHome();
    assert.deepEqual(app.picks(), []);
    assert.equal(app.message(), 'Nothing written down yet.');
  });
});

rule('picks-step-aside-for-the-results', () => {
  test('typing, then changing my mind', () => {
    const app = frontDoor('2026-08-19');
    const before = app.picks();

    app.search('lemon');
    assert.deepEqual(app.results(), [
      ['Lemon drizzle', 'Sweets'],
      ['Lemon chicken', 'Dinner'],
    ]);
    assert.deepEqual(app.picks(), [], 'the picks step aside');

    app.clearSearch();
    assert.deepEqual(app.picks(), before, 'and come back unshuffled');
  });
});
