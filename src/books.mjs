// The book model.
//
// A book is a named collection of recipes. There is always at least one,
// exactly one is open, and the contents on screen is the open one's. Pure, like
// recipes.mjs — nothing here touches the document or localStorage. See
// specs/features/books/spec.md.

import { isLine, newId, sanitizeLines, sanitizeRecipes } from './recipes.mjs';

/**
 * What the first book is called: the one a fresh browser starts on, and the one
 * an old bare list is moved into. Naming it here rather than at each call site
 * is what keeps those two the same book from the reader's side.
 */
export const DEFAULT_NAME = 'My book';

/** A book with nothing in it. */
export function makeBook(name) {
  return { id: newId(), name, recipes: [] };
}

/** The store an app opens on when nothing usable was found: one empty book. */
export function emptyStore() {
  const book = makeBook(DEFAULT_NAME);
  return { books: [book], openId: book.id };
}

/**
 * Whether a value read back out of storage is a book.
 *
 * The same bet as `isRecipe`: `id` and `name` must be non-empty strings and the
 * recipes an array. A `recipes` that is not a list is not a book missing its
 * recipes, it is not a book — dropping it keeps its neighbours, which is the
 * better of the two failures.
 */
export function isBook(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    value.id !== '' &&
    typeof value.name === 'string' &&
    value.name !== '' &&
    Array.isArray(value.recipes)
  );
}

/**
 * `books` and which one is open, given a list of already-sanitised books.
 *
 * Nothing usable at all opens one empty book rather than a blank screen, and an
 * `openId` naming a book that is not there opens the first one — no reachable
 * stored string leaves the app with nothing to draw.
 */
function openOn(books, openId) {
  if (books.length === 0) return emptyStore();
  const open = books.some((book) => book.id === openId);
  return { books, openId: open ? openId : books[0].id };
}

/**
 * Everything in `value` that is a book, with its recipes read the way
 * recipes.mjs reads them, plus which one is open.
 *
 * Untrusted at every level: a junk book is dropped and its neighbours kept,
 * exactly as a junk recipe is.
 */
export function sanitizeStore(value) {
  if (typeof value !== 'object' || value === null) return emptyStore();
  const found = Array.isArray(value.books) ? value.books : [];
  const books = found
    .filter(isBook)
    .map(({ id, name, recipes }) => ({ id, name, recipes: sanitizeRecipes(recipes) }));
  return openOn(books, value.openId);
}

/**
 * One todo, read as the recipe it becomes: its text is the recipe's name, its
 * sub-todos are the method, and it has no ingredients because nothing that was
 * a todo ever had any.
 *
 * **`done` is read and dropped.** There is no honest place to put it — a recipe
 * is not finished — so a half-ticked list opens as recipes with no ticks at
 * all. That is the one thing a migration in this app throws away on purpose;
 * see specs/changes/0004-recipe-book.md.
 */
function migrateTodo({ id, text, subTodos }) {
  return { id, name: text, ingredients: [], steps: sanitizeLines(subTodos) };
}

/** Everything in `value` that was a todo, as recipes. */
function migrateTodos(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(isLine).map(migrateTodo);
}

/** Whether a value read out of the 0003 key is a notepad: the shape that key wrote. */
function isNotepad(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    value.id !== '' &&
    typeof value.name === 'string' &&
    value.name !== '' &&
    Array.isArray(value.todos)
  );
}

/**
 * The notepads written by version 0003, read as books.
 *
 * A notepad becomes a book of the same name and each todo in it a recipe, ids
 * and order intact. Untrusted like every other read: a junk notepad is dropped
 * and its neighbours kept, and nothing usable opens one empty book.
 */
export function migrateNotepads(value) {
  if (typeof value !== 'object' || value === null) return emptyStore();
  const found = Array.isArray(value.notepads) ? value.notepads : [];
  const books = found
    .filter(isNotepad)
    .map(({ id, name, todos }) => ({ id, name, recipes: migrateTodos(todos) }));
  return openOn(books, value.openId);
}

/**
 * A bare array of todos — everything written before notepads existed — read as
 * a store holding one book called "My book".
 *
 * Anything that is not a list of todos lands on the same empty book the rest of
 * the read path does, so an upgrade can never be the thing that shows a blank
 * screen.
 */
export function migrateList(value) {
  const book = { ...makeBook(DEFAULT_NAME), recipes: migrateTodos(value) };
  return { books: [book], openId: book.id };
}

/** The book on screen. */
export function openBook(store) {
  return store.books.find((book) => book.id === store.openId) ?? store.books[0];
}

/** The contents on screen: the open book's recipes, and never anything else's. */
export function openRecipes(store) {
  return openBook(store).recipes;
}

/** `store` with `recipes` as the open book's. Every contents change lands here. */
export function withOpenRecipes(store, recipes) {
  return {
    ...store,
    books: store.books.map((book) =>
      book.id === store.openId ? { ...book, recipes } : book,
    ),
  };
}

/** `store` showing another book. An id that is not there changes nothing. */
export function switchTo(store, id) {
  if (!store.books.some((book) => book.id === id)) return store;
  return { ...store, openId: id };
}

/**
 * `store` with a new book at the end, open, or `store` unchanged when there is
 * nothing to name it.
 *
 * Appended rather than put on top: books are made once and then navigated by
 * remembered position, so the first one stays first. Trimming is what makes an
 * all-whitespace name impossible.
 */
export function addBook(store, name) {
  const trimmed = name.trim();
  if (trimmed === '') return store;
  const book = makeBook(trimmed);
  return { books: [...store.books, book], openId: book.id };
}

/** `store` with one book renamed. A blank name is not a rename. */
export function renameBook(store, id, name) {
  const trimmed = name.trim();
  if (trimmed === '') return store;
  return {
    ...store,
    books: store.books.map((book) => (book.id === id ? { ...book, name: trimmed } : book)),
  };
}

/**
 * `store` without one book, and its recipes with it.
 *
 * The last book does not go: there is always somewhere for a recipe to be, so
 * there is no empty state below the empty state. Deleting the open one leaves
 * the book before it open, or the first one — the eye lands where the deleted
 * one was, rather than somewhere it has to look for.
 */
export function removeBook(store, id) {
  if (store.books.length < 2) return store;
  const at = store.books.findIndex((book) => book.id === id);
  if (at === -1) return store;
  const books = store.books.filter((book) => book.id !== id);
  if (store.openId !== id) return { ...store, books };
  return { books, openId: books[Math.max(at - 1, 0)].id };
}
