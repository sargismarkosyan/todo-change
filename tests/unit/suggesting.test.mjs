// Internals of asking the browser's model: the adapter around `LanguageModel`,
// and what is kept of an answer. No Gherkin rule describes these — a rule about
// a model would be a rule about what an LLM says, which is not the app's to
// promise. What the rules check is what the app does with an answer.
//
// The scope holding the API is an argument, so the whole adapter is exercised
// here against a fake one. jsdom has no model of any kind, and neither does CI.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModel, usableRelated, usableSuggestions } from '../../src/suggesting.mjs';

/** A stand-in for `LanguageModel`, recording what it was asked. */
function fakeApi({ answer = '[]', state = 'available', throwsOnCreate = false } = {}) {
  const asked = [];
  let destroyed = 0;
  return {
    asked,
    destroyed: () => destroyed,
    availability(options) {
      asked.push({ availability: options });
      return Promise.resolve(state);
    },
    create(options) {
      if (throwsOnCreate) return Promise.reject(new Error('no session'));
      asked.push({ created: options });
      return Promise.resolve({
        prompt(text, options) {
          asked.push({ text, options });
          return Promise.resolve(answer);
        },
        destroy() {
          destroyed += 1;
        },
      });
    },
  };
}

const recipe = (name, ingredients = []) => ({ id: 'r', name, ingredients, steps: [] });

test('a scope with no LanguageModel has no model, which is most of them', () => {
  assert.equal(createModel({}), null);
  assert.equal(createModel(null), null);
  assert.equal(createModel(undefined), null);
});

test('availability is asked about the session that would actually be made', async () => {
  const api = fakeApi({ state: 'downloadable' });
  const model = createModel({ LanguageModel: api });

  assert.equal(await model.availability(), 'downloadable');
  const [{ availability }] = api.asked;
  assert.deepEqual(availability.expectedOutputs, [{ type: 'text', languages: ['en'] }]);
  assert.deepEqual(availability.expectedInputs, [{ type: 'text', languages: ['en'] }]);
});

test('suggestTags asks about the name and the ingredients, never the method', async () => {
  const api = fakeApi({ answer: '["apple","cake"]' });
  const model = createModel({ LanguageModel: api });

  const words = await model.suggestTags({
    id: 'r',
    name: 'Apple cake',
    ingredients: [{ id: 'i', text: '200g plain flour' }],
    steps: [{ id: 's', text: 'Heat the oven to 180C' }],
  });

  assert.deepEqual(words, ['apple', 'cake']);
  const prompt = api.asked.at(-1);
  assert.match(prompt.text, /Apple cake/);
  assert.match(prompt.text, /200g plain flour/);
  assert.ok(!prompt.text.includes('Heat the oven'), 'the method is not what it is found by');
});

test('a recipe stored without ingredients is still askable', async () => {
  const api = fakeApi({ answer: '["cake"]' });
  const model = createModel({ LanguageModel: api });
  assert.deepEqual(await model.suggestTags({ id: 'r', name: 'Apple cake' }), ['cake']);
});

test('the language it will answer in is declared, not left to be guessed', async () => {
  const api = fakeApi({ answer: '[]' });
  const model = createModel({ LanguageModel: api });
  await model.suggestTags(recipe('Apple cake'));

  const { created } = api.asked[0];
  assert.deepEqual(created.expectedOutputs, [{ type: 'text', languages: ['en'] }]);
  assert.deepEqual(created.expectedInputs, [{ type: 'text', languages: ['en'] }]);
});

test('the answer is held to a list of words by a schema, not by hoping', async () => {
  const api = fakeApi({ answer: '[]' });
  const model = createModel({ LanguageModel: api });
  await model.suggestTags(recipe('Apple cake'));

  const prompt = api.asked.at(-1);
  assert.equal(prompt.options.responseConstraint.type, 'array');
  assert.equal(prompt.options.responseConstraint.items.type, 'string');
});

test('relate is held to the tags that exist, by the schema as well', async () => {
  const api = fakeApi({ answer: '["pork"]' });
  const model = createModel({ LanguageModel: api });

  assert.deepEqual(await model.relate('pig', ['pork', 'slow']), ['pork']);
  const prompt = api.asked.at(-1);
  assert.deepEqual(prompt.options.responseConstraint.items.enum, ['pork', 'slow']);
  assert.match(prompt.text, /pig/);
});

test('an answer that is not a list of words is no answer', async () => {
  for (const answer of ['not json at all', '{"tags":["apple"]}', '"apple"', '7', 'null']) {
    const model = createModel({ LanguageModel: fakeApi({ answer }) });
    assert.deepEqual(await model.suggestTags(recipe('Apple cake')), [], `for ${answer}`);
  }
});

test('the session is closed whichever way the question goes', async () => {
  const api = fakeApi({ answer: '["apple"]' });
  const model = createModel({ LanguageModel: api });

  await model.suggestTags(recipe('Apple cake'));
  await model.relate('pig', ['pork']);
  assert.equal(api.destroyed(), 2, 'nothing here is a conversation');
});

test('a session that cannot be opened rejects, and the app treats that as a failure', async () => {
  const model = createModel({ LanguageModel: fakeApi({ throwsOnCreate: true }) });
  await assert.rejects(() => model.suggestTags(recipe('Apple cake')));
});

test('usableSuggestions normalises, deduplicates, and drops what is already there', () => {
  assert.deepEqual(
    usableSuggestions(['Apple', 'apple', ' APPLE ', 'cake', '', '  ', 'flour'], ['flour']),
    ['apple', 'cake'],
  );
});

test('usableSuggestions on nothing proposed is nothing on offer', () => {
  assert.deepEqual(usableSuggestions([], []), []);
  assert.deepEqual(usableSuggestions([7, null, {}], []), []);
});

test('usableRelated keeps only tags that exist and were not already offered', () => {
  assert.deepEqual(
    usableRelated(['Pork', 'bacon', 'slow', 'pork'], ['pork', 'slow'], ['slow']),
    ['pork'],
  );
});

test('usableRelated cannot mint a tag, whatever comes back', () => {
  assert.deepEqual(usableRelated(['bacon', 'ham'], ['pork'], []), []);
  assert.deepEqual(usableRelated([null, 42, ''], ['pork'], []), []);
});
