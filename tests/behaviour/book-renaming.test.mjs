// specs/features/books/renaming.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

/** The Background: "Dinner" open, two recipes in it. */
function open() {
  const app = openAppWithContents('Roast chicken', 'Fish pie');
  app.renameBook('Dinner');
  return app;
}

rule('rename-keeps-the-todos', () => {
  test('"Dinner" turns out to mean "Weeknights"', () => {
    const app = open();
    app.give('Fish pie', 'ingredient', ['400g white fish']);

    app.renameBook('Weeknights');

    assert.equal(app.openBook(), 'Weeknights');
    assert.deepEqual(app.contents(), ['Roast chicken', 'Fish pie']);
    app.openRecipe('Fish pie');
    assert.deepEqual(app.ingredients('Fish pie'), ['400g white fish']);
  });
});

rule('rename-rejects-blank', () => {
  test('submitting only spaces', () => {
    const app = open();
    app.renameBook('   ');
    assert.equal(app.openBook(), 'Dinner');
  });
});
