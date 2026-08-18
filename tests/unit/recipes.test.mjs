// Internals of the recipe model that no Gherkin rule describes: id generation,
// and the shape checks that decide what counts as a recipe and as a line on the
// way out of storage. The behaviour those feed is specced; these are the corners.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isLine,
  isRecipe,
  linesOf,
  newId,
  removeFrom,
  sanitizeLines,
  sanitizeRecipes,
} from '../../src/recipes.mjs';

test('newId is unique across a tight loop', () => {
  const ids = new Set();
  for (let i = 0; i < 1000; i += 1) ids.add(newId());
  assert.equal(ids.size, 1000, 'ids must never collide — rows are addressed by them');
});

test('isLine accepts an ingredient or a step', () => {
  assert.equal(isLine({ id: 'a', text: '200g plain flour' }), true);
  assert.equal(isLine({ id: 'a', text: 'Heat the oven to 180C', done: true }), true);
});

test('isLine rejects everything that is only nearly one', () => {
  const rejected = {
    null: null,
    undefined: undefined,
    'a string': '200g plain flour',
    'a number': 7,
    'an array': [],
    'no id': { text: '200g plain flour' },
    'an empty id': { id: '', text: '200g plain flour' },
    'a numeric id': { id: 1, text: '200g plain flour' },
    'no text': { id: 'a' },
    'an empty text': { id: 'a', text: '' },
    'a numeric text': { id: 'a', text: 7 },
  };
  for (const [what, value] of Object.entries(rejected)) {
    assert.equal(isLine(value), false, `${what} is not a line`);
  }
});

test('isRecipe wants an id and a name, and nothing else', () => {
  assert.equal(isRecipe({ id: 'a', name: 'Apple cake' }), true);
  assert.equal(isRecipe(null), false);
  assert.equal(isRecipe([]), false);
  assert.equal(isRecipe('Apple cake'), false);
  assert.equal(isRecipe({ id: '', name: 'Apple cake' }), false);
  assert.equal(isRecipe({ id: 'a', name: '' }), false);
  assert.equal(isRecipe({ id: 'a', text: 'Apple cake' }), false);
});

test('sanitizeLines keeps order, drops junk, and strips done', () => {
  const stored = [
    { id: 'a', text: '200g plain flour', done: true },
    { nonsense: true },
    { id: 'b', text: '3 apples' },
  ];
  assert.deepEqual(sanitizeLines(stored), [
    { id: 'a', text: '200g plain flour' },
    { id: 'b', text: '3 apples' },
  ]);
});

test('sanitizeLines yields an empty list for anything that is not an array', () => {
  for (const value of [null, undefined, 7, 'nope', { steps: 'nope' }]) {
    assert.deepEqual(sanitizeLines(value), []);
  }
});

test('sanitizeRecipes strips properties nobody asked for, done included', () => {
  const stored = { id: 'a', name: 'Apple cake', done: true, rating: 5 };
  assert.deepEqual(sanitizeRecipes([stored]), [
    { id: 'a', name: 'Apple cake', ingredients: [], steps: [] },
  ]);
});

test('sanitizeRecipes keeps order and drops what is not a recipe', () => {
  const names = sanitizeRecipes([
    { id: 'a', name: 'Apple cake' },
    { nonsense: true },
    { id: 'b', name: 'Fish pie' },
  ]).map((recipe) => recipe.name);
  assert.deepEqual(names, ['Apple cake', 'Fish pie']);
});

test('sanitizeRecipes yields an empty list for anything that is not an array', () => {
  for (const value of [null, undefined, 7, 'nope', { recipes: 'nope' }]) {
    assert.deepEqual(sanitizeRecipes(value), []);
  }
});

test('linesOf treats an absent group and an empty one as the same thing', () => {
  assert.deepEqual(linesOf({ id: 'a', name: 'Apple cake' }, 'steps'), []);
  assert.deepEqual(linesOf({ id: 'a', name: 'Apple cake', steps: [] }, 'steps'), []);
});

test('removeFrom leaves a recipe alone when the id is nowhere in it', () => {
  const recipes = [
    { id: 'r', name: 'Apple cake', ingredients: [{ id: 'i', text: '3 apples' }], steps: [] },
  ];
  assert.deepEqual(removeFrom(recipes, 'gone'), recipes);
});

test('removeFrom reaches into a recipe stored without its groups', () => {
  assert.deepEqual(removeFrom([{ id: 'r', name: 'Apple cake' }], 'gone'), [
    { id: 'r', name: 'Apple cake', ingredients: [], steps: [] },
  ]);
});
