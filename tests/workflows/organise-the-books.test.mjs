// specs/workflows/organise-the-books.feature
//
// The one workflow that pays off somewhere else: nothing here helps the person
// doing it, in the moment they do it. Every walkthrough therefore ends by coming
// back — the return trip is where the whole of the value is.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workflow } from '../support/covers.mjs';
import { openStore, openAppWithContents, storedBooks } from '../support/app.mjs';

workflow('organise-the-books', () => {
  test('a new book for a new occasion', async () => {
    const app = await openAppWithContents('Apple cake');

    await app.makeBook('Dinner');

    assert.equal(await app.openBook(), 'Dinner');
    assert.deepEqual(await app.contents(), [], 'a new book opens empty');
    assert.deepEqual(await app.books(), ['My book', 'Dinner']);

    const back = await app.reload();
    assert.deepEqual(await back.books(), ['My book', 'Dinner']);
  });

  test('a book called the wrong thing', async () => {
    const app = await openStore(
      storedBooks([{ id: 'b1', name: 'Puddings', recipes: [{ id: 'r1', name: 'Apple cake' }] }], 'b1'),
    );

    await app.renameBook('Sweets');

    assert.equal(await app.openBook(), 'Sweets');
    assert.deepEqual(await app.contents(), ['Apple cake'], 'its recipes are all still in it');

    const back = await app.reload();
    assert.equal(await back.openBook(), 'Sweets');
    assert.deepEqual(await back.contents(), ['Apple cake']);
  });

  test('telling two books apart without reading them', async () => {
    const app = await openStore(
      storedBooks(
        [
          { id: 'b1', name: 'Sweets', recipes: [] },
          { id: 'b2', name: 'Dinner', recipes: [] },
        ],
        'b1',
      ),
    );

    await app.colourBook('green');

    assert.equal(await app.binding(), 'green');
    assert.deepEqual(await app.bookColours(), [
      ['Sweets', 'green'],
      ['Dinner', 'red'],
    ]);

    const back = await app.reload();
    assert.equal(await back.binding(), 'green', 'the shelf still reads at a glance');
  });
});
