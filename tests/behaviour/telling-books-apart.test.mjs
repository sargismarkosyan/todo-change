// specs/features/look/telling-books-apart.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openHome, openStore, storedBooks } from '../support/app.mjs';
import { contrast, resolve, ruleFor, token } from '../support/palette.mjs';
import { BOOK_COLOURS } from '../../src/books.mjs';

/** The Background: "Sweets" open, beside "Dinner". */
function open() {
  const app = openApp();
  app.renameBook('Sweets');
  app.makeBook('Dinner');
  app.openBookNamed('Sweets');
  return app;
}

rule('the-open-book-wears-its-colour', () => {
  test('opening the green book', () => {
    const app = open();
    app.colourBook('green');

    assert.equal(app.ribbonIsShowing(), true);
    assert.equal(app.binding(), 'green');
    // Nothing is read in a book's colour, which is the whole reason it can be
    // one at full strength. The ribbon holds no words and nothing is drawn on
    // top of it.
    assert.equal(app.document.getElementById('ribbon').textContent, '');
    assert.equal(app.document.getElementById('ribbon').children.length, 0);
  });

  test('the ribbon and the stitching cannot drift apart', () => {
    // jsdom computes no pseudo-element styles, so the guarantee that both draw
    // from the one token the book sets is checked against the stylesheet the
    // browser is served. Which colour that token holds is checked above.
    assert.match(ruleFor('.ribbon'), /background-color:\s*var\(--thread\)/);
    assert.match(ruleFor('.app::before'), /var\(--thread\)/);
  });

  test('switching to a book of another colour', () => {
    const app = open();
    app.colourBook('green');

    app.openBookNamed('Dinner');
    app.colourBook('blue');
    assert.equal(app.binding(), 'blue');

    app.openBookNamed('Sweets');
    assert.equal(app.binding(), 'green');
  });
});

rule('every-book-in-the-menu-wears-its-colour', () => {
  test('the shelf, at a glance', () => {
    const app = open();
    app.colourBook('green');
    app.openBookNamed('Dinner');
    app.colourBook('plum');

    assert.deepEqual(app.bookColours(), [
      ['Sweets', 'green'],
      ['Dinner', 'plum'],
    ]);
  });

  test('every row wears one, coloured or not', () => {
    const app = open();

    assert.deepEqual(app.bookColours(), [
      ['Sweets', 'red'],
      ['Dinner', 'red'],
    ]);
  });
});

rule('colour-is-never-the-only-thing-saying-which-book', () => {
  test('the name is on screen either way', () => {
    const app = open();
    app.colourBook('teal');

    assert.equal(app.openBook(), 'Sweets');
    assert.deepEqual(app.books(), ['Sweets', 'Dinner']);
  });

  test('a book read aloud is read by its name', () => {
    const app = open();
    app.colourBook('teal');
    app.openBookNamed('Sweets');

    assert.equal(
      app.document.getElementById('book-open').getAttribute('aria-label'),
      'Book: Sweets',
    );
    // Nothing on a row says its colour: the mark is drawn, and the name is what
    // the row reads. A colour said twice is a colour somebody has to hear.
    assert.deepEqual(app.bookColours().map(([name]) => name), ['Sweets', 'Dinner']);
  });
});

rule('every-book-colour-shows-on-paper', () => {
  test('the six a book can be bound in', () => {
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

  test('every one of the six is a colour this stylesheet declares', () => {
    for (const colour of BOOK_COLOURS) {
      assert.match(resolve(token(`book-${colour}`)), /^#[0-9a-f]{6}$/i, colour);
    }
  });
});

rule('the-front-door-has-no-ribbon', () => {
  test('arriving at the front door', () => {
    const app = openHome(
      storedBooks([{ id: 'b1', name: 'Sweets', colour: 'plum', recipes: [] }], 'b1'),
    );

    assert.equal(app.atHome(), true);
    assert.equal(app.ribbonIsShowing(), false);
    assert.equal(app.binding(), 'red');
  });

  test('and it comes back on the way into a book', () => {
    const app = openStore(
      storedBooks([{ id: 'b1', name: 'Sweets', colour: 'plum', recipes: [] }], 'b1'),
    );
    assert.equal(app.ribbonIsShowing(), true);
    assert.equal(app.binding(), 'plum');

    app.pressCover();
    assert.equal(app.ribbonIsShowing(), false);
    assert.equal(app.binding(), 'red');
  });
});
