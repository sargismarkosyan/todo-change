// specs/features/recipes/method.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

/** The Background: one recipe, open. */
function open() {
  const app = openAppWithContents('Apple cake');
  app.openRecipe('Apple cake');
  return app;
}

rule('sub-todo-added-under-parent', () => {
  test('the first thing to do', () => {
    const app = open();
    app.addStep('Apple cake', 'Heat the oven to 180C');
    assert.deepEqual(app.method('Apple cake'), ['Heat the oven to 180C']);
  });

  test('the recipe stays where it was in the contents', () => {
    const app = openAppWithContents('Lemon drizzle', 'Apple cake');
    app.openRecipe('Apple cake');
    app.addStep('Apple cake', 'Heat the oven to 180C');
    assert.deepEqual(app.contents(), ['Lemon drizzle', 'Apple cake']);
  });
});

rule('sub-todos-keep-typing-order', () => {
  test('three things in sequence', () => {
    const app = open();
    app.addStep('Apple cake', 'Heat the oven to 180C');
    app.addStep('Apple cake', 'Peel and slice the apples');
    app.addStep('Apple cake', 'Bake for forty minutes');

    assert.deepEqual(app.method('Apple cake'), [
      'Heat the oven to 180C',
      'Peel and slice the apples',
      'Bake for forty minutes',
    ]);
  });
});

rule('sub-todo-rejects-blank', () => {
  test('submitting only spaces', () => {
    const app = open();
    app.submitLine('Apple cake', 'step', '   ');
    assert.deepEqual(app.method('Apple cake'), []);
  });
});

rule('sub-todo-depth-is-one', () => {
  test('there is no second level to reach for', () => {
    const app = open();
    app.addStep('Apple cake', 'Heat the oven to 180C');
    assert.equal(
      app.offersAnythingUnder('Heat the oven to 180C'),
      false,
      'a step holds nothing of its own',
    );
  });
});
