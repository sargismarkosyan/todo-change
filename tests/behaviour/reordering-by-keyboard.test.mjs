// specs/features/recipes/reordering-by-keyboard.feature

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

rule('line-moved-by-keyboard', () => {
  test('lifting a step by one', () => {
    const app = book();
    app.focusHandle('Heat the oven to 190C');
    app.pressArrow('ArrowUp');

    assert.deepEqual(app.method('Apple pie'), [
      'Heat the oven to 190C',
      'Rub the butter into the flour',
      'Bake for 45 minutes',
    ]);
  });

  test('pushing one down', () => {
    const app = book();
    app.focusHandle('Rub the butter into the flour');
    app.pressArrow('ArrowDown');

    assert.deepEqual(app.method('Apple pie'), [
      'Heat the oven to 190C',
      'Rub the butter into the flour',
      'Bake for 45 minutes',
    ]);
  });

  test('the handle keeps focus, so it can be pressed again', () => {
    const app = book();
    app.focusHandle('Bake for 45 minutes');
    app.pressArrow('ArrowUp');
    assert.ok(app.handleHasFocus('Bake for 45 minutes'), 'focus followed the line');

    app.pressArrow('ArrowUp');
    assert.deepEqual(app.method('Apple pie'), [
      'Bake for 45 minutes',
      'Rub the butter into the flour',
      'Heat the oven to 190C',
    ]);
  });

  test('the ingredients move the same way', () => {
    const app = book();
    app.give('Apple pie', 'ingredient', ['3 apples', '200g plain flour']);
    app.openRecipe('Apple pie');

    app.focusHandle('200g plain flour');
    app.pressArrow('ArrowUp');
    assert.deepEqual(app.ingredients('Apple pie'), ['200g plain flour', '3 apples']);
  });

  test('any other key leaves it alone', () => {
    const app = book();
    app.focusHandle('Bake for 45 minutes');
    app.pressArrow('ArrowLeft');
    app.pressArrow('Enter');

    assert.deepEqual(app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Heat the oven to 190C',
      'Bake for 45 minutes',
    ]);
  });

  test('the new order is written down, not just shown', () => {
    const app = book();
    app.focusHandle('Bake for 45 minutes');
    app.pressArrow('ArrowUp');

    const back = app.reload();
    back.openRecipe('Apple pie');
    assert.deepEqual(back.method('Apple pie'), [
      'Rub the butter into the flour',
      'Bake for 45 minutes',
      'Heat the oven to 190C',
    ]);
  });
});

rule('the-ends-of-the-group-hold', () => {
  test('the first one cannot go higher', () => {
    const app = book();
    app.focusHandle('Rub the butter into the flour');
    app.pressArrow('ArrowUp');

    assert.deepEqual(app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Heat the oven to 190C',
      'Bake for 45 minutes',
    ]);
  });

  test('the last one cannot go lower', () => {
    const app = book();
    app.focusHandle('Bake for 45 minutes');
    app.pressArrow('ArrowDown');

    assert.deepEqual(app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Heat the oven to 190C',
      'Bake for 45 minutes',
    ]);
  });

  test('a group of one has nowhere to go', () => {
    const app = book();
    app.give('Apple pie', 'ingredient', ['3 apples']);
    app.openRecipe('Apple pie');

    app.focusHandle('3 apples');
    app.pressArrow('ArrowUp');
    app.pressArrow('ArrowDown');

    assert.deepEqual(app.ingredients('Apple pie'), ['3 apples']);
  });
});
