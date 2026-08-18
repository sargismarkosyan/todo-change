# Todos — general spec

The list is the product. Everything in this folder describes how a todo comes
into existence, changes state, and leaves.

## Ordering

Newest first. The list is not sortable and does not reorder itself — a todo
stays where it was put, including when it is marked done. People navigate by
remembered position, and a list that rearranges itself under them costs more
than the tidiness it buys.

Moving done todos to the bottom is a real idea, but it is a *different* rule
that would need its own spec and its own change. It is not the default.

## Identity

Every todo carries an `id` that is generated once and never changes. Rows are
addressed by id, never by text or by index — two todos may legitimately have the
same text, and indexes shift the moment something is deleted.

That makes uniqueness load-bearing rather than nice to have: two todos sharing
an id would be ticked and deleted together. The id is a timestamp plus 64 bits
of `crypto.getRandomValues()` entropy, which is enough that a collision is not a
scenario worth designing around. An earlier version used four `Math.random()`
characters and collided in testing — see issue #2.

## Text

One line, stored exactly as typed apart from trimming the ends. No markdown, no
links, no formatting. Leading and trailing whitespace is removed on the way in,
which is what makes an all-whitespace todo impossible.

## Done

Done is a state a todo carries, not a place it goes. A done todo keeps its text,
its id, and its position; the only thing that changes is how it reads.

It reads as **struck through and muted** — a line through the text, and less
contrast than an unfinished one. That pairing is deliberate: the line is what
carries the meaning at a glance, and the muting is what stops a list of finished
todos shouting as loudly as the two that are left. Neither alone is enough —
muting on its own is easy to miss on a bright screen, and a line on its own
keeps full weight in a list being skimmed.

The tick box stays checked, so the state is not carried by colour alone.

## Deletion

Immediate and permanent. There is no undo and no confirmation in this version.
That is a deliberate bet that a list this small is cheap to retype — and a bet
worth revisiting the first time someone reports losing something.
