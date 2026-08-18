# Spec 0007: a real hand

- **Status:** approved
- **Issue:** [#8](https://github.com/sargismarkosyan/todo-change/issues/8) — the
  last piece of it.

## Who this is for

Nell, in **Browse**: the moment of opening the app. See
[persona.md](../persona.md).

**This reverses a decision, and the reversal is the spec.** 0005 was specced
with "system fonts only, no webfont and no font file", and recorded it in
`features/look/spec.md` so it would not be relitigated. It is being relitigated,
on evidence that did not exist when it was made.

## The job behind the request

Unchanged since 0005: **the thing holding my recipes should feel like the thing
it replaced.** #8 asked for a granny's recipe book, and a grandmother's recipe
book is handwritten. That is not decoration on the request; it is most of it.

## Why now

Because 0005 and 0006 shipped and were looked at, and the thing they are missing
is the same thing both times.

The stack was Segoe Print, Bradley Hand, Apple Chancery and then a serif. On a
machine that has one of those it works. **On a machine that has none — which
includes the one every clip in `docs/screenshots/` is recorded on — there is no
second voice at all**, and "Ingredients" and "Method" differ from the lines under
them by colour alone. Two versions of look work were being carried entirely by
palette and rules.

The original reasoning was sound and the conclusion was wrong, which is worth
separating:

- **"A font host is a request on every load and a second origin the app depends
  on."** Still true, and still ruled out. Nothing here links to one.
- **"A `.woff2` is a binary asset in a repository whose whole argument is
  readable diffs."** True, and it turns out to be a much smaller cost than
  losing the thing the version exists for. The binary is 73 KB, is written once,
  never appears in a diff again, and adds no build step. The readable-diffs
  argument is about *code*, and a font is not code.

## The end value

The book is handwritten where a book is handwritten: on the cover, on the book's
name, and on the two labels inside a recipe. Everything read while cooking stays
in the book face, so nothing gets harder to read at arm's length.

**How we would know it worked:** the clip for this version shows handwriting,
which no clip in the series does. And the check that keeps it honest: the app
still asks no other machine for anything when it draws itself.

## What changes

- **`src/fonts/caveat-latin-400.woff2`** — Caveat, weight 400, latin subset,
  73 KB, SIL Open Font License, with `caveat-OFL.txt` beside it and a README
  saying what it is for.
- **`@font-face` in `styles.css`**, pointing at that file and no other origin.
- **Caveat goes to the front of the labelling stack.** The system handwriting
  names stay behind it, and it still ends in Palatino and then a serif rather
  than `cursive` — that fallback now only matters if the file fails to load.
- **The masthead and the headings are re-sized** to sit right in the new face,
  which runs smaller than a serif at the same size.

**Rules added or changed:**

| Rule id | Feature file | New or changed |
|---|---|---|
| `nothing-is-fetched-from-elsewhere` | `features/look/paper.feature` | new |

That rule is the point of self-hosting rather than linking, so it is the thing
worth writing down. It is deliberately broader than fonts: it will fail for the
next tempting CDN too.

`handwriting-labels-but-is-not-read` is unchanged and still enforced — the new
face labels and is not read from.

Prose updated in the same pass: `features/look/spec.md` (the faces section,
rewritten — it previously argued for exactly what this change undoes) and
`specs/setup/constraints.md` (a static asset is not a dependency).

## What we are not doing

- **No font host, now or later.** The reasoning that ruled it out in 0005 is
  the reasoning that survives, and `nothing-is-fetched-from-elsewhere` now
  enforces it rather than leaving it to memory.
- **No second face.** One is a voice; two is a ransom note. Adding another needs
  its own spec saying what it is for.
- **No handwriting on anything that is read.** Not recipe names, not
  ingredients, not the method. Legible in four words, tiring in forty.
- **No tighter subset.** A book's name is typed by the person using the app, so
  the character set is not known in advance. The full latin subset is the honest
  size.
- **No `font-display` cleverness.** `swap` and a local file; there is nothing to
  optimise on an origin that is already the machine.

## Data

None.

## Risks

- **73 KB of binary enters a repository that has been text-only.** It is written
  once and never diffed again, and it is the largest single file here apart from
  the clips — which are also binary, also written once, and were never
  controversial.
- **Caveat is a modern casual hand, not a copperplate one.** A fountain-pen
  script would be more literally "granny", and would be markedly harder to read
  on the two headings. This is the legible end of the choice, deliberately.
- **A face that fails to load leaves the fallback**, which is a serif and looks
  like 0006. That is a soft failure and it is the reason the tail of the stack
  was kept.
- **The screenshot series changes character at this version**, so versions 5, 6
  and 7 will look like three passes at the same idea — because they are.

## Acceptance checks

1. Open the app. The cover, the book's name, and the "Ingredients" and "Method"
   headings are all handwritten. Everything else is not.
2. Open a recipe and read it from a step back. The ingredients and the method
   are as legible as they were in 0006.
3. In devtools, on the network panel, reload. Nothing is requested from any
   host but this one, and the font comes from `src/fonts/`.
4. Disable the font in devtools. The page falls back to a serif and still reads
   as a deliberate second voice, not as the default sans.
5. Take the screenshot. It is the first one in the series with handwriting in it.
