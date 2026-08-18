# Storage — general spec

`localStorage` is the only copy of the data. There is no server to fall back on
and no export, so the rules here are about not losing anything and not breaking
when what is found is not what was left.

**The stakes went up with version 0004.** A todo was ninety seconds old and
cheap to retype. A recipe may be the only copy of something dictated once, and
the gap between visits is months rather than hours. Nothing in the mechanism
changed for that reason; the tolerance for getting it wrong did.

## When writing happens

After every change that alters what is stored — writing a recipe down, adding an
ingredient or a step, deleting any of them, switching book, making one, renaming
one, deleting one. There is no save button and no debounce. A write that has not
happened yet is data that a closed tab loses.

**Which recipe is open is not written**, because it is not data. It is where the
reader is looking, and a book reopens on its contents.

**Two writes are not caused by a change on screen:** the migrations. When
`todo-change.books` is absent, whichever older key is present is read, converted,
written under the new key, and removed. It happens once, on the first open after
upgrading. See `books-migration.feature`.

## Reading is untrusted

Every read must survive:

- **the key missing** — a browser that has never opened the app;
- **unparseable text** — someone edited it in devtools;
- **valid JSON of the wrong shape** — an array where an object was expected, a
  book with no `name`, a recipe with no `name`, an `ingredients` that is a
  string;
- **an `openId` naming a book that is not there** — the first book opens.

In all of these the app opens on a usable book — an empty one called "My book"
when nothing survived. It never throws a blank screen. See `recovery.feature`.

**A partly-bad array keeps what is good.** If the stored value is an array but
one entry in it is malformed, that entry is dropped and the rest are kept —
throwing away someone's real recipes because a neighbouring one got mangled is
the larger failure of the two.

That holds at every level. A book is well-formed when `id` and `name` are
non-empty strings and `recipes` is an array. A recipe is well-formed when `id`
and `name` are non-empty strings; `ingredients` and `steps` are each kept when
they are arrays and dropped to empty when they are not. An ingredient or a step
is well-formed when `id` and `text` are non-empty strings. Anything else is
dropped and its neighbours are kept.

**`done` is read and discarded.** Every recipe migrated from a todo has one, and
so does anything hand-edited in devtools. It is not part of the shape, nothing
reads it, and the next write does not put it back. It is not an error either —
there is nothing to recover from, so it is simply not carried.

## The two migrations

They chain, oldest last, and both are only reached when `todo-change.books` is
absent:

1. `todo-change.notepads` (version 0003) — each notepad becomes a book of the
   same name; each todo becomes a recipe whose name is the todo's text; its
   `subTodos` become that recipe's `steps`; `ingredients` is empty; `done` is
   dropped at both levels.
2. `todo-change.todos` (version 0002 and earlier) — the bare array becomes one
   book called "My book", converted the same way.

Each is sanitised by the untrusted read above *before* being converted, so junk
in an old key is dropped rather than migrated. The source key is removed once
the new one is written, so the conversion never runs twice and the two keys
never both hold real data.

## What is not handled yet

**A second tab.** Two tabs open on this app will overwrite each other, because
nothing listens for the `storage` event. This is a known gap, not a solved
problem — worth a spec of its own once someone actually hits it. Books make it
sharper rather than merely likelier: two tabs on *different* books still share
one key, so the loser of the race loses recipes it was never showing.

**A full quota.** `localStorage` writes throw when the origin is out of space.
At the size of book this app is for — text only, no images — that is still
unreachable. It stops being unreachable the moment anything bulky is stored,
which is the reason photographs of food are out of scope rather than merely
unbuilt.
