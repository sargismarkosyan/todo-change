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

rule('line-moved-within-its-group', () => {
  test('the step that should have come first', async () => {
    const app = await book();
    await app.moveLineUp('Heat the oven to 190C');
    assert.deepEqual(await app.method('Apple pie'), [
      'Heat the oven to 190C',
      'Rub the butter into the flour',
      'Bake for 45 minutes',
    ]);
  });

  test('dropped where it belongs, rather than walked there', async () => {
    const app = await book();
    await app.dropLine('Bake for 45 minutes', 0);
    assert.deepEqual(await app.method('Apple pie'), [
      'Bake for 45 minutes',
      'Rub the butter into the flour',
      'Heat the oven to 190C',
    ]);
  });

  test('sending one to the end', async () => {
    const app = await book();
    await app.moveLineDown('Rub the butter into the flour');
    await app.moveLineDown('Rub the butter into the flour');
    assert.deepEqual(await app.method('Apple pie'), [
      'Heat the oven to 190C',
      'Bake for 45 minutes',
      'Rub the butter into the flour',
    ]);
  });

  test('the ingredients move the same way', async () => {
    const app = await book();
    await app.give('Apple pie', 'ingredient', ['3 apples', '200g plain flour']);
    await app.openRecipe('Apple pie');

    await app.moveLineUp('200g plain flour');
    assert.deepEqual(await app.ingredients('Apple pie'), ['200g plain flour', '3 apples']);
  });
});

rule('line-moves-only-within-its-group', () => {
  test('the last step cannot fall into the ingredients', async () => {
    const app = await book();
    await app.give('Apple pie', 'ingredient', ['3 apples']);
    await app.openRecipe('Apple pie');

    await app.moveLineDown('Bake for 45 minutes');

    assert.deepEqual(await app.ingredients('Apple pie'), ['3 apples']);
    assert.deepEqual(await app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Heat the oven to 190C',
      'Bake for 45 minutes',
    ]);
  });

  test('and the first ingredient cannot climb into the method', async () => {
    const app = await book();
    await app.give('Apple pie', 'ingredient', ['3 apples', '200g plain flour']);
    await app.openRecipe('Apple pie');

    await app.moveLineUp('3 apples');

    assert.deepEqual(await app.ingredients('Apple pie'), ['3 apples', '200g plain flour']);
    assert.deepEqual(await app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Heat the oven to 190C',
      'Bake for 45 minutes',
    ]);
  });
});

rule('moving-changes-nothing-but-the-order', () => {
  test('the words are the words', async () => {
    const app = await book();
    await app.moveLineUp('Bake for 45 minutes');
    assert.deepEqual(await app.method('Apple pie'), [
      'Rub the butter into the flour',
      'Bake for 45 minutes',
      'Heat the oven to 190C',
    ]);
  });

  test('the recipe stays where it is in the contents', async () => {
    const app = await openAppWithContents('Apple pie', 'Lemon drizzle');
    await app.give('Apple pie', 'step', ['Heat the oven to 190C', 'Bake for 45 minutes']);
    await app.openRecipe('Apple pie');

    await app.moveLineUp('Bake for 45 minutes');
    assert.deepEqual(await app.contents(), ['Apple pie', 'Lemon drizzle']);
  });

  test('another recipe is untouched', async () => {
    const app = await openAppWithContents('Apple pie', 'Lemon drizzle');
    await app.give('Lemon drizzle', 'step', ['Zest the lemons', 'Beat the sugar in']);
    await app.give('Apple pie', 'step', ['Heat the oven to 190C', 'Bake for 45 minutes']);
    await app.openRecipe('Apple pie');

    await app.moveLineUp('Bake for 45 minutes');

    await app.openRecipe('Lemon drizzle');
    assert.deepEqual(await app.method('Lemon drizzle'), ['Zest the lemons', 'Beat the sugar in']);
  });
});

rule('the-new-order-is-kept', () => {
  test('coming back to it', async () => {
    const app = await book();
    await app.moveLineUp('Heat the oven to 190C');

    const back = await app.reload();
    await back.openRecipe('Apple pie');
    assert.deepEqual(await back.method('Apple pie'), [
      'Heat the oven to 190C',
      'Rub the butter into the flour',
      'Bake for 45 minutes',
    ]);
  });
});
