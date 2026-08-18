# Notepads — general spec

A notepad is a named list of todos. There is always at least one, exactly one is
open, and the list on screen is the open one's. Everything in `features/todo/`
describes what happens *inside* a notepad; nothing there changes.

## Why more than one

Rowan's real alternative is a sticky note, and people do not keep one sticky
note. There is one on the monitor and one on the fridge, and the reason is not
organisation — it is that looking at the fridge should not show you work.

That is the whole of what a notepad is: a way to look at less. It is not a
category on a todo, not a filter, not a tag. A todo is *in* a notepad the way a
line is on a note, and it never had to be told which one.

## The one thing that must not change

**Capture does not gain a decision.** The box asks nothing about notepads; a new
todo lands in whichever notepad is open, because that is the one being looked
at. `workflows.md` names "a category to pick" as what breaks Capture, and the
difference is that the choice happens rarely, at switch time, not on every add.

If that is ever traded away — a notepad picker beside the box, a default-notepad
setting, an "unfiled" notepad — this feature has cost more than it bought.

## Where it lives on screen

Next to the title, showing the open notepad's name, and opening a short menu:
the notepads to switch between, then making, renaming and deleting. It is a
menu over the one page, not a screen to navigate to — the list stays where it
is behind it. `persona.md` rules out reading a settings screen, and a popover
that is opened for two seconds and closed is not one.

The name of the open notepad is on screen at all times, because a list of five
todos looks much the same in any notepad and adding to the wrong one is the
mistake this feature makes possible.

## Ordering

Notepads sit in the order they were made, oldest first, and a new one is
appended. This runs opposite to todos, which are newest first, for the same
reason todos are: nothing rearranges itself under the cursor. Todos churn daily
and the newest is the one being looked at; notepads are made once and then
navigated by remembered position, so the first one stays first.

## Names

One line, trimmed, and that is all that is required of it. Names are not unique
— two notepads called "Home" are allowed, in the same way two todos may read
"Buy milk", because a notepad is addressed by id and never by name. It is a
confusing thing to do rather than an invalid one, and renaming is one click
away.

A blank name is not a name: a notepad cannot be made or renamed with one, which
is what makes an all-whitespace notepad impossible.

## Deleting, and the size of the mistake

Deleting a notepad is the first action in this app that can destroy more than
what is under the cursor. There is still no undo, so the protection is
proportionality rather than ceremony:

- **An empty notepad** is deleted immediately, with nothing asked. Nothing is at
  stake, and asking would be the confirmation dialog `persona.md` complains
  about.
- **A notepad with todos in it** is asked about once, and the question says how
  many todos go with it. That number is the whole point of the question — "are
  you sure?" is noise, "3 todos" is information.
- **Only the open notepad can be deleted**, so the thing being destroyed has
  been looked at first. It also keeps the delete control away from the rows used
  to switch, where a mis-click would be one pixel from routine.
- **The last notepad cannot be deleted.** There is always somewhere for a todo
  to go, so there is no empty state below the empty state.

Deleting one leaves the notepad before it open, or the first one if it was
already first.

## What a notepad is not

- **Not an archive.** `persona.md` still rules those out. Every notepad is a
  live list you switch to and look at; nothing is moved somewhere to stop being
  visible, and there is no notion of past.
- **Not a project.** Notepads do not nest, do not carry state of their own, and
  do not know anything about each other.
- **Not sync.** One browser, one machine, as before. Two tabs on this app still
  overwrite each other — see `../storage/spec.md`, now with the sharper edge
  that the two tabs may be on different notepads and still share one key.
