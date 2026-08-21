// specs/features/books/renaming.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

/** The Background: "Dinner" open, two recipes in it. */
async function open() {
  const app = await openAppWithContents('Roast chicken', 'Fish pie');
  await app.renameBook('Dinner');
  return app;
}

rule('rename-keeps-the-todos', () => {
  test('"Dinner" turns out to mean "Weeknights"', async () => {
    const app = await open();
    await app.give('Fish pie', 'ingredient', ['400g white fish']);

    await app.renameBook('Weeknights');

    assert.equal(await app.openBook(), 'Weeknights');
    assert.deepEqual(await app.contents(), ['Roast chicken', 'Fish pie']);
    await app.openRecipe('Fish pie');
    assert.deepEqual(await app.ingredients('Fish pie'), ['400g white fish']);
  });
});

rule('rename-rejects-blank', () => {
  test('submitting only spaces', async () => {
    const app = await open();
    await app.renameBook('   ');
    assert.equal(await app.openBook(), 'Dinner');
  });
});
