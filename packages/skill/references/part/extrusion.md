# part.extrusion

Creates a parametric extrusion feature inside a part by sweeping a 2D sketch profile along a direction. Unlike `solid.extrusion` (direct geometry in an EIF), this lives in the feature tree, supports `updateExtrusion`, and can be driven by expressions.

## Prerequisites

- A part (`part.create`)
- A sketch with `planeId` set (e.g., `sketch.create({ id: partId, planeId: topPlaneId })`)
- Either a sketch region (`sketch.sketchRegion`) or sketch contour elements (line IDs forming a closed loop)

## Key Parameters

- `id` — **part ID** (not sketch ID, not region ID, not EIF ID)
- `references` — **required**. Array of sketch region IDs or sketch contour element IDs (line IDs). Both work. Must form a closed profile — open profiles fail with "not manifold."
- `type` — extrusion direction mode:
  - `'UP'` (default) — extrudes along sketch plane normal (+Z for XY plane)
  - `'DOWN'` — extrudes opposite to sketch normal
  - `'SYMMETRIC'` — extrudes equally in both directions from the sketch plane
  - `'CUSTOM'` — extrudes along a user-specified `direction` vector
- `limit2` — extrusion distance (default: 100). Accepts numbers or expressions (`'@expr.H'`). Negative values reverse the direction.
- `limit1` — start offset, only used with CUSTOM type (default: 0)
- `direction` — `[x, y, z]` vector, **only used with CUSTOM type**. Silently ignored for UP/DOWN/SYMMETRIC. Must not be perpendicular to the sketch plane normal. Magnitude is irrelevant — `limit2` controls the distance (unlike `solid.extrusion` where direction magnitude IS the distance).
- `taperAngle` — taper angle in radians (default: 0). Positive = inward taper (top smaller), negative = outward. Accepts expressions.
- `capEnds` — **integer boolean** (1 or 0, NOT strings 'TRUE'/'FALSE'). `1` (default) = solid body, `0` = sheet body (no top/bottom caps).
- `name` — feature name (default: "Extrusion")

## Return Value

Feature ID (numeric) on success, with maxLevel=31. The feature ID works with `openFeature`, `closeFeature`, `updateExtrusion`.

On error: returns null or a feature ID with maxLevel=51 (degenerate feature).

## Gotchas

- **Sketch MUST have `planeId` set.** Without it, extrusion produces maxLevel=51 error (`Sketch.GetNormal:CCObject can not be opened`) even though geometry may be created. Always pass `planeId` to `sketch.create`.
- **`references` is required** despite the bracket notation in docs. Omitting it gives: "The parameter 'references' must be provided."
- **Empty `references: []` creates a broken feature.** Returns a feature ID with maxLevel=51: "Nothing was selected." The feature exists but is degenerate.
- **`capEnds` is an integer, not a string.** Passing `'TRUE'` or `'FALSE'` fails with: "has the wrong type! It should be of type (boolean)". Use `1` or `0`.
- **`direction` is silently ignored for non-CUSTOM types.** No error, no warning — it just does nothing.
- **Direction magnitude doesn't matter.** `[0,0,1]` and `[0,0,10]` produce identical results. Distance is controlled by `limit2`, not the vector length. This is different from `solid.extrusion`.
- **Direction can't be perpendicular to sketch normal.** Error code 1122: "Direction can't be perpendicular to the normal vector of sketch plane." For a sketch on XY plane, `[1,0,0]` is invalid.
- **`limit2=0` creates a degenerate feature.** Returns feature ID with maxLevel=51, error 1122: "Height not valid. Value for height must be greater than 0."
- **Negative `limit2` reverses direction.** UP with limit2=-30 extrudes downward. DOWN with limit2=-30 extrudes upward. This is valid, not an error.
- **Feature parameters are not readable via `getExpression`.** Calling `getExpression({ id: featureId, name: 'limit2' })` returns null. Feature params are internal, not named expressions.
- **Extrusions are additive.** Each extrusion creates a separate body. For subtraction (holes, cuts), create the extrusion then use `part.boolean`.
- **Taper + non-normal custom direction fails.** With CUSTOM type, taperAngle only works when the direction is perpendicular to the sketch plane. A diagonal direction like `[1,0,2]` with taperAngle > 0 errors: "Extrudedirection with taper angle is not normal to curves."
- **Multiple regions = multiple bodies.** Passing multiple sketch region IDs in `references` creates multiple independent bodies from one feature.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| — | "The provided id for the part is not a part id." | Passed sketch/region/EIF ID as `id` | Use part ID from `part.create` |
| — | "The parameter 'references' must be provided" | `references` omitted | Always pass `references` |
| 1122 | "Nothing was selected" | Empty `references: []` | Pass at least one region or line ID |
| 1122 | "Height not valid. Value for height must be greater than 0" | `limit2: 0` | Use positive or negative limit2 |
| 1122 | "Direction can't be perpendicular to the normal vector of sketch plane" | Direction in sketch plane | Direction must have component along sketch normal |
| — | "Brep after linear sweep not manifold" | Open profile (lines don't form closed loop) | Ensure closed profile |
| 1001 | "capEnds has the wrong type" | Passed string instead of integer | Use `1` or `0`, not `'TRUE'`/`'FALSE'` |
| — | "Sketch.GetNormal:CCObject can not be opened" | Sketch created without `planeId` | Set `planeId` on `sketch.create` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

// Create sketch WITH planeId
const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const rectIds = (await api.v1.sketch.rectangle({
  id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0]
})).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

// Extrusion from region
const extId = (await api.v1.part.extrusion({
  id: partId,
  name: 'MyExtrusion',
  references: [regionId],
  type: 'UP',
  limit2: 60,
})).result
// extId → 96 (feature ID)

// Alternative: pass line IDs directly (no region needed)
const extId2 = (await api.v1.part.extrusion({
  id: partId,
  references: rectIds, // [58, 64, 70, 76]
  limit2: 40,
})).result

// Expression-driven
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 50 }] })
const extId3 = (await api.v1.part.extrusion({
  id: partId,
  references: [regionId],
  limit2: '@expr.H',
  taperAngle: 0.1,
})).result

// Custom direction (diagonal extrusion)
const extId4 = (await api.v1.part.extrusion({
  id: partId,
  references: [regionId],
  type: 'CUSTOM',
  direction: [1, 0, 1], // diagonal — magnitude doesn't matter
  limit1: 0,
  limit2: 50,
})).result

// Sheet body (no caps)
const extId5 = (await api.v1.part.extrusion({
  id: partId,
  references: [regionId],
  limit2: 40,
  capEnds: 0, // integer, NOT string
})).result
```

## Type Behavior

| Type | Direction | limit1 | limit2 | Result |
|------|-----------|--------|--------|--------|
| UP | +sketch normal | ignored | distance in + direction | Extrudes "up" from sketch |
| DOWN | -sketch normal | ignored | distance in - direction | Extrudes "down" from sketch |
| SYMMETRIC | both | ignored | total distance split equally | Centers on sketch plane |
| CUSTOM | user-specified `direction` | start offset | end offset | Extrudes along custom vector |

**Note:** "up" and "down" are relative to the sketch plane normal, not world Z. A sketch on the Front plane (normal=[0,1,0]) extrudes along Y for UP.

## Related

- [`part.updateExtrusion`](updateExtrusion.md) — modify after creation (requires `openFeature`/`closeFeature`)
- `part.boolean` — combine extrusion with other features (union, subtraction, intersection)
- `sketch.sketchRegion` — create the region reference
- `sketch.rectangle` / `sketch.line` / `sketch.circle` — create contour elements for references
- `part.box` — simpler alternative for rectangular solids (no sketch needed)
- `solid.extrusion` — direct extrusion in EIF (no feature tree, no update, direction magnitude = distance)
