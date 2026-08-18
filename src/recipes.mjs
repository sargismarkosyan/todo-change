// The recipe model.
//
// Pure: nothing here touches the document or localStorage, so it can be read,
// tested and reasoned about on its own. The DOM layer is app.mjs; the storage
// layer is storage.mjs. See specs/setup/constraints.md.
//
// A recipe has a name, the ingredients it takes, and a method made of steps.
// It has no state: nothing here is done, unfinished, started or made, because
// nothing in this product is finished. See specs/features/recipes/spec.md.

/**
 * A fresh id: when it was made, plus 64 bits of randomness.
 *
 * The randomness is the part that matters. Ids are how rows are addressed, so
 * two recipes sharing one would mean deleting one deletes both. An earlier
 * version used four base36 characters from `Math.random()` — about 1.7 million
 * values against the ~265 ids that fit in a millisecond, which collided roughly
 * two runs in five. See issue #2.
 *
 * `getRandomValues` rather than `randomUUID`: the latter is undefined outside a
 * secure context, which would break the app entirely over plain http.
 */
export function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${Date.now()}-${suffix}`;
}

/**
 * Whether a value read back out of storage is a line of a recipe — an
 * ingredient or a step. They have the same shape as each other and neither
 * holds anything of its own.
 *
 * localStorage is untrusted input: anyone with devtools can put anything in it,
 * and everything under the old todo keys arrives through here too. `id` and
 * `text` must be non-empty strings; a value that is nearly a line is not one.
 */
export function isLine(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    value.id !== '' &&
    typeof value.text === 'string' &&
    value.text !== ''
  );
}

/** Whether a value read back out of storage is a recipe. */
export function isRecipe(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    value.id !== '' &&
    typeof value.name === 'string' &&
    value.name !== ''
  );
}

/**
 * The lines of one group — `ingredients` or `steps`. Absent and empty mean the
 * same thing, so this is the only way anything should reach for them.
 */
export function linesOf(recipe, group) {
  return recipe[group] ?? [];
}

/**
 * The tags of a recipe. Absent and empty mean the same thing, so this is the
 * only way anything should reach for them.
 */
export function tagsOf(recipe) {
  return recipe.tags ?? [];
}

/**
 * One tag as it is stored: trimmed and lower case.
 *
 * A tag is an index key rather than something read, which is the whole
 * difference between it and an ingredient. "Chicken" and "chicken" would
 * otherwise be two doors, each opening onto half the answer. Anything that is
 * not a string at all is not a word — untrusted data reaches here too.
 */
export function normalizeTag(text) {
  return typeof text === 'string' ? text.trim().toLowerCase() : '';
}

/**
 * Everything in `value` that is a tag: normalised, non-empty, each present
 * once, in the order found.
 *
 * Not an array at all reads as no tags, and the recipe still survives — a
 * recipe is never discarded over what it is filed under. See
 * specs/features/recipes/spec.md.
 */
export function sanitizeTags(value) {
  if (!Array.isArray(value)) return [];
  const tags = [];
  for (const entry of value) {
    const tag = normalizeTag(entry);
    if (tag !== '' && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

/**
 * Everything in `value` that is a line, in the order found, stripped of
 * anything else it was carrying. Not an array at all reads as no lines.
 *
 * Stripping is what keeps `done` out of the data: every ingredient and step
 * migrated from a sub-todo arrives with one, and it does not survive the read.
 */
export function sanitizeLines(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(isLine).map(({ id, text }) => ({ id, text }));
}

/**
 * Everything in `value` that is a recipe, in the order found, with its
 * ingredients and method read the same way.
 *
 * Malformed entries are dropped rather than failing the whole read: throwing
 * away someone's real recipes because a neighbour got mangled is the worse of
 * the two failures, and it is worse here than it was for todos — a recipe may
 * be the only copy of something somebody dictated once.
 */
export function sanitizeRecipes(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecipe).map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    tags: sanitizeTags(recipe.tags),
    ingredients: sanitizeLines(recipe.ingredients),
    steps: sanitizeLines(recipe.steps),
  }));
}

/**
 * `recipes` with a new one on top, or `recipes` unchanged when there is nothing
 * to name it. Newest first, always — the contents never reorders itself.
 *
 * Trimming on the way in is what makes an all-whitespace recipe impossible.
 */
export function addRecipe(recipes, name) {
  const trimmed = name.trim();
  if (trimmed === '') return recipes;
  return [{ id: newId(), name: trimmed, tags: [], ingredients: [], steps: [] }, ...recipes];
}

/**
 * `recipes` with one line appended to the bottom of a recipe's `group`, or
 * `recipes` unchanged when there is nothing to add.
 *
 * Oldest first here, against the newest-first contents above. A recipe is read
 * top to bottom and a method is a sequence; reversing either would fight the
 * thing itself. See specs/features/recipes/spec.md.
 */
function addLine(recipes, recipeId, group, text) {
  const trimmed = text.trim();
  if (trimmed === '') return recipes;
  const made = { id: newId(), text: trimmed };
  return recipes.map((recipe) =>
    recipe.id === recipeId
      ? { ...recipe, [group]: [...linesOf(recipe, group), made] }
      : recipe,
  );
}

/** One more thing it takes. The amount is part of the line, never a field. */
export function addIngredient(recipes, recipeId, text) {
  return addLine(recipes, recipeId, 'ingredients', text);
}

/** One more thing to do, at the end of the method. */
export function addStep(recipes, recipeId, text) {
  return addLine(recipes, recipeId, 'steps', text);
}

/**
 * `recipes` with one more word to find a recipe by, or `recipes` unchanged
 * when there is nothing to add and when it is already there.
 *
 * A tag carries no id, unlike an ingredient. Two lines reading "3 apples" on
 * one recipe are two ingredients; two tags reading "apple" are one tag, and
 * that sameness is exactly what filtering by one relies on.
 */
export function addTag(recipes, recipeId, text) {
  const tag = normalizeTag(text);
  if (tag === '') return recipes;
  return recipes.map((recipe) =>
    recipe.id === recipeId && !tagsOf(recipe).includes(tag)
      ? { ...recipe, tags: [...tagsOf(recipe), tag] }
      : recipe,
  );
}

/** `recipes` with one word taken off. Addressed by the word, which is its identity. */
export function removeTag(recipes, recipeId, text) {
  const tag = normalizeTag(text);
  return recipes.map((recipe) =>
    recipe.id === recipeId
      ? { ...recipe, tags: tagsOf(recipe).filter((each) => each !== tag) }
      : recipe,
  );
}

/**
 * `recipes` without whatever carries `id` — a whole recipe, one ingredient, or
 * one step. Rows are addressed by id, never by index.
 *
 * Deleting a recipe takes its ingredients and its method with it, because they
 * are inside it: the recipe is the unit, and an orphaned step is not a state
 * worth having.
 */
export function removeFrom(recipes, id) {
  return recipes
    .filter((recipe) => recipe.id !== id)
    .map((recipe) => ({
      ...recipe,
      ingredients: linesOf(recipe, 'ingredients').filter((line) => line.id !== id),
      steps: linesOf(recipe, 'steps').filter((line) => line.id !== id),
    }));
}
