# Persona

Every spec in this repo is answerable to one question: *does this help them?*
If the answer takes a paragraph to construct, the answer is no.

## Primary — Nell, cooking from what they have written down

Nell cooks most nights, from recipes they have been collecting for years: a card
in a grandmother's handwriting, one a friend read out over the phone, one they
improvised in March that happened to work.

**Context.** They open the app in a pinned browser tab, on one machine, twice in
an evening. Once at the point of deciding what to make, standing at the fridge
with the door open. Once with the pan already on, glancing back at it with their
hands full. It is not open all day, and there is nothing to keep on top of.

**What good looks like to them.** A recipe someone is reading out gets written
down before they hang up. Weeks later, opening the book shows a page of names,
and the one they want opens with the ingredients at the top — because what it
takes is what decides whether it is tonight's dinner. Nothing has expired, been
tidied away, or asked to be marked as anything.

**What annoys them.** Retyping something they already wrote down. Hunting for
the recipe they know is in there somewhere. Being asked, by a thing that is
supposed to be a book, whether they have *finished* a cake. And losing something
they wrote — that one is not annoyance. Some of these exist nowhere else.

**Books are occasions, not categories.** Sweets, Dinner, Chicken, the four
things they make when there is no time. Which book a recipe goes in is answered
by whichever one is already open, because they were already in it when the
recipe turned up. A book is chosen by opening it, and never asked for while
typing.

**What they will never do.** Tick a recipe off. Rate one, time one, scale one,
count servings, log what they ate, or fill in a nutrition panel. Photograph the
food. Read a settings screen. If a feature only pays off for someone who does
these things, it is not for Nell.

**A settings screen, not a switch.** What that line rules out is a place you go
to configure the thing before using it — a page, a list of options, a decision
asked before there is a reason for one. It does not rule out a switch, in a
popover, holding an answer somebody has already been asked for once. The book
menu has been exactly that since 0006, and `features/books/spec.md` makes the
same argument: opened for two seconds and closed is not a screen. If either of
them ever grows a third line, that is the signal this distinction has stopped
being honest.

**Their real alternative** is a drawer of loose paper and a phone full of
screenshots. That is the bar: quicker to find than the drawer, and it survives
being closed.

## Not for

Stating this plainly, because most feature requests drift here:

- **Teams.** No sharing, publishing, commenting, or seeing anyone else's book.
- **Meal planning.** No calendar, no week ahead, no shopping list, no "what's for
  dinner on Thursday". Those are a different product that happens to read
  recipes.
- **Nutrition and scaling.** No calories, no macros, no serving maths, no unit
  conversion. An ingredient is a line of text on purpose — see
  [features/recipes/spec.md](features/recipes/spec.md).
- **Importing from the web.** No pasting a URL and having it filled in. There is
  no backend to fetch with, and a recipe fetched from a site is somebody else's,
  in somebody else's words.

  **"Typing it out is how it ends up in your words" is amended, not deleted.**
  Version 0009 lets the browser's own model draft a recipe's ingredients and
  method, accepted a line at a time. What that sentence protected was
  *provenance* — that the book holds what you decided goes in it — and that is
  now protected by acceptance rather than by typing. Nobody's recipes are better
  for having been typed twice. What it did not survive is the claim that the
  labour itself is the point. See
  [features/suggesting/spec.md](features/suggesting/spec.md), which also writes
  down what this costs.
- **Multi-device life.** One machine, one browser. Sync is a different product.

A request that only makes sense for one of these is not a small feature. It is a
different persona, and it needs to be argued for as such.

## Archives, and why this reads differently now

The old persona said "the list is about now, history is not a feature". **That
sentence is retired with it.** A recipe book is an archive and that is the whole
point of one: it holds what you are not cooking today so it is still there in
March. Nothing here is put away to stop being visible — every book is opened and
read — but nothing ages out either, and nothing is kept only because it is
current.

This is the direct contradiction that [change 0004](changes/0004-recipe-book.md)
exists to resolve, and it is resolved by changing the product rather than by
finding a reading of the old persona that lets it through.

## The person this app used to be for

Versions 0001–0003 were built for **Rowan**, who kept a short list of things to
do today, wanted them out of their head in three seconds, and wanted them gone
once done. Notepads were their second sticky note.

Rowan is not Nell, and the difference is not a matter of degree: Rowan's items
existed to be got rid of, and Nell's exist to be kept. The reasoning written for
Rowan stays in `changes/0001`–`0003` as the history of a product that changed
direction, and is not evidence about what Nell wants.

What carried over, and why, is in [change 0004](changes/0004-recipe-book.md):
one browser tab, no backend, nothing between the person and typing, and a list
that never rearranges itself under the cursor.

## The other person in the room

The human testing this repo is **not** Nell. They are stress-testing the app on
purpose — pasting odd input, opening devtools, corrupting `localStorage`, trying
things Nell never would.

Both matter, differently. What the tester *finds* is real: a crash is a crash.
What the tester *wants* has to be checked against Nell before it becomes a spec.
