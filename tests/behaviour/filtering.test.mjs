// specs/features/finding/filtering.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp } from '../support/app.mjs';

/**
 * The Background: two books, "Sweets" open, and three of the four recipes
 * carrying a tag. Built the way Nell builds one — newest first means each book
 * is written in reverse.
 */
function shelf() {
  const app = openApp();
  app.renameBook('Sweets');
  app.makeBook('Dinner');
  app.writeDown('Lemon chicken');
  app.writeDown('Roast chicken');
  app.giveTags('Roast chicken', ['chicken']);
  app.giveTags('Lemon chicken', ['chicken', 'lemon']);
  app.openBookNamed('Sweets');
  app.writeDown('Lemon drizzle');
  app.writeDown('Apple cake');
  app.giveTags('Lemon drizzle', ['lemon']);
  return app;
}

rule('filter-reaches-every-book', () => {
  test('what takes chicken', () => {
    const app = shelf();
    app.pickTag('chicken');
    assert.deepEqual(app.results(), [
      ['Roast chicken', 'Dinner'],
      ['Lemon chicken', 'Dinner'],
    ]);
  });

  test('an answer from a book that is not open', () => {
    const app = shelf();
    app.pickTag('lemon');
    assert.deepEqual(app.results(), [
      ['Lemon drizzle', 'Sweets'],
      ['Lemon chicken', 'Dinner'],
    ]);
    assert.equal(app.openBook(), 'Sweets', 'filtering does not move the reader');
  });

  test('an untagged recipe is not an answer', () => {
    const app = shelf();
    app.pickTag('lemon');
    assert.ok(!app.results().some(([name]) => name === 'Apple cake'));
  });

  test('the results stand in place of the contents', () => {
    const app = shelf();
    assert.ok(app.contentsIsShowing());
    app.pickTag('chicken');
    assert.ok(!app.contentsIsShowing(), 'the contents is not on screen during a filter');
  });

  test('nothing picked is not a filter', () => {
    const app = shelf();
    assert.deepEqual(app.results(), []);
    assert.ok(app.contentsIsShowing());
    assert.deepEqual(app.contents(), ['Apple cake', 'Lemon drizzle']);
  });
});

rule('filter-combines-tags', () => {
  test('chicken and lemon', () => {
    const app = shelf();
    app.pickTag('chicken');
    app.pickTag('lemon');
    assert.deepEqual(app.results(), [['Lemon chicken', 'Dinner']]);
    assert.deepEqual(app.pickedTags(), ['chicken', 'lemon']);
  });

  test('putting one back', () => {
    const app = shelf();
    app.pickTag('chicken');
    app.pickTag('lemon');
    app.unpickTag('lemon');
    assert.deepEqual(app.results(), [
      ['Roast chicken', 'Dinner'],
      ['Lemon chicken', 'Dinner'],
    ]);
  });

  test('putting the last one back brings the contents back', () => {
    const app = shelf();
    app.pickTag('chicken');
    app.unpickTag('chicken');
    assert.ok(app.contentsIsShowing());
    assert.deepEqual(app.contents(), ['Apple cake', 'Lemon drizzle']);
  });

  test('a picked tag is not offered again', () => {
    const app = shelf();
    app.pickTag('chicken');
    assert.deepEqual(app.tagsOffered(), ['lemon']);
  });
});

rule('filter-finds-nothing', () => {
  test('two words that never meet', () => {
    const app = shelf();
    app.giveTags('Apple cake', ['apple']);
    app.pickTag('apple');
    app.pickTag('chicken');

    assert.deepEqual(app.results(), []);
    assert.equal(app.message(), 'No recipe takes all of those.');
    assert.deepEqual(app.pickedTags(), ['apple', 'chicken']);
  });

  test('it says nothing about the book, which has not been touched', () => {
    const app = shelf();
    app.giveTags('Apple cake', ['apple']);
    app.pickTag('apple');
    app.pickTag('chicken');
    assert.notEqual(app.message(), 'No recipes in this book yet.');

    app.unpickTag('chicken');
    app.unpickTag('apple');
    assert.deepEqual(app.contents(), ['Apple cake', 'Lemon drizzle']);
    assert.equal(app.message(), null);
  });
});

rule('filter-offers-only-tags-in-use', () => {
  test('every tag, from every book, in alphabetical order', () => {
    const app = shelf();
    app.openTagBox();
    assert.deepEqual(app.tagsOffered(), ['chicken', 'lemon']);
  });

  test('typing narrows the offer', () => {
    const app = shelf();
    app.typeTag('lem');
    assert.deepEqual(app.tagsOffered(), ['lemon']);
  });

  test('a word nothing is tagged with offers nothing', () => {
    const app = shelf();
    app.typeTag('paella');
    assert.deepEqual(app.tagsOffered(), []);
  });

  test('nothing tagged anywhere means nothing to pick from', () => {
    const app = openApp();
    app.writeDown('Apple cake');
    assert.equal(app.hasTagBox(), false);
  });

  test('the box arrives with the first tag and goes with the last', () => {
    const app = openApp();
    app.writeDown('Apple cake');
    app.giveTags('Apple cake', ['apple']);
    assert.equal(app.hasTagBox(), true);

    app.removeTag('Apple cake', 'apple');
    assert.equal(app.hasTagBox(), false);
  });

  test('deleting the only recipe carrying a tag takes the tag with it', () => {
    const app = shelf();
    app.giveTags('Apple cake', ['apple']);
    app.deleteRecipe('Apple cake');
    assert.deepEqual(app.tagsOffered(), ['chicken', 'lemon']);
  });
});
