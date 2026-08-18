// specs/features/todo/sub-todos.feature

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openAppWithList } from '../support/app.mjs';

rule('sub-todo-added-under-parent', () => {
  test('adding the first sub-todo', () => {
    const app = openAppWithList('Sort out car insurance');
    app.addSub('Sort out car insurance', 'Call current insurer');
    assert.deepEqual(app.subTodos('Sort out car insurance'), ['Call current insurer']);
  });

  test('the parent stays where it was', () => {
    const app = openAppWithList('Water plants', 'Sort out car insurance');
    app.addSub('Sort out car insurance', 'Call current insurer');
    assert.deepEqual(app.list(), ['Water plants', 'Sort out car insurance']);
  });

  test('a sub-todo is not a todo in the list', () => {
    const app = openAppWithList('Sort out car insurance');
    app.addSub('Sort out car insurance', 'Call current insurer');
    assert.deepEqual(
      app.list(),
      ['Sort out car insurance'],
      'steps belong to their parent, not to the list',
    );
  });

  test('one group does not collect another parent’s steps', () => {
    const app = openAppWithList('Water plants', 'Sort out car insurance');
    app.addSub('Sort out car insurance', 'Call current insurer');
    app.addSub('Water plants', 'Fill the can');
    assert.deepEqual(app.subTodos('Sort out car insurance'), ['Call current insurer']);
    assert.deepEqual(app.subTodos('Water plants'), ['Fill the can']);
  });
});

rule('sub-todos-keep-typing-order', () => {
  test('three steps in sequence', () => {
    const app = openAppWithList('Sort out car insurance');
    app.addSub('Sort out car insurance', 'Call current insurer');
    app.addSub('Sort out car insurance', 'Compare two quotes');
    app.addSub('Sort out car insurance', 'Cancel the old policy');
    assert.deepEqual(app.subTodos('Sort out car insurance'), [
      'Call current insurer',
      'Compare two quotes',
      'Cancel the old policy',
    ]);
  });

  test('the box stays open and focused between steps', () => {
    const app = openAppWithList('Sort out car insurance');
    app.addSub('Sort out car insurance', 'Call current insurer');
    const box = app.document.querySelector('.sub-composer__box');
    assert.equal(box.value, '', 'the box should be ready for the next step');
    assert.equal(app.document.activeElement, box, 'and should still have the caret');
  });
});

rule('sub-todo-rejects-blank', () => {
  test('submitting only spaces under a parent', () => {
    const app = openAppWithList('Sort out car insurance');
    app.submitSub('Sort out car insurance', '   ');
    assert.deepEqual(app.subTodos('Sort out car insurance'), []);
  });

  test('submitting nothing at all', () => {
    const app = openAppWithList('Sort out car insurance');
    app.submitSub('Sort out car insurance', '');
    assert.deepEqual(app.subTodos('Sort out car insurance'), []);
  });

  test('a sub-todo is trimmed like anything typed into a box', () => {
    const app = openAppWithList('Sort out car insurance');
    app.addSub('Sort out car insurance', '  Call current insurer  ');
    assert.deepEqual(app.subTodos('Sort out car insurance'), ['Call current insurer']);
  });
});

rule('sub-todo-depth-is-one', () => {
  test('there is no second level to reach for', () => {
    const app = openAppWithList('Sort out car insurance');
    app.addSub('Sort out car insurance', 'Call current insurer');
    assert.equal(app.offersSubTodos('Sort out car insurance'), true);
    assert.equal(
      app.offersSubTodos('Call current insurer'),
      false,
      'a sub-todo must offer no way to nest under it',
    );
  });

  test('nesting stored a level too deep arrives flat', () => {
    const app = openAppWithList('Sort out car insurance');
    app.addSub('Sort out car insurance', 'Call current insurer');

    // Straight into storage, because the UI offers no way to write this.
    const smuggled = JSON.parse(app.stored());
    smuggled[0].subTodos[0].subTodos = [{ id: 'x', text: 'Find the policy number', done: false }];
    const reopened = openApp(JSON.stringify(smuggled));

    assert.deepEqual(reopened.subTodos('Sort out car insurance'), ['Call current insurer']);
    assert.equal(reopened.offersSubTodos('Call current insurer'), false);
  });
});
