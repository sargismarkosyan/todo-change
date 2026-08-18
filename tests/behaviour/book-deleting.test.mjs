// specs/features/books/deleting.feature
//
// The one place this app asks before destroying something, and the reasoning
// for why it asks here and nowhere else is in specs/features/books/spec.md.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp } from '../support/app.mjs';

/** "Sweets" and "Dinner", with "Dinner" open — the Gherkin Background. */
function shelf() {
  const app = openApp();
  app.renameBook('Sweets');
  app.makeBook('Dinner');
  return app;
}

rule('delete-empty-notepad-goes-without-asking', () => {
  test('a book started by mistake', () => {
    const app = shelf();
    assert.deepEqual(app.contents(), []);

    app.deleteBook();

    assert.equal(app.askedAbout(), null, 'nothing was at stake, so nothing was asked');
    assert.deepEqual(app.books(), ['Sweets']);
    assert.equal(app.openBook(), 'Sweets');
  });

  test('it stays deleted', () => {
    const app = shelf();
    app.deleteBook();
    assert.deepEqual(app.reload().books(), ['Sweets']);
  });
});

rule('delete-notepad-with-todos-asks-first', () => {
  test('agreeing to lose three recipes', () => {
    const app = shelf();
    app.writeDown('Lentil soup');
    app.writeDown('Fish pie');
    app.writeDown('Roast chicken');

    app.deleteBook();
    assert.equal(app.askedAbout(), 'Delete "Dinner" and its 3 recipes?');

    app.agree();
    assert.deepEqual(app.books(), ['Sweets']);
    assert.equal(app.openBook(), 'Sweets');
  });

  test('the question counts one recipe as one', () => {
    const app = shelf();
    app.writeDown('Roast chicken');
    app.deleteBook();
    assert.equal(app.askedAbout(), 'Delete "Dinner" and its 1 recipe?');
  });

  test('changing my mind leaves everything where it was', () => {
    const app = shelf();
    app.writeDown('Roast chicken');

    app.deleteBook();
    app.decline();

    assert.deepEqual(app.books(), ['Sweets', 'Dinner']);
    assert.equal(app.openBook(), 'Dinner');
    assert.deepEqual(app.contents(), ['Roast chicken']);
  });
});

rule('last-notepad-cannot-be-deleted', () => {
  test('down to one', () => {
    const app = openApp();
    app.renameBook('Sweets');
    assert.deepEqual(app.books(), ['Sweets']);
    assert.equal(app.offersBookDelete(), false);
  });
});
