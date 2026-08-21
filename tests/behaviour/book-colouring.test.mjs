// specs/features/books/colouring.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents, openStore, storedBooks } from '../support/app.mjs';

/** The Background: "Sweets" open beside "Dinner", one recipe in it. */
function open() {
  const app = openAppWithContents('Apple cake');
  app.renameBook('Sweets');
  app.makeBook('Dinner');
  app.openBookNamed('Sweets');
  return app;
}

rule('a-book-takes-a-colour', () => {
  test('Sweets becomes the green book', () => {
    const app = open();
    app.colourBook('green');

    assert.equal(app.binding(), 'green');
    assert.equal(app.chosenSwatch(), 'green');
  });

  test('changing my mind', () => {
    const app = open();
    app.colourBook('green');
    app.colourBook('plum');

    assert.equal(app.binding(), 'plum');
    assert.equal(app.chosenSwatch(), 'plum');
  });

  test('a book nobody has coloured is red', () => {
    const app = open();

    assert.equal(app.binding(), 'red');
    assert.equal(app.chosenSwatch(), 'red');
  });

  test('the strip offers six, and says which is which out loud', () => {
    const app = open();

    assert.deepEqual(app.swatches(), ['red', 'ochre', 'green', 'teal', 'blue', 'plum']);
    assert.deepEqual(app.swatchLabels(), [
      'Bind this book in red',
      'Bind this book in ochre',
      'Bind this book in green',
      'Bind this book in teal',
      'Bind this book in blue',
      'Bind this book in plum',
    ]);
  });

  test('the red is the absence of a choice, so it is not written down', () => {
    const app = open();
    app.colourBook('teal');
    assert.match(app.stored(), /"colour":"teal"/);

    app.colourBook('red');
    assert.doesNotMatch(app.stored(), /"colour"/);
    assert.equal(app.binding(), 'red');
  });
});

rule('a-colour-belongs-to-one-book', () => {
  test('two books, two colours', () => {
    const app = open();
    app.colourBook('green');

    app.openBookNamed('Dinner');
    assert.equal(app.binding(), 'red');

    app.colourBook('blue');
    app.openBookNamed('Sweets');
    assert.equal(app.binding(), 'green');
  });
});

rule('a-books-colour-is-kept', () => {
  test('reopening tomorrow', () => {
    const app = open();
    app.colourBook('teal');

    const again = app.reload();
    assert.equal(again.binding(), 'teal');
  });
});

rule('colouring-changes-nothing-else', () => {
  test('the book is otherwise untouched', () => {
    const app = open();
    app.give('Apple cake', 'ingredient', ['200g plain flour']);
    app.writeDown('Lemon drizzle');

    app.colourBook('ochre');

    assert.equal(app.openBook(), 'Sweets');
    assert.deepEqual(app.contents(), ['Lemon drizzle', 'Apple cake']);
    assert.equal(app.isOpen('Apple cake'), false);
    assert.equal(app.isOpen('Lemon drizzle'), false);
    // A press on a swatch is not a way out of the menu: the next one is one
    // press away, which is what makes trying two of them cost two presses.
    assert.equal(app.menuIsOpen(), true);
  });

  test('what was written down is still there afterwards', () => {
    const app = open();
    app.give('Apple cake', 'ingredient', ['200g plain flour']);

    app.colourBook('ochre');
    app.openRecipe('Apple cake');

    assert.deepEqual(app.ingredients('Apple cake'), ['200g plain flour']);
  });
});

rule('an-unknown-colour-is-the-red-it-always-was', () => {
  test('a colour nobody offered', () => {
    const app = openStore(
      storedBooks(
        [{ id: 'b1', name: 'Sweets', colour: 'chartreuse', recipes: [{ id: 'r1', name: 'Apple cake' }] }],
        'b1',
      ),
    );

    assert.equal(app.binding(), 'red');
    assert.equal(app.chosenSwatch(), 'red');
    assert.deepEqual(app.contents(), ['Apple cake']);
  });

  test('and it does not survive the next write', () => {
    const app = openStore(
      storedBooks([{ id: 'b1', name: 'Sweets', colour: 'chartreuse', recipes: [] }], 'b1'),
    );
    app.writeDown('Apple cake');

    assert.doesNotMatch(app.stored(), /chartreuse/);
  });
});
