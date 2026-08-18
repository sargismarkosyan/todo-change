# Storage — general spec

`localStorage` is the only copy of the data. There is no server to fall back on
and no export, so the rules here are about not losing anything and not breaking
when what is found is not what was left.

## When writing happens

After every change that alters the list — add, tick, untick, delete. There is no
save button and no debounce. A write that has not happened yet is data that a
closed tab loses.

## Reading is untrusted

Every read must survive:

- **the key missing** — a browser that has never opened the app;
- **unparseable text** — someone edited it in devtools;
- **valid JSON of the wrong shape** — an object where an array was expected, a
  todo with no `text`, a `done` that is a string.

In all of these the app opens on an empty, usable list. It never throws a blank
screen. See `recovery.feature`.

## What is not handled yet

**A second tab.** Two tabs open on this app will overwrite each other, because
nothing listens for the `storage` event. This is a known gap, not a solved
problem — worth a spec of its own once someone actually hits it.

**A full quota.** `localStorage` writes throw when the origin is out of space.
At the size of list this app is for, that is unreachable; if the product ever
grows something bulky, this becomes real.
