// specs/features/finding/leaving-a-search.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp } from '../support/app.mjs';

/** The same two books as searching.test.mjs, "Sweets" open. */
async function shelf() {
  const app = await openApp();
  await app.renameBook('Sweets');
  await app.makeBook('Dinner');
  await app.writeDown('Lemon chicken');
  await app.writeDown('Roast chicken');
  await app.openBookNamed('Sweets');
  await app.writeDown('Lemon drizzle');
  await app.writeDown('Apple cake');
  return app;
}

rule('search-opens-it-where-it-lives', () => {
  test('landing in the other book', async () => {
    const app = await shelf();
    await app.openBookNamed('Dinner');
    await app.give('Roast chicken', 'step', ['Heat the oven to 200C']);
    await app.openBookNamed('Sweets');

    await app.search('roast');
    await app.openResult('Roast chicken');

    assert.equal(await app.openBook(), 'Dinner');
    assert.ok(await app.isOpen('Roast chicken'));
    assert.deepEqual(await app.method('Roast chicken'), ['Heat the oven to 200C']);
    assert.deepEqual(await app.contents(), ['Roast chicken', 'Lemon chicken']);
    assert.equal(await app.searchBox(), '');
  });

  test('the book it opened is the book it writes into', async () => {
    const app = await shelf();
    await app.search('roast');
    await app.openResult('Roast chicken');

    await app.writeDown('Fish pie');
    assert.deepEqual(await app.contents(), ['Fish pie', 'Roast chicken', 'Lemon chicken']);

    await app.openBookNamed('Sweets');
    assert.deepEqual(await app.contents(), ['Apple cake', 'Lemon drizzle']);
  });

  test('one already in the open book opens where it is', async () => {
    const app = await shelf();
    await app.search('apple');
    await app.openResult('Apple cake');

    assert.equal(await app.openBook(), 'Sweets');
    assert.ok(await app.isOpen('Apple cake'));
    assert.equal(await app.searchBox(), '');
  });

  test('a result offers nothing but going there', async () => {
    const app = await shelf();
    await app.search('roast');
    const result = app.document.querySelector('.result');
    assert.equal((await result.querySelectorAll('input, form')).length, 0, 'nothing to type into');
    assert.equal((await result.querySelectorAll('[class$="__delete"]')).length, 0, 'nothing to delete');
  });
});

rule('search-clears-back-to-the-contents', () => {
  test('changing my mind halfway', async () => {
    const app = await shelf();
    await app.openRecipe('Apple cake');

    await app.search('chicken');
    await app.clearSearch();

    assert.deepEqual(await app.contents(), ['Apple cake', 'Lemon drizzle']);
    assert.ok(await app.isOpen('Apple cake'), 'the recipe being read is still open');
  });

  test('nothing about a search is written down', async () => {
    const app = await shelf();
    const before = await app.stored();

    await app.search('chicken');
    assert.equal(await app.stored(), before, 'searching writes nothing');

    await app.clearSearch();
    assert.equal(await app.stored(), before);
  });
});

rule('search-does-not-outlast-what-follows-it', () => {
  test('a new recipe has to be visibly there', async () => {
    const app = await shelf();
    await app.search('chicken');
    await app.writeDown('Bakewell tart');

    assert.equal(await app.searchBox(), '');
    assert.deepEqual(await app.contents(), ['Bakewell tart', 'Apple cake', 'Lemon drizzle']);
  });

  test('another book is another contents page', async () => {
    const app = await shelf();
    await app.search('chicken');
    await app.openBookNamed('Dinner');

    assert.equal(await app.searchBox(), '');
    assert.deepEqual(await app.contents(), ['Roast chicken', 'Lemon chicken']);
  });

  test('a book made mid-search opens on its own empty contents', async () => {
    const app = await shelf();
    await app.search('chicken');
    await app.makeBook('Baking');

    assert.equal(await app.searchBox(), '');
    assert.equal(await app.openBook(), 'Baking');
    assert.deepEqual(await app.contents(), []);
    assert.equal(await app.message(), 'No recipes in this book yet.');
  });

  test('deleting the book mid-search lands on the contents of the next one', async () => {
    const app = await shelf();
    await app.openBookNamed('Dinner');
    await app.search('lemon');
    await app.deleteBook();
    await app.agree();

    assert.equal(await app.searchBox(), '');
    assert.equal(await app.openBook(), 'Sweets');
    assert.deepEqual(await app.contents(), ['Apple cake', 'Lemon drizzle']);
  });

  test('deleting an empty book mid-search does the same, without asking', async () => {
    const app = await shelf();
    await app.makeBook('Baking');
    await app.search('lemon');
    await app.deleteBook();

    assert.equal(await app.searchBox(), '');
    assert.equal(await app.openBook(), 'Dinner');
    assert.deepEqual(await app.contents(), ['Roast chicken', 'Lemon chicken']);
  });
});
