// Internals of the todo model that no Gherkin rule describes: id generation,
// and the shape check that decides what counts as a todo on the way out of
// storage. The behaviour those feed is specced; these are the corners.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTodo, newId, sanitizeTodos } from '../../src/todos.mjs';

test('newId is unique across a tight loop', () => {
  const ids = new Set();
  for (let i = 0; i < 1000; i += 1) ids.add(newId());
  assert.equal(ids.size, 1000, 'ids must never collide — rows are addressed by them');
});

test('isTodo accepts a well-formed todo', () => {
  assert.equal(isTodo({ id: 'a', text: 'Buy milk', done: false }), true);
  assert.equal(isTodo({ id: 'a', text: 'Buy milk', done: true }), true);
});

test('isTodo rejects everything that is only nearly one', () => {
  const rejected = {
    null: null,
    undefined: undefined,
    'a string': 'Buy milk',
    'a number': 7,
    'an array': [],
    'no id': { text: 'Buy milk', done: false },
    'an empty id': { id: '', text: 'Buy milk', done: false },
    'a numeric id': { id: 1, text: 'Buy milk', done: false },
    'no text': { id: 'a', done: false },
    'an empty text': { id: 'a', text: '', done: false },
    'a numeric text': { id: 'a', text: 7, done: false },
    'no done': { id: 'a', text: 'Buy milk' },
    'done as a string': { id: 'a', text: 'Buy milk', done: 'false' },
    'done as a number': { id: 'a', text: 'Buy milk', done: 0 },
  };
  for (const [what, value] of Object.entries(rejected)) {
    assert.equal(isTodo(value), false, `${what} is not a todo`);
  }
});

test('isTodo rejects an array, which is an object but not a todo', () => {
  assert.equal(isTodo([]), false);
});

test('sanitizeTodos keeps order and drops what is not a todo', () => {
  const good = { id: 'a', text: 'Buy milk', done: false };
  const also = { id: 'b', text: 'Call the bank', done: true };
  assert.deepEqual(sanitizeTodos([good, { nonsense: true }, also]), [good, also]);
});

test('sanitizeTodos strips properties nobody asked for', () => {
  const stored = { id: 'a', text: 'Buy milk', done: false, priority: 'high' };
  assert.deepEqual(sanitizeTodos([stored]), [{ id: 'a', text: 'Buy milk', done: false }]);
});

test('sanitizeTodos yields an empty list for anything that is not an array', () => {
  for (const value of [null, undefined, 7, 'nope', { todos: 'nope' }]) {
    assert.deepEqual(sanitizeTodos(value), []);
  }
});
