// specs/features/notepads/deleting.feature
//
// The one place this app asks before destroying something, and the reasoning
// for why it asks here and nowhere else is in specs/features/notepads/spec.md.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp } from '../support/app.mjs';

/** "My list" and "Home", with "Home" open — the Gherkin Background. */
function openWithHomeOpen() {
  const app = openApp();
  app.makeNotepad('Home');
  return app;
}

rule('delete-empty-notepad-goes-without-asking', () => {
  test('a notepad made by mistake', () => {
    const app = openWithHomeOpen();
    assert.deepEqual(app.list(), []);

    app.deleteNotepad();

    assert.equal(app.askedAbout(), null, 'nothing was at stake, so nothing was asked');
    assert.deepEqual(app.notepads(), ['My list']);
    assert.equal(app.openNotepad(), 'My list');
  });

  test('it stays deleted', () => {
    const app = openWithHomeOpen();
    app.deleteNotepad();
    assert.deepEqual(app.reload().notepads(), ['My list']);
  });
});

rule('delete-notepad-with-todos-asks-first', () => {
  test('agreeing to lose three todos', () => {
    const app = openWithHomeOpen();
    app.add('Call the bank');
    app.add('Buy milk');
    app.add('Water plants');

    app.deleteNotepad();
    assert.equal(app.askedAbout(), 'Delete "Home" and its 3 todos?');
    assert.deepEqual(app.notepads(), ['My list', 'Home'], 'nothing goes before the answer');

    app.agree();
    assert.deepEqual(app.notepads(), ['My list']);
    assert.equal(app.openNotepad(), 'My list');
  });

  test('changing my mind leaves everything where it was', () => {
    const app = openWithHomeOpen();
    app.add('Buy milk');

    app.deleteNotepad();
    app.decline();

    assert.deepEqual(app.notepads(), ['My list', 'Home']);
    assert.equal(app.openNotepad(), 'Home');
    assert.deepEqual(app.list(), ['Buy milk']);
  });

  test('walking away from the question destroys nothing', () => {
    const app = openWithHomeOpen();
    app.add('Buy milk');
    app.deleteNotepad();

    // Anything else being clicked shuts the menu, question and all.
    app.tick('Buy milk');

    assert.equal(app.menuIsOpen(), false);
    assert.deepEqual(app.notepads(), ['My list', 'Home']);
    assert.deepEqual(app.list(), ['Buy milk']);
    assert.equal(app.isDone('Buy milk'), true, 'and the click it was clicked for still landed');
  });

  test('one todo is asked about in the singular', () => {
    const app = openWithHomeOpen();
    app.add('Buy milk');
    app.deleteNotepad();
    assert.equal(app.askedAbout(), 'Delete "Home" and its 1 todo?');
  });

  test('the todos go with the notepad, not back to another one', () => {
    const app = openWithHomeOpen();
    app.add('Buy milk');
    app.deleteNotepad();
    app.agree();

    assert.deepEqual(app.list(), []);
    assert.deepEqual(app.reload().list(), []);
  });
});

rule('last-notepad-cannot-be-deleted', () => {
  test('down to one', () => {
    const app = openApp();
    assert.deepEqual(app.notepads(), ['My list']);
    assert.equal(app.offersNotepadDelete(), false);
  });

  test('the delete comes back once there is a second notepad', () => {
    const app = openWithHomeOpen();
    assert.equal(app.offersNotepadDelete(), true);
    app.deleteNotepad();
    assert.equal(app.offersNotepadDelete(), false);
  });
});
