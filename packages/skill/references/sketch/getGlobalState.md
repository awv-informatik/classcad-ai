# sketch.getGlobalState

One cheap call (~1.5 ms on a native worker) that says how the sketch's solver stands — empty/dead, under-constrained, fully constrained, over-determined or in conflict — plus the entity counts. Reach for it as the gate after building a constrained sketch and before consuming it: geometric conflicts are accepted at maxLevel 31, and this is the cheapest call that flags them. It reports no DOF number and does not say WHICH entity is still free or conflicting.

```js
const r = await api.v1.sketch.getGlobalState({ id: skId })   // id = sketch id only
r.result === {
  status: 'OK',            // see table
  pointCount: 10,          // every CC_Point incl. line ends, arc ends, centres
  lineCount: 2, arcCount: 1, circleCount: 2,   // construction curves INCLUDED
  solidCount: 3,           // non-construction curves (profile-capable)
  constructionCount: 2,
  constraintCount: 1,      // geometric constraints incl. auto ones (Rect_*, Auto_*); dimensions excluded
  dimensionCount: 1,       // dimensional constraints, including ones whose value failed
}
```

Every count equals the length of the matching [getObjectsLists](getObjectsLists.md) array (`points`, `lines`, …, `solidGeometry`, `constructionGeometry`, `constraints`, `dimensions`). maxLevel 31, no messages, on every valid sketch. Counts and status are live: no recalc is needed after creating geometry, constraints or dimensions (see the stale-status trap for deletions).

## status

| status | Meaning | Observed on |
|---|---|---|
| `UNDEFINED` | No solve has happened | Empty sketch; a **planeless** sketch at every step, with any amount of geometry |
| `OK` | Solved, DOF remain | Any under-constrained sketch — incl. one with every shape dimension but no anchor (it floats), and a lone free construction line (construction geometry carries DOF too) |
| `FULLY_CONSTRAINED` | Solved, 0 DOF | Fixed line + length + ANGLEOX; rect + FIXATION corner + width + height; circle + fixed centre + RADIUS; same on a custom work plane and on a face sketch |
| `OVERDEFINED` | Solved, consistent but over-determined | A redundant dimension that agrees with the rest (VD 50 on a height already OFFSET 50; OFFSET 50 + HD 30 + VD 40 on a fixed line, geometry exact); a line drawn horizontal (it gets `Auto_H`) with FIXATION on both endpoints |
| `NOT_SOLVED` | Conflict | HORIZONTAL + VERTICAL on one line (both calls maxLevel 31); a dimension value that contradicts the others (that call 51) |

Walk of one sketch on Top: empty `UNDEFINED` → slanted line `OK` → + FIXATION on start point `OK` → + OFFSET 45 `OK` → + ANGLEOX 30deg `FULLY_CONSTRAINED`. On a fixed rect, deleting the height dimension drops it to `OK`; re-adding returns `FULLY_CONSTRAINED`.

## Traps

- **Planeless = `UNDEFINED` forever.** A sketch created without `planeId` stays `UNDEFINED` with geometry, constraints and dimensions present (constraints never move anything, see [create.md](create.md)); counts are identical to a planed sketch. A planed sketch reports `UNDEFINED` only while empty — even a lone free point is `OK`. Rule: `status === 'UNDEFINED'` while any count > 0 ⇒ dead solver.
- **A point at the origin is auto-fixed.** `rectangle` brings 8 constraints (`Rect_Coinc`×4, `Rect_Par`, `Rect_Perp`×2, `Rect_H`); a corner at `[0,0,0]` adds `Auto_Fix`, so width + height alone give `FULLY_CONSTRAINED` (a lone point at the origin is `FULLY_CONSTRAINED` by itself). Off origin the same rect stays `OK` until something anchors it.
- **Not every redundancy shows.** A second HORIZONTAL on a fixed rect's `Rect_H` line, and one on the opposite line (implied via `Rect_Par`), both left `FULLY_CONSTRAINED` (constraintCount +2); `getDiagnosticsInfo` listed only the first (`DUPLICATE`). `FULLY_CONSTRAINED` does not prove the scheme is free of redundant constraints; `OVERDEFINED` does prove one exists.
- **Axis-aligned seeds carry auto constraints.** A line drawn horizontal gets `Auto_H`; fixing both its endpoints then reads `OVERDEFINED`, and the same on a slanted seed reads `FULLY_CONSTRAINED`. OVERDEFINED is solved geometry but brittle: changing a dimension inside the redundancy fails (`updateDimension` 0, status `NOT_SOLVED`).
- **`NOT_SOLVED` poisons the whole sketch.** After a silent H+V conflict on line X, a consistent `OFFSET value 30` on an unrelated line Y fails 51 `Couldn't set the value for dimension $72 of type "OFFSET"`. Check the status BEFORE blaming a dimension that errors.
- **A dimension that errors 51 stays in the sketch** (dimensionCount counts it) and keeps the status at `NOT_SOLVED`. Its id is the `$N` in the message — the display `CC_*FeatureDimension`; `deleteObject({ ids: [N] })` re-solves and restores the status (a fixed, dimensioned rect went back to `FULLY_CONSTRAINED`).
- **Stale after deleting a geometric constraint.** `deleteObject` of a constraint does not re-solve: a rect that lost its FIXATION still reports `FULLY_CONSTRAINED` (constraintCount 8); a sketch whose conflicting VERTICAL was deleted still reports `NOT_SOLVED`. Adding a constraint, a point or a dimension, or `common.recalc()`, refreshes it (→ `OK`). Deleting a dimension or geometry re-solves immediately. Call `common.recalc()` before trusting the gate after deletions.
- **`updateDimension` result mirrors this status, it is not a fully-constrained flag:** `0` = `NOT_SOLVED`, `1` = solved (`OK` or `FULLY_CONSTRAINED` — numeric and `@expr` alike), `2` = `OVERDEFINED`. Read the status here instead.
- **Consumed sketches answer normally.** Same status and counts before and after `part.extrusion`, and after re-dimensioning through it. The status covers the sketch only: after `updateDimension` on a consumed sketch the extrusion kept its old volume (80 000) until `common.recalc()` (→ 100 000).
- **`id` must be a sketch id.** Part, work plane, curve, point, constraint, dimension (either node) or region id → 51, code 1001 `The parameter "id" has a wrong id type! Provide only following id types: ["sketch"]`. Unknown number or unparsable string → warning 41 + 51/1006 `An element of parameter "id" has an invalid id!`. Missing → 51/1004. Strict script runners throw with that text.

## With getDiagnosticsInfo

Observed side by side in these runs: every `NOT_SOLVED` came with at least one `conflictingSets` entry (the unsatisfied constraint, the ones it fights — sometimes none listed — and the entities); every `OVERDEFINED` came with EMPTY diagnostics (consistent redundancy is not reported there); a same-type duplicate appeared in `redundantConstraints` while the status stayed `FULLY_CONSTRAINED`; on a planeless sketch this call says `UNDEFINED` while diagnostics lists every constraint as a conflicting set. Gate on this call; call [getDiagnosticsInfo](getDiagnosticsInfo.md) on `NOT_SOLVED` to find the culprits (~2.5 ms).

## Working example — gate before extruding

```js
const partId = (await api.v1.part.create({ name: 'Plate' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const r = (await api.v1.sketch.rectangle({ id: skId, startPos: [10, 10, 0], endPos: [90, 60, 0] })).result
const corner = (await api.v1.sketch.getPoints({ id: r[0] })).result.startId
await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [corner] })
await api.v1.sketch.dimension([
  { id: skId, type: 'OFFSET', geomIds: [r[0]], value: 80 },
  { id: skId, type: 'OFFSET', geomIds: [r[1]], value: 50 },
])

const s = (await api.v1.sketch.getGlobalState({ id: skId })).result
const geometry = s.pointCount + s.lineCount + s.arcCount + s.circleCount
if (s.status === 'UNDEFINED' && geometry > 0) throw new Error('dead solver — sketch was created without planeId')
if (s.status === 'NOT_SOLVED') {
  const d = (await api.v1.sketch.getDiagnosticsInfo({ id: skId })).result
  throw new Error('conflict: ' + JSON.stringify(d.conflictingSets))
}
if (s.status !== 'FULLY_CONSTRAINED') console.log('sketch not fully constrained:', s.status)
// s → { status: 'FULLY_CONSTRAINED', lineCount: 4, pointCount: 8, constraintCount: 9, dimensionCount: 2, solidCount: 4, ... }
await api.v1.part.extrusion({ id: partId, references: r, type: 'UP', limit2: 20 })
```

`FULLY_CONSTRAINED` says the scheme is determined, not that the values match the drawing — read positions back for that ([recipes/constrained-sketching.md](../../recipes/constrained-sketching.md)).

## Related

[getDiagnosticsInfo](getDiagnosticsInfo.md) · [getObjectsLists](getObjectsLists.md) · [constraint](constraint.md) · [dimension](dimension.md) · [updateDimension](updateDimension.md) · [deleteObject](deleteObject.md) · [create](create.md)
