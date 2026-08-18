// specs/features/storage/recovery.feature
//
// localStorage is seeded with raw strings here on purpose: this is the one
// place where the input is whatever a devtools panel, a second tab, or a
// half-finished write left behind.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openStore, storedBooks } from '../support/app.mjs';

const MESSAGE = 'No recipes in this book yet.';

rule('recover-from-missing-key', () => {
  test('a browser that has never opened the app', () => {
    const app = openApp();
    assert.equal(app.stored(), null, 'nothing should have been stored yet');
    assert.equal(app.openBook(), 'My book');
    assert.deepEqual(app.contents(), []);
    assert.equal(app.message(), MESSAGE);
  });
});

rule('recover-from-unreadable-data', () => {
  test('the value is not valid JSON', () => {
    const app = openStore('{not json');
    assert.equal(app.openBook(), 'My book');
    assert.deepEqual(app.contents(), []);
    assert.equal(app.message(), MESSAGE);
  });

  test('the value is JSON but the wrong shape', () => {
    for (const raw of ['{"books":"nope"}', '"nope"', '42', '[]', 'null']) {
      const app = openStore(raw);
      assert.deepEqual(app.contents(), [], `for ${raw}`);
      assert.equal(app.openBook(), 'My book', `for ${raw}`);
    }
  });

  test('one recipe in a book is not a recipe', () => {
    const app = openStore(
      storedBooks(
        [{ id: 'b1', name: 'Sweets', recipes: [{ id: 'r1', name: 'Apple cake' }, { nonsense: true }] }],
        'b1',
      ),
    );
    assert.deepEqual(app.contents(), ['Apple cake']);
  });
});

rule('recover-from-bad-sub-todos', () => {
  test('ingredients holds something that is not a list', () => {
    const app = openStore(
      storedBooks(
        [
          {
            id: 'b1',
            name: 'Sweets',
            recipes: [{ id: 'r1', name: 'Apple cake', ingredients: 'nope' }],
          },
        ],
        'b1',
      ),
    );
    app.openRecipe('Apple cake');
    assert.deepEqual(app.ingredients('Apple cake'), []);
  });

  test('one step is not a step, and a stored tick is not carried', () => {
    const app = openStore(
      storedBooks(
        [
          {
            id: 'b1',
            name: 'Sweets',
            recipes: [
              {
                id: 'r1',
                name: 'Apple cake',
                steps: [{ id: 's1', text: 'Heat the oven to 180C', done: true }, { nonsense: true }],
              },
            ],
          },
        ],
        'b1',
      ),
    );
    app.openRecipe('Apple cake');
    assert.deepEqual(app.method('Apple cake'), ['Heat the oven to 180C']);
    assert.equal(app.offersTickBox(), false, 'a stored tick is not a tick box');
  });
});

rule('recover-from-bad-notepads', () => {
  test('one entry in the books is not a book', () => {
    const app = openStore(
      storedBooks([{ id: 'b1', name: 'Sweets', recipes: [] }, { nonsense: true }], 'b1'),
    );
    assert.deepEqual(app.books(), ['Sweets']);
  });

  test('the book said to be open is not there', () => {
    const app = openStore(storedBooks([{ id: 'b1', name: 'Sweets', recipes: [] }], 'gone'));
    assert.equal(app.openBook(), 'Sweets');
  });
});
