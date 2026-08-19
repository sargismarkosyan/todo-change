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

test('a bare recipe says both lists are empty rather than leaving them out', async () => {
  const api = fakeApi();
  const model = createModel({ LanguageModel: api });
  await model.draft({ id: 'r', name: 'Apple pie' });

  const { text } = api.asked.at(-1);
  assert.match(text, /Ingredients so far: nothing written down yet\./);
  assert.match(text, /Method so far: nothing written down yet\./);
});

test('every line is shown with the position the model answers against', async () => {
  const api = fakeApi();
  const model = createModel({ LanguageModel: api });
  await model.draft(recipe('Lava cake', [line('2 large eggs')], [line('1 Preheat the oven')]));

  const { text } = api.asked.at(-1);
  assert.match(text, /\[0\] 2 large eggs/);
  assert.match(
    text,
    /\[0\] 1 Preheat the oven/,
    'bracketed, so a number already in the line cannot be mistaken for the position',
  );
});

test('it is asked for what is missing, not for the recipe', async () => {
  const api = fakeApi();
  const model = createModel({ LanguageModel: api });
  await model.draft(recipe('Lava cake', [line('2 large eggs')], []));

  const { created } = api.asked[0];
  const system = created.initialPrompts[0].content;
  assert.match(
    system,
    /lines that are missing/,
    'asking for the whole recipe and then forbidding repeats answered with nothing',
  );
  assert.match(
    system,
    /never write a number, a bullet/,
    'or the numbering ends up inside the line',
  );
});

let n = 0;
const ids = () => `p${(n += 1)}`;
const shown = (entries) =>
  entries.map((entry) => (entry.kind === 'line' ? entry.id : `+${entry.text}`));

test('the answer is held to two lists of placed lines by a schema, not by hoping', async () => {
  const api = fakeApi();
  const model = createModel({ LanguageModel: api });
  await model.draft(recipe('Apple pie'));

  const { responseConstraint } = api.asked.at(-1).opts;
  assert.equal(responseConstraint.type, 'object');
  assert.deepEqual(responseConstraint.required, ['ingredients', 'steps']);
  const item = responseConstraint.properties.steps.items;
  assert.equal(item.properties.text.type, 'string');
  assert.equal(item.properties.index.type, 'integer', 'the place, so it cannot be misspelt');
  assert.deepEqual(item.required, ['text', 'index']);
});

test('an answer that is not two lists of lines is no answer', async () => {
  for (const answer of ['not json', '[]', '7', 'null', '{"ingredients":"nope"}']) {
    const model = createModel({ LanguageModel: fakeApi({ answer }) });
    const out = await model.draft(recipe('Apple pie'));
    assert.ok(Array.isArray(out.ingredients), `for ${answer}`);
    assert.ok(Array.isArray(out.steps), `for ${answer}`);
  }
});

test('a proposal lands at the place it asked for', () => {
  const out = usableDraft(
    { ingredients: [], steps: [{ text: 'Rub the butter in', index: 1 }] },
    recipe('Apple pie', [], [line('Heat the oven'), line('Bake it')]),
    ids,
  );
  assert.deepEqual(shown(out.steps), ['Heat the oven', '+Rub the butter in', 'Bake it']);
});

test('several at one place keep the order they were drafted in', () => {
  const out = usableDraft(
    { ingredients: [], steps: [{ text: 'Rub', index: 1 }, { text: 'Peel', index: 1 }] },
    recipe('Apple pie', [], [line('Heat the oven'), line('Bake it')]),
    ids,
  );
  assert.deepEqual(shown(out.steps), ['Heat the oven', '+Rub', '+Peel', 'Bake it']);
});

test('a place that is not there lands last rather than nowhere', () => {
  const before = [line('Heat the oven'), line('Bake it')];
  for (const index of [9, -3, undefined, 'no', 1.5, null]) {
    const out = usableDraft(
      { ingredients: [], steps: [{ text: 'Dust it', index }] },
      recipe('Apple pie', [], before),
      ids,
    );
    assert.deepEqual(
      shown(out.steps),
      ['Heat the oven', 'Bake it', '+Dust it'],
      `for index ${String(index)}`,
    );
  }
});

test('usableDraft trims, deduplicates, and drops what the recipe already holds', () => {
  const out = usableDraft(
    {
      ingredients: [
        { text: '3 apples', index: 0 },
        { text: ' 3 apples ', index: 0 },
        { text: '200g plain flour', index: 0 },
        { text: '', index: 0 },
      ],
      steps: [],
    },
    recipe('Apple pie', [line('3 apples')], []),
    ids,
  );
  assert.deepEqual(shown(out.ingredients), ['+200g plain flour', '3 apples']);
});

test('a line the recipe already holds is not proposed back in a different case', () => {
  const out = usableDraft(
    { ingredients: [{ text: '3 Apples', index: 0 }], steps: [{ text: 'heat the oven', index: 0 }] },
    recipe('Apple pie', [line('3 apples')], [line('Heat the oven')]),
    ids,
  );
  assert.deepEqual(shown(out.ingredients), ['3 apples']);
  assert.deepEqual(shown(out.steps), ['Heat the oven']);
});

test('the first spelling of a repeat within one answer is the one kept', () => {
  const out = usableDraft(
    { ingredients: [{ text: '3 Apples', index: 0 }, { text: '3 apples', index: 0 }], steps: [] },
    recipe('Apple pie'),
    ids,
  );
  assert.deepEqual(shown(out.ingredients), ['+3 Apples']);
});

test('usableDraft survives a recipe stored without its groups', () => {
  const out = usableDraft(
    { ingredients: [{ text: '3 apples', index: 0 }], steps: [] },
    { id: 'r', name: 'Apple pie' },
    ids,
  );
  assert.deepEqual(shown(out.ingredients), ['+3 apples']);
  assert.deepEqual(out.steps, []);
});

test('usableDraft keeps nothing that is not a line of text', () => {
  const out = usableDraft(
    { ingredients: [{ text: 7, index: 0 }, { index: 0 }, { text: '', index: 0 }], steps: [null] },
    recipe('X'),
    ids,
  );
  assert.deepEqual(out.ingredients, []);
  assert.deepEqual(out.steps, []);
});

test('isEmptyDraft is the difference between no answer and an answer', () => {
  const bare = recipe('Apple pie', [], [line('Heat the oven')]);
  const nothing = usableDraft({ ingredients: [], steps: [] }, bare, ids);
  assert.equal(isEmptyDraft(nothing), true, 'a group of lines alone is not a draft');

  const something = usableDraft(
    { ingredients: [], steps: [{ text: 'Bake it', index: 1 }] },
    bare,
    ids,
  );
  assert.equal(isEmptyDraft(something), false);
});
