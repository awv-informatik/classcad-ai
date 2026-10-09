# part.extrusion

Parametric extrusion feature: sweeps a closed 2D sketch profile along a direction. Unlike `solid.extrusion` (direct geometry in an EIF), it lives in the feature tree, supports `updateExtrusion`, and can be expression-driven.

## Prerequisites

- A sketch created with `planeId` (e.g. `sketch.create({ id: partId, planeId: topPlaneId })`)
- A sketch region (`sketch.sketchRegion`) or contour element IDs forming a closed loop

## Key Parameters

- `id` — **part ID** (not sketch, region, or EIF ID)
- `references` — **required**. Sketch region IDs or contour element (curve) IDs — both work. Must be closed (open → "not manifold"; one stray open curve among the ids is enough). Multiple loops in one array form holes (see below). Multiple region IDs → multiple independent bodies from one feature. **No construction curves:** mixed into curve ids → maxLevel 51 "Selection of construction geometry is not allowed." although the body IS built (do not retry — that stacks a second body); inside a region → 51 "There is at least one construction curve in the region …", no body. `sketch.getObjectsLists().solidGeometry` is the non-construction set.
- `type` — `'UP'` (default, +sketch normal), `'DOWN'`, `'SYMMETRIC'`, `'CUSTOM'` (uses `direction`)
- `limit2` — distance (default 100). Numbers or expressions (`'@expr.H'`). Negative reverses direction
- `limit1` — start offset, CUSTOM only (default 0)
- `direction` — **sketch-local** vector, CUSTOM only. `[0,0,1]` = sketch normal on Top, Front and Right alike (world +Z, +Y, +X). World `[1,0,0]` on a Right-plane sketch is an in-plane direction and fails. Magnitude irrelevant (`[0,0,1]` ≡ `[0,0,10]`; limits control distance — unlike `solid.extrusion`). Silently ignored for UP/DOWN/SYMMETRIC
- `taperAngle` — radians (default 0). Positive = inward (top smaller), negative = outward. Accepts expressions
- `capEnds` — **integer** `1` (default, solid) or `0` (sheet body, no caps). NOT `'TRUE'`/`'FALSE'`
- `name` — default "Extrusion"

## Type Behavior

| Type      | Direction                | limit1       | limit2                       | Result                          |
| --------- | ------------------------ | ------------ | ---------------------------- | ------------------------------- |
| UP        | +sketch normal           | ignored      | distance in + direction      | Extrudes "up" from sketch       |
| DOWN      | -sketch normal           | ignored      | distance in - direction      | Extrudes "down" from sketch     |
| SYMMETRIC | both                     | ignored      | total distance split equally | Centers on sketch plane         |
| CUSTOM    | sketch-local `direction` | start offset | end offset                   | `[0,0,1]` follows sketch normal |

"Up"/"down" are relative to the sketch normal, not world Z (Front plane, normal [0,1,0] → UP extrudes along Y).

## Return Value

Feature ID (numeric), maxLevel 31; works with `openFeature`, `closeFeature`, `updateExtrusion`. On error: null, or a feature ID with maxLevel 51 (degenerate feature).

## Profiles with holes (multi-loop)

- **Nested loops auto-subtract.** Pass ALL loops' curve ids in ONE `references` array: `[outerCircle, innerCircle]` → annulus, one body (vol 25131.9 ≈ analytic, r=30/10 × h=10); rectangle lines + hole circles → plate with holes, one body. No boolean needed for holes in the same sketch.
- **Containment is even-odd**: an island inside a hole materializes again — `[r40, r20, r8]` → annulus + island post (volume matches analytic sum).
- **Loop order is irrelevant** — `[inner, outer]` ≡ `[outer, inner]`.
- **Disjoint outers combine in one call**, each hole assigned to its containing outer (two plates + their two holes → both plates-with-holes from one feature).
- **Loops must not touch or cross.** A hole straddling the outline fails with error 1121 "Curves … self intersect at least at position {x,y,z}" — and STILL returns a feature id at maxLevel 51 that you must `deleteFeature`. Pre-check with [`sketch.getTopologyInfo`](../sketch/getTopologyInfo.md): its `intersectingCurves` names the crossing pair and point. Two loops sharing a collinear edge are NOT reported there and fail with position "unknown".
- **`CC_SketchRegion` exists only AFTER a curve-based extrusion** (child of the sketch, named "SketchRegion"); a fresh sketch has none, so a first extrusion goes by curve ids. `getSketchRegion({ id: partId, name: 'SketchRegion' })` resolves it; passing that region id re-extrudes the SAME multi-loop profile, holes included (volume exactly doubled extruding the region the other way).
- `updateExtrusion` can change `references` too (e.g. rectangle → circle) inside `openFeature`/`closeFeature`; error 1200 "not active and open" means the feature was not opened.

## Gotchas

- **Pass `planeId` to `sketch.create`.** Without it, curve references still extrude (default XY), but region references fail with `Sketch.GetNormal:CCObject can not be opened`, and the sketch's constraint solver does not run.
- **`references` is required** despite the bracket notation in docs. Empty `references: []` returns a degenerate feature ID (maxLevel 51, "Nothing was selected").
- **Direction can't be perpendicular to the sketch normal** (error 1122; `[1,0,0]` on XY is invalid).
- **`limit2=0` creates a degenerate feature** (feature ID, maxLevel 51, error 1122). Negative `limit2` is valid: UP with -30 extrudes downward, DOWN with -30 upward.
- **Feature params are not readable via `getExpression`** — `getExpression({ id: featureId, name: 'limit2' })` returns null; they are internal, not named expressions.
- **Extrusions are additive**: each creates a separate body. For cuts, extrude then `part.boolean`.
- **Taper + non-normal CUSTOM direction fails**: taper only works when direction is perpendicular to the sketch plane; `[1,0,2]` with taperAngle > 0 → "Extrudedirection with taper angle is not normal to curves."

## Common Errors

| Code | Message | Cause | Fix |
| ---- | ------- | ----- | --- |
| —    | "The provided id for the part is not a part id." | Sketch/region/EIF ID as `id` | Use part ID |
| —    | "The parameter 'references' must be provided" | `references` omitted | Always pass `references` |
| 1122 | "Nothing was selected" | `references: []` | Pass at least one region or curve ID |
| 1122 | "Height not valid. Value for height must be greater than 0" | `limit2: 0` | Use positive or negative limit2 |
| 1122 | "Direction can't be perpendicular to the normal vector of sketch plane" | Direction in sketch plane | Needs a component along the normal |
| —    | "Brep after linear sweep not manifold" | Open profile | Close the profile |
| 1001 | "capEnds has the wrong type" (…"It should be of type (boolean)") | String instead of integer | Use `1` or `0` |
| —    | "Sketch.GetNormal:CCObject can not be opened" | Region reference from a sketch without `planeId` | Set `planeId` on `sketch.create` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

// From region
const extId = (await api.v1.part.extrusion({ id: partId, name: 'MyExtrusion', references: [regionId], type: 'UP', limit2: 60 })).result
// From curve IDs directly (no region needed)
await api.v1.part.extrusion({ id: partId, references: rectIds, limit2: 40 })
// Expression-driven with taper
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 50 }] })
await api.v1.part.extrusion({ id: partId, references: [regionId], limit2: '@expr.H', taperAngle: 0.1 })
// Custom diagonal direction
await api.v1.part.extrusion({ id: partId, references: [regionId], type: 'CUSTOM', direction: [1, 0, 1], limit1: 0, limit2: 50 })
// Sheet body
await api.v1.part.extrusion({ id: partId, references: [regionId], limit2: 40, capEnds: 0 })
```

## Related

[`part.updateExtrusion`](updateExtrusion.md) · `part.boolean` · `sketch.sketchRegion` · `sketch.rectangle` / `sketch.line` / `sketch.circle` · `part.box` · `solid.extrusion`
