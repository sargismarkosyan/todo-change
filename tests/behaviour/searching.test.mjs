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

rule('search-reaches-every-book', () => {
  test('one word, two books', async () => {
    const app = await shelf();
    await app.search('lemon');
    assert.deepEqual(await app.results(), [
      ['Lemon drizzle', 'Sweets'],
      ['Lemon chicken', 'Dinner'],
    ]);
  });

  test('finding something that is not in the open book', async () => {
    const app = await shelf();
    await app.search('roast');
    assert.deepEqual(await app.results(), [['Roast chicken', 'Dinner']]);
    assert.equal(await app.openBook(), 'Sweets', 'searching does not move the reader');
  });

  test('it does not matter how it was typed', async () => {
    const app = await shelf();
    await app.search('APPLE');
    assert.deepEqual(await app.results(), [['Apple cake', 'Sweets']]);
  });

  test('the results stand in place of the contents', async () => {
    const app = await shelf();
    assert.ok(await app.contentsIsShowing());
    await app.search('lemon');
    assert.ok(!await app.contentsIsShowing(), 'the contents is not on screen during a search');
  });

  test('an empty box is not a search', async () => {
    const app = await shelf();
    await app.search('   ');
    assert.deepEqual(await app.results(), []);
    assert.ok(await app.contentsIsShowing());
    assert.deepEqual(await app.contents(), ['Apple cake', 'Lemon drizzle']);
  });
});

rule('search-matches-what-it-takes', () => {
  test('the recipe with the flour in it', async () => {
    const app = await shelf();
    await app.give('Apple cake', 'ingredient', ['200g plain flour', '3 apples']);
    await app.openBookNamed('Dinner');
    await app.give('Lemon chicken', 'ingredient', ['2 lemons']);
    await app.openBookNamed('Sweets');

    await app.search('flour');
    assert.deepEqual(await app.results(), [['Apple cake', 'Sweets']]);
    assert.equal(await app.resultLine('Apple cake'), '200g plain flour');
  });

  test('a match on the name shows no line', async () => {
    const app = await shelf();
    await app.give('Apple cake', 'ingredient', ['200g plain flour', '3 apples']);

    await app.search('apple');
    assert.deepEqual(await app.results(), [['Apple cake', 'Sweets']]);
    assert.equal(await app.resultLine('Apple cake'), null);
  });

  test('the method is not searched', async () => {
    const app = await shelf();
    await app.give('Apple cake', 'step', ['Heat the oven to 180C']);

    await app.search('oven');
    assert.deepEqual(await app.results(), [], 'a step is not what a recipe is recognised by');
  });
});

rule('search-finds-nothing', () => {
  test('looking for something never written down', async () => {
    const app = await shelf();
    await app.search('paella');

    assert.deepEqual(await app.results(), []);
    assert.equal(await app.message(), 'No recipe matches that.');
  });

  test('it says nothing about the book, which has not been touched', async () => {
    const app = await shelf();
    await app.search('paella');
    assert.notEqual(await app.message(), 'No recipes in this book yet.');

    await app.clearSearch();
    assert.deepEqual(await app.contents(), ['Apple cake', 'Lemon drizzle']);
    assert.equal(await app.message(), null);
  });

  test('an empty book searched for nothing still says it is empty', async () => {
    const app = await shelf();
    await app.makeBook('Baking');
    assert.equal(await app.message(), 'No recipes in this book yet.');
  });
});
