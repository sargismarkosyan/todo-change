// specs/features/recipes/reordering-by-keyboard.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

/** The Background: "Apple pie" open, with three steps in the wrong order. */
async function book() {
  const app = await openAppWithContents('Apple pie');
  await app.renameBook('Sweets');
  await app.openRecipe('Apple pie');
  await app.give('Apple pie', 'step', [
    'Rub the butter into the flour',
    'Heat the oven to 190C',
    'Bake for 45 minutes',
  ]);
  await app.openRecipe('Apple pie');
  return app;
}

rule('line-moved-by-keyboard', () => {
  test('lifting a step by one', async () => {
    const app = await book();
    await app.focusHandle('Heat the oven to 190C');
    await app.pressArrow('ArrowUp');

    assert.deepEqual(await app.method('Apple pie'), [
      'Heat the oven to 190C',
      'Rub the butter into the flour',
      'Bake for 45 minutes',
    ]);
  });

  test('pushing one down', async () => {
    const app = await book();
    await app.focusHandle('Rub the butter into the flour');
    await app.pressArrow('ArrowDown');

    assert.deepEqual(await app.method('Apple pie'), [
      'Heat the oven to 190C',
      'Rub the butter into the flour',
      'Bake for 45 minutes',
    ]);
  });

  test('the handle keeps focus, so it can be pressed again', async () => {
    const app = await book();
    await app.focusHandle('Bake for 45 minutes');
    await app.pressArrow('ArrowUp');
    assert.ok(await app.handleHasFocus('Bake for 45 minutes'), 'focus followed the line');

    await app.pressArrow('ArrowUp');
    assert.deepEqual(await app.method('Apple pie'), [
      'Bake for 45 minutes',
      'Rub the butter into the flour',
      'Heat the oven to 190C',
    ]);
  });

  test('the ingredients move the same way', async () => {
    const app = await book();
    await app.give('Apple pie', 'ingredient', ['3 apples', '200g plain flour']);
    await app.openRecipe('Apple pie');

    await app.focusHandle('200g plain flour');
    await app.pressArrow('ArrowUp');
    assert.deepEqual(await app.ingredients('Apple pie'), ['200g plain flour', '3 apples']);
  });

  test('any other key leaves it alone', async () => {
    const app = await book();
    await app.focusHandle('Bake for 45 minutes');
    await app.pressArrow('ArrowLeft');
    await app.pressArrow('Enter');

    assert.deepEqual(await app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Heat the oven to 190C',
      'Bake for 45 minutes',
    ]);
  });

  test('the new order is written down, not just shown', async () => {
    const app = await book();
    await app.focusHandle('Bake for 45 minutes');
    await app.pressArrow('ArrowUp');

    const back = await app.reload();
    await back.openRecipe('Apple pie');
    assert.deepEqual(await back.method('Apple pie'), [
      'Rub the butter into the flour',
      'Bake for 45 minutes',
      'Heat the oven to 190C',
    ]);
  });
});

rule('the-ends-of-the-group-hold', () => {
  test('the first one cannot go higher', async () => {
    const app = await book();
    await app.focusHandle('Rub the butter into the flour');
    await app.pressArrow('ArrowUp');

    assert.deepEqual(await app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Heat the oven to 190C',
      'Bake for 45 minutes',
    ]);
  });

  test('the last one cannot go lower', async () => {
    const app = await book();
    await app.focusHandle('Bake for 45 minutes');
    await app.pressArrow('ArrowDown');

    assert.deepEqual(await app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Heat the oven to 190C',
      'Bake for 45 minutes',
    ]);
  });

  test('a group of one has nowhere to go', async () => {
    const app = await book();
    await app.give('Apple pie', 'ingredient', ['3 apples']);
    await app.openRecipe('Apple pie');

    await app.focusHandle('3 apples');
    await app.pressArrow('ArrowUp');
    await app.pressArrow('ArrowDown');

    assert.deepEqual(await app.ingredients('Apple pie'), ['3 apples']);
  });
});
