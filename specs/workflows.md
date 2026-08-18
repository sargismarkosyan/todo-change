# Workflows

The five things Rowan actually does. Specs are written against these, and a
change that does not make one of them shorter, safer, or clearer needs a good
argument.

See [persona.md](persona.md) for who Rowan is.

---

## 1. Capture — get it out of my head

**Trigger.** A thought arrives, usually while doing something else.

**Steps.** Focus the box → type one line → press Enter → back to what they were
doing.

**Done well.** Under three seconds, no mouse, no decisions. The new todo is
visibly *there* — at the top, where the eye already is.

**The notepad it lands in** is whichever one is open, and the box never asks.
That is the load-bearing part of notepads: the choice happens rarely, when
switching, and never here.

**Where it breaks.** Anything that adds a step: a field that must be clicked, a
category to pick, a notepad to choose, a save button. Silent failure is worse —
if a todo does not appear, Rowan does not find out until the thing is
forgotten.

**The steps case.** Sometimes the thought that arrives is one thing with a few
steps in it. Those go in as sub-todos, typed on the parent's own row — the box
at the top of the list never asks which todo you meant, so plain Capture keeps
its three seconds.

**Specs.** `features/todo/adding.feature`, `features/todo/sub-todos.feature`,
`features/notepads/switching.feature`

---

## 2. Review — what is left?

**Trigger.** Glancing at the tab between other work, a dozen times a day.

**Steps.** Look. That is the whole workflow.

**Switching notepads sits here**, and nowhere else. It is the rare, deliberate
version of the glance: not "file this correctly", but "show me the other list".
The name of the open notepad is on screen throughout, because that is what says
which list is being looked at.

**Done well.** Unfinished items are legible in one glance without reading
carefully. Done items are visibly out of the way without having moved.

**Where it breaks.** A list that reorders itself, so what was second is now
fifth. Done and unfinished looking too similar to separate at a glance — or too
different, so the list becomes noisy. An empty list showing a blank panel, which
reads as "broken", not "finished".

**Specs.** `features/todo/completing.feature`, `features/todo/empty-state.feature`,
`features/notepads/switching.feature`, `features/notepads/creating.feature`

---

## 3. Complete — tick it off

**Trigger.** Finishing something.

**Steps.** Click the checkbox. Done.

**Done well.** One click, instant, and the row stays where it was so the next
click lands where expected. This is the workflow with the reward in it — it
should feel good.

**Where it breaks.** A row that jumps on being ticked, taking the next row with
it and causing a mis-click. Any lag, which the app has no excuse for. And, once
todos have steps under them: a parent struck through while a step below it is
still open, which makes the list lie to the glance in workflow 2.

**Sub-todos.** Ticking the last step ticks the thing itself, so finishing a
multi-step todo needs no extra click to close it out. Ticking the parent instead
ticks every step under it, for when it turns out the whole thing is done.

**Specs.** `features/todo/completing.feature`,
`features/todo/sub-todos-completing.feature`

---

## 4. Prune — clear out what is done or dead

**Trigger.** The list has grown noisy, usually end of day.

**Steps.** Delete finished or irrelevant todos, one at a time.

**Done well.** Fast and repeatable. The list gets shorter and the remaining
items are all real.

**Where it breaks.** A confirmation on every delete, which turns pruning into a
chore. And the opposite failure: deleting the wrong row, which has no undo. Rows
are addressed by id precisely so that a deletion during pruning hits what was
aimed at.

Deleting a todo that has steps under it takes them with it — the group is the
unit, and leaving orphaned steps behind would be worse than either outcome.

**A whole notepad can go too**, which is the largest thing this app can destroy.
An empty one goes like a todo does, immediately; one with todos still in it asks
once and says how many are about to go. That is the only question this app asks
before deleting anything, and it is asked because the number is information
rather than ceremony.

**Specs.** `features/todo/deleting.feature`, `features/notepads/deleting.feature`

---

## 5. Return — come back and find it intact

**Trigger.** Reopening the tab. Next morning, after a restart, after a crash.

**Steps.** Open the app. Look.

**Done well.** Everything is exactly as it was left — same items, same order,
same ticks, and the same notepad open. Nothing to restore, nothing to confirm.
A list saved before notepads existed opens as one, called "My list", with
nothing else different about it.

**Where it breaks.** This is the workflow that carries the most risk and the
least visible surface. There is no server: `localStorage` is the only copy, it
can be edited in devtools, overwritten by a second tab, or cleared by the
browser. A bad read must still open a usable list — a blank screen here costs
more than any missing feature, because it ends trust in the tool.

**Specs.** `features/storage/persistence.feature`, `features/storage/recovery.feature`,
`features/storage/notepads-migration.feature`

---

## Reading this as a map

Capture and Complete are where the value is. Review is what makes them worth
doing. Prune is maintenance. Return is the floor everything else stands on.

Most good changes make Capture or Complete shorter. Most bad ones add a step to
Capture to serve something Rowan does once a month.
