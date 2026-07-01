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

---

# sketch.copyFrom (Category 4.10 #6)

`copyFrom({ id: DEST, toCopyId: SRC })` — a **cross-sketch merge**: adds SRC's geometry+constraints into DEST.
Pre-existing `references/sketch/copyFrom.md` was thorough; I verified every claim live (probes 04–05).

| Claim | Result |
|---|---|
| Returns VOID (`null`), maxLevel 31 | ✅ |
| **Merges**, doesn't replace | ✅ dst 1 line → 5 lines + 1 circle (kept its own line, gained src rect+circle) |
| Copies **all** constraints (no flag) | ✅ census doubled: fixation/coincident×4/parallel/perpendicular×2/horizontal×2/radius |
| **No offset** — same positions | ✅ copied circle center reads `[60,15,0]` = src |
| Self-copy duplicates on top | ✅ dst {5 lines,1 circle} → {10,2} |
| Empty source = no-op | ✅ result null, maxLevel 31, dst unchanged |
| part id as dest → 1001 `["sketch"]`; bad toCopyId → 1006 | ✅ |

### Key distinction from copyGeometry (verified, probe 05)
`copyFrom` copies the **full driving dimension**, not just its constraint: a `RADIUS` dim gave both
`CC_2DRadiusConstraint` 1→2 **and** `CC_RadialFeatureDimension` 1→2 (+ a new per-sketch `CC_SketchDimensionSet`).
`copyGeometry(true)` copies only the constraint part (annotation stays). So `copyFrom` = a true sketch merge;
`copyGeometry` = element duplication (with translation, optional constraints, and returned ids when `false`).

- `scripts/04-copyFrom.mjs` — merge / constraints / no-offset / self-copy / empty / errors
- `scripts/05-copyFrom-dim.mjs` — full-dimension copy (annotation) vs copyGeometry
- Skill doc updated: `references/sketch/copyFrom.md` (constraints+full-dimensions, verified)
