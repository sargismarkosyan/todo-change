// The front door: which of the two addresses is on screen, and what to offer
// somebody who has arrived at it with nothing in mind.
//
// Pure, like finding.mjs and books.mjs: nothing here touches the document or
// localStorage. Nothing about the picks is stored either — they are worked out
// from the day, the way results are worked out from what is typed. See
// specs/features/home/spec.md.

/** How many recipes the front door offers. Three is a choice, not a contents page. */
export const PICKS = 3;

/** The address of the front door. */
export const HOME = '#/';

/** The address of one book. The only place this shape is written down. */
export const addressOf = (id) => `#/book/${id}`;

/**
 * Which of the two addresses this is, given the books actually on the shelf.
 *
 * Untrusted input, in the same posture storage.mjs takes to a stored string:
 * anybody can type an address, so anything not naming a book here is the front
 * door. An id holding a character a URL escapes simply fails to match, which
 * lands on that same safe screen rather than on a blank one.
 */
export function routeOf(hash, books) {
  const id = /^#\/book\/(.+)$/.exec(hash ?? '')?.[1];
  return id !== undefined && books.some((book) => book.id === id)
    ? { at: 'book', id }
    : { at: 'home' };
}

const pad = (number) => String(number).padStart(2, '0');

/**
 * The local calendar day, and the only thing the picks are seeded from.
 *
 * Local rather than UTC because "of the day" means the reader's day, and there
 * is exactly one reader, in one browser, on one machine.
 */
export const dayOf = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * FNV-1a over a day and a recipe id.
 *
 * Neither security nor randomness: a spread. What it has to be is *stable* — the
 * same day gives the same three all day, because the home repaints on every
 * letter typed into the search box, and a page that reshuffles itself under the
 * cursor is the one thing this app has never done.
 */
function hash(text) {
  let value = 2166136261;
  for (let at = 0; at < text.length; at += 1) {
    value ^= text.charCodeAt(at);
    value = Math.imul(value, 16777619);
  }
  // The last three lines are the avalanche, and they are not decoration: without
  // them the top bits are decided by the end of the string, the day is at the
  // front, and consecutive days come out in nearly the same order — which is the
  // one thing these three names must not do.
  value ^= value >>> 15;
  value = Math.imul(value, 2246822507);
  value ^= value >>> 13;
  return value >>> 0;
}

/**
 * The recipes to start from: `count` of them, from any book, each carrying the
 * book it is in — the same shape a result has, so one row draws both.
 *
 * The day chooses which; the books decide where they sit. Nothing is ranked,
 * and fewer written down than asked for gives what there is.
 */
export function picksForDay(books, day, count = PICKS) {
  const pool = books.flatMap((book) =>
    book.recipes.map((recipe) => ({ recipe, book, line: null })),
  );
  const wanted = new Set(
    pool
      .map((pick, at) => ({ at, by: hash(`${day} ${pick.recipe.id}`) }))
      .sort((one, two) => one.by - two.by)
      .slice(0, count)
      .map(({ at }) => at),
  );
  return pool.filter((_, at) => wanted.has(at));
}
