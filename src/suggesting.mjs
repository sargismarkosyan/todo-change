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

/**
 * A line and the place it should take.
 *
 * The place is an index rather than a quotation of the line it follows: naming
 * the line would mean asking the model to quote text back exactly, and one
 * wrong character puts the proposal nowhere at all. An index cannot be
 * misspelt, and one that points past the end lands last — which matters,
 * because a recipe can be typed into while the model is still writing.
 */
const LINES = {
  type: 'array',
  items: {
    type: 'object',
    properties: { text: { type: 'string' }, index: { type: 'integer', minimum: 0 } },
    required: ['text', 'index'],
  },
};

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

/**
 * What the model is asked to do.
 *
 * **Asked for what is missing, not for the recipe.** The first version of this
 * asked for the whole thing and then forbade repeats — produce everything, then
 * suppress most of it — and a part-written recipe answered that reliably with
 * nothing at all. Completing something is a task a small model can do; writing
 * a whole recipe and then subtracting is not.
 *
 * **The position is not part of the line.** Saying only "give each line an
 * index" got the number written into the text as well, so a method came out
 * reading "1 Preheat the oven", "10 Serve immediately". The text is what goes
 * on the card; the position is a field beside it, and the prompt now says so.
 */
const DRAFTING = [
  'You help somebody finish writing a recipe down.',
  'You are given the recipe name and whatever has been written so far,',
  'each line shown with the position it sits at in square brackets.',
  'Answer with the lines that are missing, and only those.',
  'Never repeat a line that is already there, and never move one.',
  'A part-written recipe is usually missing several lines: add what a cook',
  'would still need in order to make it.',
  'Give each line the position it should take, counting the lines already in',
  'that list: 0 puts it first, and the number of lines already there puts it last.',
  'The position is separate from the text — never write a number, a bullet or',
  '"Step 3" into the text itself.',
  'One ingredient per line, the amount in the line, written the way it is said',
  'out loud. One step per line, in plain sentences. No headings, no commentary.',
].join(' ');

/**
 * A recipe as the model reads it: its name, and what is written so far with the
 * position of each line.
 *
 * Positions are bracketed so they cannot be mistaken for part of the line —
 * "[0] 1 Preheat the oven" is legible where "0: 1 Preheat the oven" is two
 * numbering systems fighting. Both groups are always named, empty or not, so
 * that a missing one reads as "nothing here yet" rather than as an omission.
 */
function asPrompt(recipe) {
  const lines = [`Recipe: ${recipe.name}`];
  const say = (heading, group) => {
    const held = recipe[group] ?? [];
    if (held.length === 0) {
      lines.push(`${heading}: nothing written down yet.`);
      return;
    }
    lines.push(`${heading}:`);
    lines.push(...held.map((line, at) => `[${at}] ${line.text}`));
  };
  say('Ingredients so far', 'ingredients');
  say('Method so far', 'steps');
  return lines.join('\n');
}

/** An answer, read as two lists of placed lines. Anything else is no answer. */
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
 * The place a proposal asked for, clamped into the list it is joining.
 *
 * Anything that is not a whole number — missing, a word, a fraction, negative —
 * lands last rather than nowhere. A place that is not there is not a reason to
 * throw a line away.
 */
function placeOf(value, length) {
  // A negative is no more a real place than a word is, so it lands last with
  // the rest of the nonsense rather than being clamped to the front.
  const at = Number.isInteger(value) && value >= 0 ? value : length;
  return Math.min(at, length);
}

/**
 * A group as it would read with the draft in it: the lines that are there and
 * the ones being proposed, in one order.
 *
 * Each entry is either `{ kind: 'line', id }` — a line the recipe already holds
 * — or `{ kind: 'proposal', id, text }`, which is on screen and nowhere else.
 * The list *is* the view: what is drawn, what the numbers count, and what
 * accepting reads a position out of.
 *
 * Indices are read against the group as it stands right now, all of them, so
 * proposals landing at the same place keep the order they were drafted in.
 * After this they are positions in a list rather than indices, and editing the
 * recipe moves them the way it moves anything else.
 */
function mergeGroup(lines, proposed, newId) {
  const already = lines.map((line) => line.text.toLowerCase());
  const taken = [];

  const wanted = [];
  for (const entry of proposed) {
    const text = clean(entry?.text);
    const key = text.toLowerCase();
    // A line the recipe already holds is not proposed back to it, and the model
    // repeating itself is one proposal, not two.
    if (text === '' || already.includes(key) || taken.includes(key)) continue;
    taken.push(key);
    wanted.push({ at: placeOf(entry?.index, lines.length), text });
  }

  const merged = [];
  const emitAt = (at) => {
    for (const { at: place, text } of wanted) {
      if (place === at) merged.push({ kind: 'proposal', id: newId(), text });
    }
  };
  lines.forEach((line, at) => {
    emitAt(at);
    merged.push({ kind: 'line', id: line.id });
  });
  emitAt(lines.length);
  return merged;
}

/**
 * A whole draft, merged into the recipe as it stands.
 *
 * Both groups come back as the list they would read as. Nothing is stored — a
 * proposal is on screen and nowhere else, which is the guarantee this version
 * has to be most careful about, now that proposals sit *inside* the list rather
 * than beside it.
 */
export function usableDraft(proposed, recipe, newId) {
  return {
    ingredients: mergeGroup(recipe.ingredients ?? [], proposed.ingredients, newId),
    steps: mergeGroup(recipe.steps ?? [], proposed.steps, newId),
  };
}

/** Whether a merged draft is proposing anything at all. */
export const isEmptyDraft = (draft) =>
  !['ingredients', 'steps'].some((group) =>
    draft[group].some((entry) => entry.kind === 'proposal'),
  );
