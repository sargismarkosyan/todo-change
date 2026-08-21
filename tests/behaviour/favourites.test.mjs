// specs/features/recipes/favourites.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openAppWithContents, openStore } from '../support/app.mjs';

/** The Background: one book of three, written down through the box. */
const sweets = () => {
  const app = openAppWithContents('Apple cake', 'Lemon drizzle', 'Bakewell tart');
  app.renameBook('Sweets');
  return app;
};

rule('a-recipe-can-be-starred', () => {
  test('the one that gets made every week', () => {
    const app = sweets();

    app.star('Apple cake');

    assert.equal(app.isFavourite('Apple cake'), true);
    assert.equal(app.isFavourite('Lemon drizzle'), false);
  });

  test('changing your mind about it', () => {
    const app = sweets();
    app.star('Apple cake');

    app.star('Apple cake');

    assert.equal(app.isFavourite('Apple cake'), false);
  });

  test('every recipe offers the star, marked or not', () => {
    const app = sweets();
    app.star('Apple cake');

    assert.equal(app.everyRecipeOffersTheStar(), true);
    assert.equal(app.offersTickBox(), false, 'and nothing on the row can be ticked');
  });
});

rule('a-star-is-kept', () => {
  test('coming back to it next month', () => {
    const app = sweets();
    app.star('Bakewell tart');

    const later = app.reload();

    assert.equal(later.isFavourite('Bakewell tart'), true);
    assert.equal(later.isFavourite('Apple cake'), false);
  });

  test('a stored star that is not one is not a star', () => {
    const app = openStore(
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

    assert.equal(app.isFavourite('Apple cake'), false);
    assert.equal(app.isFavourite('Lemon drizzle'), true);
  });

  test('a recipe nobody starred stores nothing about it', () => {
    const app = sweets();
    app.star('Apple cake');
    app.star('Apple cake');

    const stored = JSON.parse(app.stored()).books[0].recipes;
    for (const recipe of stored) {
      assert.equal('favourite' in recipe, false, `"${recipe.name}" carries no key`);
    }
  });
});

rule('starring-moves-nothing', () => {
  test('the contents stays in the order it was put in', () => {
    const app = sweets();

    app.star('Bakewell tart');

    assert.deepEqual(app.contents(), ['Apple cake', 'Lemon drizzle', 'Bakewell tart']);
  });

  test('starring is not opening', () => {
    const app = sweets();
    app.openRecipe('Lemon drizzle');

    app.star('Apple cake');

    assert.equal(app.isOpen('Lemon drizzle'), true, 'the one being read stays open');
    assert.equal(app.isOpen('Apple cake'), false, 'and the one starred does not open');
  });

  test('a starred recipe is deleted like any other', () => {
    const app = sweets();
    app.star('Apple cake');

    app.deleteRecipe('Apple cake');

    assert.deepEqual(app.contents(), ['Lemon drizzle', 'Bakewell tart']);
  });

  test('what it takes and how to make it are untouched', () => {
    const app = openApp();
    app.writeDown('Apple cake');
    app.give('Apple cake', 'ingredient', ['200g plain flour']);
    app.give('Apple cake', 'step', ['Heat the oven to 180C']);

    app.star('Apple cake');
    app.openRecipe('Apple cake');

    assert.deepEqual(app.ingredients('Apple cake'), ['200g plain flour']);
    assert.deepEqual(app.method('Apple cake'), ['Heat the oven to 180C']);
  });

  test('the address does not move under a star', () => {
    const app = sweets();
    const before = app.address();

    app.star('Apple cake');

    assert.equal(app.address(), before);
    assert.equal(app.addressNamesTheOpenBook(), true);
  });
});
