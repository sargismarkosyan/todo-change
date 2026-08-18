// specs/features/suggesting/related-words.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { fakeModel, openApp } from '../support/app.mjs';

/** The Background: two books, one tagged recipe in "Dinner". */
async function shelf(model) {
  const app = openApp(model);
  app.renameBook('Sweets');
  app.makeBook('Dinner');
  app.writeDown('Roast pork');
  app.giveTags('Roast pork', ['pork', 'slow']);
  await app.settle();
  return app;
}

rule('related-tags-never-hold-anything-up', () => {
  test('a model that has not answered yet', async () => {
    const app = await shelf(fakeModel({ silent: true }));

    app.typeTag('po');
    assert.deepEqual(app.tagsOffered(), ['pork'], 'the letters answered on the spot');
    assert.deepEqual(app.relatedTags(), []);
  });

  test('the related ones arrive underneath, kept apart', async () => {
    const app = await shelf(fakeModel({ relates: { pig: ['pork'] } }));

    app.typeTag('pig');
    await app.settle();

    assert.deepEqual(app.tagsOffered(), []);
    assert.deepEqual(app.relatedTags(), ['pork']);
  });

  test('a word the letters already found is not repeated underneath', async () => {
    const app = await shelf(fakeModel({ relates: { po: ['pork'] } }));

    app.typeTag('po');
    await app.settle();

    assert.deepEqual(app.tagsOffered(), ['pork']);
    assert.deepEqual(app.relatedTags(), []);
  });

  test('an answer to a word that has been typed past is dropped', async () => {
    const app = await shelf(fakeModel({ relates: { pig: ['pork'] } }));

    app.typeTag('pig');
    app.typeTag('slo');
    await app.settle();

    assert.deepEqual(app.tagsOffered(), ['slow']);
    assert.deepEqual(app.relatedTags(), []);
  });
});

rule('related-tags-are-tags-that-exist', () => {
  test('a word from another book is still a word you wrote', async () => {
    const app = await shelf(fakeModel({ relates: { pig: ['pork'] } }));

    app.typeTag('pig');
    await app.settle();
    app.pickTag('pork');

    assert.deepEqual(app.pickedTags(), ['pork']);
    assert.deepEqual(app.results(), [['Roast pork', 'Dinner']]);
  });

  test('a proposal that is nobody’s tag is dropped', async () => {
    const app = await shelf(fakeModel({ relates: { pig: ['bacon'] } }));

    app.typeTag('pig');
    await app.settle();

    assert.deepEqual(app.relatedTags(), []);
  });

  test('half an answer is still half an answer', async () => {
    const app = await shelf(fakeModel({ relates: { pig: ['bacon', 'pork'] } }));

    app.typeTag('pig');
    await app.settle();

    assert.deepEqual(app.relatedTags(), ['pork']);
  });

  test('picking one clears the box, the way picking any tag does', async () => {
    const app = await shelf(fakeModel({ relates: { pig: ['pork'] } }));

    app.typeTag('pig');
    await app.settle();
    app.pickTag('pork');

    assert.deepEqual(app.relatedTags(), []);
    assert.deepEqual(app.tagsOffered(), ['slow']);
  });
});

rule('no-model-no-related-tags', () => {
  test('typing still narrows the offer', async () => {
    const app = await shelf(null);

    app.typeTag('po');
    await app.settle();

    assert.deepEqual(app.tagsOffered(), ['pork']);
    assert.deepEqual(app.relatedTags(), []);
  });

  test('a word never written down finds nothing', async () => {
    const app = await shelf(null);

    app.typeTag('pig');
    await app.settle();

    assert.deepEqual(app.tagsOffered(), []);
    assert.deepEqual(app.relatedTags(), []);
  });

  test('a model that fails on the way is the same as no model', async () => {
    const app = await shelf(fakeModel({ relateFails: true }));

    app.typeTag('po');
    await app.settle();

    assert.deepEqual(app.tagsOffered(), ['pork'], 'the letters are unaffected');
    assert.deepEqual(app.relatedTags(), []);
  });

  test('a model that cannot run is the same as no model', async () => {
    const app = await shelf(fakeModel({ state: 'unavailable', relates: { pig: ['pork'] } }));

    app.typeTag('pig');
    await app.settle();

    assert.deepEqual(app.relatedTags(), []);
  });
});
