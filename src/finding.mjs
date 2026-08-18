// Finding a recipe without knowing which book it is in.
//
// Pure, like recipes.mjs and books.mjs: nothing here touches the document or
// localStorage. A search is not stored anywhere — it is where the reader is
// looking, the same as which recipe is open. See specs/features/finding/spec.md.

import { linesOf, tagsOf } from './recipes.mjs';

/** Case-insensitive, and a substring: a half-remembered name is half a word. */
const holds = (text, needle) => text.toLowerCase().includes(needle);

/**
 * How one recipe answers a search, or `null` when it does not.
 *
 * `line` is the ingredient that matched, and it is only there when the name did
 * not: a result reading "Thursday casserole" for a search of "chicken" looks
 * like a bug unless it says which line put it there, and a name that visibly
 * contains what was typed is its own explanation.
 */
function resultFor(recipe, book, needle) {
  if (holds(recipe.name, needle)) return { recipe, book, line: null };
  const found = linesOf(recipe, 'ingredients').find((line) => holds(line.text, needle));
  return found ? { recipe, book, line: found.text } : null;
}

/**
 * Every recipe in every book that answers `term`, each carrying the book it is
 * in. Nothing to search for finds nothing, so an empty box is not a search.
 *
 * The name and the ingredients, never the method: a method is full of oven,
 * bowl and minutes, and matching it would return most of a baking book for
 * terms that identify nothing. What a recipe takes is how it is chosen, which
 * is why ingredients sit above the method when one is open.
 *
 * Results come out in book order, then contents order. Nothing is ranked —
 * relevance is a guess about intent, and nothing in this app rearranges itself.
 */
export function findRecipes(books, term) {
  const needle = term.trim().toLowerCase();
  if (needle === '') return [];
  return books.flatMap((book) =>
    book.recipes.map((recipe) => resultFor(recipe, book, needle)).filter((found) => found),
  );
}

/**
 * Every tag written down anywhere, once each, alphabetically.
 *
 * Alphabetical is the one order that does not move as tagging goes on. By how
 * often each is used, the list would rearrange itself under the cursor every
 * time a recipe was tagged — and nothing in this app rearranges itself.
 */
export function tagsInUse(books) {
  const found = new Set();
  for (const book of books) {
    for (const recipe of book.recipes) {
      for (const tag of tagsOf(recipe)) found.add(tag);
    }
  }
  return [...found].sort();
}

/**
 * Every recipe carrying *all* of `picked`, each with the book it is in — the
 * fridge question rather than the where-did-I-put-it one.
 *
 * All of them, not any: a fridge holds several things and what is being asked
 * is what they add up to. Nothing picked is not a filter, the same way an empty
 * search box is not a search.
 *
 * A tag matches whole, where a search matches letters. That is the point of the
 * two existing side by side: searching "ice" answers with every rice and juice,
 * and this cannot.
 */
export function filterByTags(books, picked) {
  if (picked.length === 0) return [];
  return books.flatMap((book) =>
    book.recipes
      .filter((recipe) => picked.every((tag) => tagsOf(recipe).includes(tag)))
      .map((recipe) => ({ recipe, book, line: null })),
  );
}

/**
 * The tags on offer for what has been typed so far. Nothing typed offers all of
 * them, because the list of doors is the point — you cannot type a word you
 * have not thought of, but you can read one off a list.
 */
export function offerTags(tags, term) {
  const needle = term.trim().toLowerCase();
  if (needle === '') return tags;
  return tags.filter((tag) => tag.includes(needle));
}
