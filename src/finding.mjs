// Finding a recipe without knowing which book it is in.
//
// Pure, like recipes.mjs and books.mjs: nothing here touches the document or
// localStorage. A search is not stored anywhere — it is where the reader is
// looking, the same as which recipe is open. See specs/features/finding/spec.md.

import { linesOf } from './recipes.mjs';

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
