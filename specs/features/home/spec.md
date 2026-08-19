# The home — general spec

Everything in `../recipes/` happens inside a book, `../books/` is the container,
and `../finding/` is the one thing that reaches across them. **This folder is
what the app opens on**: a front door that is not a book, and the addresses that
tell the two apart.

It exists because of a gap that books opened and searching only half closed. The
app can reach across every book — but only for somebody who already has a word
to type. Arriving with nothing in mind leaves exactly one thing on screen: the
contents of whichever book was open last. Everything in the other books is
invisible until somebody names it, and `workflows.md` says the trigger for
browsing is "standing at the fridge, deciding what to make" — which is the
moment of having nothing in mind, not something in it.

## Two addresses, one page

- **`#/` — the home.** The masthead, the search box, and the picks. No contents
  and no box.
- **`#/book/<id>` — one book.** Exactly the page the app has always been: the
  box, the contents, the book menu, an open recipe, and everything drafting
  does.

Anything else — no hash, a hash naming a book that is not there, a hash nobody
meant to type — is the home. Same posture as `../storage/spec.md` takes to a
stored string: an address is typed by anybody, and none of them may produce a
blank screen.

**This is routing, and `setup/constraints.md` said there would be none.** That
section is amended by [change 0013](../../changes/0013-a-front-door.md) rather
than reinterpreted. What it was protecting is still protected: one
`index.html`, no router library, no build step, no second file, and the Pages
deploy unchanged. What it was ruling out — a second page to navigate to, and a
view layer implying one — is now a deliberate yes to the first and still a no to
the second. Popovers are still not pages.

The reason to spend an address on this rather than an in-page toggle is
[workflow 5](../../workflows.md). A pinned tab is how this app is used, and a
pinned tab remembers a URL. `#/book/<id>` means reopening it lands on the book it
was left on, with the box under the cursor, without the app having to guess from
storage.

## Which book is open

The address is what says it, and going to one **sets** the open book — `openId`
follows the address rather than competing with it. That keeps the invariant
`../finding/spec.md` argues for: *what is on screen is always in the open book*,
which is what stops the next thing typed landing somewhere nobody chose.

Which is also why the home has no box. It shows recipes from every book at once,
so there is no book for a name typed there to belong to. The answer is not a
book picker beside it — `../books/spec.md` calls that the one thing that must not
change — the answer is that writing a recipe down happens in a book, one click
away, and a pinned tab is already there.

## The picks

Three recipes, from any book, each naming the book it is in. They are the reason
the front door is worth opening: the only place in this app that shows something
from a book nobody asked for.

**Picked from the date and nothing else.** The same day gives the same three, all
day. This is not a nicety — the home repaints on every letter typed into the
search box, and picks drawn fresh on each repaint would reshuffle under the
cursor while somebody read them. Deriving them from the day makes the page still
and makes the rule testable without asserting which three came up.

**Arbitrary is the feature, not a compromise.** A recipe book of a few dozen
recipes has no popularity to report and this app has no way to learn one: it
would mean counting what gets opened, which is a usage record kept about the
person using it, written on read, and empty on the day it is needed most. What is
actually wanted is *a book you have not thought about since March*, and any
arbitrary pick does that.

**Not ranked, not inferred, not remembered.** No relevance, no "because you
liked", no history of what came up yesterday. Nothing about the picks is stored;
they are recomputed from the date, exactly as a search is recomputed from what is
typed.

## What this is not

- **Not a dashboard.** No counts, no "recently viewed", no statistics about a
  recipe book. Three names and a search box.
- **Not a second file.** One `index.html`, as before. An address is not a page.
- **Not a router library.** Hash and `hashchange`, both of which the browser has
  already. See `setup/constraints.md` on what a dependency has to be worth.
- **Not a deep link to a recipe.** Which recipe is open stays where
  `../recipes/spec.md` put it: where the reader is looking, not something they
  have. A recipe route is a defensible idea and it is a different version.
- **Not a demotion of anything.** Making, renaming and deleting books, deleting a
  recipe and moving a line all stay exactly where they are, in the book. What
  makes them secondary is that the front door is now somewhere else, not that
  anything moved.
