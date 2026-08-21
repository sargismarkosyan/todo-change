// specs/features/books/deleting.feature
//
// The one place this app asks before destroying something, and the reasoning
// for why it asks here and nowhere else is in specs/features/books/spec.md.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp } from '../support/app.mjs';

/** "Sweets" and "Dinner", with "Dinner" open — the Gherkin Background. */
async function shelf() {
  const app = await openApp();
  await app.renameBook('Sweets');
  await app.makeBook('Dinner');
  return app;
}

rule('delete-empty-notepad-goes-without-asking', () => {
  test('a book started by mistake', async () => {
    const app = await shelf();
    assert.deepEqual(await app.contents(), []);

    await app.deleteBook();

    assert.equal(await app.askedAbout(), null, 'nothing was at stake, so nothing was asked');
    assert.deepEqual(await app.books(), ['Sweets']);
    assert.equal(await app.openBook(), 'Sweets');
  });

  test('it stays deleted', async () => {
    const app = await shelf();
    await app.deleteBook();
    assert.deepEqual(await (await app.reload()).books(), ['Sweets']);
  });
});

rule('delete-notepad-with-todos-asks-first', () => {
  test('agreeing to lose three recipes', async () => {
    const app = await shelf();
    await app.writeDown('Lentil soup');
    await app.writeDown('Fish pie');
    await app.writeDown('Roast chicken');

    await app.deleteBook();
    assert.equal(await app.askedAbout(), 'Delete "Dinner" and its 3 recipes?');

    await app.agree();
    assert.deepEqual(await app.books(), ['Sweets']);
    assert.equal(await app.openBook(), 'Sweets');
  });

  test('the question counts one recipe as one', async () => {
    const app = await shelf();
    await app.writeDown('Roast chicken');
    await app.deleteBook();
    assert.equal(await app.askedAbout(), 'Delete "Dinner" and its 1 recipe?');
  });

  test('changing my mind leaves everything where it was', async () => {
    const app = await shelf();
    await app.writeDown('Roast chicken');

    await app.deleteBook();
    await app.decline();

    assert.deepEqual(await app.books(), ['Sweets', 'Dinner']);
    assert.equal(await app.openBook(), 'Dinner');
    assert.deepEqual(await app.contents(), ['Roast chicken']);
  });
});

rule('last-notepad-cannot-be-deleted', () => {
  test('down to one', async () => {
    const app = await openApp();
    await app.renameBook('Sweets');
    assert.deepEqual(await app.books(), ['Sweets']);
    assert.equal(await app.offersBookDelete(), false);
  });
});
