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
async function shelf() {
  const app = await openApp();
  await app.renameBook('Sweets');
  await app.makeBook('Dinner');
  await app.writeDown('Lemon chicken');
  await app.writeDown('Roast chicken');
  await app.openBookNamed('Sweets');
  await app.writeDown('Lemon drizzle');
  await app.writeDown('Apple cake');
  return app;
}

/** That same shelf, opened at the front door. */
const frontDoor = async () => await openHome(await (await shelf()).stored());

rule('the-front-door-is-the-home', () => {
  test('arriving with nothing in the address', async () => {
    const app = await frontDoor();
    assert.equal(await app.searchBoxIsShowing(), true, 'the search box is on screen');
    assert.equal((await app.picks()).length, 3, 'and three recipes to start from');
    assert.equal(await app.contentsIsShowing(), false, 'no contents');
    assert.equal(await app.canWriteARecipe(), false, 'and nowhere to write a recipe into');
  });
});

rule('a-book-has-its-own-address', () => {
  test('going into the other book', async () => {
    const app = await frontDoor();
    await app.openBookNamed('Dinner');
    assert.equal(await app.addressNamesTheOpenBook(), true, `the address reads ${await app.address()}`);
    assert.equal(await app.openBook(), 'Dinner');
    assert.deepEqual(await app.contents(), ['Roast chicken', 'Lemon chicken']);
  });

  test('opening straight into a book, and writing in it', async () => {
    const shelved = await shelf();
    await shelved.openBookNamed('Dinner');
    const app = await openStore(await shelved.stored());
    assert.equal(await app.openBook(), 'Dinner');
    await app.writeDown('Paella');
    assert.deepEqual(await app.contents(), ['Paella', 'Roast chicken', 'Lemon chicken']);
  });
});

rule('the-masthead-goes-home', () => {
  test('out of a book again', async () => {
    const app = await shelf();
    assert.equal(await app.atHome(), false, 'a book, to begin with');
    await app.pressCover();
    assert.equal(await app.atHome(), true);
    assert.equal((await app.picks()).length, 3, 'the picks are on screen');
  });
});

rule('back-and-forward-move-between-them', () => {
  test('in, out, and in again', async () => {
    const app = await frontDoor();
    await app.openBookNamed('Dinner');
    assert.equal(await app.openBook(), 'Dinner');

    await app.goBack();
    assert.equal(await app.atHome(), true, 'Back is the way out');

    await app.goForward();
    assert.equal(await app.atHome(), false);
    assert.equal(await app.openBook(), 'Dinner', 'and Forward is the way back in');
  });
});

rule('an-address-that-names-nothing-opens-the-front-door', () => {
  test('a book that is not there', async () => {
    const app = await openAt('#/book/1739827000000-1a2b3c4d5e6f7a8b', await (await shelf()).stored());
    assert.equal(await app.atHome(), true);
    assert.equal((await app.picks()).length, 3, 'the picks are on screen');
  });

  test('something nobody meant to type', async () => {
    const app = await openAt('#/rubbish', await (await shelf()).stored());
    assert.equal(await app.atHome(), true);
  });

  test('a book deleted since the address was copied', async () => {
    const shelved = await shelf();
    await shelved.openBookNamed('Dinner');
    const address = await shelved.address();
    await shelved.deleteBook();
    await shelved.agree();
    const app = await openAt(address, await shelved.stored());
    assert.equal(await app.atHome(), true, 'the front door, not a blank page');
  });
});
