// specs/features/books/creating.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

/** The Background: "Sweets" open, one recipe in it. */
async function open() {
  const app = await openAppWithContents('Apple cake');
  await app.renameBook('Sweets');
  return app;
}

rule('create-notepad-opens-it-empty', () => {
  test('starting a book for what is for dinner', async () => {
    const app = await open();
    await app.makeBook('Dinner');

    assert.equal(await app.openBook(), 'Dinner');
    assert.deepEqual(await app.contents(), []);
    assert.equal(await app.message(), 'No recipes in this book yet.');
  });

  test('the book it was made from is untouched', async () => {
    const app = await open();
    await app.makeBook('Dinner');
    await app.openBookNamed('Sweets');
    assert.deepEqual(await app.contents(), ['Apple cake']);
  });
});

rule('notepad-rejects-blank-name', () => {
  test('submitting only spaces', async () => {
    const app = await open();
    await app.makeBook('   ');

    assert.deepEqual(await app.books(), ['Sweets']);
    assert.equal(await app.openBook(), 'Sweets');
  });
});
