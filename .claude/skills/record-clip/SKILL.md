---
name: record-clip
description: Record the animated GIF a version ships with — the app being used in a real browser — and save it to docs/screenshots/. Use when asked to record, film, screenshot or capture a version, a clip, a GIF or a video of the app, or to show a change moving rather than frozen. Every pull request that changes what the app looks like needs one. Repo-local tooling — it records the app and never changes it.
---

# Record the version

Produces **one looping GIF** in `docs/screenshots/`: the app being *used*, not a
still. It is the only picture a version gets, and the pull request carries it —
see [`specs/setup/repository.md`](../../../specs/setup/repository.md). **Keep it
short**: a handful of seconds, a dozen or so frames. Nobody watches a long one,
and it lives in git forever.

**No PNGs.** A frozen frame is not a deliverable here. Half of what this app does
is something *happening* — a recipe unfolding, a line landing where it was
dropped, a proposal being taken — and that is exactly the half a still drops.

## What to record

**The change this version made, in the shortest sequence that shows it.** Read
the change spec first: its *What changes* section is the shot list, and its
*Acceptance checks* are usually already in order.

Get on screen the thing that is new, plus just enough of what was there before to
make it read. A search shows results from a book that is not open. A front door
shows recipes from books nobody opened. Reordering shows the line *arriving*,
which is two frames minimum.

When the version changed the core of the app rather than one corner, record the
tour instead — name a recipe → fill it in → find it again, the workflows carrying
the value (`specs/workflows/README.md`):

1. The empty book, message showing.
2. Write three recipes down, one at a time — a frame after each.
3. Open one. The recipe unfolding under its name is the moment worth holding.
4. Type an ingredient and a step into it, so it fills in on screen.

Use the vocabulary's own examples, not lorem ipsum. Real-sounding recipes.

## How

1. Start the server in the background: `npm run serve`. The app is ES modules
   and does nothing over `file://`.
2. Drive it with the Playwright browser tools at **900×760** — every version is
   recorded at one size, so the series stays one series.
3. After every step, screenshot to `docs/screenshots/.frames/NN.png` —
   zero-padded so they sort.
4. Hold on a moment by writing the same frame twice. Worth holding: the state
   the change is *about*, and the last frame, so a loop does not snap.
5. Stitch, then clean up:
   ```sh
   python3 tools/clip.py docs/screenshots/.frames docs/screenshots/vNNN-<slug>.gif
   rm -rf docs/screenshots/.frames
   ```
6. Stop the background server.

## Rules

- **Never commit the frames.** Only the finished GIF. `.frames/` is ignored.
- **One GIF per version**, named for the change spec that shipped it —
  `v001-core-todo-list.gif`.
- **Recorded on the branch, before the pull request is opened**, and embedded in
  the body by a raw URL pinned to the commit. A branch URL rots when the branch
  is deleted on merge.
- **Never touch `src/` or `specs/`.** If the recording shows something broken,
  that is a finding: file it with the `feedback` skill. Do not fix it here, and
  do not re-record around it.
- Check the file size before committing. Over ~1 MB means too many frames or too
  large a viewport.
