// Internals of asking the browser's model: the adapter around `LanguageModel`,
// and what is kept of an answer. No Gherkin rule describes these — a rule about
// a model would be a rule about what an LLM says, which is not the app's to
// promise. What the rules check is what the app does with an answer.
//
// The scope holding the API is an argument, so the whole adapter is exercised
// here against a fake one. jsdom has no model of any kind, and neither does CI.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModel, isEmptyDraft, usableDraft } from '../../src/suggesting.mjs';

/** A stand-in for `LanguageModel`, recording what it was asked. */
function fakeApi({ answer = '{"ingredients":[],"steps":[]}', state = 'available', throwsOnCreate = false } = {}) {
  const asked = [];
  const monitored = [];
  let destroyed = 0;
  return {
    asked,
    destroyed: () => destroyed,
    /** Fire a downloadprogress event at whatever create() was handed. */
    reaches: (loaded) => monitored.forEach((fire) => fire(loaded)),
    availability(options) {
      asked.push({ availability: options });
      return Promise.resolve(state);
    },
    create(options) {
      if (throwsOnCreate) return Promise.reject(new Error('no session'));
      asked.push({ created: options });
      if (options.monitor) {
        const listeners = [];
        options.monitor({ addEventListener: (name, fn) => listeners.push([name, fn]) });
        monitored.push((loaded) => {
          for (const [name, fn] of listeners) if (name === 'downloadprogress') fn({ loaded });
        });
      }
      return Promise.resolve({
        prompt(text, opts) {
          asked.push({ text, opts });
          return Promise.resolve(answer);
        },
        destroy() {
          destroyed += 1;
        },
      });
    },
  };
}

const recipe = (name, ingredients = [], steps = []) => ({ id: 'r', name, ingredients, steps });
const line = (text) => ({ id: text, text });

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

test('prepare watches the download, and throws the session away after', async () => {
  const api = fakeApi();
  const model = createModel({ LanguageModel: api });

  const seen = [];
  await model.prepare((loaded) => seen.push(loaded));
  api.reaches(0.4);

  assert.deepEqual(seen, [0.4], 'progress reaches only the session that started it');
  assert.equal(api.destroyed(), 1, 'what is wanted is the model, not this conversation');
});

test('a fetch that cannot even open a session rejects, and the app says so', async () => {
  const model = createModel({ LanguageModel: fakeApi({ throwsOnCreate: true }) });
  await assert.rejects(() => model.prepare(() => {}));
  await assert.rejects(() => model.draft(recipe('Apple pie')));
});

test('draft asks about the name and anything already written down', async () => {
  const api = fakeApi({ answer: '{"ingredients":["3 apples"],"steps":["Bake it"]}' });
  const model = createModel({ LanguageModel: api });

  const out = await model.draft(
    recipe('Apple pie', [line('200g plain flour')], [line('Heat the oven')]),
  );

  assert.deepEqual(out, { ingredients: ['3 apples'], steps: ['Bake it'] });
  const prompt = api.asked.at(-1);
  assert.match(prompt.text, /Apple pie/);
  assert.match(prompt.text, /200g plain flour/);
  assert.match(prompt.text, /Heat the oven/);
  assert.equal(api.destroyed(), 1);
});

test('a bare recipe is asked about without inventing sections', async () => {
  const api = fakeApi();
  const model = createModel({ LanguageModel: api });
  await model.draft({ id: 'r', name: 'Apple pie' });

  const prompt = api.asked.at(-1);
  assert.equal(prompt.text, 'Recipe: Apple pie');
});

test('the answer is held to two lists by a schema, not by hoping', async () => {
  const api = fakeApi();
  const model = createModel({ LanguageModel: api });
  await model.draft(recipe('Apple pie'));

  const { responseConstraint } = api.asked.at(-1).opts;
  assert.equal(responseConstraint.type, 'object');
  assert.deepEqual(responseConstraint.required, ['ingredients', 'steps']);
  assert.equal(responseConstraint.properties.ingredients.items.type, 'string');
});

test('an answer that is not two lists of lines is no answer', async () => {
  for (const answer of ['not json', '[]', '7', 'null', '{"ingredients":"nope"}']) {
    const model = createModel({ LanguageModel: fakeApi({ answer }) });
    const out = await model.draft(recipe('Apple pie'));
    assert.ok(Array.isArray(out.ingredients), `for ${answer}`);
    assert.ok(Array.isArray(out.steps), `for ${answer}`);
  }
});

test('usableDraft trims, deduplicates, and drops what the recipe already holds', () => {
  const out = usableDraft(
    { ingredients: ['3 apples', ' 3 apples ', '200g plain flour', '', '  '], steps: ['Bake it'] },
    recipe('Apple pie', [line('200g plain flour')], []),
  );
  assert.deepEqual(out, { ingredients: ['3 apples'], steps: ['Bake it'] });
});

test('usableDraft survives a recipe stored without its groups', () => {
  const out = usableDraft({ ingredients: ['3 apples'], steps: [] }, { id: 'r', name: 'Apple pie' });
  assert.deepEqual(out, { ingredients: ['3 apples'], steps: [] });
});

test('usableDraft keeps nothing that is not a line of text', () => {
  const out = usableDraft({ ingredients: [7, null, {}, ''], steps: [undefined] }, recipe('X'));
  assert.deepEqual(out, { ingredients: [], steps: [] });
});

test('isEmptyDraft is the difference between no answer and an answer', () => {
  assert.equal(isEmptyDraft({ ingredients: [], steps: [] }), true);
  assert.equal(isEmptyDraft({ ingredients: ['3 apples'], steps: [] }), false);
  assert.equal(isEmptyDraft({ ingredients: [], steps: ['Bake it'] }), false);
});
