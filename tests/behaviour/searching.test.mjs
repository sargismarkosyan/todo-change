// specs/features/finding/searching.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp } from '../support/app.mjs';

/**
 * The Background: two books, "Sweets" open, two recipes in each.
 *
 * Built through the box and the menu, the way Nell builds one — newest first
 * means each book is written in reverse.
 */
function shelf() {
  const app = openApp();
  app.renameBook('Sweets');
  app.makeBook('Dinner');
  app.writeDown('Lemon chicken');
  app.writeDown('Roast chicken');
  app.openBookNamed('Sweets');
  app.writeDown('Lemon drizzle');
  app.writeDown('Apple cake');
  return app;
}

rule('search-reaches-every-book', () => {
  test('one word, two books', () => {
    const app = shelf();
    app.search('lemon');
    assert.deepEqual(app.results(), [
      ['Lemon drizzle', 'Sweets'],
      ['Lemon chicken', 'Dinner'],
    ]);
  });

  test('finding something that is not in the open book', () => {
    const app = shelf();
    app.search('roast');
    assert.deepEqual(app.results(), [['Roast chicken', 'Dinner']]);
    assert.equal(app.openBook(), 'Sweets', 'searching does not move the reader');
  });

  test('it does not matter how it was typed', () => {
    const app = shelf();
    app.search('APPLE');
    assert.deepEqual(app.results(), [['Apple cake', 'Sweets']]);
  });

  test('the results stand in place of the contents', () => {
    const app = shelf();
    assert.ok(app.contentsIsShowing());
    app.search('lemon');
    assert.ok(!app.contentsIsShowing(), 'the contents is not on screen during a search');
  });

  test('an empty box is not a search', () => {
    const app = shelf();
    app.search('   ');
    assert.deepEqual(app.results(), []);
    assert.ok(app.contentsIsShowing());
    assert.deepEqual(app.contents(), ['Apple cake', 'Lemon drizzle']);
  });
});

rule('search-matches-what-it-takes', () => {
  test('the recipe with the flour in it', () => {
    const app = shelf();
    app.give('Apple cake', 'ingredient', ['200g plain flour', '3 apples']);
    app.openBookNamed('Dinner');
    app.give('Lemon chicken', 'ingredient', ['2 lemons']);
    app.openBookNamed('Sweets');

    app.search('flour');
    assert.deepEqual(app.results(), [['Apple cake', 'Sweets']]);
    assert.equal(app.resultLine('Apple cake'), '200g plain flour');
  });

  test('a match on the name shows no line', () => {
    const app = shelf();
    app.give('Apple cake', 'ingredient', ['200g plain flour', '3 apples']);

    app.search('apple');
    assert.deepEqual(app.results(), [['Apple cake', 'Sweets']]);
    assert.equal(app.resultLine('Apple cake'), null);
  });

  test('the method is not searched', () => {
    const app = shelf();
    app.give('Apple cake', 'step', ['Heat the oven to 180C']);

    app.search('oven');
    assert.deepEqual(app.results(), [], 'a step is not what a recipe is recognised by');
  });
});

rule('search-finds-nothing', () => {
  test('looking for something never written down', () => {
    const app = shelf();
    app.search('paella');

    assert.deepEqual(app.results(), []);
    assert.equal(app.message(), 'No recipe matches that.');
  });

  test('it says nothing about the book, which has not been touched', () => {
    const app = shelf();
    app.search('paella');
    assert.notEqual(app.message(), 'No recipes in this book yet.');

    app.clearSearch();
    assert.deepEqual(app.contents(), ['Apple cake', 'Lemon drizzle']);
    assert.equal(app.message(), null);
  });

  test('an empty book searched for nothing still says it is empty', () => {
    const app = shelf();
    app.makeBook('Baking');
    assert.equal(app.message(), 'No recipes in this book yet.');
  });
});
