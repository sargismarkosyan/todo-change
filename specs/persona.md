# Persona

Every spec in this repo is answerable to one question: *does this help them?*
If the answer takes a paragraph to construct, the answer is no.

## Primary — Rowan, keeping today's list

Rowan keeps a short list of things they mean to get done today, and maybe
tomorrow. Five to fifteen items, most of them small.

**Context.** They open the app in a pinned browser tab, on one machine, and
glance at it a dozen times a day. It sits next to their real work, not in front
of it. They are not "doing todo management" — they are trying to not forget the
thing they thought of ninety seconds ago while on a call.

**What good looks like to them.** The thought leaves their head and lands in the
list before it evaporates. Later, the list tells them what is left without
having to be read carefully. At the end of the day the ticked ones are proof
they did something.

**What annoys them.** Anything between them and typing. A field that needs to be
clicked into. A confirmation dialog for a two-word todo. A list that rearranges
itself so the thing they were about to click has moved. Losing something they
typed, ever — that one is not annoyance, it is the end of trust in the tool.

**What they will never do.** Fill in a due date. Set a priority. Assign a
category. Archive anything. Read a settings screen. If a feature only pays off
for someone who does these things, it is not for Rowan.

**Their real alternative** is a paper sticky note, not another app. That is the
bar: faster than a pen, and it survives being closed.

## Not for

Stating this plainly, because most feature requests drift here:

- **Teams.** No assigning, sharing, commenting, or seeing anyone else's list.
- **Project tracking.** No sub-tasks, dependencies, milestones, or estimates.
- **Archives.** The list is about now. History is not a feature.
- **Multi-device life.** One machine, one browser. Sync is a different product.

A request that only makes sense for one of these is not a small feature. It is a
different persona, and it needs to be argued for as such.

## The other person in the room

The human testing this repo is **not** Rowan. They are stress-testing the app on
purpose — pasting odd input, opening devtools, corrupting `localStorage`, trying
things Rowan never would.

Both matter, differently. What the tester *finds* is real: a crash is a crash.
What the tester *wants* has to be checked against Rowan before it becomes a
spec. "I tried to paste a 4,000-word note and it looked bad" is a genuine
finding about robustness; it is not a request for rich text.
