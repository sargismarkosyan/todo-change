// The front door's internals: the address, the day, and the spread over a pool.
// What the picks and the two addresses *do* is in tests/behaviour/.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addressOf, dayOf, picksForDay, routeOf } from '../../src/home.mjs';

const book = (id, name, names) => ({
  id,
  name,
  recipes: names.map((recipe, at) => ({ id: `${id}-${at}`, name: recipe })),
});

const shelf = [
  book('s', 'Sweets', ['Apple cake', 'Lemon drizzle', 'Bakewell tart']),
  book('d', 'Dinner', ['Roast chicken', 'Lemon chicken', 'Thursday casserole']),
];

test('a book address round-trips through the route it names', () => {
  assert.deepEqual(routeOf(addressOf('s'), shelf), { at: 'book', id: 's' });
});

test('anything that does not name a book on the shelf is the front door', () => {
  for (const hash of ['', '#/', '#/book/', '#/rubbish', '#/book/gone', '#/book/%', undefined]) {
    assert.deepEqual(routeOf(hash, shelf), { at: 'home' }, `"${hash}" is the home`);
  }
});

test('the day is the local one, zero-padded so it reads as a date', () => {
  assert.equal(dayOf(new Date(2026, 7, 9, 23, 59)), '2026-08-09');
  assert.equal(dayOf(new Date(2026, 11, 31, 0, 1)), '2026-12-31');
});

test('the picks sit in book order, whatever the day chose', () => {
  const order = shelf.flatMap((one) => one.recipes.map((recipe) => recipe.name));
  for (const day of ['2026-08-19', '2026-08-20', '2026-08-21']) {
    const picked = picksForDay(shelf, day).map((pick) => pick.recipe.name);
    assert.deepEqual(
      picked,
      order.filter((name) => picked.includes(name)),
      `${day} came out in book order`,
    );
  }
});

test('asking for more than there is gives what there is, and none gives none', () => {
  assert.equal(picksForDay(shelf, '2026-08-19', 99).length, 6);
  assert.deepEqual(picksForDay([], '2026-08-19'), []);
  assert.deepEqual(picksForDay(shelf, '2026-08-19', 0), []);
});
