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
  return [{ id: newId(), name: trimmed, ingredients: [], steps: [] }, ...recipes];
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
 * `recipes` with one line moved to sit immediately before or after another, in
 * its own group, or `recipes` unchanged when the move is not a move.
 *
 * A person moves a line; the app never does. That is not a contradiction of
 * "nothing rearranges itself" — that promise is about the app reordering things
 * under somebody's eye, and this is the opposite. See
 * specs/features/recipes/spec.md.
 *
 * Only within one group: an ingredient cannot become a step. What a recipe
 * takes and what you do with it are two different lists that happen to sit near
 * each other, so a line whose target is in the other group does not move.
 *
 * Unchanged is returned as the identical array where nothing happens, so a
 * no-op move writes nothing and repaints nothing.
 */
export function moveLine(recipes, recipeId, group, lineId, targetId, before) {
  if (lineId === targetId) return recipes;

  return recipes.map((recipe) => {
    if (recipe.id !== recipeId) return recipe;

    const lines = linesOf(recipe, group);
    const from = lines.findIndex((line) => line.id === lineId);
    const onto = lines.findIndex((line) => line.id === targetId);
    if (from === -1 || onto === -1) return recipe;

    const without = lines.filter((line) => line.id !== lineId);
    const at = without.findIndex((line) => line.id === targetId) + (before ? 0 : 1);
    const moved = [...without.slice(0, at), lines[from], ...without.slice(at)];

    // A line dropped where it already was is not a change.
    if (moved.every((line, index) => line.id === lines[index].id)) return recipe;
    return { ...recipe, [group]: moved };
  });
}

/**
 * The line one place up or down from `lineId` in its group, or `null` at the
 * ends. What the arrow keys move against, and what makes the ends hold.
 */
export function neighbourOf(recipes, recipeId, group, lineId, step) {
  const recipe = recipes.find((each) => each.id === recipeId);
  if (!recipe) return null;
  const lines = linesOf(recipe, group);
  const at = lines.findIndex((line) => line.id === lineId);
  if (at === -1) return null;
  return lines[at + step] ?? null;
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
