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

## Text

One line, stored exactly as typed apart from trimming the ends. No markdown, no
links, no formatting. Leading and trailing whitespace is removed on the way in,
which is what makes an all-whitespace todo impossible.

## Deletion

Immediate and permanent. There is no undo and no confirmation in this version.
That is a deliberate bet that a list this small is cheap to retype — and a bet
worth revisiting the first time someone reports losing something.
