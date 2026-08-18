# Storage — general spec

`localStorage` is the only copy of the data. There is no server to fall back on
and no export, so the rules here are about not losing anything and not breaking
when what is found is not what was left.

## When writing happens

After every change that alters what is stored — add, tick, untick, delete,
switch notepad, make one, rename one, delete one. There is no save button and no
debounce. A write that has not happened yet is data that a closed tab loses.

**One write is not caused by a change on screen:** the migration. When
`todo-change.notepads` is absent and the old `todo-change.todos` key is there,
the read moves that list into a notepad called "My list", writes the new key,
and removes the old one. It happens once, on the first open after upgrading, and
after it the old key is gone. See `notepads-migration.feature`.

## Reading is untrusted

Every read must survive:

- **the key missing** — a browser that has never opened the app;
- **unparseable text** — someone edited it in devtools;
- **valid JSON of the wrong shape** — an array where an object was expected, a
  notepad with no `name`, a todo with no `text`, a `done` that is a string;
- **an `openId` naming a notepad that is not there** — the first notepad opens.

In all of these the app opens on a usable notepad — an empty one called "My
list" when nothing survived. It never throws a blank screen. See
`recovery.feature`.

**A partly-bad array keeps what is good.** If the stored value is an array but
one entry in it is malformed, that entry is dropped and the rest are kept —
throwing away someone's real todos because a neighbouring one got mangled is the
larger failure of the two. A todo is well-formed when `id` and `text` are
non-empty strings and `done` is a boolean; anything else is not a todo and does
not survive the read.

That holds at both levels now. A notepad is well-formed when `id` and `name` are
non-empty strings and `todos` is an array; a junk notepad is dropped and its
neighbours are kept, and the todos inside a good one are read exactly as they
always were.

## What is not handled yet

**A second tab.** Two tabs open on this app will overwrite each other, because
nothing listens for the `storage` event. This is a known gap, not a solved
problem — worth a spec of its own once someone actually hits it. Notepads make
it sharper rather than merely likelier: two tabs on *different* notepads still
share one key, so the loser of the race loses todos it was never showing.

**A full quota.** `localStorage` writes throw when the origin is out of space.
At the size of list this app is for, that is unreachable; if the product ever
grows something bulky, this becomes real.
