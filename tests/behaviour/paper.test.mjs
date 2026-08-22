// specs/features/guarantees/paper.feature
//
// A look is mostly taste and mostly not testable. These are the three parts of
// it that are: the palette stays warm and readable, and the labelling face
// never carries anything anyone reads while cooking. What the look is *for* is
// in specs/features/guarantees/spec.md.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rule } from '../support/covers.mjs';
import { openApp, openAppWithContents } from '../support/app.mjs';
import { contrast, lightness, resolve, token, warmth } from '../support/palette.mjs';
import { readFileSync } from 'node:fs';

/** The resolved font stack an element is actually set in. */
const faceOf = (app, selector) =>
  resolve(app.window.getComputedStyle(app.document.querySelector(selector)).fontFamily);

const READING = resolve(token('reading'));
const LABELLING = resolve(token('hand'));

rule('paper-under-everything', () => {
  test('the ground, the page and the card are all warm', async () => {
    for (const name of ['paper', 'page', 'card']) {
      assert.ok(
        warmth(token(name)) > 5,
        `--${name} is ${token(name)}, which is not warm — paper is not a system grey`,
      );
    }
  });

  test('each one is lighter than the one it sits on', async () => {
    const [ground, page, card] = ['paper', 'page', 'card'].map((n) => lightness(token(n)));
    assert.ok(ground < page, 'the page must be lighter than the ground it lies on');
    assert.ok(page < card, 'a card must be lighter than the page it lies on');
  });

  test('the ground really is the page background', async () => {
    const app = await openApp();
    const body = app.window.getComputedStyle(app.document.body);
    assert.equal(resolve(body.backgroundColor), token('paper'));
  });
});

rule('ink-reads-on-paper', () => {
  // Every colour a recipe is read in, against what it sits on. Cream on cream
  // is the natural failure of a warm palette, and this is the guard.
  const pairs = [
    ['the ink on a card', 'ink', 'card'],
    ['the ink on the page', 'ink', 'page'],
    ['the muted ink on the page', 'faded', 'page'],
    ['the muted ink on a card', 'faded', 'card'],
    ['the red on a card', 'red', 'card'],
    ['the red on the page', 'red', 'page'],
  ];

  for (const [what, ink, ground] of pairs) {
    test(`${what} clears 4.5 to 1`, () => {
      const ratio = contrast(token(ink), token(ground));
      assert.ok(ratio >= 4.5, `${what} is ${ratio.toFixed(2)} to 1`);
    });
  }

  test('the label on the Add button clears 4.5 to 1', async () => {
    const app = await openApp();
    const label = app.window.getComputedStyle(
      app.document.querySelector('.composer__add'),
    ).color;
    const ratio = contrast(resolve(label), token('red'));
    assert.ok(ratio >= 4.5, `the Add button reads at ${ratio.toFixed(2)} to 1`);
  });
});

rule('the-masthead-names-the-book', () => {
  test('the cover', async () => {
    const app = await openApp();
    assert.equal(await app.masthead(), 'Recipes');
  });

  test('it does not say what the repository is called', async () => {
    // The repository is still todo-change, and still says so where it is the
    // repository being named. The cover is not one of those places.
    const app = await openApp();
    assert.ok(
      !await (await app.masthead()).includes('todo-change'),
      'the masthead names the book, not the repo it lives in',
    );
  });
});

rule('handwriting-labels-but-is-not-read', () => {
  /** One recipe, open, with something in both of its groups. */
  async function open() {
    const app = await openAppWithContents('Apple cake');
    await app.give('Apple cake', 'ingredient', ['200g plain flour']);
    await app.give('Apple cake', 'step', ['Heat the oven to 180C']);
    await app.openRecipe('Apple cake');
    return app;
  }

  test('the title and the group headings are set in the labelling face', async () => {
    const app = await open();
    assert.equal(faceOf(app, '.app__title'), LABELLING);
    assert.equal(faceOf(app, '.recipe__heading'), LABELLING);
  });

  test('the recipe, its ingredients and its method are set in the reading face', async () => {
    const app = await open();
    for (const selector of ['.recipe__name', '.ingredient__text', '.step__text']) {
      assert.equal(faceOf(app, selector), READING, `${selector} is read, not glanced at`);
    }
  });

  test('the labelling face falls back to a book face, never to whatever cursive is', async () => {
    // `cursive` always matches something, and where nothing handwritten is
    // installed that something is the default sans — beside a serif body it
    // reads as a mistake rather than a choice. See features/guarantees/spec.md.
    assert.ok(!/\bcursive\b/.test(LABELLING), `the labelling stack ends in: ${LABELLING}`);
    assert.ok(/serif$/.test(LABELLING), 'the labelling stack must end in a serif');
  });
});

rule('nothing-is-fetched-from-elsewhere', () => {
  // Read off the files rather than the DOM: jsdom fetches no subresources, so
  // a request to a font host would simply not happen here and the test would
  // pass while the real page reached for another origin.
  const sources = ['index.html', 'src/styles.css'].map((path) => [
    path,
    readFileSync(path, 'utf8'),
  ]);

  test('the page asks for nothing over http', async () => {
    for (const [path, source] of sources) {
      const found = source.match(/https?:\/\/[^\s"')]+/g) ?? [];
      // A link in a comment is a reference, not a request; anything in an
      // href, src or url() is the app reaching for another machine.
      const fetched = (source.match(/(?:href|src)\s*=\s*["']https?:[^"']*|url\(\s*["']?https?:[^)]*/g) ?? []);
      assert.deepEqual(fetched, [], `${path} reaches for: ${fetched.join(', ')}`);
      assert.ok(found.length === 0 || fetched.length === 0, `${path} is self-contained`);
    }
  });

  test('every font it uses is one of this app own files', async () => {
    const [, css] = sources.find(([path]) => path === 'src/styles.css');
    const faces = [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map((m) => m[1]);
    assert.ok(faces.length > 0, 'the labelling face is shipped, not borrowed');
    for (const face of faces) {
      const url = face.match(/url\(\s*["']?([^"')]+)/)?.[1] ?? '';
      assert.ok(url !== '', 'a @font-face with no file is a font host in disguise');
      assert.ok(!/^https?:/.test(url), `a face is fetched from elsewhere: ${url}`);
      assert.ok(
        readFileSync(`src/${url}`).length > 0,
        `${url} is not in this repository`,
      );
    }
  });
});
