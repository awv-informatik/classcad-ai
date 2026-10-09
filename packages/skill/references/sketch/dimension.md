# sketch.dimension

Creates dimensional constraints — active constraints that drive the solver to resize/reposition geometry to the value.

**Critical:** the solver only runs when the sketch has an explicit `planeId` (`sketch.create({ id: partId, planeId })`). Without it nothing is enforced: a dimension WITH a `value` fails 51 "Couldn't set the value for dimension $N" while its solver constraint is stored anyway, and `sketch.getGlobalState` reads `UNDEFINED`. Fix an anchor (FIXATION) first — without one the solver may move geometry unexpectedly; a point at the origin already carries `Auto_Fix`.

## Key Parameters

- **`id`** (required) — sketch ID
- **`type`** (required) — see table
- **`geomIds`** (required) — geometry IDs; contents depend on type
- **`value`** (optional) — omit to lock the current measurement without resizing. Accepts:
  - numbers `50`; formulas `'60+10'`, `'sqrt(2)*50'` (evaluated at creation)
  - angles `'60deg'` — **ANGLE without `deg` is radians**
  - **`@expr.NAME` binds LIVE** on OFFSET, HORIZONTAL_DISTANCE, RADIUS, DIAMETER, ANGLE, ANGLEOX: sets the dim AND keeps tracking — a later `updateExpression` re-solves immediately, no recalc. Formulas work: `'@expr.W*2'`, `'2*@expr.W'`. No prefix (`'W*2'`) and `$NAME` fail. The expression MUST exist, created with the `toCreate` form: `part.expression({id, name, value})` is a silent no-op that LOOKS successful, and `@expr` on the missing name errors 51 "Couldn't set the value for dimension". When an @expr dim fails, check `getExpression` FIRST.
  - **ANGLE + `@expr`: expression is in radians.** `A = 'C:PI/6'` or `0.5236` → 30°; `A = 30` is 30 rad. `A = 'a_r(30)'` is accepted and stored but does not drive the sketch — use `C:PI` or numbers.
- **`name`** (optional) — tree name; default auto-names by type
- **`dimPos`** (optional) — `[x, y, 0]` text position; for ANGLE also selects the angular sector
- **`reflex`** (optional, ANGLE only, default `false`) — `true` constrains the outer angle (>180°)

## Dimension Types

| Type | geomIds | Structure Class | Auto-name | Measures |
|---|---|---|---|---|
| `OFFSET` | `[line]` / `[line1, line2]` | `CC_LinearFeatureDimension` | "Offset" | Line length, or perpendicular distance between parallel lines |
| `HORIZONTAL_DISTANCE` | `[line]` / `[pt1, pt2]` | `CC_LinearFeatureDimension` | "HD" | X extent / horizontal point distance |
| `VERTICAL_DISTANCE` | `[line]` / `[pt1, pt2]` | `CC_LinearFeatureDimension` | "VD" | Y extent / vertical point distance |
| `RADIUS` | `[circle]` / `[arc]` | `CC_RadialFeatureDimension` | "R" | Radius |
| `DIAMETER` | `[circle]` / `[arc]` | `CC_DiameterFeatureDimension` | "D" | Diameter (`value: 60` → radius 30). ⚠️ May never answer — use RADIUS (Gotchas) |
| `ANGLE` | `[line1, line2]` | `CC_AngularFeatureDimension` | "Ang" | Angle between lines (`dimPos` sector, `reflex`) |
| `ANGLEOX` | `[line]` | `CC_AngularFeatureDimension` | — | Line angle to X axis |

## Return Value

`result: id | VOID | Array<id|VOID>` — single param → ID, array of params → array of IDs (batch: `api.v1.sketch.dimension([{...}, {...}])`).

- IDs are `CC_*FeatureDimension`, not the internal `CC_2D*Constraint` (both can share a name). When recovering from `api.tree()`, filter by feature-dimension class as well as name; `members.master.value` points to the constraint.
- **Non-null result ≠ success.** Check `maxLevel ≤ 31`; a dim can get an ID yet fail the solver (51).

## Solver Behavior

- **Values drive geometry at creation:** `RADIUS value: 22.5` resized an r=20 circle to r=22.5; HD=38/VD=0 between centers moved a free circle from (90,55) to exactly (78,40).
- **Re-solve cascades.** `updateDimension` re-solves everything constrained to the dim — a doubly-tangent R10 fillet followed a Ø45→Ø60 boss to (60, 75.199432), analytic to float precision. See `recipes/constrained-sketching` Step 4.
- **Geometry `lgsState`: 16/20 = `FULLY_CONSTRAINED`, 32/36 = still free (`OK`), 8 = `OVERDEFINED`** — read it decoded as `status` via [getObjectInfo](getObjectInfo.md); constraint-node values in [constraint](constraint.md#solver-behavior).

## Gotchas

- **`dimPos` at creation fails for HD/VD point pairs** — `Function InitDimensionByPosition not found` (call throws). Create without `dimPos`, then `updateDimensionPosition`. (ANGLE sector `dimPos` is unaffected.)
- **HD/VD point-pair dims are UNSIGNED and branch-keeping:** geomIds order irrelevant, `value` is absolute, and the solver keeps the SEED's side (up/down, left/right) even when the seed is far off. The side is encoded ONLY by the seed; a LARGE driving jump (cascade moving the anchor further than the local feature scale) can re-solve onto the MIRROR branch — all constraints satisfied, lgsState 1, updateDimension result 2, geometry on the wrong side. ANSI tooth sketch: teeth 21→24 in one update flipped working-arc centers below their anchor; **stepping 21→22→23→24 kept the correct branch, float-exact**. Step large changes or add side-encoding constraints.
- **Negative values at creation fail** — `Couldn't set the value for dimension` (51). Via `updateDimension`: result 0, geometry takes `|value|`.
- **Over-constraining** — what the call returns depends on the extra dim:

  | Extra dimension | Call | Geometry | Signals |
  |---|---|---|---|
  | agrees with the rest (VD 50 on a height already OFFSET 50) | 31 | unchanged | `getGlobalState` `OVERDEFINED` |
  | same type on the same line, other value (OFFSET 60 on a line OFFSET 40) | 31 | keeps the first value | both dims `OVERDEFINED` in [getObjectInfo](getObjectInfo.md) (each reports its own requested `value`); `getDiagnosticsInfo` lists it only as `DUPLICATE`; `getGlobalState` `NOT_SOLVED` |
  | contradicts other constraints (VD on a fully dimensioned rectangle; OFFSET 70 on a line with both ends fixed) | 51 `Couldn't set the value for dimension $N` | unchanged | the dim STAYS in the sketch; `NOT_SOLVED`; its solver id is `unsatisfied` in [getDiagnosticsInfo](getDiagnosticsInfo.md) |

  While any constraint or dimension is unsatisfied (a `conflictingSets` entry — a lone `DUPLICATE` does not count), every later value `dimension` in that sketch also ends 51 (and `updateDimension` returns 0), even when its own value applied — a 51 can come from a conflict elsewhere. Find the culprit with `getDiagnosticsInfo` and `deleteObject` it (the display `$N` or the solver id). See [getGlobalState](getGlobalState.md).
- **DIAMETER may never answer.** In a sketch that already holds solved content (other dimensions, a fixed center), `type: 'DIAMETER'` got no answer — the call times out after 30 s and the script stalls (the worker keeps serving other sessions); on a fresh sketch it answered. Use RADIUS with half the value.
- **Dimension handles die on every `postTrim`** (seen under the former `splitCurvesMergeBack`; re-verify on retrain) — recreated with new IDs, names preserved. Re-fetch by name before `updateDimension` after trimming, else 1006 "invalid id". Dims survive the trim and keep driving — incl. a DIAMETER whose circle became an arc.
- **Tree value storage:** RADIUS/DIAMETER — `members.value`, `members.radius`/`members.center`; linear — `members.startPt`/`members.endPt` (value derived); angular — varies.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"type must be provided"` / `"geomIds must be provided"` | 1004 | Missing param |
| `"not valid. Possible values are: [...]"` | 1013 | Invalid type string |
| `"Datamember radius not found"` | 0 | RADIUS/DIAMETER on non-circular geometry (e.g. line) → null |
| `"Wrong number of geometry ids for offset"` | 0 | OFFSET on wrong type/count (e.g. circle) → null; needs 1 or 2 lines |
| `"Couldn't set the value for dimension"` | 0 | Negative/invalid value, missing `@expr` expression, a value that contradicts the sketch, an unsatisfied constraint anywhere in the sketch, or a planeless sketch |
| `"Index N ausserhalb des Arraybereichs"` | 0 | Too few geomIds (ANGLE with 1 line — use ANGLEOX) |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'DimDemo' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

// No FIXATION: the corner at the origin already carries Auto_Fix (a second one reads OVERDEFINED).
// Batch; solver resizes rectangle to 100x60
const dims = (await api.v1.sketch.dimension([
  { id: skId, name: 'width', type: 'OFFSET', geomIds: [rectIds[0]], value: 100 },
  { id: skId, name: 'height', type: 'OFFSET', geomIds: [rectIds[1]], value: 60 },
])).result // [dimId1, dimId2], maxLevel 31; getGlobalState 'FULLY_CONSTRAINED'
```

## Related

`sketch.updateDimension` · `sketch.updateDimensionPosition` · `sketch.constraint` · `sketch.deleteObject`
