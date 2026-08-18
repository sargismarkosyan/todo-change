// specs/features/finding/leaving-a-filter.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp } from '../support/app.mjs';

/** The Background: two books, "Sweets" open, one tagged recipe in "Dinner". */
function shelf() {
  const app = openApp();
  app.renameBook('Sweets');
  app.makeBook('Dinner');
  app.writeDown('Roast chicken');
  app.giveTags('Roast chicken', ['chicken']);
  app.openBookNamed('Sweets');
  app.writeDown('Lemon drizzle');
  app.writeDown('Apple cake');
  return app;
}

rule('filter-opens-it-where-it-lives', () => {
  test('landing in the other book', () => {
    const app = shelf();
    app.openBookNamed('Dinner');
    app.give('Roast chicken', 'step', ['Heat the oven to 200C']);
    app.openBookNamed('Sweets');

    app.pickTag('chicken');
    app.openResult('Roast chicken');

    assert.equal(app.openBook(), 'Dinner');
    assert.ok(app.isOpen('Roast chicken'));
    assert.deepEqual(app.method('Roast chicken'), ['Heat the oven to 200C']);
    assert.deepEqual(app.pickedTags(), []);
    assert.deepEqual(app.contents(), ['Roast chicken']);
  });

  test('the box at the top now writes into the book on screen', () => {
    const app = shelf();
    app.pickTag('chicken');
    app.openResult('Roast chicken');
    app.writeDown('Bakewell tart');

    assert.equal(app.openBook(), 'Dinner');
    assert.deepEqual(app.contents(), ['Bakewell tart', 'Roast chicken']);
  });
});

rule('one-way-of-looking-at-a-time', () => {
  test('picking a tag puts the search away', () => {
    const app = shelf();
    app.search('lemon');
    app.pickTag('chicken');

    assert.equal(app.searchBox(), '');
    assert.deepEqual(app.results(), [['Roast chicken', 'Dinner']]);
  });

  test('searching puts the picked tags away', () => {
    const app = shelf();
    app.pickTag('chicken');
    app.search('lemon');

    assert.deepEqual(app.pickedTags(), []);
    assert.deepEqual(app.results(), [['Lemon drizzle', 'Sweets']]);
  });

  test('emptying the search box does not throw away a filter', () => {
    const app = shelf();
    app.pickTag('chicken');
    app.clearSearch();
    assert.deepEqual(app.pickedTags(), ['chicken']);
    assert.deepEqual(app.results(), [['Roast chicken', 'Dinner']]);
  });

  test('a new recipe has to be visibly there', () => {
    const app = shelf();
    app.pickTag('chicken');
    app.writeDown('Bakewell tart');

    assert.deepEqual(app.pickedTags(), []);
    assert.deepEqual(app.contents(), ['Bakewell tart', 'Apple cake', 'Lemon drizzle']);
  });

  test('another book is another contents page', () => {
    const app = shelf();
    app.pickTag('chicken');
    app.openBookNamed('Dinner');

    assert.deepEqual(app.pickedTags(), []);
    assert.deepEqual(app.contents(), ['Roast chicken']);
  });

  test('nothing about a filter is written down', () => {
    const app = shelf();
    app.pickTag('chicken');
    const back = app.reload();

    assert.deepEqual(back.pickedTags(), []);
    assert.deepEqual(back.contents(), ['Apple cake', 'Lemon drizzle']);
  });
});
