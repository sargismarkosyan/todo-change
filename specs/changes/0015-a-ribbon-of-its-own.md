# Spec 0015: a ribbon of its own

- **Status:** proposed
- **Issue:** [#14](https://github.com/sargismarkosyan/todo-change/issues/14) —
  "Allow to colorize and customize the book theme, so that every book can have
  it's own color and if I go to my recepies books library I can quickly glance
  and find the once that I like."

> Numbered 0015 rather than 0014: 0014 is
> [the usual](0014-the-usual.md), written for issue #13 and not yet merged. The
> two are independent — one puts a mark on a recipe, this one on a book — and
> neither reads the other's data.

## Who this is for

Nell, in **Browse** — [workflow 2](../workflows.md) — at the step that comes
before "read the names": knowing which book is on screen. And in **Write it
down** — [workflow 1](../workflows.md) — at the step nobody performs, because
the box never asks which book it is writing into.

It is set from **Tidy** — [workflow 4](../workflows.md) — beside renaming, which
is the other thing about a book that is edited rather than written.

## The job behind the request

**Know which book you are looking at, and pick out the one you want, without
reading anything.**

Stated with no solution in it, that is the whole of "quickly glance". The issue
proposes colour, and colour is the right mechanism — but the payoff it names,
finding a book in a library, is the smaller half of what colour buys here. The
larger half is a hazard this repo has already written down and left standing.

**`features/books/spec.md` names the mistake and only half-defends it.** It says:
*"The name of the open book is on screen at all times, because a page of five
recipe names looks much the same in any book, and writing into the wrong one is
the mistake this feature makes possible."* The defence is a name you have to
read, at the top of a page whose whole design is that you read *down* it. The box
is under the masthead and takes a name in three seconds with no mouse and no
decisions — which is exactly the speed at which nobody looks up.

**What they do today instead.** Read the masthead. That is the entire workaround,
and it is one of two things a person does when they are not sure: read the
masthead, or write it down and find out later.

**And the library really is a list of names.** The book menu is four or five
names in a column. Reading four names is cheap, which is why nothing has been
reported broken — it is a small tax, and it is the half of this the issue felt.

## Why now

**Because the app has more places to be than it used to, and none of them look
different.** 0008 made searching reach across books, 0013 gave the app a front
door and an address per book, and 0014 is putting favourites from every book on
one screen. Every one of those moves a person *between* books more often than
before, and every one of them lands on a page that looks byte-for-byte like the
page they left. The masthead is doing all of the work, and it has been doing it
alone since 0006.

**And the look has an empty slot exactly the right shape.** `features/look/`
already draws a bound book: a crease where the binding pulls, and red stitching
down the inside edge — thread, with paper between the stitches. That thread has
been one colour since 0005 because there was nothing for it to say. A bound book
carries its identity in its binding, and this app has drawn the binding for ten
versions without giving it anything to carry.

**What it costs today**, concretely: a glance up to the masthead every time you
are not certain, and a recipe in the wrong book on the times you were certain and
wrong. The first is small and constant. The second has no undo and no report,
because a recipe in the wrong book does not look like anything going wrong until
March.

## The end value

The page tells you which book you are in from a step back, without being read.
Open the book menu and the books are told apart by colour before their names are.
Nothing else about the app changes, and a book nobody colours is drawn exactly as
version 0014 left it.

**How we would know it worked:** cover the masthead and you can still say which
book is on screen. Today that is impossible — every book renders identically, and
the name is the only thing that differs. And the check that keeps it honest: with
nothing coloured, every page is byte-for-byte the page before this change, so the
feature costs a fresh install nothing.

## What changes

**The ribbon** — the signature, and the whole of what this looks like.

- **A band of the open book's colour runs the full height of the page**, just
  outside the stitching on the binding edge. It is sewn in at the head — showing
  above the top edge of the page — and hangs past the foot onto the paper ground
  with a cut end.
- **The stitching takes the same colour.** A book is bound in one colour of
  thread and one ribbon, not two. Together they make the binding edge wide enough
  to read peripherally, which a 2px thread alone is not.
- **It never carries a word**, and nothing is drawn on top of it. The ribbon sits
  outside the page's text column entirely.
- **The card's red margin rule does not change**, in any book. Index cards come
  out of a packet ruled red; the binding is the part somebody chose. That is also
  why `ink-reads-on-paper` needs no rewording — no colour a recipe is *read* in
  is touched by this.
- **At the home there is no ribbon**, and the stitching is the default red. No
  book is open at the front door, so there is nothing for the binding to say.

**The swatches** — where a colour is chosen.

- **A strip of six in the book menu**, under the list of books and above making,
  renaming and deleting. Not a line of text leading somewhere: the swatches
  themselves, pressed directly.
- **One press colours the open book, immediately**, written down at once like
  everything else this app stores. Pressing another changes it. The menu stays
  open, the contents does not move, and no recipe opens or closes.
- **The chosen one is marked by more than its colour** — it sits proud, ringed —
  and every swatch carries the colour's name for anything reading the page aloud.
- **Only the open book can be coloured**, exactly as only the open book can be
  renamed or deleted. At the home the menu is the list of books and nothing more,
  as today.

**The book menu wears the colours.** Every row is marked in its book's colour,
beside its name — the same ribbon end, small. This is the "library" the issue
asks for, and it is the one place all the colours are seen together.

**The six.** Bookbinder's cloth, not web accents. The first is the red every book
already has:

| Name | | Against the page | Against the ground |
|---|---|---|---|
| `red` | `#a8443a` | 5.44 | 4.18 |
| `ochre` | `#916412` | 4.79 | 3.68 |
| `green` | `#4e7a3a` | 4.63 | 3.56 |
| `teal` | `#2f6a6b` | 5.69 | 4.38 |
| `blue` | `#3a5573` | 7.08 | 5.45 |
| `plum` | `#7a3f63` | 7.11 | 5.46 |

All six clear 3 to 1 against both, which is the bar for a graphic that carries
meaning — checked in the test rather than judged, the same way
`ink-reads-on-paper` is. The hexes live in the stylesheet and the *name* is what
is stored, so the palette can be retuned in one place without touching a single
stored book.

**Rules added or changed** — the `@rule:` ids in `specs/features/`:

| Rule id | Feature file | New or changed |
|---|---|---|
| `a-book-takes-a-colour` | `features/books/colouring.feature` | new |
| `a-colour-belongs-to-one-book` | `features/books/colouring.feature` | new |
| `a-books-colour-is-kept` | `features/books/colouring.feature` | new |
| `colouring-changes-nothing-else` | `features/books/colouring.feature` | new |
| `an-unknown-colour-is-the-red-it-always-was` | `features/books/colouring.feature` | new |
| `the-open-book-wears-its-colour` | `features/look/telling-books-apart.feature` | new |
| `every-book-in-the-menu-wears-its-colour` | `features/look/telling-books-apart.feature` | new |
| `colour-is-never-the-only-thing-saying-which-book` | `features/look/telling-books-apart.feature` | new |
| `every-book-colour-shows-on-paper` | `features/look/telling-books-apart.feature` | new |
| `the-front-door-has-no-ribbon` | `features/look/telling-books-apart.feature` | new |

**No existing rule is reworded or retired.** `paper-under-everything` still says
the ground, the page and the card are all warm and each lighter than the one it
sits on — none of the three is touched. `ink-reads-on-paper` still lists the same
colours at the same ratio, including the red on a card. `the-masthead-names-the-book`
and `handwriting-labels-but-is-not-read` are untouched.

Prose specs updated in the same pass: a new *Colour* section in
[`features/books/spec.md`](../features/books/spec.md), the ribbon added to *The
parts* in [`features/look/spec.md`](../features/look/spec.md), the storage
contract and three vocabulary entries in [`spec.md`](../spec.md), workflows 2 and 4
in [`workflows.md`](../workflows.md), and an amendment to the settings-screen
paragraph in [`persona.md`](../persona.md) — argued below rather than made
quietly.

## The three decisions this rests on

**The persona's line-counting heuristic has fired, and is replaced rather than
ignored.** `persona.md` says a settings screen is ruled out and a switch in a
popover is not, then adds: *"If either of them ever grows a third line, that is
the signal this distinction has stopped being honest."* The book menu already has
three — the new-book form, rename, delete — so the signal has fired, and the
swatches are a fourth thing. The heuristic is amended, out loud, because counting
lines was always a proxy for the thing it cared about, and the thing it cared
about is: **do you have to go somewhere and decide before you can use the app?**
Nothing here asks. A book nobody colours is the book this app has always drawn,
no screen ever shows an unanswered question, and the book menu is opened to
switch books — the only frequent thing in it — with everything else reached from
where you already were. What stays ruled out is unchanged: a page, a list of
options, a decision asked before there is a reason for one. `persona.md` has been
amended on this pattern twice before, and the replacement test is written into
the file rather than argued for here and forgotten.

**Six colours, not a colour picker.** `<input type="color">` is one element, and
it is the wrong one. A colour picker asks a question with a wheel attached — it
is the composition of a colour, which is a decision, not a press. Worse, it moves
"is this visible on cream paper" from something checked once in a stylesheet to
something guarded on every read, and "which colours are allowed" becomes a rule
instead of a palette. Six cloth colours are pre-checked, tell each other apart at
swatch size, and are the honest analogue: a book is bound in cloth somebody had,
not mixed to order.

**The binding, not the page.** Tinting the page and the ground toward the book's
colour is what "theme" most literally asks for and is the bigger signal, and it
is the one thing this must not do. It would reword `paper-under-everything` —
*"the ground, the page and the card are all warm"* is false of a blue book — and
turn `ink-reads-on-paper`'s seven pairs into seven times six, re-checked per
colour, forever. `look/spec.md` names cream-on-cream as *"the most natural
mistake in this direction"* and says the glance stays first. The binding edge
carries no text, so putting the colour there costs the reading nothing and asks
no existing guarantee to bend. It is also where a real book keeps its identity.

## What we are not doing

- **Tinting the page, the ground, or a card.** Argued above. The colour stays on
  the binding edge and in the book menu, and never gets under a word.
- **A seventh colour, or a colour picker.** Six, fixed, named. If six turns out to
  be five too few, that is a report worth waiting for and a one-line change to a
  stylesheet.
- **Colouring a book you are not in.** Only the open book, the same as renaming
  and deleting. Colouring from the list would put a control on the rows used to
  switch, which `books/spec.md` deliberately keeps clear.
- **Asking for a colour when a book is made.** `books/spec.md` is explicit that a
  new book opens straight away *"so the reason it was started is still in mind"*,
  and a colour question there is a decision added to the one place this app
  refuses to add decisions. A new book is red, and is coloured later or never.
- **Marking the picks, the results, or the favourites.** They name the book they
  are in, in words, and 0013 and 0014 both argue that those rows offer the recipe
  and nothing else. A colour mark on them is a defensible idea and a different
  version.
- **Anything else carrying a colour.** Not a recipe, not an ingredient, not a
  step. A book is the container somebody made and named; a colour on a recipe is
  the categorising `books/spec.md` says a book is not.
- **Motion.** No ribbon that sways, settles, or slides when books are switched.
  Workflow 3 is reading with your hands full, and 0010's amendment narrowed
  "nothing moves while it is being read" to *a line under a finger deliberately
  moving it*. A ribbon is not under anybody's finger.
- **A name for each colour on screen.** The swatches are coloured, and their names
  exist for anything reading the page aloud. A labelled list of six colour names
  is the settings screen this is careful not to be.

## Data

**One optional key on a book.**

```json
{ "id": "...", "name": "Sweets", "colour": "green", "recipes": [] }
```

- **Present only when it is not the red.** A book nobody has coloured has no key,
  the same way a recipe with no method has no `steps`. The default is not written
  down, so there is nothing to clear and no third state.
- **A name, not a value.** `"green"`, never `#4e7a3a`. The hex is the
  stylesheet's business, so the palette can be retuned without a migration and
  without a stored colour ever going stale.
- **Anything that is not one of the six reads as the red** — untrusted on read,
  like every other field. A book with `"colour": "chartreuse"` opens normally, in
  red.
- **No migration.** Every book stored by every previous version reads as red,
  which is correct rather than merely safe: red is what they were drawn in.
- **Nothing else moves.** No new top-level key, no change to `openId`,
  `suggestions`, or the older-key migrations. A book arriving from
  `todo-change.notepads` or `todo-change.todos` has no colour, because a notepad
  never had one.
- **Deleting a book takes its colour with it**, because the colour is on the book.

## Risks

- **The persona amendment.** This is the change that retires a heuristic
  `persona.md` wrote down specifically so that somebody would stop and notice.
  Stopping and noticing is what this section is. If the book menu later grows
  something that *is* a question — a default, a preference, a thing asked before
  a reason exists — the replacement test has stopped being honest too, and this
  is the paragraph to come back to.
- **A ribbon on a narrow screen.** The page has 2rem of padding and the ribbon
  lives in it, outside the text column. On the narrowest viewport that margin is
  where the design has least room, and a ribbon that ends up under a word has
  broken the one thing this change promised not to. It is the first thing to
  check in the screenshot pass, at the smallest width.
- **Six colours that stop telling each other apart at swatch size.** Contrast
  against paper is checked; contrast *between* two swatches is not, and cannot
  usefully be. Ochre and red are the pair to look at, and the answer if they
  collide is to move one hex, not to add a rule.
- **Colour as the only signal.** Deliberately guarded — `colour-is-never-the-only-thing-saying-which-book`
  is a permanent rule rather than a note, because the tempting next change is a
  book menu of swatches with the names dropped.
- **Workflow 5 (Return).** One optional string on a book, never required, absent
  in every byte written by every previous version. A second tab on an older build
  would drop colours it does not know about when it writes — the same two-tab
  hazard `features/storage/spec.md` already describes, and no worse for this
  field.

## Acceptance checks

1. Open a book. A coloured ribbon runs down the binding edge, showing above the
   top of the page and hanging past the bottom onto the paper. It is red, as
   every book has always been.
2. Open the book menu. Under the list of books there is a strip of six swatches,
   with the red one marked as chosen. The books above it are each marked in their
   own colour.
3. Press the green swatch. The ribbon and the stitching turn green at once. The
   menu is still open, the contents has not moved, and no recipe has opened or
   closed.
4. Shut the menu. Read the page from a step back. Cover the masthead with a hand.
   You can still say which book this is.
5. Make a second book and colour it plum. Open the book menu. The two books are
   told apart by colour before their names are read.
6. Switch between them. The ribbon changes with the book, every time.
7. Open a recipe with ingredients and a method. Nothing on the card has changed
   colour — the margin rule is still red, and every word reads as it did.
8. Go to the home. There is no ribbon, and the stitching is red.
9. Reload. Both colours are still there.
10. Narrow the window to its smallest. The ribbon is still beside the text and
    never under it.
11. In devtools, set a book's `"colour"` to `"chartreuse"` and reload. The book
    opens normally, in red.
12. Colour a book, then delete that book. Nothing coloured is left behind in the
    menu.
