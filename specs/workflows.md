# Workflows — moved

**This file became [`workflows/`](workflows/README.md) in
[change 0018](changes/0018-what-it-serves.md).** It is kept as a tombstone
because fifteen frozen change specs link to it, and history that stops
resolving stops being evidence — the same job
[`features/RETIRED.md`](features/RETIRED.md) does for spent rule ids.

Nothing here is current. What it said is now in three places:

| What it held | Where it went |
|---|---|
| The five workflows | Six `.feature` files in [`workflows/`](workflows/README.md), each with a trigger, an end state, and examples that are walked by a test |
| *Cook from it* and *Return* | `@guarantee:readable-while-cooking` and `@guarantee:survives-return` in [`spec.md`](spec.md) — neither was ever a bounded attempt |
| *Reading this as a map* | [`workflows/README.md`](workflows/README.md#reading-this-as-a-map), which also carries the table of what became of each of the five |
| The `Specs.` lists | Gone. They were hand-maintained and nine of thirty-five feature files had drifted out of them; a `@workflow:` tag on the feature, gated in both directions, replaces them |
| The arc across months, and the seams between workflows | [`journeys/keeping-what-you-cook.md`](journeys/keeping-what-you-cook.md) |

A change spec written before 0018 that points here is describing the five, and
should be read as history rather than as the contract.
