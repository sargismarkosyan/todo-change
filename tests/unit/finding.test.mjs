// Corners of the matching itself, which the rules describe from the screen's
// side. What a search does across books is specced; these are the shapes it can
// be handed — a book with nothing in it, a recipe stored without ingredients,
// and the whitespace that is not a search.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findRecipes } from '../../src/finding.mjs';

const recipe = (name, ingredients) => ({ id: name, name, ingredients, steps: [] });
const book = (name, ...recipes) => ({ id: name, name, recipes });

const found = (books, term) =>
  findRecipes(books, term).map(({ recipe: r, book: b, line }) => [r.name, b.name, line]);

const shelf = [
  book('Sweets', recipe('Apple cake', [{ id: 'i1', text: '200g plain flour' }])),
  book('Dinner', recipe('Roast chicken', [{ id: 'i2', text: '1 whole chicken' }])),
];

test('nothing to search for is not a search', () => {
  for (const term of ['', '   ', '\t\n']) {
    assert.deepEqual(findRecipes(shelf, term), [], `"${term}" should find nothing`);
  }
});

test('an empty book contributes nothing and breaks nothing', () => {
  assert.deepEqual(found([book('Baking'), ...shelf], 'chicken'), [
    ['Roast chicken', 'Dinner', null],
  ]);
});

test('no books at all is an answer, not a crash', () => {
  assert.deepEqual(findRecipes([], 'chicken'), []);
});

test('a recipe stored without ingredients is searched by name alone', () => {
  const bare = { id: 'r1', name: 'Fish pie' };
  assert.deepEqual(found([book('Dinner', bare)], 'fish'), [['Fish pie', 'Dinner', null]]);
  assert.deepEqual(findRecipes([book('Dinner', bare)], 'haddock'), []);
});

test('the first matching ingredient is the one shown', () => {
  const stew = recipe('Thursday stew', [
    { id: 'i1', text: '2 onions' },
    { id: 'i2', text: '4 chicken thighs' },
    { id: 'i3', text: 'chicken stock' },
  ]);
  assert.deepEqual(found([book('Dinner', stew)], 'chicken'), [
    ['Thursday stew', 'Dinner', '4 chicken thighs'],
  ]);
});

test('the term is trimmed before it is matched', () => {
  assert.deepEqual(found(shelf, '  cake  '), [['Apple cake', 'Sweets', null]]);
});
