# part.twist

Creates a parametric twist feature inside a part by sweeping a 2D sketch profile along a direction while progressively rotating it around the twist axis. Unlike `part.extrusion`, the profile rotates as it sweeps, producing helical/twisted geometry.

## Prerequisites

- A part (`part.create`)
- A sketch with `planeId` set (e.g., `sketch.create({ id: partId, planeId: topId })`)
- Either a sketch region (`sketch.sketchRegion`) or sketch contour elements (line IDs forming a closed loop)

## Key Parameters

- `id` — **part ID** (not sketch ID, not region ID)
- `references` — **required**. Array of sketch region IDs or sketch contour element IDs. Must form a closed profile.
- `twistAngle` — total rotation in radians applied over the full extrusion length (default: 0). This is NOT per-unit-length — it's the total angle from base to top. `0` = straight extrusion. `Math.PI` = 180° twist. `4*Math.PI` = 2 full rotations (drill-bit shape). Negative values reverse twist direction. No upper limit.
- `type` — extrusion direction mode:
  - `'UP'` (default) — along +sketch normal
  - `'DOWN'` — along -sketch normal
  - `'SYMMETRIC'` — both directions equally
  - `'CUSTOM'` — user-specified `direction`, `twistCenter`, and `limit1`
- `limit2` — extrusion distance (default: 100). Negative values reverse direction. Accepts expressions.
- `limit1` — start offset, **CUSTOM type only** (default: 0)
- `direction` — `[x, y, z]` vector, **CUSTOM type only**. Magnitude is irrelevant — `limit2` controls distance. Must not be perpendicular to sketch normal.
- `twistCenter` — `[x, y, z]` point defining the twist axis position, **CUSTOM type only** (default: [0,0,0]). The twist axis is the line through `twistCenter` in the `direction` vector. When the profile is offset from this axis, it orbits around it, creating curved/banana-shaped bodies. When the axis passes through the profile center, the twist is purely in-place.
- `capEnds` — **integer boolean** (1 or 0, NOT strings). `1` (default) = solid body, `0` = sheet body (no top/bottom caps).
- `name` — feature name (default: "Twist")

## Return Value

Feature ID (numeric) on success, with maxLevel=31. Works with `openFeature`, `closeFeature`, `updateTwist`.

## Gotchas

- **`twistCenter` and `direction` are CUSTOM-only.** Silently ignored for UP/DOWN/SYMMETRIC — no error, no warning, no effect.
- **`twistCenter` offset creates orbital paths.** If the twist axis doesn't pass through the profile center, the profile orbits around the axis as it extrudes, producing curved/banana-shaped bodies. This is intentional and powerful, but easy to do accidentally with the default `[0,0,0]` when the profile isn't centered at origin.
- **`capEnds` is an integer, not a string.** Passing `'TRUE'` or `'FALSE'` fails with error 1001. Use `1` or `0`.
- **Direction can't be perpendicular to sketch normal.** Error 1122 — same constraint as `part.extrusion`.
- **`limit2=0` is invalid.** Error 1122: "Height not valid."
- **Empty `references: []` creates degenerate feature.** Error: "Nothing was selected."
- **Negative `limit2` reverses direction.** UP with limit2=-50 extrudes downward. Valid, not an error.
- **No angle limit.** `twistAngle: 4*Math.PI` (2 full rotations) works fine, producing drill-bit/helical shapes.
- **`twistAngle=0` = straight extrusion.** Functionally identical to `part.extrusion` with same params.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1122 | "Height not valid. Value for height must be greater than 0" | `limit2: 0` | Use positive or negative limit2 |
| 1122 | "Direction can't be perpendicular to the normal vector of sketch plane" | Direction in sketch plane | Direction must have component along sketch normal |
| 1122 | "Nothing was selected" | Empty `references: []` | Pass region or contour IDs |
| 1111 | "There is no sketch region" | Empty references | Pass valid IDs |
| 1001 | "capEnds has the wrong type" | Passed string | Use integer `1` or `0` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

// Create sketch WITH planeId
const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const rectIds = (await api.v1.sketch.rectangle({
  id: skId, startPos: [-30, -20, 0], endPos: [30, 20, 0]
})).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

// Basic twist — 90° rotation over 100mm
const twistId = (await api.v1.part.twist({
  id: partId,
  name: 'MyTwist',
  references: [regionId],
  twistAngle: Math.PI / 2,
  limit2: 100,
})).result

// Expression-driven
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'A', value: '3.14159/2' }] })
const twistId2 = (await api.v1.part.twist({
  id: partId,
  references: [regionId],
  twistAngle: '@expr.A',
  limit2: 100,
})).result

// CUSTOM type with offset twist axis (creates orbital/curved body)
const twistId3 = (await api.v1.part.twist({
  id: partId,
  references: [regionId],
  type: 'CUSTOM',
  direction: [0, 0, 1],
  twistCenter: [0, 0, 0], // axis at origin — profile at ±30 orbits around it
  twistAngle: Math.PI / 2,
  limit1: 0,
  limit2: 100,
})).result

// Sheet body (no caps)
const twistId4 = (await api.v1.part.twist({
  id: partId,
  references: [regionId],
  twistAngle: Math.PI / 4,
  limit2: 80,
  capEnds: 0, // integer, NOT string
})).result
```

## Type Behavior

| Type | Direction | limit1 | limit2 | twistCenter | direction |
|------|-----------|--------|--------|-------------|-----------|
| UP | +sketch normal | ignored | distance | ignored | ignored |
| DOWN | -sketch normal | ignored | distance | ignored | ignored |
| SYMMETRIC | both | ignored | total split equally | ignored | ignored |
| CUSTOM | user `direction` | start offset | end offset | twist axis position | extrusion direction |

## Related

- [`part.updateTwist`](updateTwist.md) — modify after creation (requires `openFeature`/`closeFeature`)
- [`part.extrusion`](extrusion.md) — straight extrusion without twist (twist with angle=0 is equivalent)
- `part.boolean` — combine twist with other features
- `sketch.sketchRegion` — create the region reference
