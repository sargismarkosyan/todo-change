// specs/features/todo/sub-todos-completing.feature
//
// One invariant, checked from every direction it can be reached from: a parent
// is done exactly when all of its sub-todos are done.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openAppWithList } from '../support/app.mjs';

const PARENT = 'Sort out car insurance';
const FIRST = 'Call current insurer';
const SECOND = 'Compare two quotes';

/** A list of one todo with two unfinished sub-todos under it. */
function openGroup() {
  const app = openAppWithList(PARENT);
  app.addSub(PARENT, FIRST);
  app.addSub(PARENT, SECOND);
  return app;
}

rule('parent-done-when-all-sub-todos-done', () => {
  test('finishing the second of two', () => {
    const app = openGroup();

    app.tick(FIRST);
    assert.equal(app.isDone(PARENT), false, 'one step left means the thing is not done');

    app.tick(SECOND);
    assert.equal(app.isDone(PARENT), true);
    assert.equal(app.hasLineThrough(PARENT), true, 'and it must read as done at a glance');
  });

  test('a todo with no sub-todos is untouched by any of this', () => {
    const app = openAppWithList('Buy milk');
    assert.equal(app.isDone('Buy milk'), false);
    app.tick('Buy milk');
    assert.equal(app.isDone('Buy milk'), true);
  });
});

rule('parent-reopens-when-a-sub-todo-is-unticked', () => {
  test('changing my mind about one step', () => {
    const app = openGroup();
    app.tick(FIRST);
    app.tick(SECOND);
    assert.equal(app.isDone(PARENT), true);

    app.untick(FIRST);
    assert.equal(app.isDone(PARENT), false);
    assert.equal(app.hasLineThrough(PARENT), false);
    assert.equal(app.isDone(SECOND), true, 'the other step is not disturbed');
  });
});

rule('ticking-parent-ticks-sub-todos', () => {
  test('the whole thing turned out to be done', () => {
    const app = openGroup();
    app.tick(PARENT);
    assert.equal(app.isDone(FIRST), true);
    assert.equal(app.isDone(SECOND), true);
    assert.equal(app.hasLineThrough(FIRST), true);
  });

  test('unticking the parent reopens its sub-todos', () => {
    const app = openGroup();
    app.tick(PARENT);
    app.untick(PARENT);
    assert.equal(app.isDone(PARENT), false);
    assert.equal(app.isDone(FIRST), false);
    assert.equal(app.isDone(SECOND), false);
  });

  test('half a group is closed out in one click', () => {
    const app = openGroup();
    app.tick(FIRST);
    app.tick(PARENT);
    assert.equal(app.isDone(SECOND), true, 'the step that was open should have gone with it');
  });
});

rule('new-sub-todo-reopens-parent', () => {
  test('one more step turns up', () => {
    const app = openGroup();
    app.tick(PARENT);

    app.addSub(PARENT, 'Cancel the old policy');
    assert.equal(app.isDone(PARENT), false);
    assert.equal(app.isDone(FIRST), true, 'what was already finished stays finished');
    assert.equal(app.isDone('Cancel the old policy'), false);
  });

  test('the first step under a done todo reopens it too', () => {
    const app = openAppWithList('Buy milk');
    app.tick('Buy milk');
    app.addSub('Buy milk', 'Check which shop is open');
    assert.equal(app.isDone('Buy milk'), false);
  });
});

rule('deleting-sub-todos-settles-the-parent', () => {
  test('deleting the only step that was still open', () => {
    const app = openGroup();
    app.tick(FIRST);
    app.deleteTodo(SECOND);
    assert.equal(app.isDone(PARENT), true);
    assert.deepEqual(app.subTodos(PARENT), [FIRST]);
  });

  test('losing the last sub-todo leaves an ordinary todo', () => {
    const app = openGroup();
    app.deleteTodo(FIRST);
    app.deleteTodo(SECOND);
    assert.deepEqual(app.subTodos(PARENT), []);
    assert.equal(
      app.isDone(PARENT),
      false,
      'an empty group is no reason to tick something nobody finished',
    );
  });

  test('a done group that loses its steps stays done', () => {
    const app = openGroup();
    app.tick(PARENT);
    app.deleteTodo(FIRST);
    app.deleteTodo(SECOND);
    assert.equal(app.isDone(PARENT), true);
  });
});
