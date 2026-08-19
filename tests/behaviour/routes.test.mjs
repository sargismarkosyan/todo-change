// specs/features/home/routes.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openAt, openHome, openStore } from '../support/app.mjs';

/**
 * The Background: two books, "Sweets" open, two recipes in each.
 *
 * Built through the box and the menu, the way Nell builds one — which happens in
 * a book, so the shelf is built there and the front door is opened onto it
 * afterwards, the way reopening a tab at the root does.
 */
function shelf() {
  const app = openApp();
  app.renameBook('Sweets');
  app.makeBook('Dinner');
  app.writeDown('Lemon chicken');
  app.writeDown('Roast chicken');
  app.openBookNamed('Sweets');
  app.writeDown('Lemon drizzle');
  app.writeDown('Apple cake');
  return app;
}

/** That same shelf, opened at the front door. */
const frontDoor = () => openHome(shelf().stored());

rule('the-front-door-is-the-home', () => {
  test('arriving with nothing in the address', () => {
    const app = frontDoor();
    assert.equal(app.searchBoxIsShowing(), true, 'the search box is on screen');
    assert.equal(app.picks().length, 3, 'and three recipes to start from');
    assert.equal(app.contentsIsShowing(), false, 'no contents');
    assert.equal(app.canWriteARecipe(), false, 'and nowhere to write a recipe into');
  });
});

rule('a-book-has-its-own-address', () => {
  test('going into the other book', () => {
    const app = frontDoor();
    app.openBookNamed('Dinner');
    assert.equal(app.addressNamesTheOpenBook(), true, `the address reads ${app.address()}`);
    assert.equal(app.openBook(), 'Dinner');
    assert.deepEqual(app.contents(), ['Roast chicken', 'Lemon chicken']);
  });

  test('opening straight into a book, and writing in it', () => {
    const shelved = shelf();
    shelved.openBookNamed('Dinner');
    const app = openStore(shelved.stored());
    assert.equal(app.openBook(), 'Dinner');
    app.writeDown('Paella');
    assert.deepEqual(app.contents(), ['Paella', 'Roast chicken', 'Lemon chicken']);
  });
});

rule('the-masthead-goes-home', () => {
  test('out of a book again', () => {
    const app = shelf();
    assert.equal(app.atHome(), false, 'a book, to begin with');
    app.pressCover();
    assert.equal(app.atHome(), true);
    assert.equal(app.picks().length, 3, 'the picks are on screen');
  });
});

rule('back-and-forward-move-between-them', () => {
  test('in, out, and in again', async () => {
    const app = frontDoor();
    app.openBookNamed('Dinner');
    assert.equal(app.openBook(), 'Dinner');

    await app.goBack();
    assert.equal(app.atHome(), true, 'Back is the way out');

    await app.goForward();
    assert.equal(app.atHome(), false);
    assert.equal(app.openBook(), 'Dinner', 'and Forward is the way back in');
  });
});

rule('an-address-that-names-nothing-opens-the-front-door', () => {
  test('a book that is not there', () => {
    const app = openAt('#/book/1739827000000-1a2b3c4d5e6f7a8b', shelf().stored());
    assert.equal(app.atHome(), true);
    assert.equal(app.picks().length, 3, 'the picks are on screen');
  });

  test('something nobody meant to type', () => {
    const app = openAt('#/rubbish', shelf().stored());
    assert.equal(app.atHome(), true);
  });

  test('a book deleted since the address was copied', () => {
    const shelved = shelf();
    shelved.openBookNamed('Dinner');
    const address = shelved.address();
    shelved.deleteBook();
    shelved.agree();
    const app = openAt(address, shelved.stored());
    assert.equal(app.atHome(), true, 'the front door, not a blank page');
  });
});
