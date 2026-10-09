# sketch.getObjectInfo

One sketch id in, "what is it and how does the solver see it" out: kind, circle/arc `radius`, construction/reference flags, the constraints and dimensions that name it, and a per-object solver `status`. Reach for it to **diagnose** a sketch (`getGlobalState` says `NOT_SOLVED`/`OVERDEFINED` → which constraint lost, which points are still free), to read a **radius** (getPositions fails on circles), or to read a constraint's `entities` / a solver dimension's `value`. For a curve's coordinates use [getPositions](getPositions.md) — this returns only endpoint ids for curves.

```js
const o = (await api.v1.sketch.getObjectInfo({ id })).result // one id (number or string); no batch form
```

`id` accepts `sketch-point`, `sketch-curve` and `2dconstraint`: geometric constraints AND the solver-side dimensional constraints (`getObjectsLists().dimensions`), auto-generated ones included. NOT the display dimension `sketch.dimension()` returns (1001).

## Result by kind (live, trimmed)

```js
// POINT (standalone, or a curve's start/end/center point)
{ id: 58, type: 'POINT', geometry: { pos: { x: 30, y: 30, z: 0 } }, constraints: [90], dimensions: [], status: 'OK', isReference: 0 }
// LINE (a construction line: same shape, isConstruction: 1)
{ id: 60, type: 'LINE', geometry: { startId: 61, endId: 62 }, constraints: [66, 88], dimensions: [],
  status: 'FULLY_CONSTRAINED', isConstruction: 0, isReference: 0 }
// CIRCLE
{ id: 72, type: 'CIRCLE', geometry: { centerId: 73, radius: 12 }, constraints: [], dimensions: [96],
  status: 'OK', isConstruction: 0, isReference: 0 }
// ARC (arcByCenter and arcBy3Points alike)
{ id: 75, type: 'ARC', geometry: { startId: 77, endId: 76, centerId: 78, radius: 14.999999999999991 },
  constraints: [], dimensions: [], status: 'OK', isConstruction: 0, isReference: 0 }
// CONSTRAINT (FIXATION, PARALLEL, COINCIDENT, TANGENT, SYMMETRY, Auto_* … all look alike)
{ id: 88, type: 'CONSTRAINT', entities: [60, 68], status: 'OK' }
// DIMENSION (solver-side CC_2D*Constraint, e.g. OFFSET on a line)
{ id: 92, type: 'DIMENSION', value: 50, entities: [61, 62], status: 'OK' }
```

- `pos` is a `{x,y,z}` object in WORLD coordinates, same as getPositions (Front-plane sketch, local (10,20) → `{ x: 10, y: 0, z: -20 }`).
- After the solver moves geometry, `pos` and `radius` are bit-identical (`Object.is`) to getPositions and the tree: no lag, no rounding.
- `entities` keep the `geomIds` order you passed (SYMMETRY: axis first; COINCIDENT `[line, point]` stays `[line, point]`).
- `value` is in mm for lengths and **radians** for ANGLE/ANGLEOX (`'30deg'` → `0.5235987755982988`). Formulas come back evaluated (`'sqrt(2)*47'` → `66.46803743153548`); an `@expr`-bound dim follows `updateExpression` (33 → 44).
- Projected geometry (`referenceGeometry`) reports `isReference: 1` on the curve and its points, `FULLY_CONSTRAINED`.

## status

| status | on | meaning |
|---|---|---|
| `FULLY_CONSTRAINED` | geometry | no freedom left in THIS object |
| `OK` | geometry | still free (point can move, radius or direction unset) |
| `OK` | constraint / dimension | satisfied |
| `NOT_SATISFIED` | constraint / dimension | conflict loser (VERTICAL on a line that already has HORIZONTAL); every constraint of a planeless sketch |
| `OVERDEFINED` | both | duplicate FIXATION on a point (yours on top of an `Auto_Fix`, too), two OFFSETs on one line: the constraints AND the points they name |
| `UNDEFINED` | geometry | sketch created without `planeId` (dead solver) |

Neither this nor `getGlobalState` returns a degrees-of-freedom count; `status` is the only per-object freedom signal. `sketch.getGlobalState` gives the sketch-level status (`NOT_SOLVED` after a conflict, `OVERDEFINED`, `UNDEFINED` when planeless). `status` is the decoded tree `members.lgsState` (constraints: 1 OK, 0 NOT_SATISFIED, 9 OVERDEFINED). Read `status`, not the raw bits.

## Compared with the other getters

| need | getObjectInfo | getPositions | getPoints | getGeometry |
|---|---|---|---|---|
| kind of an id | `type`, incl. CONSTRAINT / DIMENSION | — | — | bucket, geometry only |
| point coordinates | `geometry.pos` | `pos` | — | — |
| line/arc end coordinates | ids only | `startPos`, `endPos`, `centerPos` | ids only | — |
| circle | `centerId` + `radius` | fails (`objId not found`) | `centerId` | bucket |
| arc radius | `radius` | compute from center/start | — | — |
| construction / reference | `isConstruction` / `isReference` | — | — | mixed in |
| constraints and dims on it | `constraints` / `dimensions` | — | — | — |
| solver state | `status` | — | — | — |
| constraint / solver-dim ids | answered | 1001 | 1001 | 1001 |

## Traps

- **Display dimensions are rejected (1001).** `sketch.dimension()` returns the `CC_*FeatureDimension`; ask its solver twin instead: `getObjectsLists().dimensions`, or the display node's `members.master.value` ([STRUCTURE.md](../STRUCTURE.md) sketch anatomy).
- **Flags are `0|1` numbers**, not booleans: `isConstruction === true` is never true. Test truthiness.
- **No `isSatisfied` key** on CONSTRAINT/DIMENSION, despite the JSDoc. Use `status`.
- **No subtype.** `type` is only `'CONSTRAINT'` or `'DIMENSION'`; PARALLEL vs FIXATION, OFFSET vs RADIUS only via the tree class (`CC_2DParallelConstraint`, `CC_2DOffsetConstraint`).
- **`constraints`/`dimensions` list only objects whose `entities` name THIS id.** An OFFSET on a line is stored on its endpoints (`entities: [startId, endId]`): it shows on the two points, `dimensions: []` on the line. A FIXATION on the start point isn't on the line either. To collect everything touching a curve, union the curve with its `startId`/`endId`/`centerId`. RADIUS, TANGENT and PARALLEL name the curves and show there.
- **Curve status ≠ endpoint status.** FIXATION(start) + HORIZONTAL leaves the line `FULLY_CONSTRAINED` and its end point `OK` (it slides along x). A FIXATION on the line id leaves BOTH endpoints `OK`. "Is everything pinned?" → check the points.
- **Geometry status can hide a conflict.** A line with a NOT_SATISFIED VERTICAL beside its HORIZONTAL still reports `FULLY_CONSTRAINED`. Scan the constraints, not the geometry. A duplicate HORIZONTAL isn't flagged at all (both `OK`).
- **`value` is the requested value, not the measured one.** Two OFFSETs of 40 and 60 on one line each report their own value (both OVERDEFINED); the line is 40. Check `status === 'OK'` before trusting `value`.
- **Fixing an origin corner twice reads as OVERDEFINED forever.** `sketch.rectangle` or `sketch.line` starting at (0,0) already carries an `Auto_Fix` on that point; an explicit FIXATION there turns both, the point and `getGlobalState` `OVERDEFINED`. Dimensions still solve, but the diagnosis is spoiled. Look at the point's `constraints` first.
- **No owner link.** A point's info doesn't name its curve; use the tree node's `parent`. No arc direction either (see [arcByCenter](arcByCenter.md)).
- Arc `radius` carries float noise (`14.999999999999991` for 15).
- Lifecycle: deleting a curve kills its points and the constraints naming them (all 1006); deleting a constraint drops it from every curve's list. A CONSUMED sketch (after extrusion) answers unchanged.

## Errors (maxLevel 51; the call throws in scripts)

| code | message | cause |
|---|---|---|
| 1001 | `The parameter "id" has a wrong id type! Provide only following id types: ["sketch-point","sketch-curve","2dconstraint"]` | sketch, part, work plane, sketch region, feature, display dimension |
| 1006 | `An element of parameter "id" has an invalid id!` (+ level-41 `ToId()` warning, code 0) | nonexistent or deleted id |
| 1004 | `The parameter "id" must be provided in the api call!` | missing `id` |
| 0 | `[Evaluation error in SketchAPI_v1.getObjectInfo::PROC:[CCVM::ldm: objId not found]]` | array of params: no batch form, loop single calls |

## Working example: find the losing constraint and the free points

```js
const partId = (await api.v1.part.create({ name: 'Diag' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const [b] = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [b], value: 100 })
await api.v1.sketch.constraint({ id: skId, type: 'VERTICAL', geomIds: [b] }) // fights the rectangle's own horizontal

const state = (await api.v1.sketch.getGlobalState({ id: skId })).result.status // 'NOT_SOLVED'
const lists = (await api.v1.sketch.getObjectsLists({ id: skId })).result
const bad = []
for (const id of [...lists.constraints, ...lists.dimensions]) {
  const o = (await api.v1.sketch.getObjectInfo({ id })).result
  if (o.status !== 'OK') bad.push({ id, status: o.status, entities: o.entities })
}
const free = []
for (const id of lists.points) {
  const o = (await api.v1.sketch.getObjectInfo({ id })).result
  if (o.status !== 'FULLY_CONSTRAINED') free.push({ id, status: o.status, pos: o.geometry.pos })
}
// bad  → [{ id: 96, status: 'NOT_SATISFIED', entities: [58] }]  — the VERTICAL on the bottom line
// free → the 4 top-corner point ids, status 'OK' at y = 50 (the height is not dimensioned)
```

## Related

[getObjectsLists](getObjectsLists.md) (the ids to feed in) · [getPositions](getPositions.md) · [getPoints](getPoints.md) · [getGeometry](getGeometry.md) · [constraint](constraint.md) · [dimension](dimension.md) · `sketch.getGlobalState` (sketch-level status and counts) · [STRUCTURE.md](../STRUCTURE.md) (sketch anatomy: display vs solver dimensions)
