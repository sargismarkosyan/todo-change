// specs/features/guarantees/within-reach.feature
//
// The four guarantees the 0017 audit found missing. None of them is visible,
// which is the point: this is the same book, reached by hands and ears the
// stylesheet had not been written for.
//
// Two of the four are geometry, and jsdom has no layout — so they are read out
// of the real stylesheet the way telling-books-apart.test.mjs reads the ribbon.
// What that cannot say is what a browser actually painted, and the acceptance
// pass in specs/changes/0017-within-reach.md is where that is checked.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openAppWithContents } from '../support/app.mjs';
import { declared, ruleCovering, typeSizes } from '../support/palette.mjs';

/** The floor, in the units WCAG states it in. */
const FLOOR = 24;

/** What one small mark's hit area measures, out of the stylesheet. */
const hitArea = (selector) => {
  const body = ruleCovering(`${selector}::before`);
  return ['width', 'height'].map((side) => declared(body, side));
};

rule('small-marks-hit-big', () => {
  // The grip is drawn 18 wide and a line's cross 22 — both under the floor,
  // and both deliberately drawn that quiet. What grows is the area under the
  // mark, so this asks the stylesheet for that box rather than for the mark.
  for (const [what, selector] of [
    ['the grip on a line', '.line-handle'],
    ['the cross on a line', '.ingredient__delete'],
    ['the cross on a step', '.step__delete'],
  ]) {
    test(`${what} offers at least 24 pixels each way`, () => {
      const [width, height] = hitArea(selector);
      for (const [side, value] of [['width', width], ['height', height]]) {
        assert.ok(value !== null, `${what} declares no hit ${side}`);
        assert.ok(
          value.endsWith('px') && Number.parseFloat(value) >= FLOOR,
          `${what} answers a press over ${value} of ${side}, and the floor is ${FLOOR}px`,
        );
      }
    });
  }

  test('the area is grown under the mark, so nothing drawn moves', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.addIngredient('Apple cake', '3 apples');
    await app.addStep('Apple cake', 'Heat the oven to 180C');
    for (const selector of ['.line-handle', '.ingredient__delete', '.step__delete']) {
      const body = ruleCovering(`${selector}::before`);
      assert.equal(
        declared(body, 'position'),
        'absolute',
        `${selector} grows its target in the flow, which pushes the line along`,
      );
      // An absolutely positioned box needs the control to be what it is
      // positioned against, or it centres on the page instead.
      assert.equal(
        app.window.getComputedStyle(app.document.querySelector(selector)).position,
        'relative',
        `${selector} is not what its own hit area is measured from`,
      );
    }
  });
});

rule('what-just-happened-is-announced', () => {
  test('a search says how many it found', async () => {
    const app = await openApp();
    await app.makeBook('Sweets');
    await app.writeDown('Apple cake');
    await app.writeDown('Lemon chicken');
    await app.writeDown('Lemon drizzle');

    await app.search('lemon');
    assert.equal(await app.announcement(), '2 found');
  });

  test('a search that finds nothing says so', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.search('paella');
    assert.equal(await app.announcement(), 'No recipe matches that.');
  });

  test('what it says keeps up as the search narrows', async () => {
    const app = await openApp();
    await app.makeBook('Sweets');
    await app.writeDown('Lemon chicken');
    await app.writeDown('Lemon drizzle');

    await app.search('lemon');
    assert.equal(await app.announcement(), '2 found');
    await app.search('lemon d');
    assert.equal(await app.announcement(), '1 found');
  });

  test('a deleted line is announced', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.addIngredient('Apple cake', '3 apples');
    await app.deleteLine('3 apples');
    assert.equal(await app.announcement(), 'Deleted 3 apples');
  });

  test('a deleted recipe is announced', async () => {
    const app = await openAppWithContents('Apple cake', 'Lemon drizzle');
    await app.deleteRecipe('Apple cake');
    assert.equal(await app.announcement(), 'Deleted Apple cake');
  });

  test('it says nothing before anything has happened', async () => {
    const app = await openAppWithContents('Apple cake');
    assert.equal(await app.announcement(), '');
  });

  test('it is one polite live region, and it is never drawn', async () => {
    const app = await openAppWithContents('Apple cake');
    assert.equal(await app.announcerRole(), 'status');
    assert.equal(await app.announcers(), 1);
    assert.equal(await app.announcerIsVisible(), false);
  });

  test('leaving a search takes back what it said', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.search('apple');
    assert.equal(await app.announcement(), '1 found');
    await app.openResult('Apple cake');
    assert.equal(await app.announcement(), '');
  });
});

rule('deleting-keeps-the-keyboards-place', () => {
  test('a middle line hands focus to the next', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.give('Apple cake', 'ingredient', ['200g plain flour', '3 apples']);
    await app.openRecipe('Apple cake');

    await app.deleteLine('200g plain flour');
    assert.equal(await app.focusIsOnLineCross('3 apples'), true);
  });

  test('the last line hands focus to the composer', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.addIngredient('Apple cake', '3 apples');

    await app.deleteLine('3 apples');
    assert.equal(await app.focusIsInLineBox('Apple cake', 'ingredient'), true);
  });

  test('a step hands focus on the same way', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.give('Apple cake', 'step', ['Heat the oven to 180C', 'Peel the apples']);
    await app.openRecipe('Apple cake');

    await app.deleteLine('Heat the oven to 180C');
    assert.equal(await app.focusIsOnLineCross('Peel the apples'), true);
  });

  test('a deleted recipe hands focus the same way', async () => {
    const app = await openAppWithContents('Apple cake', 'Lemon drizzle');
    await app.deleteRecipe('Apple cake');
    assert.equal(await app.focusIsOnRecipeCross('Lemon drizzle'), true);
  });

  test('the last recipe hands focus to the box', async () => {
    const app = await openAppWithContents('Apple cake');
    await app.deleteRecipe('Apple cake');
    assert.equal(await app.focusIsInTheBox(), true);
  });

  test('focus never simply falls off the page', async () => {
    const app = await openAppWithContents('Apple cake', 'Lemon drizzle');
    await app.deleteRecipe('Apple cake');
    assert.notEqual(
      app.document.activeElement,
      app.document.body,
      'the keyboard was left at the top of the page, which is the walk back down',
    );
  });
});

rule('no-text-is-sized-in-pixels', () => {
  test('no text is sized in pixels', () => {
    const fixed = typeSizes().filter((size) => size.endsWith('px'));
    assert.deepEqual(
      fixed,
      [],
      `type sized in pixels does not grow with the reader's own setting: ${fixed.join(', ')}`,
    );
  });

  test('the base size is what every version before this drew', () => {
    // 1.0625rem is 17px at a browser left alone, so the screenshot series does
    // not shift by a pixel. If this ever has to change, the series is the thing
    // to check, not the number.
    const sizes = typeSizes();
    assert.ok(
      sizes.includes('1.0625rem'),
      'the base size is no longer the 17px every earlier version was drawn at',
    );
  });
});
