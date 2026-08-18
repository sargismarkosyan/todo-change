// Asking the browser's own model for words.
//
// Two uses, both optional and both about not typing something already on
// screen: proposing tags for a recipe, and relating a typed word to the tags
// already in use. Neither is the feature — tags are — and most browsers have no
// model at all, so everything here is written to come back empty rather than to
// fail. See specs/features/suggesting/spec.md.
//
// Pure apart from `createModel`, which is the one function that touches a
// global, and takes the scope holding it as an argument so a test can pass a
// fake one. The app never reaches for `LanguageModel` itself.

import { normalizeTag } from './recipes.mjs';

/**
 * What the model is asked to answer with. A JSON Schema rather than a hopeful
 * sentence in the prompt: it is the difference between a list of words and a
 * paragraph about cooking, and it is why an unusable answer is rare enough to
 * be an error path rather than the common case.
 */
const WORDS = { type: 'array', items: { type: 'string' } };

/** The same, held to words that are already somebody's tags. */
const oneOf = (tags) => ({ type: 'array', items: { type: 'string', enum: tags } });

const SUGGESTING = [
  'You tag recipes by what they are made of.',
  'Answer with single lower-case words, at most six, and nothing else.',
  'No amounts, no cooking methods, no punctuation.',
].join(' ');

const RELATING = [
  'You match a word to the tags that mean the same food.',
  'Answer only with tags from the list you are given, and nothing else.',
  'If none of them mean the same food, answer with an empty list.',
].join(' ');

/** A recipe as the model reads it: its name and what it takes, never its method. */
function asPrompt(recipe) {
  const lines = (recipe.ingredients ?? []).map((line) => line.text);
  return [`Recipe: ${recipe.name}`, ...lines.map((text) => `- ${text}`)].join('\n');
}

/** An answer, read as words. Anything that is not a list of them is no answer. */
function words(answer) {
  try {
    const parsed = JSON.parse(answer);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * A handle on the browser's model, or `null` where there is not one — which is
 * most browsers, and is why the app takes this as an argument and draws nothing
 * at all when it is null.
 */
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

export function createModel(scope) {
  const api = scope?.LanguageModel;
  if (!api) return null;

  const ask = async (system, prompt, responseConstraint) => {
    const session = await api.create({
      ...SHAPE,
      initialPrompts: [{ role: 'system', content: system }],
    });
    try {
      return words(await session.prompt(prompt, { responseConstraint }));
    } finally {
      // A session holds a slice of a context window. Nothing here is a
      // conversation, so it is opened and closed around the one question.
      session.destroy();
    }
  };

  return {
    availability: () => api.availability(SHAPE),
    suggestTags: (recipe) => ask(SUGGESTING, asPrompt(recipe), WORDS),
    relate: (term, tags) =>
      ask(RELATING, `Word: ${term}\nTags: ${tags.join(', ')}`, oneOf(tags)),
  };
}

/**
 * What is left of a proposal once it is worth showing: normalised, deduplicated,
 * and without anything the recipe already carries.
 *
 * Offering a word that is already there reads as the model not having looked,
 * and accepting it would do nothing — see `addTag`.
 */
export function usableSuggestions(proposed, already) {
  const words = [];
  for (const word of proposed) {
    const tag = normalizeTag(word);
    if (tag !== '' && !already.includes(tag) && !words.includes(tag)) words.push(tag);
  }
  return words;
}

/**
 * What is left of a related-word proposal: only tags that actually exist, and
 * only ones the letters did not already offer.
 *
 * The model can point at one of your words. It cannot mint one — a door onto
 * nothing is worse than no door, and this is where that is enforced rather than
 * hoped for. The schema asks for the same thing; this is what happens when the
 * answer ignores it.
 */
export function usableRelated(proposed, inUse, alreadyOffered) {
  const words = [];
  for (const word of proposed) {
    const tag = normalizeTag(word);
    if (
      tag !== '' &&
      inUse.includes(tag) &&
      !alreadyOffered.includes(tag) &&
      !words.includes(tag)
    ) {
      words.push(tag);
    }
  }
  return words;
}
