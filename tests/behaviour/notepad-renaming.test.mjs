// specs/features/notepads/renaming.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp } from '../support/app.mjs';

/** "Home", holding two todos and open — the Gherkin Background. */
function openWithHome() {
  const app = openApp();
  app.makeNotepad('Home');
  app.add('Buy milk');
  app.add('Water plants');
  return app;
}

rule('rename-keeps-the-todos', () => {
  test('"Home" turns out to mean "House"', () => {
    const app = openWithHome();
    app.tick('Buy milk');

    app.renameNotepad('House');

    assert.equal(app.openNotepad(), 'House');
    assert.deepEqual(app.list(), ['Water plants', 'Buy milk']);
    assert.equal(app.isDone('Buy milk'), true);
  });

  test('the new name is the one that comes back', () => {
    const app = openWithHome();
    app.renameNotepad('House');
    assert.deepEqual(app.reload().notepads(), ['My list', 'House']);
  });

  test('the other notepads keep their names', () => {
    const app = openWithHome();
    app.renameNotepad('House');
    assert.deepEqual(app.notepads(), ['My list', 'House']);
  });
});

rule('rename-rejects-blank', () => {
  test('submitting only spaces', () => {
    const app = openWithHome();
    app.renameNotepad('   ');
    assert.equal(app.openNotepad(), 'Home');
    assert.deepEqual(app.list(), ['Water plants', 'Buy milk']);
  });
});
