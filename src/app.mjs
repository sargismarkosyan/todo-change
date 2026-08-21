// The DOM layer: rendering and events, and nothing else.
//
// Everything it needs to decide anything lives in recipes.mjs, books.mjs and
// storage.mjs, none of which knows a document exists. Keeping this layer thin is
// what makes the rest directly testable. See specs/setup/constraints.md.
//
// Since 0016 the drawing is Vue's. What that changed is only *who* rebuilds the
// page from state — the shape was already this: one description of the whole
// screen, rebuilt whenever the state under it moves. What it bought is a keyed
// diff, so a repaint no longer throws away the box somebody is typing into.

import {
  addIngredient,
  addRecipe,
  addStep,
  linesOf,
  makeLine,
  newId,
  removeFrom,
  setGroup,
  toggleFavourite,
} from './recipes.mjs';
import { findRecipes } from './finding.mjs';
import { HOME, addressOf, dayOf, favouritesIn, picksForDay, routeOf } from './home.mjs';
import {
  BOOK_COLOURS,
  DEFAULT_COLOUR,
  addBook,
  colourBook,
  colourOf,
  openBook,
  openRecipes,
  removeBook,
  renameBook,
  setSuggestions,
  switchTo,
  withOpenRecipes,
} from './books.mjs';
import { isEmptyDraft, usableDraft } from './suggesting.mjs';
import { readStore, writeStore } from './storage.mjs';
// The two libraries this app ships. Vendored, not installed — see
// vendor/vue/README.md, vendor/sortable/README.md and
// specs/setup/constraints.md.
import {
  createApp,
  h,
  nextTick,
  ref,
  shallowRef,
  watchEffect,
  withDirectives,
} from '../vendor/vue/vue.runtime.esm-browser.prod.js';
import Sortable from '../vendor/sortable/sortable.core.esm.js';

/** The two groups inside a recipe, in the order they are read. */
const GROUPS = [
  { key: 'ingredients', block: 'ingredient', heading: 'Ingredients', placeholder: 'What does it take?' },
  { key: 'steps', block: 'step', heading: 'Method', placeholder: 'And then?' },
];

const ADD_LINE = { ingredients: addIngredient, steps: addStep };

/**
 * The two things the message under the contents can say. They are one element
 * apart and one is much worse to misread: a person told "No recipes in this
 * book yet." during a search thinks the book emptied itself.
 */
const NO_RECIPES = 'No recipes in this book yet.';
const NO_MATCHES = 'No recipe matches that.';

/**
 * The third thing that element can say, and the only one about the app rather
 * than about a book: the front door of a shelf with nothing on it. Whoever
 * reads this has never written a recipe down, so it must not talk about "this
 * book" — they have not chosen one.
 */
const NOTHING_YET = 'Nothing written down yet.';

/**
 * What the line in the masthead can say. It answers one question — *would
 * waiting change this?* — and says nothing at all when the answer is no,
 * because there is no model or because the AI is off.
 */
const AI_DOWNLOADING = 'Downloading AI';
const AI_READY = 'AI ready';
const AI_UNAVAILABLE = 'AI unavailable';

/** The two ways a draft comes to nothing. Neither changes the recipe. */
const NOTHING_DRAFTED = 'Nothing drafted.';
const DRAFT_FAILED = 'The draft could not be written.';

/**
 * Running the model is the second slow thing, and the one that happens every
 * time — inference takes seconds even on a model already on the machine. The
 * message says what is happening *and* that nothing is blocked, because a
 * person who does not know that will sit and wait.
 */
const DRAFTING_NOW = 'Writing a draft. Nothing else has to wait.';

/** The star, drawn once. Filled or not by a class, never by a second shape. */
const STAR_PATH =
  'M8 1.8 9.62 6.18 14.28 6.36 10.62 9.25 11.88 13.74 8 11.15 ' +
  '4.12 13.74 5.38 9.25 1.72 6.36 6.38 6.18Z';

/** The six dots of a grip. */
const GRIP_DOTS = [[3, 4], [7, 4], [3, 8], [7, 8], [3, 12], [7, 12]];

/**
 * Wire the markup in `doc` to the books in `storage`, and render what is there.
 *
 * Both are arguments rather than globals reached for, so a test can mount a
 * fresh document against a fresh store without either leaking into the next one.
 *
 * Returns `settled`, which resolves once the page has caught up with the state.
 * Vue coalesces a repaint onto a microtask where this layer used to redraw on
 * the spot, so anything reading the page straight after changing it — a test,
 * and nothing else — has to wait for that. Callers who only ever look at the
 * screen with their eyes can ignore it.
 */
export function mountApp(doc, storage, model = null, now = () => new Date()) {
  const appEl = doc.querySelector('.app');
  const view = () => doc.defaultView;

  // ---- what the page is drawn from ----------------------------------------
  //
  // All of it reactive, and all of it either the store or something about where
  // the reader is looking. Which of the two a thing is decides whether it is
  // written down, and that split is unchanged from every version before this.

  // The books. Replaced wholesale rather than edited in place — every change
  // comes back from books.mjs or recipes.mjs as a new store — so a shallow ref
  // is the whole of the reactivity it needs.
  const store = shallowRef(readStore(storage));

  // The address, read back rather than kept: Back, Forward and anybody typing
  // in the bar all change it without asking this app first. It is a ref so the
  // page is drawn from it; `syncFromAddress` is what puts the two in step.
  // See specs/features/home/spec.md.
  const hash = ref(view().location.hash);

  // Which recipe is being read, if any. One at a time, so that there is always
  // a contents page to read down — see specs/features/recipes/spec.md. It is
  // not stored: it is where the reader is looking, not something they own.
  const readingId = ref(null);

  // What is being looked for, across every book. Screen state as well, and the
  // reason nothing about searching touches storage: a search is a way of
  // looking, not something anyone owns. See specs/features/finding/spec.md.
  const finding = ref('');

  const searching = () => finding.value.trim() !== '';

  // What the browser can do, once it has said, and whether it has been told to.
  // Two different things: a machine that could run a model is not the same as
  // one that has been asked. See specs/features/suggesting/spec.md.
  const modelState = ref('unavailable');
  const couldRunAi = () => model !== null && modelState.value !== 'unavailable';
  const aiIsOn = () => couldRunAi() && store.value.suggestions === 'on';

  // Where a fetch has got to. Screen state: the model belongs to the browser,
  // so none of this is worth writing down.
  const aiStatus = ref(null);
  const progress = ref(null);

  // The settings popover, in the colophon at the foot of the page.
  const aiMenu = ref(false);

  // What the model proposed for one recipe, and the one line under the control.
  // **Not one word of a draft is stored** — it is on screen and nowhere else,
  // exactly like which recipe is open.
  const drafted = shallowRef(null);
  const note = ref(null);

  // Which recipe the model is currently writing for, if any. Screen state, and
  // the reason the control cannot be pressed twice: a second press would be a
  // second session and a second answer nobody asked for.
  const thinking = ref(null);

  // The book menu: shut, listing the books, taking a new name, or asking about
  // a delete. Screen state too — none of it is worth storing.
  const menu = ref({ open: false, mode: 'list' });

  const shutMenu = () => {
    menu.value = { open: false, mode: 'list' };
  };

  // ---- where we are --------------------------------------------------------

  const route = () => routeOf(hash.value, store.value.books);
  const atHome = () => route().at === 'home';

  /**
   * Read the address back, and put the open book in step with it.
   *
   * A route change is not an action — it says where the reader is looking, the
   * same as which recipe is open — so it moves `openId` in memory and leaves the
   * write to the next real change. Opening the app would otherwise write to
   * storage before anybody had done anything, which nothing in here has ever
   * done. See specs/features/storage/spec.md.
   */
  const syncFromAddress = () => {
    hash.value = view().location.hash;
    const { at, id } = route();
    if (at === 'book' && id !== store.value.openId) store.value = switchTo(store.value, id);
  };

  /** Go somewhere, and draw what is there. */
  const goTo = (address) => {
    view().location.hash = address;
    syncFromAddress();
  };

  /**
   * Go into a book: the address changes, and the stored open book keeps up.
   *
   * The write is the one that switching books has always done. What is new is
   * only that the address goes with it, so a reload lands here again.
   */
  const goToBook = (id) => {
    store.value = switchTo(store.value, id);
    writeStore(storage, store.value);
    goTo(addressOf(id));
  };

  // Everything that follows a search ends it: the contents has to come back, or
  // it is covered by results while the book underneath changes. The box is
  // cleared by hand because it is the reader's own text and not drawn from
  // state — the same as the box a recipe name is typed into.
  const stopFinding = () => {
    finding.value = '';
    const findEl = doc.getElementById('find-recipe');
    if (findEl !== null) findEl.value = '';
  };

  // The contents on screen is the open book's, and never anything else's.
  const recipes = () => openRecipes(store.value);
  const recipeById = (id) => recipes().find((recipe) => recipe.id === id);

  // Every mutation goes through here: store first, then paint. Anything on
  // screen has been written, which is the whole promise of the app.
  const commit = (next) => {
    const moved = next.openId !== store.value.openId;
    store.value = next;
    writeStore(storage, store.value);
    // The address always names the book on screen, so an action that moves the
    // open book takes the address with it: making a book opens it, and deleting
    // one opens its neighbour. Without this the next read of the address would
    // undo the move.
    if (moved) goTo(addressOf(store.value.openId));
  };

  /** The same, for a change to the contents of the open book. */
  const commitRecipes = (next) => commit(withOpenRecipes(store.value, next));

  /**
   * Put the focus back on a grip once the page has caught up.
   *
   * The keyed diff keeps the box somebody is typing into, which is what
   * `typingIn` used to put back by hand — but it cannot keep focus on an element
   * it *moves*, and moving one is the whole of what this restores. A browser
   * blurs a node that is taken out of the document and put back somewhere else,
   * and that is what reordering a line is. The node itself is the same one, so
   * this finds it and asks for it again.
   */
  const refocusHandle = (id) => {
    nextTick(() => doc.querySelector(`[data-handle="${id}"]`)?.focus());
  };

  // ---- an open recipe ------------------------------------------------------
  //
  // Ingredients, then the method. That order is not decoration: the ingredients
  // answer "can I make this tonight", which is the question asked at the
  // contents, and the method answers "what do I do now".

  // ---- one list, lines and proposals together ------------------------------
  //
  // A group on screen is a single ordered list: the lines the recipe holds and
  // the ones being proposed, in one run of numbers. The list *is* the view —
  // what is drawn, what the numbers count, and what accepting reads a position
  // out of. See specs/features/suggesting/placing-a-draft.feature.

  const isDrafting = (recipe) => drafted.value !== null && drafted.value.recipeId === recipe.id;

  /**
   * The entries of one group, reconciled against what is actually stored.
   *
   * A line typed by hand while a draft is on screen is not in the draft's list,
   * so it joins at the bottom — which is where typing lands anyway. A line
   * deleted while a draft is up drops out.
   */
  function entriesOf(recipe, spec) {
    const lines = linesOf(recipe, spec.key);
    if (!isDrafting(recipe)) return lines.map((line) => ({ kind: 'line', id: line.id }));

    const held = new Set(lines.map((line) => line.id));
    const kept = drafted.value[spec.key].filter(
      (entry) => entry.kind === 'proposal' || held.has(entry.id),
    );
    const mentioned = new Set(kept.filter((entry) => entry.kind === 'line').map((e) => e.id));
    const missing = lines
      .filter((line) => !mentioned.has(line.id))
      .map((line) => ({ kind: 'line', id: line.id }));
    return [...kept, ...missing];
  }

  /** The stored group implied by a list of entries, in the order they sit. */
  const linesFrom = (entries, lines) => {
    const byId = new Map(lines.map((line) => [line.id, line]));
    return entries
      .filter((entry) => entry.kind === 'line')
      .map((entry) => byId.get(entry.id))
      .filter((line) => line !== undefined);
  };

  /** Put `entries` back on the draft, when one is on screen for this recipe. */
  const withEntries = (recipe, spec, entries) => {
    if (isDrafting(recipe)) drafted.value = { ...drafted.value, [spec.key]: entries };
  };

  /**
   * Take some proposals into the recipe, each where it sits.
   *
   * One path for taking one and for taking the lot: a proposal becomes a line
   * in place, and the group is rewritten in the order the view already shows.
   */
  function accept(recipe, spec, wanted) {
    const lines = linesOf(recipe, spec.key);
    const byId = new Map(lines.map((line) => [line.id, line]));
    const next = [];
    const entries = [];

    for (const entry of entriesOf(recipe, spec)) {
      if (entry.kind === 'line') {
        const line = byId.get(entry.id);
        if (line) {
          next.push(line);
          entries.push(entry);
        }
        continue;
      }
      if (!wanted.has(entry)) {
        entries.push(entry);
        continue;
      }
      const made = makeLine(entry.text);
      next.push(made);
      entries.push({ kind: 'line', id: made.id });
    }

    withEntries(recipe, spec, entries);
    return setGroup(recipes(), recipe.id, spec.key, next);
  }

  /**
   * Put a group into a new order.
   *
   * The one place an order changes, whichever hand did it. Storage takes the
   * line order out of the new view, so moving a proposal writes nothing at all:
   * no line changed places.
   */
  const reorder = (recipe, spec, next, focus) => {
    withEntries(recipe, spec, next);
    commitRecipes(
      setGroup(recipes(), recipe.id, spec.key, linesFrom(next, linesOf(recipe, spec.key))),
    );
    // After the commit, never before it: this waits for the repaint the commit
    // causes, and asking to wait while nothing is pending returns on the spot —
    // which would put the focus back before the move that took it away.
    refocusHandle(focus);
  };

  /**
   * Move one entry to sit at a position, which is what a dropped row gives.
   *
   * The recipe is looked up by id rather than handed in: SortableJS is attached
   * once per list now and outlives the recipe object its options were built
   * from, so anything it calls back into has to read the current one.
   */
  const moveTo = (recipeId, specKey, from, to) => {
    const recipe = recipeById(recipeId);
    if (!recipe) return;
    const spec = GROUPS.find((each) => each.key === specKey);
    const entries = entriesOf(recipe, spec);
    const moved = entries[from];
    if (!moved || from === to) return;
    const rest = entries.filter((entry, at) => at !== from);
    reorder(recipe, spec, [...rest.slice(0, to), moved, ...rest.slice(to)], moved.id);
  };

  /** Whether the machine has asked for less movement. */
  const quiet = () =>
    doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  /**
   * Hand one list on screen to SortableJS, and take back what it did.
   *
   * Attached when the list appears and destroyed when it goes, rather than
   * remade on every repaint: the diff keeps the rows now, so the elements an
   * instance is watching are still the ones in the document.
   *
   * **It puts the DOM back before the app repaints.** The library moves the row
   * itself, and the diff patches against the tree it last drew — so a dropped
   * row is returned to where it was picked up from, and the order it was
   * dropped into arrives the way every other change does: out of the state.
   *
   * Be honest about what that is worth here. With one row moved and no second
   * list to drop into, the diff reaches the right answer either way: the other
   * rows keep their order, so they are the run it holds still, and the dropped
   * row is the one it re-anchors. This is insurance against that reasoning —
   * which rests on how the diff picks what to move, and that is not a promise
   * anybody made us — and against a second row ever moving at once. The suite
   * covers the drop; it does not prove these four lines are load-bearing.
   *
   * A group name of its own per recipe and per group is what keeps an
   * ingredient out of the method: there is no other list to drop into.
   */
  const sortableLines = {
    mounted(el, binding) {
      const { recipeId, key } = binding.value;
      el.__sortable = Sortable.create(el, {
        // The grip and nothing else. The words belong to a click.
        handle: '.line-handle',
        group: `${recipeId}:${key}`,
        animation: quiet() ? 0 : 150,
        ghostClass: 'line--landing',
        chosenClass: 'line--held',
        fallbackClass: 'line--moving',
        // Sortable's own pointer dragging rather than the browser's native
        // drag-and-drop. Native never starts here: the grip is a <button>, and
        // a browser will not begin a drag from a control that handles its own
        // press. It also puts the moving row back under our styling instead of
        // the browser's translucent snapshot — see specs/features/look/spec.md.
        forceFallback: true,
        // A press is a press until it has travelled. Without this a slow click
        // on the grip reads as a tiny drag.
        fallbackTolerance: 4,
        onEnd: (event) => {
          const { item, from, oldIndex, newIndex } = event;
          if (oldIndex !== newIndex) {
            item.remove();
            from.insertBefore(item, from.children[oldIndex] ?? null);
          }
          moveTo(recipeId, key, oldIndex, newIndex);
        },
      });
    },
    unmounted(el) {
      el.__sortable?.destroy();
      delete el.__sortable;
    },
  };

  /**
   * What a line is taken hold of by. One control, two ways to use it: dragged
   * with a pointer, or focused and moved with the arrow keys. Arrows sitting
   * beside a drag handle would be two controls doing one job.
   */
  function handle(recipe, spec, id, label) {
    return h(
      'button',
      {
        type: 'button',
        class: 'line-handle',
        'data-handle': id,
        'aria-label': `Move ${label}`,
        onKeydown: (event) => {
          const step = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
          if (step === 0) return;
          event.preventDefault();
          const entries = entriesOf(recipe, spec);
          const from = entries.findIndex((entry) => entry.id === id);
          // The ends hold: nothing above the first, nothing below the last.
          if (entries[from + step] === undefined) return;
          moveTo(recipe.id, spec.key, from, from + step);
        },
      },
      h(
        'svg',
        { viewBox: '0 0 10 16', 'aria-hidden': 'true', focusable: 'false', fill: 'currentColor' },
        GRIP_DOTS.map(([cx, cy]) =>
          h('circle', { key: `${cx}-${cy}`, cx: String(cx), cy: String(cy), r: '1.1' }),
        ),
      ),
    );
  }

  function deleteButton(block, id, label) {
    return h(
      'button',
      {
        type: 'button',
        class: `${block}__delete`,
        'aria-label': `Delete ${label}`,
        onClick: () => commitRecipes(removeFrom(recipes(), id)),
      },
      '×',
    );
  }

  function lineRow(recipe, spec, line) {
    return h('li', { class: spec.block, 'data-id': line.id, key: line.id }, [
      handle(recipe, spec, line.id, line.text),
      h('span', { class: `${spec.block}__text` }, line.text),
      deleteButton(spec.block, line.id, line.text),
    ]);
  }

  /**
   * One proposed line, sitting in the list where it belongs.
   *
   * Dashed all through, because it is on the page and not in the book — a wrong
   * quantity is not a wrong word, and there is no undo anywhere here. It is
   * moved like any other row and takes its place in the numbering, which is the
   * whole point: the group reads as it would read if the draft were taken.
   */
  function proposalRow(recipe, spec, entry) {
    return h(
      'li',
      { class: `${spec.block} proposal`, 'data-id': entry.id, key: entry.id },
      [
        handle(recipe, spec, entry.id, entry.text),
        h(
          'button',
          {
            type: 'button',
            class: 'proposal__take',
            'aria-label': `Add ${entry.text} to ${recipe.name}`,
            onClick: () => commitRecipes(accept(recipe, spec, new Set([entry]))),
          },
          entry.text,
        ),
      ],
    );
  }

  function lineComposer(recipe, group) {
    const boxId = `${group.block}-box-${recipe.id}`;
    return h(
      'form',
      {
        class: `${group.block}-composer`,
        onSubmit: (event) => {
          event.preventDefault();
          const box = doc.getElementById(boxId);
          const next = ADD_LINE[group.key](recipes(), recipe.id, box.value);
          // The caret stays here on its own now: the diff keeps this box where
          // it is, so six ingredients cost six lines of typing and nothing else.
          box.value = '';
          commitRecipes(next);
        },
      },
      [
        h('input', {
          type: 'text',
          class: `${group.block}-composer__box`,
          id: boxId,
          placeholder: group.placeholder,
          autocomplete: 'off',
          'aria-label': `New ${group.block} for ${recipe.name}`,
        }),
        h('button', { type: 'submit', class: `${group.block}-composer__add` }, 'Add'),
      ],
    );
  }

  function group(recipe, spec) {
    const held = new Map(linesOf(recipe, spec.key).map((line) => [line.id, line]));
    const lines = withDirectives(
      h(
        'ul',
        { class: `recipe__${spec.key}-lines`, key: `${recipe.id}:${spec.key}` },
        entriesOf(recipe, spec).map((entry) =>
          entry.kind === 'line'
            ? lineRow(recipe, spec, held.get(entry.id))
            : proposalRow(recipe, spec, entry),
        ),
      ),
      [[sortableLines, { recipeId: recipe.id, key: spec.key }]],
    );

    return h('div', { class: `recipe__group recipe__${spec.key}` }, [
      h('h2', { class: 'recipe__heading' }, spec.heading),
      lines,
      lineComposer(recipe, spec),
    ]);
  }

  // ---- the draft -----------------------------------------------------------
  //
  // One press proposes the whole card — what it takes and how it is made — and
  // writes down neither. See specs/features/suggesting/spec.md.

  function drafting(recipe) {
    const working = thinking.value === recipe.id;
    const children = [
      h(
        'button',
        {
          type: 'button',
          class: 'drafting__ask',
          disabled: working,
          onClick: () => askForDraft(recipe.id),
        },
        working ? 'Drafting…' : 'Draft this recipe',
      ),
    ];

    if (!working && isDrafting(recipe)) {
      // Taking the lot is the press to be honest about: per-line acceptance is
      // what keeps an unread quantity out of the book, and this is the way
      // round it. A second control, never the default.
      children.push(
        h(
          'button',
          {
            type: 'button',
            class: 'drafting__take-all',
            onClick: () => {
              let next = recipes();
              for (const spec of GROUPS) {
                const wanted = new Set(
                  entriesOf(recipe, spec).filter((entry) => entry.kind === 'proposal'),
                );
                const taken = accept(recipe, spec, wanted).find((each) => each.id === recipe.id);
                // Each group folds onto the last, so the whole draft is one write.
                next = setGroup(next, recipe.id, spec.key, linesOf(taken, spec.key));
              }
              commitRecipes(next);
            },
          },
          'Take all',
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'drafting__dismiss',
            onClick: () => {
              drafted.value = null;
            },
          },
          'No thanks',
        ),
      );
    }

    if (note.value !== null) {
      children.push(h('p', { class: 'drafting__note' }, note.value));
    }

    return h('div', { class: 'drafting' }, children);
  }

  /**
   * Ask the model for a draft, and put what comes back on offer.
   *
   * Nothing on the page waits on it: the page is redrawn before the question is
   * asked, and the recipe stays writable by hand while it is out.
   */
  async function askForDraft(recipeId) {
    // One at a time. The control is disabled while it works, and this is the
    // guard behind that for anything that reaches here another way.
    if (thinking.value !== null) return;

    drafted.value = null;
    note.value = DRAFTING_NOW;
    thinking.value = recipeId;

    let proposed;
    try {
      proposed = await model.draft(recipeById(recipeId));
    } catch {
      thinking.value = null;
      note.value = DRAFT_FAILED;
      return;
    }
    thinking.value = null;

    // Re-read: the recipe may have been typed into, deleted, or the AI switched
    // off entirely while the model was out.
    const current = recipeById(recipeId);
    if (!current || !aiIsOn()) {
      note.value = null;
      return;
    }

    const draft = usableDraft(proposed, current, newId);
    drafted.value = isEmptyDraft(draft) ? null : { recipeId, ...draft };
    note.value = isEmptyDraft(draft) ? NOTHING_DRAFTED : null;
    modelState.value = 'available';
  }

  // ---- the contents --------------------------------------------------------

  /**
   * The star on a row of the contents: marks a recipe as one of the handful
   * actually cooked, and unmarks it.
   *
   * Drawn on every row, starred or not. A mark you cannot see where you made it
   * is a mark that stops being trusted, and reading down the contents is how you
   * see which ones carry it. `aria-pressed` rather than a tick box, because it
   * is a toggle and there is no tick box anywhere in this product.
   */
  function starButton(recipe) {
    const marked = recipe.favourite === true;
    return h(
      'button',
      {
        type: 'button',
        class: marked ? 'recipe__star recipe__star--on' : 'recipe__star',
        'aria-pressed': String(marked),
        'aria-label': `Favourite ${recipe.name}`,
        // Nothing else moves: the contents keeps its order and the recipe stays
        // as open or shut as it was. See specs/features/recipes/favourites.feature.
        onClick: () => commitRecipes(toggleFavourite(recipes(), recipe.id)),
      },
      h('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' }, [
        h('path', { d: STAR_PATH }),
      ]),
    );
  }

  function row(recipe) {
    const reading = recipe.id === readingId.value;
    const children = [
      h('div', { class: 'recipe__row' }, [
        // A button, not a label: opening a recipe is the click this page is for,
        // and there is nothing to tick.
        h(
          'button',
          {
            type: 'button',
            class: 'recipe__name',
            'aria-expanded': String(reading),
            onClick: () => {
              readingId.value = reading ? null : recipe.id;
              // What was drafted was drafted for the recipe being left.
              drafted.value = null;
              note.value = null;
            },
          },
          recipe.name,
        ),
        starButton(recipe),
        deleteButton('recipe', recipe.id, recipe.name),
      ]),
    ];

    if (reading) {
      const body = [];
      // Drawn only where there is a model and it has been turned on. A disabled
      // control advertising an absence is worse than nothing.
      if (aiIsOn()) body.push(drafting(recipe));
      body.push(...GROUPS.map((spec) => group(recipe, spec)));
      children.push(h('div', { class: 'recipe__body' }, body));
    }

    return h(
      'li',
      { class: reading ? 'recipe recipe--open' : 'recipe', 'data-id': recipe.id, key: recipe.id },
      children,
    );
  }

  // ---- the results ---------------------------------------------------------
  //
  // What a search finds, in place of the contents. A result is a way to get
  // somewhere: it names the recipe and the book it is in, and offers nothing
  // else — no delete, nothing to type into. See specs/features/finding/spec.md.

  function resultRow({ recipe, book, line }) {
    const inside = [
      h('span', { class: 'result__name' }, recipe.name),
      // The book is the thing the person searching did not know. Without it,
      // "regardless of which book" has not actually been answered.
      h('span', { class: 'result__book' }, book.name),
    ];

    // Only when the name did not match — otherwise the name already says why
    // this is here, and repeating a line under it is noise.
    if (line !== null) inside.push(h('span', { class: 'result__line' }, line));

    return h('li', { class: 'result', 'data-id': recipe.id, key: `${book.id}:${recipe.id}` }, [
      // The whole result is the target, because all of it is one answer.
      h(
        'button',
        {
          type: 'button',
          class: 'result__open',
          onClick: () => {
            // The whole way: the book it lives in opens, and the recipe opens in
            // it. Anything less leaves a recipe on screen with no book behind
            // it, and the box at the top writes into whichever book is open.
            readingId.value = recipe.id;
            stopFinding();
            goToBook(book.id);
          },
        },
        inside,
      ),
    ]);
  }

  // ---- the book menu -------------------------------------------------------
  //
  // A popover over the one page, not a screen to navigate to: the contents
  // stays where it is behind it, and it shuts on the next click. Switching is
  // the only thing here that happens more than rarely, so it is the only thing
  // that is one click deep. See specs/features/books/spec.md.

  const menuButton = (className, label, onClick, extra = {}) =>
    h('button', { type: 'button', class: className, onClick, ...extra }, label);

  /**
   * The strip of six, under the books and above making, renaming and deleting.
   *
   * The swatches themselves rather than a line of text leading to a picker: this
   * offers a press, not a question, which is what persona.md's rule about
   * popovers now rests on.
   */
  function swatchStrip() {
    const chosen = colourOf(openBook(store.value));
    return h(
      'div',
      { class: 'books__colours' },
      BOOK_COLOURS.map((colour) =>
        menuButton(
          'books__colour',
          null,
          () => commit(colourBook(store.value, store.value.openId, colour)),
          {
            key: colour,
            'data-colour': colour,
            // Named for anything reading the page aloud, and the chosen one is
            // marked by standing proud and ringed as well as by being this
            // colour — a mark made in colour alone is no mark to somebody who
            // cannot see it.
            'aria-label': `Bind this book in ${colour}`,
            'aria-pressed': String(colour === chosen),
          },
        ),
      ),
    );
  }

  function switchRow(book) {
    const extra = {
      // Every book wears its own colour here, which is the one place all of
      // them are seen at once. Beside its name, never instead of it.
      'data-colour': colourOf(book),
    };
    if (book.id === store.value.openId) extra['aria-current'] = 'true';

    return h('li', { key: book.id }, [
      menuButton(
        'books__switch',
        book.name,
        () => {
          shutMenu();
          // Another book is another contents page, read from the top.
          readingId.value = null;
          stopFinding();
          goToBook(book.id);
        },
        extra,
      ),
    ]);
  }

  /** A one-line form, used for both naming a new book and renaming this one. */
  function nameForm({ className, id, label, value, placeholder, action, onSubmit }) {
    return h(
      'form',
      {
        class: className,
        key: className,
        onSubmit: (event) => {
          event.preventDefault();
          const box = doc.getElementById(id);
          const typed = box.value;
          box.value = '';
          onSubmit(typed);
        },
      },
      [
        h('input', {
          type: 'text',
          class: `${className}-box`,
          id,
          value,
          placeholder,
          autocomplete: 'off',
          'aria-label': label,
        }),
        h('button', { type: 'submit', class: `${className}-add` }, action),
      ],
    );
  }

  function newBookForm() {
    return nameForm({
      className: 'books__new',
      id: 'new-book',
      label: 'Name a new book',
      value: '',
      placeholder: 'Name a new book',
      action: 'Add',
      onSubmit: (name) => {
        const next = addBook(store.value, name);
        // Nothing was named, so nothing happened and the menu stays as it is.
        if (next === store.value) return;
        shutMenu();
        readingId.value = null;
        stopFinding();
        commit(next);
      },
    });
  }

  function renameForm() {
    return nameForm({
      className: 'books__rename',
      id: 'rename-book',
      label: 'Rename this book',
      value: openBook(store.value).name,
      placeholder: openBook(store.value).name,
      action: 'Rename',
      onSubmit: (name) => {
        const next = renameBook(store.value, store.value.openId, name);
        shutMenu();
        commit(next);
      },
    });
  }

  /** "3 recipes", "1 recipe" — the number is the whole reason the question exists. */
  const counted = (n) => `${n} ${n === 1 ? 'recipe' : 'recipes'}`;

  function deleteConfirmation() {
    return h('div', { class: 'books__confirm', key: 'confirm' }, [
      h(
        'p',
        { class: 'books__question' },
        `Delete "${openBook(store.value).name}" and its ${counted(recipes().length)}?`,
      ),
      menuButton('books__confirm-yes', 'Delete', () => {
        shutMenu();
        readingId.value = null;
        stopFinding();
        commit(removeBook(store.value, store.value.openId));
      }),
      menuButton('books__confirm-no', 'Keep it', () => {
        menu.value = { open: true, mode: 'list' };
      }),
    ]);
  }

  function menuActions() {
    const children = [
      swatchStrip(),
      newBookForm(),
      menuButton('books__rename-open', 'Rename this book', () => {
        menu.value = { open: true, mode: 'renaming' };
      }),
    ];

    // The last book does not go — there is always somewhere for a recipe to be.
    if (store.value.books.length > 1) {
      children.push(
        menuButton('books__delete', 'Delete this book', () => {
          // Nothing is at stake in an empty one, and asking anyway is the
          // confirmation dialog persona.md complains about.
          if (recipes().length === 0) {
            shutMenu();
            readingId.value = null;
            stopFinding();
            commit(removeBook(store.value, store.value.openId));
            return;
          }
          menu.value = { open: true, mode: 'confirming' };
        }),
      );
    }

    return h('div', { class: 'books__actions', key: 'actions' }, children);
  }

  function bookMenu() {
    const children = [];
    if (menu.value.open) {
      children.push(
        h('ul', { class: 'books__list' }, store.value.books.map(switchRow)),
      );
      // At the front door the menu is the way into a book and nothing more.
      // Making, renaming and deleting are about the book on screen, and at the
      // front door there is not one — see specs/features/home/spec.md.
      if (!atHome()) {
        children.push(
          menu.value.mode === 'confirming'
            ? deleteConfirmation()
            : menu.value.mode === 'renaming'
              ? renameForm()
              : menuActions(),
        );
      }
    }
    return h('div', { class: 'books__menu', id: 'book-menu', hidden: !menu.value.open }, children);
  }

  function books() {
    const open = openBook(store.value);
    return h('div', { class: 'books', id: 'books' }, [
      h(
        'button',
        {
          class: 'books__open',
          id: 'book-open',
          type: 'button',
          'aria-haspopup': 'true',
          // The masthead says which book is open; now that a book has an
          // address, the control that names it carries the id that address is
          // built from.
          'data-book': open.id,
          'aria-label': `Book: ${open.name}`,
          'aria-expanded': String(menu.value.open),
          onClick: () => {
            // Two popovers now, and never both at once.
            aiMenu.value = false;
            menu.value = menu.value.open
              ? { open: false, mode: 'list' }
              : { open: true, mode: 'list' };
          },
        },
        open.name,
      ),
      bookMenu(),
    ]);
  }

  // ---- the AI: where it stands, and whether it is wanted -------------------

  /** The indicator's words, or null when there is nothing worth saying. */
  function statusText() {
    if (!aiIsOn() || aiStatus.value === null) return null;
    if (aiStatus.value === 'ready') return AI_READY;
    if (aiStatus.value === 'unavailable') return AI_UNAVAILABLE;
    return progress.value === null
      ? AI_DOWNLOADING
      : `${AI_DOWNLOADING} ${Math.round(progress.value * 100)}%`;
  }

  /**
   * Fetch the model, reporting how far along it is.
   *
   * Only ever from a press — `create()` needs recent user activation when a
   * download is involved, which is why the offer is the mechanism rather than
   * the manners.
   */
  async function fetchAi() {
    if (modelState.value === 'available') {
      aiStatus.value = 'ready';
      return;
    }
    aiStatus.value = 'downloading';
    progress.value = null;
    try {
      await model.prepare((loaded) => {
        progress.value = loaded;
      });
      modelState.value = 'available';
      aiStatus.value = 'ready';
      progress.value = null;
    } catch {
      // A fetch that fails and says nothing is the thing this removes.
      aiStatus.value = 'unavailable';
    }
  }

  /** Turning it on is a press, so it is also the activation the fetch needs. */
  function turnAiOn() {
    aiMenu.value = false;
    commit(setSuggestions(store.value, 'on'));
    fetchAi();
  }

  function turnAiOff() {
    aiMenu.value = false;
    aiStatus.value = null;
    progress.value = null;
    drafted.value = null;
    note.value = null;
    thinking.value = null;
    commit(setSuggestions(store.value, 'off'));
  }

  function aiSettings() {
    const on = store.value.suggestions === 'on';
    return h('div', { class: 'colophon__panel' }, [
      menuButton('colophon__toggle', on ? 'Turn the AI off' : 'Turn the AI on', () =>
        on ? turnAiOff() : turnAiOn(),
      ),
      // Two lines. A third means this has become the settings screen persona.md
      // rules out, and the argument in spec 0009 was wrong.
      h('p', { class: 'colophon__note' }, 'It runs on this machine. Nothing leaves it.'),
    ]);
  }

  /**
   * The switch for the AI, at the foot of the page.
   *
   * The status is a readout and sits in the masthead: read at a glance, never
   * pressed. The switch is a control and sits here: pressed twice ever, never
   * read. Position follows how often a thing is used, which is why the header
   * corner is the book's alone.
   */
  function colophon() {
    const showing = couldRunAi();
    return h('div', { class: 'colophon', id: 'settings', hidden: !showing }, [
      h(
        'button',
        {
          class: 'colophon__open',
          id: 'settings-open',
          type: 'button',
          'aria-haspopup': 'true',
          'aria-expanded': String(showing && aiMenu.value),
          onClick: () => {
            shutMenu();
            aiMenu.value = !aiMenu.value;
          },
        },
        [
          h(
            'svg',
            {
              class: 'colophon__gear',
              viewBox: '0 0 16 16',
              'aria-hidden': 'true',
              focusable: 'false',
              fill: 'none',
              stroke: 'currentColor',
              'stroke-width': '1.25',
              'stroke-linecap': 'round',
            },
            [
              h('circle', { cx: '8', cy: '8', r: '2.5' }),
              h('circle', { cx: '8', cy: '8', r: '5.4' }),
              h('path', {
                d: 'M8 .9v1.7M8 13.4v1.7M15.1 8h-1.7M2.6 8H.9 M13.02 2.98l-1.2 1.2M4.18 11.82l-1.2 1.2 M13.02 13.02l-1.2-1.2M4.18 4.18l-1.2-1.2',
              }),
            ],
          ),
          h('span', { class: 'colophon__label' }, 'AI settings'),
        ],
      ),
      h(
        'div',
        {
          class: 'colophon__menu',
          id: 'settings-menu',
          hidden: !(showing && aiMenu.value),
        },
        showing && aiMenu.value ? [aiSettings()] : [],
      ),
    ]);
  }

  /**
   * The one question, asked once, and only where there is a recipe to fill in.
   * Offering to draft before there is anything to draft is a question with no
   * reason behind it yet.
   */
  const offering = () =>
    couldRunAi() &&
    store.value.suggestions === 'unasked' &&
    !atHome() &&
    recipes().length > 0;

  function offer() {
    return h('div', { class: 'offer', id: 'offer', hidden: !offering() }, [
      h('p', { class: 'offer__question' }, 'Let the AI draft your recipes?'),
      h(
        'p',
        { class: 'offer__note' },
        'It writes the ingredients and the method for a recipe you have named, ' +
          'and you take the lines you want. It runs on this machine — nothing ' +
          'leaves it. The first use downloads the model, which is large.',
      ),
      // Accepting is the press the fetch needs, not a formality: a download
      // cannot begin without recent user activation.
      h('button', { class: 'offer__yes', id: 'offer-yes', type: 'button', onClick: turnAiOn },
        'Yes, fetch it'),
      // Off, and off the page: no indicator, no control on a recipe.
      h(
        'button',
        {
          class: 'offer__no',
          id: 'offer-no',
          type: 'button',
          onClick: () => commit(setSuggestions(store.value, 'off')),
        },
        'No thanks',
      ),
    ]);
  }

  // ---- the whole page ------------------------------------------------------

  const App = {
    render() {
      const home = atHome();
      const status = statusText();
      const found = searching() ? findRecipes(store.value.books, finding.value) : [];
      const showing = home && !searching();
      // The handful somebody starred, leading the front door. Nothing starred
      // gives nothing, and the home is then the one 0013 shipped.
      const favourites = showing ? favouritesIn(store.value.books) : [];
      // Worked out from the day, so the same three hold still through every
      // repaint — and this repaints on each letter typed into the search box.
      const picks = showing ? picksForDay(store.value.books, dayOf(now())) : [];

      // One message, three things it can say, and the wrong one is worse than
      // none. A search that found nothing says so about the search, never about
      // the book — the book is not empty and has not been touched. The front
      // door of an app with nothing in it talks about neither.
      let empty;
      if (searching()) {
        empty = { text: NO_MATCHES, hidden: found.length > 0 };
      } else if (home) {
        // Anything at all on the shelf, starred or not, and there is something
        // to start from — so this speaks only for a browser holding no recipes.
        empty = { text: NOTHING_YET, hidden: favourites.length + picks.length > 0 };
      } else {
        empty = { text: NO_RECIPES, hidden: recipes().length > 0 };
      }

      return [
        // The ribbon: the open book's colour, down the binding edge. It says
        // which book this is without being read, so it carries no words of its
        // own — the masthead beside it says the same thing in the name.
        h('div', { class: 'ribbon', id: 'ribbon', 'aria-hidden': 'true', hidden: home }),

        h('header', { class: 'app__header' }, [
          h('div', { class: 'app__heading' }, [
            h('h1', { class: 'app__title' }, [
              // A real link, so it can be opened in a tab and reached by
              // keyboard, and the press is handled here so the page is drawn now
              // rather than when the browser gets round to `hashchange`.
              h(
                'a',
                {
                  class: 'app__home',
                  href: '#/',
                  onClick: (event) => {
                    event.preventDefault();
                    readingId.value = null;
                    stopFinding();
                    goTo(HOME);
                  },
                },
                'Recipes',
              ),
            ]),
            h('p', { class: 'app__tagline' }, 'A recipe book built one spec at a time.'),
            h('p', { class: 'app__ai', id: 'ai-status', hidden: status === null }, status ?? ''),
          ]),
          books(),
        ]),

        // The box writes into the open book, and the home is not in one. What is
        // on screen there comes from every book at once, so there is no book for
        // a name typed at the front door to belong to — see
        // specs/features/home/spec.md.
        h(
          'form',
          {
            class: 'composer',
            id: 'composer',
            hidden: home,
            onSubmit: (event) => {
              event.preventDefault();
              const box = doc.getElementById('new-recipe');
              const next = addRecipe(recipes(), box.value);
              // workflows.md promises a new recipe is visibly there, at the top
              // of the contents — which it cannot be while results are covering
              // the contents.
              stopFinding();
              // Cleared either way: what did not become a recipe was whitespace,
              // and the box has to be ready for the next one without a decision.
              box.value = '';
              commitRecipes(next);
            },
          },
          [
            h('input', {
              class: 'composer__box',
              id: 'new-recipe',
              type: 'text',
              placeholder: 'What are we cooking?',
              'aria-label': 'New recipe',
              autocomplete: 'off',
            }),
            h('button', { class: 'composer__add', type: 'submit' }, 'Add'),
          ],
        ),

        offer(),

        h('div', { class: 'finder' }, [
          // Live, on every keystroke: nothing is submitted and nothing loads,
          // because nothing leaves the machine. There is no Add button beside it
          // either — the one risk searching carries is a recipe name typed in
          // here by mistake, and a box that can only ever find things is the
          // answer to it.
          h('input', {
            class: 'finder__box',
            id: 'find-recipe',
            type: 'search',
            placeholder: 'Find a recipe in any book',
            'aria-label': 'Find a recipe in any book',
            autocomplete: 'off',
            onInput: (event) => {
              finding.value = event.target.value;
            },
          }),
        ]),

        // Both headings or neither: one unlabelled list is a front door, and two
        // stacked unlabelled ones are a puzzle. With nothing starred there is
        // only the one, and it is the screen 0013 shipped.
        h(
          'h2',
          { class: 'shelf__heading', id: 'favourites-heading', hidden: favourites.length === 0 },
          'Favourites',
        ),
        h(
          'ul',
          { class: 'picks', id: 'favourites', hidden: favourites.length === 0 },
          favourites.map(resultRow),
        ),
        h(
          'h2',
          { class: 'shelf__heading', id: 'picks-heading', hidden: favourites.length === 0 },
          'Somewhere to start',
        ),
        h('ul', { class: 'picks', id: 'picks', hidden: !showing }, picks.map(resultRow)),

        // A favourite and a pick are both the shape of a result, so the same row
        // draws all three: a name, the book it is in, and a way to get there.
        h(
          'ul',
          { class: 'contents', id: 'contents', hidden: home || searching() },
          home ? [] : recipes().map(row),
        ),
        h('ul', { class: 'results', id: 'results', hidden: !searching() }, found.map(resultRow)),

        h('p', { class: 'empty', id: 'empty', hidden: empty.hidden }, empty.text),

        colophon(),
      ];
    },
  };

  // ---- wiring --------------------------------------------------------------

  // The address is read back before the first paint, so the app opens on
  // whatever the pinned tab was left on rather than on what storage guessed.
  syncFromAddress();

  // What the book on screen is bound in: the ribbon down the binding edge and
  // the stitching beside it, in one colour, because a book is bound in one.
  //
  // The name goes on the element and the stylesheet knows what it looks like —
  // so the six hexes live in one file and no stored book has to be touched to
  // retune them. At the front door there is no open book, so there is no ribbon
  // and the thread is the red it has been since 0005: the binding says which
  // book this is, and at the home there is not one.
  //
  // Set on the element the app is mounted *into*, which is the one part of the
  // page Vue does not own, so it is written here rather than drawn above.
  watchEffect(() => {
    appEl.dataset.colour = atHome() ? DEFAULT_COLOUR : colourOf(openBook(store.value));
  });

  createApp(App).mount(appEl);

  // Back, Forward, and anybody editing the address by hand. The app is not told
  // about any of them, so it reads where it is and draws that.
  view().addEventListener('hashchange', syncFromAddress);

  // A popover, so anything else being clicked shuts it — including a recipe's
  // name, which is the click most likely to follow "show me the other book".
  //
  // On the way down rather than the way up, so the clicked control is left in
  // place to handle its own click — shutting the menu must never swallow it.
  doc.addEventListener(
    'click',
    (event) => {
      const booksEl = doc.getElementById('books');
      const settingsEl = doc.getElementById('settings');
      if (menu.value.open && booksEl !== null && !booksEl.contains(event.target)) shutMenu();
      if (aiMenu.value && settingsEl !== null && !settingsEl.contains(event.target)) {
        aiMenu.value = false;
      }
    },
    true,
  );

  // The caret starts in the box, in a book and nowhere else. It was the
  // `autofocus` attribute until 0016; the browser only honours that on markup it
  // parsed, and this page is drawn rather than parsed now. One press of focus at
  // mount is the same thing, and it is the same thing on purpose — where the
  // caret lands is behaviour, and this change is not allowed to move it.
  // See specs/features/home/spec.md for why the front door has no box at all.
  if (!atHome()) doc.getElementById('new-recipe')?.focus();

  // What the browser can do is asked once, and the answer only ever adds a
  // control. Anything going wrong leaves the app exactly as it is in a browser
  // with no model at all, which is the app most people open.
  if (model !== null) {
    model
      .availability()
      .then((state) => {
        modelState.value = state;
        // A choice already made is reflected, never acted on: starting a fetch
        // needs a press, and there has not been one yet this visit.
        if (store.value.suggestions === 'on') {
          if (state === 'available') aiStatus.value = 'ready';
          else if (state === 'downloading') aiStatus.value = 'downloading';
        }
      })
      .catch(() => {});
  }

  return { settled: () => nextTick() };
}
