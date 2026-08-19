# Spec 0013: a front door

- **Status:** proposed
- **Issue:** [#10](https://github.com/sargismarkosyan/todo-change/issues/10) —
  the structure it asks for, and the "somewhere to start from" it asks for it
  because of. The popularity half is deliberately left open there; see *What we
  are not doing*.

## Who this is for

Nell, in **Browse** — [workflow 2](../workflows.md), at a step that does not
exist yet: the one before "open a book". Browse today starts with an answer
already given. Which book you open *is* a decision about roughly what you are
making, and the trigger for the whole workflow is standing at the fridge with the
door open, which is the moment of having no answer at all.

It also spends something from **workflow 1** and changes **workflow 5**, and both
are written up under *Risks* rather than glossed. A version that touches three of
the five workflows is a big one, and it should be read as one.

## The job behind the request

**Open the app with nothing in mind and be given somewhere to begin.**

The issue's own words for it are "so that user can start from", and that is the
whole of it. Everything else in the message — search as the home page, popular
recipes, random recipes of the day, books and management demoted — is one
proposed shape for that job.

It is a *browsing* need and it is distinct from the *finding* need 0008 answered.
Searching reaches across every book, but only for somebody who already has a word
to type. This is the case where there is no word.

## Why now

Books shipped in 0006 and made the app a container of containers. Searching
shipped in 0008 and reaches across all of them. Between them they leave one hole,
and it is the hole the fridge door opens on: **with nothing typed, exactly one
book is visible, and it is whichever one was last open.**

So a recipe written down in March, in a book nobody has opened since, is
effectively gone. Nothing is broken — it is in storage, it survives reloads, a
search finds it instantly — but nothing will ever put it in front of anybody
again, because everything that could reach it needs to be told what to look for
first. [persona.md](../persona.md) sets the bar as "quicker to find than the
drawer", and a drawer of loose paper is better than this in exactly one respect:
riffling it shows you things you were not looking for.

The second thing going wrong is smaller and constant: the app has one address, so
the browser's Back button does nothing, and a pinned tab reopens on whatever
`openId` was last written rather than on where its reader last was.

## The end value

Opening the app offers three recipes to start from, pulled from any book, each
saying which book it is in — and a search box, for the visits where there *is*
something in mind. A book is then somewhere you go, with its own address, so
reopening a pinned tab lands where it was left and Back means what it means
everywhere else.

**How we would know it worked:** a recipe in a book nobody has opened for months
appears on screen without anybody naming it — which is impossible today, in every
version since 0006. And the smaller check that keeps it honest: press Back after
going into a book and end up where you were, rather than nowhere.

## What changes

**Two addresses, one `index.html`.**

- **`#/` is the home** — the masthead, the search box, and the picks. No
  contents, and nothing to write a recipe into.
- **`#/book/<id>` is one book** — exactly the page that exists today: the box, the
  contents, the book menu, an open recipe, the AI and everything it does.
- **Going to a book's address opens that book**, setting `openId`, so the address
  and the stored open book never disagree.
- **The masthead title goes home.** That is the whole of the new navigation: into
  a book through the book menu that is already there, out through the title.
- **Back and forward walk in and out**, and a refresh lands where you were.
- **Any other address is the home** — no hash, a hash naming a book that is not
  there, a hash nobody meant to type. An address is untrusted input in the same
  posture as a stored string: none of them may produce a blank screen.

**The picks, on the home.**

- **Three recipes, from any book**, each naming the book it is in. Opening one
  goes to that book with the recipe open — the same thing opening a result does.
- **Derived from the date and nothing else**, so they hold still all day. The home
  repaints on every letter typed into the search box, and picks drawn fresh each
  repaint would reshuffle under the cursor.
- **Fewer than three written down shows what there is.** Nothing written down
  anywhere says "Nothing written down yet." — which is not the empty book's
  message and must not be confused with it.
- **Typing in the search box replaces them with results; clearing puts back the
  same three.**

**Nothing about searching changes.** The same box, the same matching, the same
results, and it stays in a book as well as being on the home — a search from
inside Sweets should not cost you the book you are in. What differs is only what
comes back when the box is emptied: the contents in a book, the picks on the
home. Every existing rule in `features/finding/` stays true as written.

**Rules added or changed** — the `@rule:` ids in `specs/features/`:

| Rule id | Feature file | New or changed |
|---|---|---|
| `the-front-door-is-the-home` | `features/home/routes.feature` | new |
| `a-book-has-its-own-address` | `features/home/routes.feature` | new |
| `the-masthead-goes-home` | `features/home/routes.feature` | new |
| `back-and-forward-move-between-them` | `features/home/routes.feature` | new |
| `an-address-that-names-nothing-opens-the-front-door` | `features/home/routes.feature` | new |
| `picks-reach-every-book` | `features/home/starting-from.feature` | new |
| `picks-hold-still-all-day` | `features/home/starting-from.feature` | new |
| `picks-open-where-they-live` | `features/home/starting-from.feature` | new |
| `picks-give-what-there-is` | `features/home/starting-from.feature` | new |
| `picks-step-aside-for-the-results` | `features/home/starting-from.feature` | new |

**No existing rule is reworded or retired.** That is a deliberate property of the
shape chosen and worth stating: every rule in `features/finding/`,
`features/books/` and `features/recipes/` describes what happens in a book, and a
book is still that page. The new area is additive.

Prose specs updated in the same pass: a new
[`features/home/spec.md`](../features/home/spec.md), the *Single page* section of
[`setup/constraints.md`](../setup/constraints.md) — amended, see below — the *Not
a home page* paragraph in
[`features/finding/spec.md`](../features/finding/spec.md), workflows 1, 2 and 5 in
[`workflows.md`](../workflows.md), and two vocabulary entries plus the storage
note in [`spec.md`](../spec.md).

## The three decisions this rests on

**Routing, over a view swap and over real pages.** Asked and answered: hash
routes, in one file, like any single-page app. `setup/constraints.md` said "No
routing, no second page, no view layer that implies one" and is amended here
rather than reinterpreted. What that section was protecting survives intact — one
`index.html`, no router library, no build step, no second file, Pages serving the
repo root, and a hash the server never sees so a refresh cannot 404. What it
ruled out was a *second page* and a *view layer implying one*; this takes the
first deliberately and still refuses the second. An in-page toggle would have been
less code and would have thrown away the reason to want an address at all: a
pinned tab remembers a URL, and workflow 5 is a pinned tab reopened months later.

**"Most popular" is dropped, not deferred into this version.** There is no
popularity to report: one person, no backend, so it could only mean the ones this
person opens most. That needs a stored per-recipe count, written when a recipe is
*opened* — the first write-on-read in an app where every write today follows a
deliberate act — and it is a behavioural record of the person using the app, which
is a category of data this repo has never held. It is also empty on a fresh
install, which is precisely when a front door most needs not to be blank. What is
actually wanted is a recipe you have not thought about since March, and an
arbitrary pick does that without any of it.

**The picks come from every book, the open one included.** Simpler to state, and
on the home there is no contents beside them to repeat: the home shows no book's
recipes, so a pick from the last-open book is no more redundant than any other.
(Excluding the open book was considered — it would make every pick something you
could not otherwise see — and dropped for making the feature vanish for anybody
with one book.)

## What we are not doing

- **Counting what gets opened.** The popularity half of #10, left open on the
  issue. It needs a stored field, a write on read, an answer for clearing it, and
  its own argument against [persona.md](../persona.md) — a version of its own, if
  it survives that argument at all.
- **A recipe in the address.** No `#/book/<id>/recipe/<id>`, no deep link to a
  recipe. Which recipe is open stays where `features/recipes/spec.md` put it:
  where the reader is looking, not something they have. It is a defensible next
  version and it is not this one.
- **Moving any management control.** Making, renaming and deleting books,
  deleting a recipe, moving a line: all stay in the book, untouched. #10 asked for
  them to become "secondary pages" and they become secondary by the front door
  being elsewhere, which costs nothing and moves nothing.
- **Path routing, the History API, or a router library.** Hash and `hashchange`,
  both already in the browser. `setup/constraints.md` has one vendored library and
  a written bar for the second; this is not close to it.
- **A timer on the picks.** They change on the first repaint after midnight, not
  at midnight. A tab left open across midnight will show yesterday's three until
  something is clicked, and that is an acceptable ceiling for a page nobody is
  reading at the time.
- **Remembering yesterday's picks**, so as not to repeat them. That is a stored
  history of what the app has shown, to solve a problem nobody has reported.
- **Ranking the picks, or explaining them.** No "because you liked", no most
  recent, no relevance. Arbitrary and held still is the whole design.
- **Taking the search box out of a book.** It stays there as well. Searching from
  inside Sweets should not mean leaving Sweets first.
- **A settings screen, or anything on the home to configure it.** Ruled out by
  [persona.md](../persona.md), and it would be the second thing in this batch to
  argue with it.

## Data

**None.** The `localStorage` shape is untouched: no new key, no new field, no
migration, and no read path changes. The picks are computed from the date and the
books already in memory, and the address lives in the URL bar, which is not
storage — nothing about where you were is written down, exactly as nothing about a
search is.

`openId` gains a second writer — going to a book's address sets it — but it holds
the same kind of value it always has, and every existing read of it is unchanged.

## Risks

- **Workflow 1 (Write it down), the real cost.** The box is in a book, so somebody
  arriving at `#/` is one click from typing. Mitigated by the way this app is
  actually opened: a pinned tab carries the address of the book it was left on and
  reopens there with the box autofocused, exactly as today. The cost lands on the
  arrival case only. Worth watching in the screenshot pass, because this is the
  workflow the repo is most protective of.
- **Workflow 5 (Return), and the one upgrade wrinkle.** No stored data can be
  damaged — nothing is written — but a tab pinned at the root, with no hash, now
  opens the home rather than the book it used to. Nothing is lost and one click
  restores it, and thereafter the tab carries a book's address. It is still the
  first time in this repo's history that reopening shows a different screen than
  it did the version before, and it should be said out loud rather than discovered
  in a screenshot.
- **An address is typed by anybody.** A junk hash, a book id that has since been
  deleted, a half-pasted URL. All of them open the front door; none of them may
  blank the page. This is the same posture the storage read has and it needs the
  same test coverage.
- **Two places a search can be typed, and two things that come back.** The rule
  that stops this being a bug is that what comes back is what was there before —
  the contents in a book, the picks on the home. If a third thing ever appears
  behind the search box, that is the signal this has stopped being one behaviour.
- **The picks are the first thing on screen that depends on the clock.** A wrong
  or reset system date changes which three come up, and nothing else. It cannot
  fail into a blank home: the pool is the books, and the date only chooses.
- **Where the work actually is.** Every behaviour test opens the app at the root,
  which is now the home rather than a book, so the test harness has to say which
  address it opens at. That is invisible to Nell and it is the largest part of the
  diff — it should not be mistaken for scope creep when it appears in the pull
  request.

## Acceptance checks

1. Open the app with no hash. The front door: the search box, three recipe names
   under it, each with a book name, and nowhere to type a recipe.
2. Reload it three times. The same three, in the same order.
3. Type "lemon". The results replace the picks. Empty the box. The same three
   come back, unshuffled.
4. Click a pick from a book you have not opened in a while. That book is on
   screen, its name in the masthead, the recipe open and readable.
5. Press Back. The home again. Press Forward. The book again.
6. In the book, type a recipe name and press Enter. It lands at the top of that
   book's contents, as before, and nothing about the address changed.
7. Press the masthead title. Home.
8. Copy the book's address, close the tab, paste it into a new one. Straight into
   that book, with the box under the cursor.
9. Edit the hash to `#/book/nonsense`. The front door, not a blank page.
10. In devtools, clear `todo-change.books` and reload. One empty book, and the
    home says "Nothing written down yet." rather than showing an empty gap.
11. Change the system date to tomorrow and reload the home. A different three —
    and if it happens to be the same three, tomorrow-but-one is not.
