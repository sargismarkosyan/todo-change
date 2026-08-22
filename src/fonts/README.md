# Fonts

One face, self-hosted. It is here rather than linked from a font host because a
`<link>` to one is a request on every load and a second origin the app depends
on — see [`../../specs/setup/constraints.md`](../../specs/setup/constraints.md).
Nothing this app draws leaves the machine.

## Caveat

- **File:** `caveat-latin-400.woff2` — the latin subset, weight 400, 73 KB.
- **Licence:** SIL Open Font License 1.1, in `caveat-OFL.txt`. Copyright 2014
  The Caveat Project Authors, <https://github.com/googlefonts/caveat>.
- **Used for:** the masthead, the open book's name, the two group headings, and
  the empty-book message. Nothing that is read while cooking — see
  [`../../specs/features/guarantees/spec.md`](../../specs/features/guarantees/spec.md).

The full latin subset is here rather than a tighter one because a book's name is
typed by the person using the app, so the character set cannot be known in
advance.

Adding a second face is a decision, not a detail: it needs a change spec saying
what it is for and why the first one cannot do it.
