# Training: sketch.copyGeometry (Category 4.10 #5)

**Date:** 2026-07-01
**Type:** API study — verify + enrich the existing `references/sketch/copyGeometry.md` against live behavior.

`copyGeometry({ id, geomIds, translation, doCopyConstraints=TRUE })` duplicates geometry **within one sketch**,
offset by a translation vector. (Cross-sketch is `copyFrom`.)

## What I verified (probes 01–03, all live)

A pre-existing doc made several surprising claims. I probed each — **all confirmed**, plus new detail:

| Claim | Result |
|---|---|
| `doCopyConstraints:true`/default → `result: null` (but geometry IS created) | ✅ A: result null, lines 1→2 |
| `doCopyConstraints:false` → `result: id[]` (one per input) | ✅ B: `[70]`; G: `[98,101,104]` for [line,line,circle] |
| `translation` required (not really optional) | ✅ C: error **1004** "must be provided" |
| empty `geomIds` → silent no-op | ✅ D: null, maxLevel 31, no message |
| invalid id → error **1006** | ✅ E (also an internal level-41 "ToId didn't get a valid id") |
| null in `geomIds` → error **1001** wrong type | ✅ F |

### New findings (added to the doc)
- **Child points are copied and translated.** Copy a circle centered `[5,5]` by `[80,0,0]` → the copy's center
  reads back `[85,5,0]`. `result` returns only the parent geom IDs; child points get fresh IDs silently.
- **`true` duplicates geometric constraints.** Copying 2 perpendicular joined lines: constraint nodes +7
  (coincident + perpendicular + auto H/V per copy). CC_Line +2, CC_Point +4.
- **The constraint part of a dimension duplicates, but the annotation does not.** A `RADIUS` dimension's
  `CC_2DRadiusConstraint` went 1→2 on a `true` copy, while `CC_RadialFeatureDimension` stayed 1 → copies are
  size-locked but not re-annotated.
- **`false` = bare geometry**, no constraints at all (not even the auto H/V fresh axis-aligned geometry gets):
  constraint count unchanged across a `false` copy.
- Every response carries `structure` + `graphic` regardless of the flag.

## The one thing to remember
`doCopyConstraints` **controls the return type**, not just constraint behavior: `true` → `null`,
`false` → the array of new IDs. If you need the copied IDs either pass `false`, or diff `getGeometry`
before/after a default copy.

## Files
- `scripts/01-probe.mjs` — return-type / errors / child points / multi-geom order
- `scripts/02-constraints.mjs` — constraint census (true vs false deltas)
- `scripts/03-dim-classes.mjs` — exact dimension/constraint class names before/after
- Skill doc updated: `references/sketch/copyGeometry.md` (verified + "What gets copied" section added)
