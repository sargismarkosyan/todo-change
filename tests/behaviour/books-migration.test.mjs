// specs/features/storage/books-migration.feature
//
// The two older keys, read once and taken away. This is the only write in the
// app that nothing on screen caused, and the only one that discards a field.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openLegacy, openNotepads, storedList, storedNotepads } from '../support/app.mjs';

const roastChicken = {
  id: 't1',
  text: 'Roast chicken',
  done: true,
  subTodos: [{ id: 's1', text: 'Heat the oven to 200C', done: true }],
};

rule('old-notepads-open-as-books', () => {
  test('a notepad of todos, one of them with steps and ticks', () => {
    const app = openNotepads(
      storedNotepads([{ id: 'n1', name: 'Dinner', todos: [roastChicken] }], 'n1'),
    );

    assert.equal(app.openBook(), 'Dinner');
    assert.deepEqual(app.contents(), ['Roast chicken']);

    app.openRecipe('Roast chicken');
    assert.deepEqual(app.method('Roast chicken'), ['Heat the oven to 200C']);
    assert.deepEqual(app.ingredients('Roast chicken'), []);
    assert.equal(app.offersTickBox(), false, 'the ticks had nowhere to go');
  });

  test('every notepad becomes a book, in the order they were made', () => {
    const app = openNotepads(
      storedNotepads(
        [
          { id: 'n1', name: 'Sweets', todos: [{ id: 't2', text: 'Apple cake', done: false }] },
          { id: 'n2', name: 'Dinner', todos: [] },
        ],
        'n2',
      ),
    );

    assert.deepEqual(app.books(), ['Sweets', 'Dinner']);
    assert.equal(app.openBook(), 'Dinner');

    app.openBookNamed('Sweets');
    assert.deepEqual(app.contents(), ['Apple cake']);
  });
});

rule('old-list-opens-as-one-notepad', () => {
  test('todos saved before notepads existed', () => {
    const app = openLegacy(
      storedList(
        { id: 'a', text: 'Apple cake', done: false },
        { id: 'b', text: 'Fish pie', done: true },
      ),
    );

    assert.equal(app.openBook(), 'My book');
    assert.deepEqual(app.contents(), ['Apple cake', 'Fish pie']);
    assert.equal(app.offersTickBox(), false);
  });
});

rule('migration-happens-once', () => {
  test('reading the notepads key once and never again', () => {
    const app = openNotepads(storedNotepads([{ id: 'n1', name: 'Dinner', todos: [] }], 'n1'));

    assert.equal(app.storedNotepads(), null, 'the old key is moved, not copied');
    assert.notEqual(app.stored(), null, 'and the new one holds it');
    assert.equal(app.reload().openBook(), 'Dinner');
  });

  test('reading the bare list once and never again', () => {
    const app = openLegacy(storedList({ id: 'a', text: 'Apple cake', done: false }));

    assert.equal(app.storedLegacy(), null);
    assert.deepEqual(app.reload().contents(), ['Apple cake']);
  });
});
