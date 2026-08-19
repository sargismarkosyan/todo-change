// specs/features/recipes/reordering.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

/**
 * The Background: "Apple pie" open, with three steps in the wrong order.
 *
 * Lines are moved with the arrow keys. Since 0012 the dragging is SortableJS's
 * and cannot run in jsdom; the keyboard is this app's own and reaches the same
 * state by the same path. See specs/changes/0012-somebody-elses-drag.md.
 */
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
    app.moveLineUp('Heat the oven to 190C');
    assert.deepEqual(app.method('Apple pie'), [
      'Heat the oven to 190C',
      'Rub the butter into the flour',
      'Bake for 45 minutes',
    ]);
  });

  test('sending one to the end', () => {
    const app = book();
    app.moveLineDown('Rub the butter into the flour');
    app.moveLineDown('Rub the butter into the flour');
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

    app.moveLineUp('200g plain flour');
    assert.deepEqual(app.ingredients('Apple pie'), ['200g plain flour', '3 apples']);
  });
});

rule('line-moves-only-within-its-group', () => {
  test('the last step cannot fall into the ingredients', () => {
    const app = book();
    app.give('Apple pie', 'ingredient', ['3 apples']);
    app.openRecipe('Apple pie');

    app.moveLineDown('Bake for 45 minutes');

    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples']);
    assert.deepEqual(app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Heat the oven to 190C',
      'Bake for 45 minutes',
    ]);
  });

  test('and the first ingredient cannot climb into the method', () => {
    const app = book();
    app.give('Apple pie', 'ingredient', ['3 apples', '200g plain flour']);
    app.openRecipe('Apple pie');

    app.moveLineUp('3 apples');

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
    app.moveLineUp('Bake for 45 minutes');
    assert.deepEqual(app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Bake for 45 minutes',
      'Heat the oven to 190C',
    ]);
  });

  test('the recipe stays where it is in the contents', () => {
    const app = openAppWithContents('Apple pie', 'Lemon drizzle');
    app.give('Apple pie', 'step', ['Heat the oven to 190C', 'Bake for 45 minutes']);
    app.openRecipe('Apple pie');

    app.moveLineUp('Bake for 45 minutes');
    assert.deepEqual(app.contents(), ['Apple pie', 'Lemon drizzle']);
  });

  test('another recipe is untouched', () => {
    const app = openAppWithContents('Apple pie', 'Lemon drizzle');
    app.give('Lemon drizzle', 'step', ['Zest the lemons', 'Beat the sugar in']);
    app.give('Apple pie', 'step', ['Heat the oven to 190C', 'Bake for 45 minutes']);
    app.openRecipe('Apple pie');

    app.moveLineUp('Bake for 45 minutes');

    app.openRecipe('Lemon drizzle');
    assert.deepEqual(app.method('Lemon drizzle'), ['Zest the lemons', 'Beat the sugar in']);
  });
});

rule('the-new-order-is-kept', () => {
  test('coming back to it', () => {
    const app = book();
    app.moveLineUp('Heat the oven to 190C');

    const back = app.reload();
    back.openRecipe('Apple pie');
    assert.deepEqual(back.method('Apple pie'), [
      'Heat the oven to 190C',
      'Rub the butter into the flour',
      'Bake for 45 minutes',
    ]);
  });
});
