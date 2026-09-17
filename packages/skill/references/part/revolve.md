# part.revolve

Parametric revolve feature: rotates a closed 2D sketch profile around an axis (cylinders, rings, domes, any lathe shape). Lives in the feature tree, supports `updateRevolve`, expression-driven.

## Prerequisites

- A sketch created with `planeId` (as for extrusion: region references need it, and the sketch solver only runs with it)
- A sketch region (`sketch.sketchRegion`) or contour element IDs forming a closed loop
- An axis: work axis, sketch line, brep edge, or two points

## Key Parameters

- `id` — **part ID** (not sketch or feature ID)
- `references` — **required** (despite bracket notation in docs). Region IDs or contour element IDs — both work identically. Closed profile
- `axisIds` — **required**. Single line `[workAxisId | sketchLineId | brepEdgeId]`, or two points `[p1, p2]` (work points, sketch points, brep vertices)
- `startAngle` — radians (default 0); `endAngle` — radians (default 2*PI). Numbers, formulas, or expressions: `Math.PI / 2`, `'C:PI/2'`, `'@expr.ANG'`
- `inverted` — **integer** `0` (default, CCW) or `1` (CW). NOT JS `true`/`false`, NOT `'TRUE'`/`'FALSE'`
- `name` — default "Revolve"

## Angle Behavior

| startAngle | endAngle | Result |
|---|---|---|
| 0 | 2*PI (default) | Full revolution |
| 0 | PI/2 | Quarter turn CCW |
| PI/4 | 3*PI/4 | 90° arc starting at 45° |
| 0 | -PI/2 | Quarter turn CW (negative = reverse, same as `inverted: 1` with positive angles) |
| PI | PI/2 | `start > end` valid — sweeps backward from 180° to 90° |
| PI/2 | PI/2 | Full revolution (equal angles = 360° wrap) |
| 0 | 0 | Full revolution (equal angles = 360° wrap) |

## Return Value

Feature ID (numeric), maxLevel 31; use with `openFeature`/`closeFeature` + `updateRevolve`. On error: null at maxLevel 51, or a degenerate feature ID at maxLevel 51.

## Gotchas

- **Wrong `inverted` type** (JS bool or string) fails with a misleading `"id" must be provided to create CC_Revolve`. That message is not caused by the angle — check `inverted` first (or an undefined `id`).
- **Profile crossing the axis → degenerate feature** (feature ID, maxLevel 51, "The brep elements of at least one face are not well defined."). Keep the profile on one side. **Touching** the axis is fine: a profile starting at x=0 gives a solid cylinder with no center hole.
- **Revolves in several parts work** (e.g. one per part template in an assembly). A drawing holds one root part; a second `part.create` is refused, which can leave a later call without a valid `id`.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1004 | "id" must be provided to create CC_Revolve | `inverted` as JS bool/string, or `id` undefined | Integer 1/0; check the part id |
| 0 | "brep elements of at least one face are not well defined" | Profile crosses the axis | Keep profile on one side |
| — | "The parameter 'references' must be provided" | Missing `references` | Always pass `references` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0] })).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

// Full revolve (ring)
const revId = (await api.v1.part.revolve({ id: partId, name: 'Ring', references: [regionId], axisIds: [yAxisId] })).result
// Half turn, CW
await api.v1.part.revolve({ id: partId, references: [regionId], axisIds: [yAxisId], endAngle: Math.PI, inverted: 1 })
// Expression-driven angle
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'ANG', value: 1.5708 }] })
await api.v1.part.revolve({ id: partId, references: [regionId], axisIds: [yAxisId], endAngle: '@expr.ANG' })
// Sketch line as axis
const axisLine = (await api.v1.sketch.line({ id: skId, startPos: [0, -10, 0], endPos: [0, 40, 0] })).result
await api.v1.part.revolve({ id: partId, references: [regionId], axisIds: [axisLine] })
// Two work points as axis
const wp1 = (await api.v1.part.workPoint({ id: partId, position: [0, 0, 0] })).result
const wp2 = (await api.v1.part.workPoint({ id: partId, position: [0, 50, 0] })).result
await api.v1.part.revolve({ id: partId, references: [regionId], axisIds: [wp1, wp2] })
```

## Related

[`part.updateRevolve`](updateRevolve.md) · `part.workAxis` · `part.getWorkGeometry` · `sketch.sketchRegion` · `part.extrusion` · `part.boolean`
