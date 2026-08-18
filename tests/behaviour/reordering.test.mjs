// specs/features/recipes/reordering.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

/** The Background: "Apple pie" open, with three steps in the wrong order. */
function book() {
  const app = openAppWithContents('Apple pie');
  app.renameBook('Sweets');
  app.openRecipe('Apple pie');
  app.give('Apple pie', 'step', [
    'Rub the butter into the flour',
    'Heat the oven to 190C',
    'Bake for 45 minutes',
  ]);
  app.openRecipe('Apple pie');
  return app;
}

rule('line-moved-within-its-group', () => {
  test('the step that should have come first', () => {
    const app = book();
    app.dragAbove('Heat the oven to 190C', 'Rub the butter into the flour');
    assert.deepEqual(app.method('Apple pie'), [
      'Heat the oven to 190C',
      'Rub the butter into the flour',
      'Bake for 45 minutes',
    ]);
  });

  test('sending one to the end', () => {
    const app = book();
    app.dragBelow('Rub the butter into the flour', 'Bake for 45 minutes');
    assert.deepEqual(app.method('Apple pie'), [
      'Heat the oven to 190C',
      'Bake for 45 minutes',
      'Rub the butter into the flour',
    ]);
  });

  test('the ingredients move the same way', () => {
    const app = book();
    app.give('Apple pie', 'ingredient', ['3 apples', '200g plain flour']);
    app.openRecipe('Apple pie');

    app.dragAbove('200g plain flour', '3 apples');
    assert.deepEqual(app.ingredients('Apple pie'), ['200g plain flour', '3 apples']);
  });
});

rule('line-moves-only-within-its-group', () => {
  test('dropping a step among the ingredients', () => {
    const app = book();
    app.give('Apple pie', 'ingredient', ['3 apples']);
    app.openRecipe('Apple pie');

    app.dragAbove('Bake for 45 minutes', '3 apples');

    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples']);
    assert.deepEqual(app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Heat the oven to 190C',
      'Bake for 45 minutes',
    ]);
  });

  test('and the other way round', () => {
    const app = book();
    app.give('Apple pie', 'ingredient', ['3 apples', '200g plain flour']);
    app.openRecipe('Apple pie');

    app.dragAbove('3 apples', 'Heat the oven to 190C');

    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples', '200g plain flour']);
    assert.deepEqual(app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Heat the oven to 190C',
      'Bake for 45 minutes',
    ]);
  });
});

rule('moving-changes-nothing-but-the-order', () => {
  test('the words are the words', () => {
    const app = book();
    app.dragAbove('Bake for 45 minutes', 'Heat the oven to 190C');
    assert.deepEqual(app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Bake for 45 minutes',
      'Heat the oven to 190C',
    ]);
  });

  test('a line dropped where it already was is not a change', () => {
    const app = book();
    app.dragAbove('Heat the oven to 190C', 'Bake for 45 minutes');
    assert.deepEqual(app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Heat the oven to 190C',
      'Bake for 45 minutes',
    ]);
  });

  test('a line dropped on itself is not a change', () => {
    const app = book();
    app.dragAbove('Heat the oven to 190C', 'Heat the oven to 190C');
    assert.deepEqual(app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Heat the oven to 190C',
      'Bake for 45 minutes',
    ]);
  });

  test('the recipe stays where it is in the contents', () => {
    const app = openAppWithContents('Apple pie', 'Lemon drizzle');
    app.give('Apple pie', 'step', ['Heat the oven to 190C', 'Bake for 45 minutes']);
    app.openRecipe('Apple pie');

    app.dragAbove('Bake for 45 minutes', 'Heat the oven to 190C');
    assert.deepEqual(app.contents(), ['Apple pie', 'Lemon drizzle']);
  });

  test('another recipe is untouched', () => {
    const app = openAppWithContents('Apple pie', 'Lemon drizzle');
    app.give('Lemon drizzle', 'step', ['Zest the lemons', 'Beat the sugar in']);
    app.give('Apple pie', 'step', ['Heat the oven to 190C', 'Bake for 45 minutes']);
    app.openRecipe('Apple pie');

    app.dragAbove('Bake for 45 minutes', 'Heat the oven to 190C');

    app.openRecipe('Lemon drizzle');
    assert.deepEqual(app.method('Lemon drizzle'), ['Zest the lemons', 'Beat the sugar in']);
  });
});

rule('the-new-order-is-kept', () => {
  test('coming back to it', () => {
    const app = book();
    app.dragAbove('Heat the oven to 190C', 'Rub the butter into the flour');

    const back = app.reload();
    back.openRecipe('Apple pie');
    assert.deepEqual(back.method('Apple pie'), [
      'Heat the oven to 190C',
      'Rub the butter into the flour',
      'Bake for 45 minutes',
    ]);
  });
});
