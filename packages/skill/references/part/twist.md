# part.twist

Parametric twist feature: sweeps a closed 2D sketch profile along a direction while progressively rotating it around the twist axis, producing helical/twisted geometry.

## Prerequisites

- A sketch created with `planeId` (e.g. `sketch.create({ id: partId, planeId: topId })`)
- A sketch region (`sketch.sketchRegion`) or contour element IDs forming a closed loop

## Key Parameters

- `id` — **part ID** (not sketch or region ID)
- `references` — **required**. Region or contour element IDs; closed profile
- `twistAngle` — **total** rotation in radians from base to top, not per unit length (default 0). `0` = straight extrusion (identical to `part.extrusion` with same params); `Math.PI` = 180°; `4*Math.PI` = 2 full rotations (drill bit) — no upper limit. Negative reverses twist direction
- `type` — `'UP'` (default), `'DOWN'`, `'SYMMETRIC'`, `'CUSTOM'` (see table)
- `limit2` — distance (default 100); negative reverses direction (UP with -50 goes down — valid); accepts expressions
- `limit1` — start offset, CUSTOM only (default 0)
- `direction` — `[x,y,z]`, CUSTOM only. Magnitude irrelevant (`limit2` controls distance). Must not be perpendicular to the sketch normal
- `twistCenter` — `[x,y,z]` point on the twist axis, CUSTOM only (default `[0,0,0]`). Axis = line through `twistCenter` along `direction`
- `capEnds` — **integer** `1` (default, solid) or `0` (sheet, no caps). Strings → error 1001
- `name` — default "Twist"

## Type Behavior

| Type | Direction | limit1 | limit2 | twistCenter | direction |
|------|-----------|--------|--------|-------------|-----------|
| UP | +sketch normal | ignored | distance | ignored | ignored |
| DOWN | -sketch normal | ignored | distance | ignored | ignored |
| SYMMETRIC | both | ignored | total split equally | ignored | ignored |
| CUSTOM | user `direction` | start offset | end offset | twist axis position | extrusion direction |

## Return Value

Feature ID (numeric), maxLevel 31. Works with `openFeature`, `closeFeature`, `updateTwist`.

## Gotchas

- **`twistCenter` and `direction` are silently ignored** for UP/DOWN/SYMMETRIC — no error, no effect.
- **Offset twist axis → orbital path.** If the axis does not pass through the profile center, the profile orbits the axis, producing curved/banana-shaped bodies; through the center, the twist is purely in place. Easy to trigger accidentally with the default `[0,0,0]` when the profile isn't centered at the origin.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1122 | "Height not valid. Value for height must be greater than 0" | `limit2: 0` | Use positive or negative limit2 |
| 1122 | "Direction can't be perpendicular to the normal vector of sketch plane" | Direction in sketch plane | Needs a component along the normal |
| 1122 | "Nothing was selected" | Empty `references: []` (creates degenerate feature) | Pass region or contour IDs |
| 1111 | "There is no sketch region" | Empty references | Pass valid IDs |
| 1001 | "capEnds has the wrong type" | Passed string | Use integer `1` or `0` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [-30, -20, 0], endPos: [30, 20, 0] })).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

// 90° over 100mm
const twistId = (await api.v1.part.twist({ id: partId, name: 'MyTwist', references: [regionId], twistAngle: Math.PI / 2, limit2: 100 })).result
// Expression-driven
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'A', value: '3.14159/2' }] })
await api.v1.part.twist({ id: partId, references: [regionId], twistAngle: '@expr.A', limit2: 100 })
// CUSTOM: axis at origin
await api.v1.part.twist({
  id: partId, references: [regionId], type: 'CUSTOM',
  direction: [0, 0, 1], twistCenter: [0, 0, 0], twistAngle: Math.PI / 2, limit1: 0, limit2: 100,
})
// Sheet body
await api.v1.part.twist({ id: partId, references: [regionId], twistAngle: Math.PI / 4, limit2: 80, capEnds: 0 })
```

## Related

[`part.updateTwist`](updateTwist.md) · [`part.extrusion`](extrusion.md) · `part.boolean` · `sketch.sketchRegion`
