---
name: record-clip
description: Record a short clip of the app's main workflow running in a real browser and save it to docs/screenshots/. Use when asked to record, film, or capture a video, clip or GIF of the app, or to show the workflow moving rather than a still. Repo-local tooling — it records the app and never changes it.
---

# Record the workflow

Produces one looping GIF in `docs/screenshots/`: the app being *used*, not a
still. **Keep it short** — a handful of seconds, a dozen or so frames. Nobody
watches a long one, and it lives in git forever.

## What to record

Write it down → Browse → Cook from it, in that order and nothing else. Those are
the three workflows carrying the value; see `specs/workflows.md`.

1. The empty book, message showing.
2. Write three recipes down, one at a time — a frame after each.
3. Open one. The recipe unfolding under its name is the moment worth holding.
4. Type an ingredient and a step into it, so it fills in on screen.

Use the vocabulary's own examples, not lorem ipsum. Real-sounding recipes.

## How

1. Start the server in the background: `npm run serve`. The app is ES modules
   and does nothing over `file://`.
2. Drive it with the Playwright browser tools at **900×760**. After every step,
   screenshot to `docs/screenshots/.frames/NN.png` — zero-padded so they sort.
3. Hold on a moment by writing the same frame twice. Worth holding: the recipe
   opening, and the finished recipe with its ingredients above its method.
4. Stitch, then clean up:
   ```sh
   python3 tools/clip.py docs/screenshots/.frames docs/screenshots/vNNN-<slug>.gif
   rm -rf docs/screenshots/.frames
   ```
5. Stop the background server.

## Rules

- **Never commit the frames.** Only the finished GIF. `.frames/` is ignored.
- **One clip per version**, named for the change spec that shipped it —
  `v001-core-todo-list.gif`.
- **Never touch `src/` or `specs/`.** If the recording shows something broken,
  that is a finding: file it with the `feedback` skill. Do not fix it here, and
  do not re-record around it.
- Check the file size before committing. Over ~1 MB means too many frames or
  too large a viewport.
