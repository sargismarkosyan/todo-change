// specs/features/books/switching.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp } from '../support/app.mjs';

/** The Background: two books, "Sweets" open. */
function shelf() {
  const app = openApp();
  app.renameBook('Sweets');
  app.makeBook('Dinner');
  app.openBookNamed('Sweets');
  return app;
}

rule('switch-shows-only-that-notepad', () => {
  test('two books, one visible at a time', () => {
    const app = shelf();
    app.writeDown('Apple cake');

    app.openBookNamed('Dinner');
    assert.deepEqual(app.contents(), []);

    app.writeDown('Roast chicken');
    assert.deepEqual(app.contents(), ['Roast chicken']);

    app.openBookNamed('Sweets');
    assert.deepEqual(app.contents(), ['Apple cake']);
    assert.equal(app.openBook(), 'Sweets');
  });

  test('the books are listed in the order they were made', () => {
    assert.deepEqual(shelf().books(), ['Sweets', 'Dinner']);
  });
});

rule('capture-goes-to-the-open-notepad', () => {
  test('typing into the box while "Dinner" is open', () => {
    const app = shelf();
    app.openBookNamed('Dinner');
    app.writeDown('Roast chicken');
    assert.deepEqual(app.contents(), ['Roast chicken']);

    app.openBookNamed('Sweets');
    assert.deepEqual(app.contents(), []);
  });

  test('the box never asks which book was meant', () => {
    const app = shelf();
    assert.equal(
      app.document.getElementById('composer').querySelectorAll('select, [role="listbox"]').length,
      0,
      'nothing beside the box asks for a book',
    );
  });
});
