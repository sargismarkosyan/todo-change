// specs/workflows/throw-something-out.feature
//
// The highest-stakes workflow in the app: there is no undo, and a recipe may be
// the only copy of something somebody dictated once. Each walkthrough ends by
// coming back, because "gone" that comes back is the failure this guards.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workflow } from '../support/covers.mjs';
import { openAppWithContents, openStore, storedBooks } from '../support/app.mjs';

workflow('throw-something-out', () => {
  test('a recipe that did not work', async () => {
    const app = await openAppWithContents('Lemon drizzle', 'Apple cake');

    await app.deleteRecipe('Apple cake');
    assert.deepEqual(await app.contents(), ['Lemon drizzle']);

    const back = await app.reload();
    assert.deepEqual(await back.contents(), ['Lemon drizzle'], 'and it stays gone');
  });

  test('an empty book goes without being asked about', async () => {
    const app = await openStore(
      storedBooks(
        [
          { id: 'b1', name: 'Sweets', recipes: [{ id: 'r1', name: 'Apple cake' }] },
          { id: 'b2', name: 'Scraps', recipes: [] },
        ],
        'b2',
      ),
    );

    await app.deleteBook();

    assert.equal(await app.askedAbout(), null, 'nothing asked');
    assert.deepEqual(await app.books(), ['Sweets']);

    const back = await app.reload();
    assert.deepEqual(await back.books(), ['Sweets']);
  });

  test('a book with recipes in it says what is at stake', async () => {
    const app = await openStore(
      storedBooks(
        [
          { id: 'b1', name: 'Dinner', recipes: [] },
          {
            id: 'b2',
            name: 'Sweets',
            recipes: [
              { id: 'r1', name: 'Apple cake' },
              { id: 'r2', name: 'Lemon drizzle' },
            ],
          },
        ],
        'b2',
      ),
    );

    await app.deleteBook();
    assert.match(await app.askedAbout(), /2 recipes/, 'the number is the information');

    await app.agree();
    assert.deepEqual(await app.books(), ['Dinner']);

    const back = await app.reload();
    assert.deepEqual(await back.books(), ['Dinner']);
  });
});
