// specs/workflows/name-a-recipe.feature
//
// A walkthrough, not a rule check. Trigger to end state in one sequence, then
// back to the app to find it as it was left — which is @guarantee:survives-return
// asserted where it actually matters rather than once, in storage/.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workflow } from '../support/covers.mjs';
import { openApp, openAppWithContents } from '../support/app.mjs';

workflow('name-a-recipe', () => {
  test('a recipe arrives mid-call', async () => {
    const app = await openApp();
    const book = await app.openBook();

    await app.writeDown('Apple cake');

    assert.equal((await app.contents())[0], 'Apple cake');
    assert.equal(await app.box(), '', 'the box is ready for the next one');
    assert.equal(await app.openBook(), book, 'it landed in the book that was open');
  });

  test('it is still there next time', async () => {
    const app = await openApp();
    await app.writeDown('Apple cake');
    const book = await app.openBook();

    const back = await app.reload();

    assert.deepEqual(await back.contents(), ['Apple cake']);
    assert.equal(await back.openBook(), book);
  });

  test('three of them, dictated in a row', async () => {
    const app = await openAppWithContents();
    for (const name of ['Apple cake', 'Lemon drizzle', 'Bakewell tart']) {
      await app.writeDown(name);
    }

    assert.deepEqual(await app.contents(), ['Bakewell tart', 'Lemon drizzle', 'Apple cake']);

    const back = await app.reload();
    assert.deepEqual(await back.contents(), ['Bakewell tart', 'Lemon drizzle', 'Apple cake']);
  });
});
