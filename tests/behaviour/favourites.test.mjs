// specs/features/recipes/favourites.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openAppWithContents, openStore } from '../support/app.mjs';

/** The Background: one book of three, written down through the box. */
const sweets = async () => {
  const app = await openAppWithContents('Apple cake', 'Lemon drizzle', 'Bakewell tart');
  await app.renameBook('Sweets');
  return app;
};

rule('a-recipe-can-be-starred', () => {
  test('the one that gets made every week', async () => {
    const app = await sweets();

    await app.star('Apple cake');

    assert.equal(await app.isFavourite('Apple cake'), true);
    assert.equal(await app.isFavourite('Lemon drizzle'), false);
  });

  test('changing your mind about it', async () => {
    const app = await sweets();
    await app.star('Apple cake');

    await app.star('Apple cake');

    assert.equal(await app.isFavourite('Apple cake'), false);
  });

  test('every recipe offers the star, marked or not', async () => {
    const app = await sweets();
    await app.star('Apple cake');

    assert.equal(await app.everyRecipeOffersTheStar(), true);
    assert.equal(await app.offersTickBox(), false, 'and nothing on the row can be ticked');
  });
});

rule('a-star-is-kept', () => {
  test('coming back to it next month', async () => {
    const app = await sweets();
    await app.star('Bakewell tart');

    const later = await app.reload();

    assert.equal(await later.isFavourite('Bakewell tart'), true);
    assert.equal(await later.isFavourite('Apple cake'), false);
  });

  test('a stored star that is not one is not a star', async () => {
    const app = await openStore(
      JSON.stringify({
        books: [
          {
            id: 'b1',
            name: 'Sweets',
            recipes: [
              { id: 'r1', name: 'Apple cake', favourite: 'yes' },
              { id: 'r2', name: 'Lemon drizzle', favourite: true },
            ],
          },
        ],
        openId: 'b1',
      }),
    );

    assert.equal(await app.isFavourite('Apple cake'), false);
    assert.equal(await app.isFavourite('Lemon drizzle'), true);
  });

  test('a recipe nobody starred stores nothing about it', async () => {
    const app = await sweets();
    await app.star('Apple cake');
    await app.star('Apple cake');

    const stored = JSON.parse(await app.stored()).books[0].recipes;
    for (const recipe of stored) {
      assert.equal('favourite' in recipe, false, `"${recipe.name}" carries no key`);
    }
  });
});

rule('starring-moves-nothing', () => {
  test('the contents stays in the order it was put in', async () => {
    const app = await sweets();

    await app.star('Bakewell tart');

    assert.deepEqual(await app.contents(), ['Apple cake', 'Lemon drizzle', 'Bakewell tart']);
  });

  test('starring is not opening', async () => {
    const app = await sweets();
    await app.openRecipe('Lemon drizzle');

    await app.star('Apple cake');

    assert.equal(await app.isOpen('Lemon drizzle'), true, 'the one being read stays open');
    assert.equal(await app.isOpen('Apple cake'), false, 'and the one starred does not open');
  });

  test('a starred recipe is deleted like any other', async () => {
    const app = await sweets();
    await app.star('Apple cake');

    await app.deleteRecipe('Apple cake');

    assert.deepEqual(await app.contents(), ['Lemon drizzle', 'Bakewell tart']);
  });

  test('what it takes and how to make it are untouched', async () => {
    const app = await openApp();
    await app.writeDown('Apple cake');
    await app.give('Apple cake', 'ingredient', ['200g plain flour']);
    await app.give('Apple cake', 'step', ['Heat the oven to 180C']);

    await app.star('Apple cake');
    await app.openRecipe('Apple cake');

    assert.deepEqual(await app.ingredients('Apple cake'), ['200g plain flour']);
    assert.deepEqual(await app.method('Apple cake'), ['Heat the oven to 180C']);
  });

  test('the address does not move under a star', async () => {
    const app = await sweets();
    const before = await app.address();

    await app.star('Apple cake');

    assert.equal(await app.address(), before);
    assert.equal(await app.addressNamesTheOpenBook(), true);
  });
});
