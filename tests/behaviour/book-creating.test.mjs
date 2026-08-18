// specs/features/books/creating.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents } from '../support/app.mjs';

/** The Background: "Sweets" open, one recipe in it. */
function open() {
  const app = openAppWithContents('Apple cake');
  app.renameBook('Sweets');
  return app;
}

rule('create-notepad-opens-it-empty', () => {
  test('starting a book for what is for dinner', () => {
    const app = open();
    app.makeBook('Dinner');

    assert.equal(app.openBook(), 'Dinner');
    assert.deepEqual(app.contents(), []);
    assert.equal(app.message(), 'No recipes in this book yet.');
  });

  test('the book it was made from is untouched', () => {
    const app = open();
    app.makeBook('Dinner');
    app.openBookNamed('Sweets');
    assert.deepEqual(app.contents(), ['Apple cake']);
  });
});

rule('notepad-rejects-blank-name', () => {
  test('submitting only spaces', () => {
    const app = open();
    app.makeBook('   ');

    assert.deepEqual(app.books(), ['Sweets']);
    assert.equal(app.openBook(), 'Sweets');
  });
});
