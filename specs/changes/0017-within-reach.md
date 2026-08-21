# Spec 0017: within reach

- **Status:** proposed
- **Issue:** [#31](https://github.com/sargismarkosyan/todo-change/issues/31) —
  "Revisit the design using Fable model to make it accessible fun and plesent"

## Who this is for

Nell — not a new persona, but Nell on the days `persona.md` does not dwell on:
hands wet or full (workflow 3 is *defined* as reading with your hands full),
eyes a decade older than the stylesheet's author assumed, a browser whose text
size was raised for a reason, or a screen reader doing the looking. None of
that is a different person. It is the same person, reached by fewer of their
usual means, and a design revisit is exactly the place to notice that the app
serves them unevenly.

It sits in **Browse** — [workflow 2](../workflows.md) — where a search now
answers aloud as well as on screen; in **Tidy** — [workflow 4](../workflows.md)
— where deleting stops dropping the keyboard on the floor and the small marks
grow honest hit areas; and under all five, where text finally follows the
reader's own browser setting.

## The job behind the request

**Look at the whole design again, with better eyes than the ones that made it,
and fix what they find.**

The issue names three adjectives — accessible, fun, pleasant — and the audit's
honest finding is that they are not three jobs. *Fun and pleasant* is already
load-bearing and defended in [`features/look/spec.md`](../features/look/spec.md):
the paper, the tape, the ribbon, the two faces, and the rules about what the
look is not allowed to cost. Decorating further is explicitly what that file
guards against, and the one *visible* gap the human has actually felt — the
home naming books without their colours — is already filed as
[#30](https://github.com/sargismarkosyan/todo-change/issues/30) and is its own
version, not this one.

*Accessible* is where the revisit found real work, all of it invisible:

- **Nothing on the page announces anything.** No live region exists. A search
  redraws the results in silence; a delete removes the thing under focus in
  silence. WCAG 4.1.3 calls these status messages, and this app has none.
- **Deleting by keyboard drops focus to `<body>`** — verified in a real
  browser: focus a line's cross, press Enter, and the keyboard is back at the
  top of the page. For the keyboard user, every delete costs a full re-walk.
- **The small marks are under the 24px floor.** The grip measures 18×22, a
  line's cross 22×22 — below WCAG 2.2's target-size minimum. The stars and
  recipe crosses (28×28) already clear it.
- **The base size is a fixed `17px`.** Every other size in the stylesheet is
  `rem`, so a reader who raises their browser's text size gets a page that
  half-listens: headings grow, body text does not.

**The audit also found what already holds**, and recording that is half the
value of a revisit: read-ink contrast is gated at 4.5:1 by
`ink-reads-on-paper` and the bindings at 3:1 by
`every-book-colour-shows-on-paper`; every control has a `:focus-visible` ring;
every icon control carries a spoken name (`aria-label`, `aria-pressed`,
`aria-expanded`, `aria-current` are all in use); `prefers-reduced-motion`
removes the one motion the app has; the headings are a sane outline
(H1 masthead, H2 groups); and axe-core reports zero violations on the home, a
book, and an open recipe. The look did not need rescuing. It needed the four
gaps above, which is why this version has nothing to see.

## Why now

The trigger is the issue's own: a more capable model was put on the repo and
asked to re-inspect the design it inherited. Beyond that, the debt is recent
and growing — 0008 gave the app its first region that redraws out of view
(results), 0009 a second (a draft arriving), 0010 gave it real keyboard editing
without deciding where focus goes when a line dies, and WCAG 2.2's target-size
minimum postdates the look's rules entirely. Each version made the silent gaps
slightly wider. A revisit is the right moment to close them as one step, before
the next feature copies the silence.

## The end value

The app works the same for a hand that misses by a few pixels, a keyboard that
never touches the mouse, a browser told to write larger, and a screen reader —
and looks byte-for-byte the same for everyone else.

**How we would know it worked:** searching with a screen reader now answers
("2 found") instead of silence; deleting a line by keyboard leaves the
keyboard one Tab from the next action instead of at the top of the page;
raising the browser's base text size raises the recipes with it; nothing in
the app offers less than 24px to hit. Each of those is a check that fails
today and passes after, and the first two were reproduced failing in a real
browser before this was written.

## What changes

- **The announcer.** One visually hidden line, `role="status"`, at most one on
  the page. A search writes how many it found into it ("2 found", or the
  existing "No recipe matches that." when empty); deleting a line or a recipe
  writes what went ("Deleted 3 apples"). It never says anything the screen
  does not show, and nothing else writes to it in this version.
- **Focus lands, never falls.** Deleting an ingredient, a step, or a recipe by
  its cross moves focus to the cross of the line that took the deleted one's
  place; deleting the last of a group moves it into that group's composer box
  (for a recipe: the box). Pointer users are unaffected in practice — a click
  focuses the pressed button anyway, and afterwards it is gone either way.
- **24px to hit, drawn as before.** The grip and the line crosses gain hit
  area — padding around the same small mark, no visual change. Nothing drawn
  gets bigger, nothing moves.
- **The base size becomes `1.0625rem`** — identical to today's `17px` at the
  default setting, but downstream of the reader's browser preference. No other
  size changes; everything else was already `rem`.

**Rules added or changed** — the `@rule:` ids in `specs/features/`:

| Rule id | Feature file | New or changed |
|---|---|---|
| `small-marks-hit-big` | `features/look/within-reach.feature` | new |
| `what-just-happened-is-announced` | `features/look/within-reach.feature` | new |
| `deleting-keeps-the-keyboards-place` | `features/look/within-reach.feature` | new |
| `no-text-is-sized-in-pixels` | `features/look/within-reach.feature` | new |

**No existing rule is reworded or retired.** The four sit beside
`paper.feature`, which stays exactly as it is — this version is the same
contract extended to hands and ears, not a new look.

Prose specs updated in the same pass: a *Within reach* section in
[`features/look/spec.md`](../features/look/spec.md) carrying the audit record,
and **the announcer** added to the vocabulary in [`spec.md`](../spec.md).

## What we are not doing

- **Any visible redesign.** The issue says *fun and pleasant*; the audit says
  the look already carries both on purpose, and `look/spec.md` names what more
  decoration would cost (the glance, the stillness, the paper under the text).
  Making the app *more* fun is decoration until somebody names a concrete lack,
  and nobody has.
- **Book colours on the home rows.** That is the one visible design gap with
  evidence behind it, and it is [#30](https://github.com/sargismarkosyan/todo-change/issues/30)
  — researched, labelled `needs-spec`, and a version of its own. Folding it in
  here would bundle the one visible change with four invisible ones and give
  the screenshot series a version that cannot say what it was.
- **Announcing additions.** Accepting a proposal or adding a line happens where
  focus already is, and the result is on screen at the focus point. Announcing
  it would be the chatty version; the announcer covers what changes *away* from
  focus, or takes the focused thing with it.
- **`role="status"` on the AI indicator.** The same mechanism and a natural
  next tenant, but the indicator belongs to `features/suggesting/` and its
  wording is specced there. A one-line follow-up if wanted, not smuggled in
  here.
- **The search box's clear cross.** It is a restyled browser control
  (`::-webkit-search-cancel-button`), Chrome-only, with Escape and select-all
  as first-class equivalents. Enlarging a pseudo-element nobody can focus is
  not where the 24px floor earns anything.
- **Skip links and landmark surgery.** One column, one `<main>`, a five-item
  outline. There is nothing to skip past.
- **A visible focus redesign.** Every control already shows a ring; making the
  rings prettier is taste, and taste changes need a reason this audit did not
  find.

## Data

None. Nothing in `localStorage` changes shape, and nothing new is stored — the
announcer is written and overwritten in the DOM only.

## Risks

- **Announcer chattiness.** `role="status"` is polite by design (it never
  interrupts), and one line that is overwritten cannot queue up. The rule
  keeps it to search and deletion; the moment it grows a wider vocabulary,
  this is the paragraph to reread.
- **Focus moves on pointer deletes too.** Deliberate: the pressed button is
  gone, so focus has to go *somewhere*, and "the next cross" beats the
  browser's answer (`<body>`) for everyone. No pointer workflow observes the
  difference.
- **Hit areas that overlap.** The grip sits against the step number and the
  crosses against text; the extra 24px is padding on the existing marks, and
  the check is that neighbouring targets still do not intersect. The
  screenshot pass looks at the tightest line rather than trusting the
  arithmetic.
- **The rem base.** `1.0625rem` is exactly `17px` at the default root, so the
  screenshot series must not shift by a pixel; if any frame differs, something
  downstream was quietly depending on the fixed base and this version has a
  bug, not the frame. Workflow 5 is untouched — nothing here reads or writes
  storage.

## Acceptance checks

1. Open a book, open a recipe. The page is pixel-identical to version 0016 —
   nothing moved, nothing grew, nothing changed colour.
2. Tab to an ingredient's cross and press Enter. Focus is on the next line's
   cross; the ring is visible there. Delete the last line the same way — focus
   is in that group's composer box, cursor blinking.
3. Delete a recipe by keyboard. Focus is on the next recipe's cross.
4. With a screen reader running (or the announcer inspected in devtools),
   search for something: "2 found", updating as the search narrows, and the
   no-match message when nothing does. Delete a line: "Deleted 3 apples".
5. The announcer is invisible at every viewport width, and appears exactly
   once in the DOM.
6. Raise the browser's base font size (not zoom). Every word on the page grows
   with it, including the recipe lines and both composer boxes.
7. In devtools, measure the grip and a line's cross: each hit target is at
   least 24×24, and adjacent targets on the tightest line do not overlap.
8. `npm run verify` is green, and axe-core still reports zero violations on
   the home, a book, and an open recipe.
