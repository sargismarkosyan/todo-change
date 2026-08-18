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

Sub-todos run the other way: **oldest first**, appended to the bottom of their
parent's group. That is a deliberate divergence, not an oversight. Top-level
ordering is newest-first so the thing just captured is under the eye, which is
where the box is. A sub-todo's box sits at the bottom of its group, so the same
argument puts the newest one there — and steps carry a natural sequence that
reversing would fight.

## Nesting

A todo may hold one flat level of sub-todos. A sub-todo is a todo in every other
respect — same shape, same id rules, same text rules, ticked and deleted the
same way — it simply lives under another one and offers no nesting of its own.

The cap is the feature. Two levels is an outline, an outline is a project plan,
and `persona.md` says who that is not for. Enforcing depth in the UI rather than
the data means there is no state to reach that the screen cannot draw.

Sub-todos are typed on their parent's own row. The box at the top of the list is
untouched by any of this, because Capture is the workflow with the least room to
spare in it.

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

**A parent is done exactly when all of its sub-todos are done.** This is one
invariant, not two behaviours, and it holds no matter which end was clicked:
ticking the last open step closes the parent, ticking the parent closes every
step, and unticking either end reopens the other. Adding a step to a done parent
reopens it, since the new step is not done.

Two sources of truth for one fact is where trust goes, so there is only one: the
screen may never show a struck-through parent above an open step. A todo that
has *no* sub-todos is untouched by the invariant — it is done when it is ticked,
and losing its last sub-todo leaves it exactly as it was rather than tidying it
into done.

## Deletion

Immediate and permanent. There is no undo and no confirmation in this version.
That is a deliberate bet that a list this small is cheap to retype — and a bet
worth revisiting the first time someone reports losing something.

Deleting a parent deletes its sub-todos with it: the group is the unit, and a
step outliving the thing it was a step of is not a state worth having. It also
raises the stakes of that bet, since one mis-click can now take four lines
instead of one.
