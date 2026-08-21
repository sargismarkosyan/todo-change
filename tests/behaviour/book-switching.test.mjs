// specs/features/books/switching.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp } from '../support/app.mjs';

/** The Background: two books, "Sweets" open. */
async function shelf() {
  const app = await openApp();
  await app.renameBook('Sweets');
  await app.makeBook('Dinner');
  await app.openBookNamed('Sweets');
  return app;
}

rule('switch-shows-only-that-notepad', () => {
  test('two books, one visible at a time', async () => {
    const app = await shelf();
    await app.writeDown('Apple cake');

    await app.openBookNamed('Dinner');
    assert.deepEqual(await app.contents(), []);

    await app.writeDown('Roast chicken');
    assert.deepEqual(await app.contents(), ['Roast chicken']);

    await app.openBookNamed('Sweets');
    assert.deepEqual(await app.contents(), ['Apple cake']);
    assert.equal(await app.openBook(), 'Sweets');
  });

  test('the books are listed in the order they were made', async () => {
    assert.deepEqual(await (await shelf()).books(), ['Sweets', 'Dinner']);
  });
});

rule('capture-goes-to-the-open-notepad', () => {
  test('typing into the box while "Dinner" is open', async () => {
    const app = await shelf();
    await app.openBookNamed('Dinner');
    await app.writeDown('Roast chicken');
    assert.deepEqual(await app.contents(), ['Roast chicken']);

    await app.openBookNamed('Sweets');
    assert.deepEqual(await app.contents(), []);
  });

  test('the box never asks which book was meant', async () => {
    const app = await shelf();
    assert.equal(
      app.document.getElementById('composer').querySelectorAll('select, [role="listbox"]').length,
      0,
      'nothing beside the box asks for a book',
    );
  });
});
