// specs/features/notepads/creating.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp } from '../support/app.mjs';

/** "My list" with one todo in it — the Gherkin Background. */
function openWithAList() {
  const app = openApp();
  app.add('Call the bank');
  return app;
}

rule('create-notepad-opens-it-empty', () => {
  test('starting a notepad for things at home', () => {
    const app = openWithAList();
    app.makeNotepad('Home');

    assert.equal(app.openNotepad(), 'Home');
    assert.deepEqual(app.list(), []);
    assert.equal(app.message(), 'Nothing to do yet.');
  });

  test('the notepad it was made from is untouched', () => {
    const app = openWithAList();
    app.makeNotepad('Home');

    app.openNotepadNamed('My list');
    assert.deepEqual(app.list(), ['Call the bank']);
  });

  test('both notepads are in the menu, oldest first', () => {
    const app = openWithAList();
    app.makeNotepad('Home');
    app.makeNotepad('Someday');
    assert.deepEqual(app.notepads(), ['My list', 'Home', 'Someday']);
  });

  test('the new notepad survives a reload', () => {
    const app = openWithAList();
    app.makeNotepad('Home');
    assert.equal(app.reload().openNotepad(), 'Home');
  });
});

rule('notepad-rejects-blank-name', () => {
  test('submitting only spaces', () => {
    const app = openWithAList();
    app.makeNotepad('   ');

    assert.deepEqual(app.notepads(), ['My list']);
    assert.equal(app.openNotepad(), 'My list');
  });

  test('a name is trimmed, so it is the name that was meant', () => {
    const app = openWithAList();
    app.makeNotepad('  Home  ');
    assert.equal(app.openNotepad(), 'Home');
  });
});
