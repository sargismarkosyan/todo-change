#!/usr/bin/env python3
"""Stitch numbered PNG frames into one short looping GIF.

    python3 tools/clip.py <frames-dir> <out.gif> [ms-per-frame]

Frames are taken in filename order, so name them 01.png, 02.png, ... Repeat a
frame to hold on a moment. Needs Pillow; python3 is already a dev dependency
here, since `npm run serve` is python3's http.server.
"""
import pathlib
import sys

from PIL import Image

if len(sys.argv) < 3:
    sys.exit(__doc__)

frames_dir = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2])
ms = int(sys.argv[3]) if len(sys.argv) > 3 else 650

paths = sorted(frames_dir.glob("*.png"))
if not paths:
    sys.exit(f"no .png frames in {frames_dir}")

frames = [Image.open(p).convert("RGB") for p in paths]

# Half resolution. The clip is for glancing at, and it lives in git forever.
width, height = frames[0].size
frames = [f.resize((width // 2, height // 2), Image.LANCZOS) for f in frames]

# Collapse runs of identical frames into one frame held for longer. Repeating a
# frame is how the caller asks for a pause, and PIL's optimiser would otherwise
# drop the duplicate and take the pause with it.
kept, durations = [], []
for frame in frames:
    if kept and frame.tobytes() == kept[-1].tobytes():
        durations[-1] += ms
    else:
        kept.append(frame)
        durations.append(ms)

out.parent.mkdir(parents=True, exist_ok=True)
kept[0].save(
    out,
    save_all=True,
    append_images=kept[1:],
    duration=durations,
    loop=0,
    optimize=True,
)
frames = kept
print(f"{out} — {len(frames)} frames, {out.stat().st_size // 1024} KB")
