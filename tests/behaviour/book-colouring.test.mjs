// specs/features/books/colouring.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithContents, openStore, storedBooks } from '../support/app.mjs';

/** The Background: "Sweets" open beside "Dinner", one recipe in it. */
async function open() {
  const app = await openAppWithContents('Apple cake');
  await app.renameBook('Sweets');
  await app.makeBook('Dinner');
  await app.openBookNamed('Sweets');
  return app;
}

rule('a-book-takes-a-colour', () => {
  test('Sweets becomes the green book', async () => {
    const app = await open();
    await app.colourBook('green');

    assert.equal(await app.binding(), 'green');
    assert.equal(await app.chosenSwatch(), 'green');
  });

  test('changing my mind', async () => {
    const app = await open();
    await app.colourBook('green');
    await app.colourBook('plum');

    assert.equal(await app.binding(), 'plum');
    assert.equal(await app.chosenSwatch(), 'plum');
  });

  test('a book nobody has coloured is red', async () => {
    const app = await open();

    assert.equal(await app.binding(), 'red');
    assert.equal(await app.chosenSwatch(), 'red');
  });

  test('the strip offers six, and says which is which out loud', async () => {
    const app = await open();

    assert.deepEqual(await app.swatches(), ['red', 'ochre', 'green', 'teal', 'blue', 'plum']);
    assert.deepEqual(await app.swatchLabels(), [
      'Bind this book in red',
      'Bind this book in ochre',
      'Bind this book in green',
      'Bind this book in teal',
      'Bind this book in blue',
      'Bind this book in plum',
    ]);
  });

  test('the red is the absence of a choice, so it is not written down', async () => {
    const app = await open();
    await app.colourBook('teal');
    assert.match(await app.stored(), /"colour":"teal"/);

    await app.colourBook('red');
    assert.doesNotMatch(await app.stored(), /"colour"/);
    assert.equal(await app.binding(), 'red');
  });
});

rule('a-colour-belongs-to-one-book', () => {
  test('two books, two colours', async () => {
    const app = await open();
    await app.colourBook('green');

    await app.openBookNamed('Dinner');
    assert.equal(await app.binding(), 'red');

    await app.colourBook('blue');
    await app.openBookNamed('Sweets');
    assert.equal(await app.binding(), 'green');
  });
});

rule('a-books-colour-is-kept', () => {
  test('reopening tomorrow', async () => {
    const app = await open();
    await app.colourBook('teal');

    const again = await app.reload();
    assert.equal(await again.binding(), 'teal');
  });
});

rule('colouring-changes-nothing-else', () => {
  test('the book is otherwise untouched', async () => {
    const app = await open();
    await app.give('Apple cake', 'ingredient', ['200g plain flour']);
    await app.writeDown('Lemon drizzle');

    await app.colourBook('ochre');

    assert.equal(await app.openBook(), 'Sweets');
    assert.deepEqual(await app.contents(), ['Lemon drizzle', 'Apple cake']);
    assert.equal(await app.isOpen('Apple cake'), false);
    assert.equal(await app.isOpen('Lemon drizzle'), false);
    // A press on a swatch is not a way out of the menu: the next one is one
    // press away, which is what makes trying two of them cost two presses.
    assert.equal(await app.menuIsOpen(), true);
  });

  test('what was written down is still there afterwards', async () => {
    const app = await open();
    await app.give('Apple cake', 'ingredient', ['200g plain flour']);

    await app.colourBook('ochre');
    await app.openRecipe('Apple cake');

    assert.deepEqual(await app.ingredients('Apple cake'), ['200g plain flour']);
  });
});

rule('an-unknown-colour-is-the-red-it-always-was', () => {
  test('a colour nobody offered', async () => {
    const app = await openStore(
      storedBooks(
        [{ id: 'b1', name: 'Sweets', colour: 'chartreuse', recipes: [{ id: 'r1', name: 'Apple cake' }] }],
        'b1',
      ),
    );

    assert.equal(await app.binding(), 'red');
    assert.equal(await app.chosenSwatch(), 'red');
    assert.deepEqual(await app.contents(), ['Apple cake']);
  });

  test('and it does not survive the next write', async () => {
    const app = await openStore(
      storedBooks([{ id: 'b1', name: 'Sweets', colour: 'chartreuse', recipes: [] }], 'b1'),
    );
    await app.writeDown('Apple cake');

    assert.doesNotMatch(await app.stored(), /chartreuse/);
  });
});
