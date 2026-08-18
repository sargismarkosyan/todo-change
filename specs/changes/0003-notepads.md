# Spec 0003: notepads

- **Status:** approved
- **Issue:** [#7](https://github.com/sargismarkosyan/todo-change/issues/7)

## Who this is for

Rowan, in **Review** (step: the glance — but the rare, deliberate version of it,
"show me the other list") and in **Return** (step: opening the tab and finding
the same notepad open). It touches **Capture** only by promising not to: the box
gains nothing and asks nothing.

**This widens the persona, and that has to be said out loud.** `persona.md`
listed "Assign a category" under what Rowan will never do, and `spec.md` said
the product was one person "keeping a short list", singular. A second named list
is close enough to a category to need the argument made rather than assumed.

The argument: Rowan's stated alternative is a sticky note, and nobody keeps one
sticky note. There is one on the monitor and one on the fridge, and the reason
is not filing — it is that looking at the fridge should not show you work. That
is the entire job a notepad does here, and it is a *narrower* thing than a
category, in the way that matters:

- A category is answered **on the way in**, for every todo. A notepad is
  answered by whatever was already on screen, and changes only when Rowan says
  so — a handful of times a day at most, against a dozen captures.
- A category makes one list carry more information. A notepad makes each list
  carry **less**. The point is to look at less, which is what `workflows.md`
  says Review is for.

What does *not* get argued for, and stays out: notepads are not archives
(`persona.md` still rules those out — every notepad is a live list that is
switched to and looked at, not somewhere things go to stop being visible), not
projects, and not a step towards sync.

**The reporter is the tester, not Rowan.** #7 came from stress-testing, so the
request went through the persona check rather than around it. What survived is
the sticky-note argument above. What did not survive is the phrase "full notepad
management system": there is no settings screen here, and there is no screen at
all — see *What changes*.

## The job behind the request

Things that have nothing to do with each other end up in the same glance,
because there is exactly one place to put anything. Home things and work things,
this week and someday. Rowan cannot look at one of them without reading past the
others, and the only way to separate them today is to delete and retype.

The job: **keep more than one short list, and be able to look at just one of
them, without being asked which one every time something is typed.**

## Why now

Nothing is broken; this is a capability gap and should be labelled as one. #7
was filed as a feature request, and #8 asks for the same container in different
clothes ("themed books — sweets, dinner, chicken"), which is the strongest
evidence that one list is the shape people keep bumping into.

What it costs today is Review, the workflow with the least tolerance for noise.
A fifteen-item list that is really two six-item lists and three that belong to
neither reads slower than either list would alone, and the reading happens a
dozen times a day. The workaround — keeping the second list somewhere else, or
in the same list and ignoring it — is what the app was supposed to replace.

There is also a *now* reason rather than a *someday* one: this is the last
version at which the migration is cheap. Every version that ships on the bare
array under `todo-change.todos` is another version's worth of stored lists to
move, and moving them is the only genuinely risky part of this change.

## The end value

Rowan can keep home and work apart, look at one of them at a time, and still
capture a thought in three seconds without deciding anything — because the
notepad on screen is the answer. Coming back next morning opens the notepad they
left, with everything in it.

**How we would know it worked:** the glance gets shorter — the list on screen is
one notepad's worth rather than everything — while Capture is measurably
unchanged: same keystrokes, same box, no mouse, no notepad named at any point
during an add. Negatively: if anyone ever has to pick a notepad while typing a
todo, this change failed regardless of which rules pass.

## What changes

- **The title bar gains the open notepad's name**, with a menu behind it. It is
  the only new chrome on the page, and it says at all times which list is being
  looked at.
- **The menu** lists the notepads — click one to switch — and then, below them,
  making a new one, renaming the open one, and deleting the open one. It is a
  popover over the page, not a screen: the list stays where it is behind it, and
  it closes on the next click. `persona.md` rules out reading a settings screen;
  this is not one, and it must not grow into one.
- **Making a notepad** is typing a name and pressing Enter, inline in that menu.
  It opens immediately and starts empty. A blank name makes nothing.
- **Switching** replaces the list with that notepad's todos. Nothing else on
  screen changes.
- **The box is untouched.** A new todo lands in the open notepad. There is no
  notepad picker, no default-notepad setting, and no "unfiled".
- **Renaming** the open notepad changes its name and nothing else. A blank name
  is not a rename.
- **Deleting** the open notepad:
  - empty: it goes immediately, with nothing asked, the way a todo does;
  - with todos in it: an inline confirmation in the menu, naming the number of
    todos that would go — "Delete "Home" and its 3 todos?" — with the delete and
    the cancel next to each other. Not a browser dialog;
  - only the *open* notepad can be deleted, so the delete never sits next to the
    rows used for switching;
  - the last remaining notepad offers no delete at all;
  - afterwards the notepad before it opens, or the first one.
- **The empty state is per notepad.** A new notepad says "Nothing to do yet."
  while another one is full.
- **Everything survives a reload**, including which notepad was open.
- **A list saved by version 0002 or earlier opens as one notepad called "My
  list"**, unchanged in content, order or ticks.

**Rules added or changed** — the `@rule:` ids in `specs/features/`:

| Rule id | Feature file | New or changed |
|---|---|---|
| `switch-shows-only-that-notepad` | `features/notepads/switching.feature` | new |
| `capture-goes-to-the-open-notepad` | `features/notepads/switching.feature` | new |
| `create-notepad-opens-it-empty` | `features/notepads/creating.feature` | new |
| `notepad-rejects-blank-name` | `features/notepads/creating.feature` | new |
| `rename-keeps-the-todos` | `features/notepads/renaming.feature` | new |
| `rename-rejects-blank` | `features/notepads/renaming.feature` | new |
| `delete-empty-notepad-goes-without-asking` | `features/notepads/deleting.feature` | new |
| `delete-notepad-with-todos-asks-first` | `features/notepads/deleting.feature` | new |
| `last-notepad-cannot-be-deleted` | `features/notepads/deleting.feature` | new |
| `empty-state-is-per-notepad` | `features/todo/empty-state.feature` | new |
| `persist-notepads` | `features/storage/persistence.feature` | new |
| `old-list-opens-as-one-notepad` | `features/storage/notepads-migration.feature` | new |
| `migration-happens-once` | `features/storage/notepads-migration.feature` | new |
| `recover-from-bad-notepads` | `features/storage/recovery.feature` | new |
| `recover-from-missing-key` | `features/storage/recovery.feature` | **changed** |

`recover-from-missing-key` keeps its id and its point — a browser with nothing
stored opens on a usable screen — but now names both keys and expects the empty
"My list" rather than a bare empty list. Its existing test changes with it. No
other live rule is reworded, and no id changes.

Prose specs updated in the same pass: `persona.md` (the widening, and why a
notepad is not a category or an archive), `workflows.md` (Capture keeps its
three seconds, Review gains switching, Prune gains the notepad delete, Return
gains which notepad opens), `spec.md` (storage contract and vocabulary),
`features/todo/spec.md` (everything there happens inside one notepad),
`features/storage/spec.md` (the migration write, notepad-shaped recovery, the
second-tab gap getting sharper), and a new `features/notepads/spec.md`.

**On the size of this step.** Fourteen new rules and one reworded makes this the
largest change spec in this repo, against 0002's twelve. It was offered as two
— notepads existing, then managing them — and the split was deliberately
declined in favour of shipping
the whole of #7 in one version. That is a defensible call: the alternative ships
a version where a notepad named by a typo can never be removed, and "full
notepad management system" was the literal ask. It is recorded here because the
size is a real risk, and the mitigation is that the *model* is one small thing —
a list of lists — while half the rules are about the two ends nobody gets to
skip: the migration and the delete.

**Switching does not become workflow 6.** It is a rare, deliberate variant of
the glance and lives inside Review in `workflows.md`. A sixth workflow would
claim Rowan does this often, and the whole design here assumes they do not.

## What we are not doing

- **A notepad picker at capture time.** Not now, not later, in any form —
  including a "default notepad" setting or an inbox. This is the line the whole
  change is balanced on.
- **Moving a todo between notepads.** Real, and named in #7 as out of scope for
  the first step. Delete and retype is the answer for now; the fix, when it
  comes, is its own version.
- **Reordering notepads.** They sit in the order made. Same argument as the
  list: nothing rearranges itself under the cursor.
- **A cap on how many notepads.** Considered — the menu gets long — and dropped,
  because a cap is a rule Rowan would meet as an error message. If the menu
  becomes unreadable, that is a report and a spec, not a guess now.
- **An "everything" view across notepads.** That is the single list this change
  exists to break up.
- **Search across notepads.** Needs the container to exist first; it is #9/#10
  territory.
- **Colours, icons, or per-notepad settings.** Chrome earns its place; a name
  does the whole job.
- **A keyboard shortcut for switching.** Tempting, and cheap, but it is the kind
  of thing that gets added because it is cheap rather than because it was asked
  for. If switching turns out to be frequent enough to want one, that is a
  finding worth having.
- **Undo, anywhere.** The delete confirmation is proportionality, not a step
  towards an undo stack. Undo remains unbuilt and unspecced.
- **Anything about two tabs.** Notepads sharpen that known gap
  (`features/storage/spec.md`) and do not address it.
- **The rest of #8.** The recipe-book direction inherits this container and is
  otherwise untouched by this change.

## Data

The key changes. New key `todo-change.notepads`, holding an object:

```json
{
  "notepads": [
    {
      "id": "1739827000000-1a2b3c4d5e6f7a8b",
      "name": "My list",
      "todos": [
        { "id": "1739827200000-9f2c41ab7e0d5c83", "text": "Buy milk", "done": false }
      ]
    }
  ],
  "openId": "1739827000000-1a2b3c4d5e6f7a8b"
}
```

A notepad is well-formed when `id` and `name` are non-empty strings and `todos`
is an array. Todos inside it are unchanged in shape, still newest first, still
with the optional one-level `subTodos`. Notepads sit oldest first. `openId`
names the notepad on screen.

**Existing data must move, and this is the first migration in this repo.** On
read, when `todo-change.notepads` is absent and `todo-change.todos` is present,
the old array is sanitised exactly as it is today, wrapped in one notepad called
"My list", written under the new key, and the old key is removed. It happens
once. The two keys never both hold real data, so there is no question of which
one wins.

That migration write is the only write in this app not caused by something
happening on screen, and `features/storage/spec.md` now says so rather than
leaving it as an exception someone discovers.

On read, everything stays untrusted: a value that is not an object, a `notepads`
that is not an array, or unparseable text all open one empty notepad called "My
list". A junk notepad among good ones is dropped and the rest kept — the same
bet as junk todos. An `openId` naming nothing opens the first notepad.

## Risks

- **Return (workflow 5), and this time it is real.** Every version so far could
  claim "no migration, nothing to rewrite". This one moves everybody's data on
  first open, and a bug in that read is a blank screen or a lost list rather
  than a missing feature. Two rules cover it directly
  (`old-list-opens-as-one-notepad`, `migration-happens-once`) and the manual
  check below is the one that actually matters — a real list saved by the live
  site, opened on the new version.
- **The migration is one-way.** After it, a downgrade to the deployed version
  sees no `todo-change.todos` and opens empty. Nothing is lost — the data is
  under the new key — but the live site and a local checkout will disagree for
  anyone who opens both. Worth knowing before taking the screenshot.
- **Capture regression, which no test can fully catch.** The rules check that a
  todo lands in the open notepad; they cannot check that adding one still
  *feels* like nothing changed. If the eye has to find the notepad name before
  typing, this change cost more than it bought.
- **The first confirmation in the app.** `persona.md` names confirmation dialogs
  as what turns Prune into a chore. The bet here is that proportionality is the
  real rule — nothing is asked for a todo, or for an empty notepad, and the one
  question that exists carries a number rather than "are you sure?". If it reads
  as ceremony in use, that is a report and this is where to look.
- **Deleting a notepad is the largest destructive action here**, and there is
  still no undo. The guard is that only the open notepad can go, and that the
  question says how many todos go with it.
- **Menu discoverability.** A name in the title bar is quiet by design. Someone
  who never clicks it never learns notepads exist — which is the correct outcome
  for someone who only wants one list, and a genuine problem if it turns out to
  be everyone. The screenshot pass is where that gets judged.
- **A second tab gets sharper, not just likelier.** Two tabs on different
  notepads still share one key, so the loser of the race loses todos it was not
  even showing. Still unaddressed, now written down in
  `features/storage/spec.md`.

## Acceptance checks

1. Open the app with a list already saved by the live version. It reads exactly
   as before — same todos, same order, same ticks, same sub-todos — under a
   notepad called "My list". In devtools, `todo-change.todos` is gone and
   `todo-change.notepads` holds it.
2. Add a todo the way you always do: type, Enter. Nothing about it is different,
   no mouse, and nothing asked which notepad.
3. Open the menu, make a notepad called "Home". It opens straight away, empty,
   showing "Nothing to do yet.". Its name is in the title bar.
4. Add "Water plants" to it. Switch back to "My list" — the original list is
   exactly as it was, and "Water plants" is not in it. Switch to "Home" again;
   only "Water plants" is there.
5. Reload. "Home" is still open, with "Water plants" in it.
6. Rename "Home" to "House". The todos are untouched, the title bar follows.
   Try renaming to spaces only — nothing happens.
7. Try making a notepad with a blank name — nothing is made.
8. Delete "House" while it still has a todo in it. You are asked, and the
   question says "1 todo". Cancel: everything is still there. Delete again and
   agree: it is gone, and "My list" is open.
9. Make a notepad, delete it while empty. It goes immediately, with no question.
10. With one notepad left, confirm the menu offers no way to delete it.
11. In devtools, set `todo-change.notepads` to `{not json` and reload. A usable
    empty notepad called "My list" opens.
12. In devtools, set it to
    `{"notepads":[{"id":"a","name":"Home","todos":[]},{"x":1}],"openId":"zz"}`
    and reload. One notepad, "Home", open and usable.
13. Take the screenshot with two notepads and the menu open — that is the
    version's picture.
