// Asking the browser's own model to draft a recipe.
//
// One use: given a recipe's name and whatever is already written down, propose
// the ingredients it takes and the method for making it. Nothing here writes
// anything — a draft is a proposal until somebody accepts it, a line at a time.
// See specs/features/suggesting/spec.md.
//
// Pure apart from `createModel`, which is the one function that touches a
// global and takes the scope holding it as an argument, so a test can pass a
// fake one. The app never reaches for `LanguageModel` itself.

const LINES = { type: 'array', items: { type: 'string' } };

/**
 * What the model is asked to answer with: two lists of lines, never prose.
 *
 * A JSON Schema rather than a hopeful sentence in the prompt. It is the
 * difference between a recipe and a paragraph about cooking, and it is why an
 * unusable answer is an error path rather than the common case.
 */
const DRAFT = {
  type: 'object',
  properties: { ingredients: LINES, steps: LINES },
  required: ['ingredients', 'steps'],
};

/**
 * What every session here is: text in, text out, one language.
 *
 * Declared rather than left to be guessed. Chrome warns without it — "an output
 * language should be specified to ensure optimal output quality and properly
 * attest to output safety" — and an undeclared pairing can be refused outright.
 *
 * The same object is what `availability()` is asked about, which is the part
 * that matters: asking whether *some* session could be made and then making a
 * different one is how "available" turns into a failure on the first press.
 */
const SHAPE = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

const DRAFTING = [
  'You write down recipes somebody already knows how to cook.',
  'Given a recipe name, answer with the ingredients it takes and the steps to make it.',
  'One ingredient per line, written the way it is said out loud, with the amount in the line.',
  'One step per line, in order, in plain sentences.',
  'No headings, no numbering, no commentary.',
].join(' ');

/** A recipe as the model reads it: its name, and anything already written down. */
function asPrompt(recipe) {
  const lines = [`Recipe: ${recipe.name}`];
  const has = (group) => (recipe[group] ?? []).map((line) => line.text);
  if (has('ingredients').length > 0) {
    lines.push('It already takes:', ...has('ingredients').map((text) => `- ${text}`));
  }
  if (has('steps').length > 0) {
    lines.push('The method so far:', ...has('steps').map((text) => `- ${text}`));
  }
  return lines.join('\n');
}

/** An answer, read as two lists of lines. Anything else is no answer. */
function parse(answer) {
  try {
    const found = JSON.parse(answer);
    if (typeof found !== 'object' || found === null) return { ingredients: [], steps: [] };
    return {
      ingredients: Array.isArray(found.ingredients) ? found.ingredients : [],
      steps: Array.isArray(found.steps) ? found.steps : [],
    };
  } catch {
    return { ingredients: [], steps: [] };
  }
}

/**
 * A handle on the browser's model, or `null` where there is not one — which is
 * most browsers, and is why the app takes this as an argument and draws nothing
 * at all when it is null.
 */
export function createModel(scope) {
  const api = scope?.LanguageModel;
  if (!api) return null;

  return {
    availability: () => api.availability(SHAPE),

    /**
     * Fetch the model, reporting how far along it is.
     *
     * The only way to watch a download: progress is reported to the `monitor`
     * handed to `create()`, so there is no observing one you did not start.
     * The session it opens is thrown away — what is wanted is the model on the
     * machine, not this particular conversation.
     *
     * `create()` also needs a recent press when a download is involved, which
     * is why nothing calls this without one.
     */
    prepare: async (onProgress) => {
      const session = await api.create({
        ...SHAPE,
        monitor(m) {
          m.addEventListener('downloadprogress', (event) => onProgress(event.loaded));
        },
      });
      session.destroy();
    },

    draft: async (recipe) => {
      const session = await api.create({
        ...SHAPE,
        initialPrompts: [{ role: 'system', content: DRAFTING }],
      });
      try {
        return parse(await session.prompt(asPrompt(recipe), { responseConstraint: DRAFT }));
      } finally {
        // Nothing here is a conversation, so the session is opened and closed
        // around the one question.
        session.destroy();
      }
    },
  };
}

/** One proposed line, as it would be stored: trimmed, and a string or nothing. */
const clean = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * What is left of one group of a draft once it is worth showing: trimmed,
 * non-empty, deduplicated, and without anything the recipe already holds.
 *
 * Proposing a line back to somebody who already typed it reads as the model not
 * having looked, and accepting it would put the same line on twice.
 */
function usableGroup(proposed, already) {
  const lines = [];
  for (const value of proposed) {
    const text = clean(value);
    if (text !== '' && !already.includes(text) && !lines.includes(text)) lines.push(text);
  }
  return lines;
}

/**
 * A whole draft, filtered against the recipe as it stands.
 *
 * Returns both groups. Empty in both is not a draft — it is a model that
 * answered with nothing usable, which the app reports rather than showing an
 * empty panel.
 */
export function usableDraft(proposed, recipe) {
  const textOf = (group) => (recipe[group] ?? []).map((line) => line.text);
  return {
    ingredients: usableGroup(proposed.ingredients, textOf('ingredients')),
    steps: usableGroup(proposed.steps, textOf('steps')),
  };
}

/** Whether a filtered draft has anything in it at all. */
export const isEmptyDraft = (draft) =>
  draft.ingredients.length === 0 && draft.steps.length === 0;
