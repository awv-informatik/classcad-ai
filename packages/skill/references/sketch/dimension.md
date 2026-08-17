# sketch.dimension

Creates dimensional constraints in a sketch. Dimensions are active constraints — they drive the solver to resize/reposition geometry to match the specified value.

**Critical:** The constraint solver only runs when the sketch has an explicit `planeId`. Without it, dimensions are stored but never enforced.

## Prerequisites

- A part (`part.create`)
- A sketch created **with `planeId`** (`sketch.create({ id: partId, planeId: topPlane.id })`)
- Sketch geometry (lines, circles, arcs, points) to dimension
- Anchor geometry with FIXATION before adding dimensions — the solver needs a fixed reference

## Key Parameters

- **`id`** (required) — sketch ID
- **`type`** (required) — one of 7 types (see table below)
- **`geomIds`** (required) — array of sketch geometry IDs to dimension. Contents depend on type.
- **`value`** (optional) — target value. Omit to auto-calculate from current geometry. Accepts:
  - Numbers: `50`, `3.14`
  - Formula strings: `'60+10'`, `'sqrt(2)*50'`
  - Angle strings with `deg` suffix: `'60deg'`, `'45deg'`
  - **`@expr.NAME` WORKS and binds LIVE** (verified 2026-08-10 on OFFSET and RADIUS; ANGLE fails with maxLevel 51). `value: '@expr.W'` sets the dim from the expression AND keeps tracking it — a later `updateExpression` re-solves the sketch immediately, no recalc. The referenced expression MUST exist (`toCreate` form!) — a missing name errors 51 "Couldn't set the value for dimension". Formula strings referencing expressions (`'W*2'`), bare names, and `$NAME` still fail.
- **`name`** (optional) — custom name for the dimension in the structure tree. Default auto-names vary by type.
- **`dimPos`** (optional) — `[x, y, 0]` position for the dimension text. For ANGLE, also selects which angular sector to constrain.
- **`reflex`** (optional, ANGLE only) — `true` to constrain the outer angle (>180°). Default `false`.

## Dimension Types

| Type | geomIds | Structure Class | Auto-name | What it measures |
|---|---|---|---|---|
| `OFFSET` | `[line]` or `[line1, line2]` | `CC_LinearFeatureDimension` | "Offset" | Length of one line, or perpendicular distance between two parallel lines |
| `HORIZONTAL_DISTANCE` | `[line]` or `[pt1, pt2]` | `CC_LinearFeatureDimension` | "HD" | Horizontal (X) extent of a line, or horizontal distance between two points |
| `VERTICAL_DISTANCE` | `[line]` or `[pt1, pt2]` | `CC_LinearFeatureDimension` | "VD" | Vertical (Y) extent of a line, or vertical distance between two points |
| `RADIUS` | `[circle]` or `[arc]` | `CC_RadialFeatureDimension` | "R" | Radius of a circle or arc |
| `DIAMETER` | `[circle]` or `[arc]` | `CC_DiameterFeatureDimension` | "D" | Diameter of a circle or arc (value = diameter, not radius) |
| `ANGLE` | `[line1, line2]` | `CC_AngularFeatureDimension` | "Ang" | Angle between two lines. Use `dimPos` to select sector. Use `reflex:true` for outer angle. |
| `ANGLEOX` | `[line]` | `CC_AngularFeatureDimension` | — | Angle of a line relative to the X axis |

## Return Value

```js
{ result: id | VOID | Array<id|VOID>, messages?: [...], maxLevel?: real }
```

- Single param → single ID. Array param → array of IDs.
- **Non-null result does NOT guarantee success.** Always check `maxLevel ≤ 31`. A dimension can be created (get an ID) but produce solver errors (maxLevel=51).

## Batch Creation

Pass an array of param objects to create multiple dimensions in one call:

```js
const ids = (await api.v1.sketch.dimension([
  { id: skId, name: 'width', type: 'OFFSET', geomIds: [bottomLine] },
  { id: skId, name: 'height', type: 'OFFSET', geomIds: [leftLine] },
])).result
// ids = [94, 98]
```

## Solver Behavior

- **Dimensions are active constraints.** Providing a `value` that differs from current geometry causes the solver to reposition geometry immediately. (Re-verified 2026-06-10: `DIAMETER value:45` resized an r=20 circle to r=22.5 at creation; HD=38/VD=0 between centers moved a free circle from (90,55) to exactly (78,40).)
- **Re-solve cascades through the whole system.** Changing a dimension via `updateDimension` re-solves everything constrained to it — a doubly-tangent R10 fillet followed a Ø45→Ø60 boss re-dimension to its new exact position, (60, 75.199432), matching analytic geometry to float precision (verified 2026-06-10). This is the payoff of constraint-driven sketches over hardcoded coordinates: see the worked example in `SKETCHING.md` Step 4.
- **Solved geometry nodes show `lgsState: 16`** in the structure tree (observed on driven circles; constraint nodes use 0/1 for unsolved/solved — the 16 on geometry nodes looks like a different flag set, meaning unconfirmed).
- **Auto-value (omit `value`)** locks the current measurement without resizing. The dimension constrains the geometry to its current size/angle.
- **Fix an anchor first.** Without a FIXATION constraint, the solver may move geometry in unexpected ways. Always fix at least one reference point.
- **Formulas work:** `'60+10'`, `'sqrt(2)*50'`, `'45deg'`. Evaluated at creation time.
- **`@expr.NAME` in `value` binds the dimension to the expression, LIVE** (verified 2026-08-10: OFFSET and RADIUS bound at creation and followed `updateExpression` immediately; also works via `updateDimension`). **ANGLE dims reject @expr** (maxLevel 51). The referenced expression MUST exist: `part.expression({id, name, value})` (missing `toCreate`) is a silent no-op that LOOKS successful, and `@expr` on the resulting nonexistent expression errors 51 "Couldn't set the value". When an @expr dim fails, check `getExpression` FIRST.

## Gotchas

- **⚠️ `dimPos` at CREATION can poison a whole batch.** Passing `dimPos` on
  HORIZONTAL_DISTANCE/VERTICAL_DISTANCE point-pair dims inside a batch made the batch return
  maxLevel 51 with several dims created as VOID and the solve left incomplete (observed
  2026-07-02 on a 21-dim batch; not isolated to a single type). Safe route: create all
  dimensions WITHOUT `dimPos`, then place text with `updateDimensionPosition` — that works on
  every type. (`dimPos` for ANGLE sector selection is a different, documented use.)
- **HD/VD point-pair dims are UNSIGNED and branch-keeping** (probed 2026-08-10): geomIds order is
  irrelevant, `value` is an absolute distance, and the solver keeps the SEED's side (up/down,
  left/right) — even when the seed is far off. Consequence: the side of a feature is encoded ONLY
  by the seed, and a LARGE driving-value jump (e.g. a cascade that moves the anchor further than
  the local feature scale) can legitimately re-solve onto the MIRROR branch — all constraints
  satisfied, lgsState 1, updateDimension result 2, geometry on the wrong side. Verified on the
  ANSI tooth sketch: teeth 21→24 in one update flipped the working-arc centers below their anchor;
  **stepping the parameter (21→22→23→24) kept the correct branch with float-exact results**.
  Mitigate by stepping large parameter changes, or add side-encoding constraints.
- **DIAMETER value is diameter, not radius.** `value: 60` on a circle means radius=30.
- **ANGLE value needs `deg` suffix.** Use `'60deg'` not `60`. Without the suffix, the value is interpreted as radians.
- **Negative values create broken dimensions.** A negative OFFSET value creates the dimension (gets an ID) but fails to set the value (maxLevel=51). The dimension exists in a broken state.
- **RADIUS on a line → null.** Wrong geometry type for RADIUS/DIAMETER returns null with error "Datamember radius not found".
- **OFFSET on a circle → null.** Wrong geometry type returns "Wrong number of geometry ids for offset".
- **ANGLE needs 2 lines.** Single line → array index error. Use ANGLEOX for angle-to-X-axis on a single line.
- **Over-constraining is silent.** Adding a dimension that conflicts with existing constraints creates the dimension (gets ID) but solver fails (maxLevel=51). Geometry doesn't change.
- **Dimension handles die on every `postTrim`** (verified 2026-06-10, under the former `splitCurvesMergeBack`; re-verify on retrain) — nodes are
  recreated with new IDs (names preserved). Re-fetch by name from the structure tree before
  calling `updateDimension` after any trim workflow, or you get error 1006 "invalid id".
  Dimensions survive the trim itself and keep driving geometry — including a DIAMETER whose
  circle became an arc.
- **Structure tree value storage varies by type:**
  - RADIUS/DIAMETER: explicit `members.value` and `members.radius`/`members.center`
  - Linear dims (OFFSET, H_DIST, V_DIST): `members.startPt` and `members.endPt` — value derived from distance
  - Angular dims: `members` vary

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"type must be provided"` | 1004 | Missing `type` param | Always provide `type` |
| `"geomIds must be provided"` | 1004 | Missing `geomIds` param | Always provide `geomIds` |
| `"not valid. Possible values are: [...]"` | 1013 | Invalid type string | Use exact type strings |
| `"Datamember radius not found"` | 0 | RADIUS/DIAMETER on a non-circular geometry | Use OFFSET for lines |
| `"Wrong number of geometry ids for offset"` | 0 | OFFSET on wrong geometry type or count | OFFSET: 1 line or 2 lines |
| `"Couldn't set the value for dimension"` | 0 | Negative or invalid value | Use positive values |
| `"Index N ausserhalb des Arraybereichs"` | 0 | Too few geomIds (e.g., ANGLE with 1 line) | Check geomIds count per type |

## Working Example

```js
const partR = await api.v1.part.create({ name: 'DimDemo' })
const partId = partR.result
const topPlane = Object.values(partR.structure.tree)
  .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

// Rectangle
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

// Fix bottom-left corner
const pts = (await api.v1.sketch.getPoints({ id: rectIds[0] })).result
await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

// Add named dimensions — solver resizes rectangle to 100x60
const dims = (await api.v1.sketch.dimension([
  { id: skId, name: 'width', type: 'OFFSET', geomIds: [rectIds[0]], value: 100 },
  { id: skId, name: 'height', type: 'OFFSET', geomIds: [rectIds[1]], value: 60 },
])).result
// dims = [dimId1, dimId2], maxLevel = 31
```

## Related

- `sketch.updateDimension` — change dimension value after creation (numbers, formula strings, or `@expr.NAME` live bindings)
- `sketch.updateDimensionPosition` — move dimension text position
- `sketch.constraint` — geometric constraints (non-dimensional)
- `sketch.deleteObject` — delete a dimension (`ids: [dimId]`)
