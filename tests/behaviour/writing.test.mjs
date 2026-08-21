// specs/features/recipes/writing.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openAppWithContents } from '../support/app.mjs';

rule('add-goes-to-top', () => {
  test('writing one down in an empty book', async () => {
    const app = await openApp();
    await app.writeDown('Apple cake');
    assert.deepEqual(await app.contents(), ['Apple cake']);
  });

  test('it goes above what is already there', async () => {
    const app = await openAppWithContents('Lemon drizzle');
    await app.writeDown('Apple cake');
    assert.deepEqual(await app.contents(), ['Apple cake', 'Lemon drizzle']);
  });
});

rule('add-clears-the-box', () => {
  test('the box is ready for the next one', async () => {
    const app = await openApp();
    await app.writeDown('Apple cake');
    assert.equal(await app.box(), '');
  });
});

rule('add-rejects-blank', () => {
  test('pressing Enter on an empty box', async () => {
    const app = await openApp();
    await app.type('');
    await app.submit();
    assert.deepEqual(await app.contents(), []);
  });

  test('submitting only spaces', async () => {
    const app = await openApp();
    await app.type('   ');
    await app.submit();
    assert.deepEqual(await app.contents(), []);
  });
});
