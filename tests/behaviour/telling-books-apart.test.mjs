// specs/features/books/telling-books-apart.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openHome, openStore, storedBooks } from '../support/app.mjs';
import { contrast, resolve, ruleFor, token } from '../support/palette.mjs';
import { BOOK_COLOURS } from '../../src/books.mjs';

/** The Background: "Sweets" open, beside "Dinner". */
async function open() {
  const app = await openApp();
  await app.renameBook('Sweets');
  await app.makeBook('Dinner');
  await app.openBookNamed('Sweets');
  return app;
}

rule('the-open-book-wears-its-colour', () => {
  test('opening the green book', async () => {
    const app = await open();
    await app.colourBook('green');

    assert.equal(await app.ribbonIsShowing(), true);
    assert.equal(await app.binding(), 'green');
    // Nothing is read in a book's colour, which is the whole reason it can be
    // one at full strength. The ribbon holds no words and nothing is drawn on
    // top of it.
    assert.equal(app.document.getElementById('ribbon').textContent, '');
    assert.equal(app.document.getElementById('ribbon').children.length, 0);
  });

  test('the ribbon and the stitching cannot drift apart', async () => {
    // jsdom computes no pseudo-element styles, so the guarantee that both draw
    // from the one token the book sets is checked against the stylesheet the
    // browser is served. Which colour that token holds is checked above.
    assert.match(ruleFor('.ribbon'), /background-color:\s*var\(--thread\)/);
    assert.match(ruleFor('.app::before'), /var\(--thread\)/);
  });

  test('switching to a book of another colour', async () => {
    const app = await open();
    await app.colourBook('green');

    await app.openBookNamed('Dinner');
    await app.colourBook('blue');
    assert.equal(await app.binding(), 'blue');

    await app.openBookNamed('Sweets');
    assert.equal(await app.binding(), 'green');
  });
});

rule('every-book-in-the-menu-wears-its-colour', () => {
  test('the shelf, at a glance', async () => {
    const app = await open();
    await app.colourBook('green');
    await app.openBookNamed('Dinner');
    await app.colourBook('plum');

    assert.deepEqual(await app.bookColours(), [
      ['Sweets', 'green'],
      ['Dinner', 'plum'],
    ]);
  });

  test('every row wears one, coloured or not', async () => {
    const app = await open();

    assert.deepEqual(await app.bookColours(), [
      ['Sweets', 'red'],
      ['Dinner', 'red'],
    ]);
  });
});

rule('colour-is-never-the-only-thing-saying-which-book', () => {
  test('the name is on screen either way', async () => {
    const app = await open();
    await app.colourBook('teal');

    assert.equal(await app.openBook(), 'Sweets');
    assert.deepEqual(await app.books(), ['Sweets', 'Dinner']);
  });

  test('a book read aloud is read by its name', async () => {
    const app = await open();
    await app.colourBook('teal');
    await app.openBookNamed('Sweets');

    assert.equal(
      app.document.getElementById('book-open').getAttribute('aria-label'),
      'Book: Sweets',
    );
    // Nothing on a row says its colour: the mark is drawn, and the name is what
    // the row reads. A colour said twice is a colour somebody has to hear.
    assert.deepEqual(await (await app.bookColours()).map(([name]) => name), ['Sweets', 'Dinner']);
  });
});

rule('every-book-colour-shows-on-paper', () => {
  test('the six a book can be bound in', async () => {
    const page = resolve(token('page'));
    const ground = resolve(token('paper'));

    for (const colour of BOOK_COLOURS) {
      const hex = resolve(token(`book-${colour}`));
      assert.ok(
        contrast(hex, page) >= 3,
        `${colour} is ${contrast(hex, page).toFixed(2)} to 1 against the page`,
      );
      assert.ok(
        contrast(hex, ground) >= 3,
        `${colour} is ${contrast(hex, ground).toFixed(2)} to 1 against the ground`,
      );
    }
  });

  test('every one of the six is a colour this stylesheet declares', async () => {
    for (const colour of BOOK_COLOURS) {
      assert.match(resolve(token(`book-${colour}`)), /^#[0-9a-f]{6}$/i, colour);
    }
  });
});

rule('the-front-door-has-no-ribbon', () => {
  test('arriving at the front door', async () => {
    const app = await openHome(
      storedBooks([{ id: 'b1', name: 'Sweets', colour: 'plum', recipes: [] }], 'b1'),
    );

    assert.equal(await app.atHome(), true);
    assert.equal(await app.ribbonIsShowing(), false);
    assert.equal(await app.binding(), 'red');
  });

  test('and it comes back on the way into a book', async () => {
    const app = await openStore(
      storedBooks([{ id: 'b1', name: 'Sweets', colour: 'plum', recipes: [] }], 'b1'),
    );
    assert.equal(await app.ribbonIsShowing(), true);
    assert.equal(await app.binding(), 'plum');

    await app.pressCover();
    assert.equal(await app.ribbonIsShowing(), false);
    assert.equal(await app.binding(), 'red');
  });
});
