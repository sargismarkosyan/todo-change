// specs/features/notepads/switching.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp } from '../support/app.mjs';

/** An app with "My list" and "Home", back on "My list" — the Gherkin Background. */
function openWithTwoNotepads() {
  const app = openApp();
  app.makeNotepad('Home');
  app.openNotepadNamed('My list');
  return app;
}

rule('switch-shows-only-that-notepad', () => {
  test('two notepads, one visible at a time', () => {
    const app = openWithTwoNotepads();
    app.add('Call the bank');

    app.openNotepadNamed('Home');
    assert.deepEqual(app.list(), []);

    app.add('Water plants');
    assert.deepEqual(app.list(), ['Water plants']);

    app.openNotepadNamed('My list');
    assert.deepEqual(app.list(), ['Call the bank']);
    assert.equal(app.openNotepad(), 'My list');
  });

  test('ticking in one notepad leaves the other alone', () => {
    const app = openWithTwoNotepads();
    app.add('Call the bank');
    app.openNotepadNamed('Home');
    app.add('Call the bank');
    app.tick('Call the bank');

    app.openNotepadNamed('My list');
    assert.equal(app.isDone('Call the bank'), false, 'same text, different notepad');
  });

  test('switching shuts the menu, so the list is what is on screen', () => {
    const app = openWithTwoNotepads();
    app.openNotepadNamed('Home');
    assert.equal(app.menuIsOpen(), false);
  });
});

rule('capture-goes-to-the-open-notepad', () => {
  test('typing into the box while "Home" is open', () => {
    const app = openWithTwoNotepads();
    app.openNotepadNamed('Home');

    app.add('Buy milk');
    assert.deepEqual(app.list(), ['Buy milk']);

    app.openNotepadNamed('My list');
    assert.deepEqual(app.list(), [], 'nothing landed anywhere it was not asked to');
  });

  test('the box is the same box, and asks nothing', () => {
    const app = openWithTwoNotepads();
    app.openNotepadNamed('Home');
    app.type('Buy milk');
    app.submit();
    assert.deepEqual(app.list(), ['Buy milk']);
    assert.equal(app.box(), '');
  });
});
