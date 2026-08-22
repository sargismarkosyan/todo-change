// specs/workflows/find-a-recipe.feature
//
// One attempt, three entry points — a book in mind, a name in mind, or nothing
// in mind at all. Each walks to the same end state: the recipe is open.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workflow } from '../support/covers.mjs';
import { openStore, openHome, storedBooks } from '../support/app.mjs';

const TWO_BOOKS = storedBooks(
  [
    {
      id: 'b1',
      name: 'Sweets',
      recipes: [
        { id: 'r1', name: 'Lemon drizzle' },
        { id: 'r2', name: 'Apple cake', favourite: true, ingredients: [{ id: 'i1', text: '3 apples' }] },
      ],
    },
    { id: 'b2', name: 'Dinner', recipes: [{ id: 'r3', name: 'Lemon chicken' }] },
  ],
  'b1',
);

workflow('find-a-recipe', () => {
  test('at the fridge, with a book in mind', async () => {
    const app = await openStore(TWO_BOOKS);

    await app.openBookNamed('Sweets');
    assert.deepEqual(await app.contents(), ['Lemon drizzle', 'Apple cake']);

    await app.openRecipe('Apple cake');
    assert.ok(await app.ingredientsComeFirst('Apple cake'));

    const back = await app.reload();
    assert.equal(await back.openBook(), 'Sweets', 'it comes back on the book it was left on');
  });

  test('with only part of the name, and no idea which book', async () => {
    const app = await openStore(TWO_BOOKS);

    await app.search('lemon drizzle');
    assert.deepEqual(await app.results(), [['Lemon drizzle', 'Sweets']]);

    await app.openResult('Lemon drizzle');
    assert.equal(await app.openBook(), 'Sweets');
    assert.ok(await app.isOpen('Lemon drizzle'));
  });

  test('with nothing in mind, from the front door', async () => {
    const app = await openHome(TWO_BOOKS, { day: '2026-03-14' });

    assert.deepEqual(await app.favourites(), [['Apple cake', 'Sweets']]);

    await app.openFavourite('Apple cake');
    assert.equal(await app.openBook(), 'Sweets');
    assert.ok(await app.isOpen('Apple cake'));
  });
});
