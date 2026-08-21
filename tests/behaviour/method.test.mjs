// specs/features/recipes/method.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

/** The Background: one recipe, open. */
async function open() {
  const app = await openAppWithContents('Apple cake');
  await app.openRecipe('Apple cake');
  return app;
}

rule('sub-todo-added-under-parent', () => {
  test('the first thing to do', async () => {
    const app = await open();
    await app.addStep('Apple cake', 'Heat the oven to 180C');
    assert.deepEqual(await app.method('Apple cake'), ['Heat the oven to 180C']);
  });

  test('the recipe stays where it was in the contents', async () => {
    const app = await openAppWithContents('Lemon drizzle', 'Apple cake');
    await app.openRecipe('Apple cake');
    await app.addStep('Apple cake', 'Heat the oven to 180C');
    assert.deepEqual(await app.contents(), ['Lemon drizzle', 'Apple cake']);
  });
});

rule('sub-todos-keep-typing-order', () => {
  test('three things in sequence', async () => {
    const app = await open();
    await app.addStep('Apple cake', 'Heat the oven to 180C');
    await app.addStep('Apple cake', 'Peel and slice the apples');
    await app.addStep('Apple cake', 'Bake for forty minutes');

    assert.deepEqual(await app.method('Apple cake'), [
      'Heat the oven to 180C',
      'Peel and slice the apples',
      'Bake for forty minutes',
    ]);
  });
});

rule('sub-todo-rejects-blank', () => {
  test('submitting only spaces', async () => {
    const app = await open();
    await app.submitLine('Apple cake', 'step', '   ');
    assert.deepEqual(await app.method('Apple cake'), []);
  });
});

rule('sub-todo-depth-is-one', () => {
  test('there is no second level to reach for', async () => {
    const app = await open();
    await app.addStep('Apple cake', 'Heat the oven to 180C');
    assert.equal(
      await app.offersAnythingUnder('Heat the oven to 180C'),
      false,
      'a step holds nothing of its own',
    );
  });
});
