# Persona — moved

**This file became [`personas/`](personas/README.md) in
[change 0018](changes/0018-what-it-serves.md).** It is kept as a tombstone
because seventeen frozen change specs link to it, and history that stops
resolving stops being evidence — the same job
[`features/RETIRED.md`](features/RETIRED.md) does for spent rule ids.

Nothing here is current.

| What it held | Where it went |
|---|---|
| Nell | [`personas/nell.md`](personas/nell.md), tagged `@persona:nell` |
| Rowan, *"the person this app used to be for"* | [`personas/rowan.md`](personas/rowan.md), tagged `@persona:rowan @retired` |
| *"The other person in the room"* — the tester | [`personas/README.md`](personas/README.md#the-other-person-in-the-room). No tag, on purpose: they are not who the product is for, and a tag would let a workflow be written for them |

It was split so a persona could be tagged and counted: every workflow must name
a live persona, and every persona must be named by a workflow or carry
`@retired`. A tag needs a file to sit on, which one combined file could not
give.
