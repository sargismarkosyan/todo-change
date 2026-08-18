// specs/features/recipes/tags.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openAppWithContents } from '../support/app.mjs';

/** The Background: "Sweets" open, two recipes, "Apple cake" open. */
function book() {
  const app = openAppWithContents('Apple cake', 'Lemon drizzle');
  app.renameBook('Sweets');
  app.openRecipe('Apple cake');
  return app;
}

rule('tag-added-to-recipe', () => {
  test('the first word to go looking with', () => {
    const app = book();
    app.addTag('Apple cake', 'apple');
    assert.deepEqual(app.tags('Apple cake'), ['apple']);
  });

  test('several, in the order they were typed', () => {
    const app = book();
    app.addTag('Apple cake', 'apple');
    app.addTag('Apple cake', 'cake');
    assert.deepEqual(app.tags('Apple cake'), ['apple', 'cake']);
  });

  test('tagging does not move the recipe in the contents', () => {
    const app = book();
    app.addTag('Apple cake', 'apple');
    assert.deepEqual(app.contents(), ['Apple cake', 'Lemon drizzle']);
  });

  test('a tag survives being written down', () => {
    const app = book();
    app.addTag('Apple cake', 'apple');
    assert.deepEqual(app.reload().tags('Apple cake'), ['apple']);
  });

  test('one recipe is tagged, not the book', () => {
    const app = book();
    app.addTag('Apple cake', 'apple');
    assert.deepEqual(app.tags('Lemon drizzle'), []);
  });
});

rule('a-tag-is-a-word-not-a-line', () => {
  test('typed with a capital', () => {
    const app = book();
    app.addTag('Apple cake', 'Apple');
    assert.deepEqual(app.tags('Apple cake'), ['apple']);
  });

  test('the same word twice', () => {
    const app = book();
    app.addTag('Apple cake', 'apple');
    app.addTag('Apple cake', 'APPLE ');
    assert.deepEqual(app.tags('Apple cake'), ['apple']);
  });

  test('blank text is not a word', () => {
    const app = book();
    app.addTag('Apple cake', '   ');
    assert.deepEqual(app.tags('Apple cake'), []);
  });

  test('the box is empty either way, ready for the next one', () => {
    const app = book();
    app.addTag('Apple cake', '   ');
    app.addTag('Apple cake', 'apple');
    assert.deepEqual(app.tags('Apple cake'), ['apple']);
  });
});

rule('tags-show-on-the-card', () => {
  test('reading the contents without opening anything', () => {
    const app = book();
    app.giveTags('Apple cake', ['apple', 'cake']);
    app.addIngredient('Apple cake', '200g plain flour');
    app.closeRecipe('Apple cake');

    assert.ok(!app.isOpen('Apple cake'));
    assert.deepEqual(app.tags('Apple cake'), ['apple', 'cake']);
    assert.deepEqual(app.ingredients('Apple cake'), []);
    assert.deepEqual(app.method('Apple cake'), []);
  });

  test('an untagged recipe is still only its name', () => {
    const app = book();
    assert.ok(!app.isOpen('Lemon drizzle'));
    assert.deepEqual(app.tags('Lemon drizzle'), []);
  });
});

rule('tag-removed-from-recipe', () => {
  test('the wrong word', () => {
    const app = book();
    app.giveTags('Apple cake', ['apple', 'pear']);
    app.removeTag('Apple cake', 'pear');
    assert.deepEqual(app.tags('Apple cake'), ['apple']);
  });

  test('the contents is for reading, not editing', () => {
    const app = book();
    app.giveTags('Lemon drizzle', ['lemon']);
    assert.ok(!app.isOpen('Lemon drizzle'));
    assert.equal(app.offersTagRemoval('Lemon drizzle'), false);
  });

  test('the last one off leaves a recipe that is only its name', () => {
    const app = openApp();
    app.writeDown('Apple cake');
    app.giveTags('Apple cake', ['apple']);
    app.removeTag('Apple cake', 'apple');
    app.closeRecipe('Apple cake');
    assert.deepEqual(app.tags('Apple cake'), []);
  });
});
