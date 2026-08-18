// specs/features/finding/leaving-a-search.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp } from '../support/app.mjs';

/** The same two books as searching.test.mjs, "Sweets" open. */
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

rule('search-opens-it-where-it-lives', () => {
  test('landing in the other book', () => {
    const app = shelf();
    app.openBookNamed('Dinner');
    app.give('Roast chicken', 'step', ['Heat the oven to 200C']);
    app.openBookNamed('Sweets');

    app.search('roast');
    app.openResult('Roast chicken');

    assert.equal(app.openBook(), 'Dinner');
    assert.ok(app.isOpen('Roast chicken'));
    assert.deepEqual(app.method('Roast chicken'), ['Heat the oven to 200C']);
    assert.deepEqual(app.contents(), ['Roast chicken', 'Lemon chicken']);
    assert.equal(app.searchBox(), '');
  });

  test('the book it opened is the book it writes into', () => {
    const app = shelf();
    app.search('roast');
    app.openResult('Roast chicken');

    app.writeDown('Fish pie');
    assert.deepEqual(app.contents(), ['Fish pie', 'Roast chicken', 'Lemon chicken']);

    app.openBookNamed('Sweets');
    assert.deepEqual(app.contents(), ['Apple cake', 'Lemon drizzle']);
  });

  test('one already in the open book opens where it is', () => {
    const app = shelf();
    app.search('apple');
    app.openResult('Apple cake');

    assert.equal(app.openBook(), 'Sweets');
    assert.ok(app.isOpen('Apple cake'));
    assert.equal(app.searchBox(), '');
  });

  test('a result offers nothing but going there', () => {
    const app = shelf();
    app.search('roast');
    const result = app.document.querySelector('.result');
    assert.equal(result.querySelectorAll('input, form').length, 0, 'nothing to type into');
    assert.equal(result.querySelectorAll('[class$="__delete"]').length, 0, 'nothing to delete');
  });
});

rule('search-clears-back-to-the-contents', () => {
  test('changing my mind halfway', () => {
    const app = shelf();
    app.openRecipe('Apple cake');

    app.search('chicken');
    app.clearSearch();

    assert.deepEqual(app.contents(), ['Apple cake', 'Lemon drizzle']);
    assert.ok(app.isOpen('Apple cake'), 'the recipe being read is still open');
  });

  test('nothing about a search is written down', () => {
    const app = shelf();
    const before = app.stored();

    app.search('chicken');
    assert.equal(app.stored(), before, 'searching writes nothing');

    app.clearSearch();
    assert.equal(app.stored(), before);
  });
});

rule('search-does-not-outlast-what-follows-it', () => {
  test('a new recipe has to be visibly there', () => {
    const app = shelf();
    app.search('chicken');
    app.writeDown('Bakewell tart');

    assert.equal(app.searchBox(), '');
    assert.deepEqual(app.contents(), ['Bakewell tart', 'Apple cake', 'Lemon drizzle']);
  });

  test('another book is another contents page', () => {
    const app = shelf();
    app.search('chicken');
    app.openBookNamed('Dinner');

    assert.equal(app.searchBox(), '');
    assert.deepEqual(app.contents(), ['Roast chicken', 'Lemon chicken']);
  });

  test('a book made mid-search opens on its own empty contents', () => {
    const app = shelf();
    app.search('chicken');
    app.makeBook('Baking');

    assert.equal(app.searchBox(), '');
    assert.equal(app.openBook(), 'Baking');
    assert.deepEqual(app.contents(), []);
    assert.equal(app.message(), 'No recipes in this book yet.');
  });

  test('deleting the book mid-search lands on the contents of the next one', () => {
    const app = shelf();
    app.openBookNamed('Dinner');
    app.search('lemon');
    app.deleteBook();
    app.agree();

    assert.equal(app.searchBox(), '');
    assert.equal(app.openBook(), 'Sweets');
    assert.deepEqual(app.contents(), ['Apple cake', 'Lemon drizzle']);
  });

  test('deleting an empty book mid-search does the same, without asking', () => {
    const app = shelf();
    app.makeBook('Baking');
    app.search('lemon');
    app.deleteBook();

    assert.equal(app.searchBox(), '');
    assert.equal(app.openBook(), 'Dinner');
    assert.deepEqual(app.contents(), ['Roast chicken', 'Lemon chicken']);
  });
});
