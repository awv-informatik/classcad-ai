# part.revolve

Creates a parametric revolve feature by rotating a 2D sketch profile around an axis. Produces solids of revolution — cylinders, rings, domes, or any lathe shape. Lives in the feature tree, supports `updateRevolve`, and can be driven by expressions.

## Prerequisites

- A part (`part.create`)
- A sketch with `planeId` set (same requirement as extrusion)
- Either a sketch region (`sketch.sketchRegion`) or sketch contour elements (line IDs forming a closed loop)
- An axis: a work axis, sketch line, brep edge, or two points

## Key Parameters

- `id` — **part ID** (not sketch ID, not feature ID)
- `references` — **required**. Array of sketch region IDs or sketch contour element IDs (line IDs). Both work identically. Must form a closed profile.
- `axisIds` — **required**. Array of IDs defining the rotation axis. Two forms:
  - Single line: `[workAxisId]` or `[sketchLineId]` or `[brepEdgeId]`
  - Two points: `[point1Id, point2Id]` (work points, sketch points, or brep vertices)
- `startAngle` — start angle in radians (default: 0). Accepts numbers or `@expr.NAME` strings.
- `endAngle` — end angle in radians (default: 2*PI). Accepts numbers or `@expr.NAME` strings.
- `inverted` — **integer boolean** (1 or 0, NOT JS `true`/`false`, NOT string `'TRUE'`/`'FALSE'`). `0` (default) = CCW rotation, `1` = CW rotation.
- `name` — feature name (default: "Revolve")

## Angle Behavior

| startAngle | endAngle | Result |
|---|---|---|
| 0 | 2*PI (default) | Full revolution |
| 0 | PI/2 | Quarter turn CCW |
| PI/4 | 3*PI/4 | 90° arc starting at 45° |
| 0 | -PI/2 | Quarter turn CW (negative = reverse) |
| PI | PI/2 | Sweeps backward from 180° to 90° |
| PI/2 | PI/2 | Full revolution (same angles = 360° wrap) |
| 0 | 0 | Full revolution (same angles = 360° wrap) |

- Negative angles reverse the sweep direction — equivalent to using `inverted: 1` with positive angles.
- `startAngle > endAngle` is valid — sweeps in the reverse direction.
- `startAngle = endAngle` produces a full 360° revolution.

## Return Value

Feature ID (numeric) on success, with maxLevel=31. Use this ID with `openFeature`/`closeFeature` + `updateRevolve`.

On error: returns null with maxLevel=51, or returns a feature ID with maxLevel=51 (degenerate feature).

## Gotchas

- **`inverted` is an integer, not a boolean.** Passing JS `true`/`false` or string `'TRUE'`/`'FALSE'` fails with a misleading error: `"id" must be provided to create CC_Revolve"`. Use `1` or `0`.
- **Angles accept numbers, formulas and expressions** (radians): `Math.PI / 2`, `'C:PI/2'`, `'@expr.ANG'`. `"id" must be provided` is not caused by the angle — check `inverted` first.
- **Profile crossing the axis creates a degenerate feature.** Returns a feature ID but maxLevel=51: "The brep elements of at least one face are not well defined." Keep the profile entirely on one side of the axis.
- **Profile touching the axis is fine.** A profile starting at x=0 (on the axis) produces a solid cylinder with no center hole.
- **Revolves in several parts work** — e.g. one per part template in an assembly. A drawing holds one root part; a second `part.create` is refused, which can leave a later call without a valid `id`.
- **Pass `planeId` to `sketch.create`** — same as extrusion: region references need it, and the sketch solver only runs with it.
- **`references` is required.** Despite bracket notation in docs. Omitting it gives: "The parameter 'references' must be provided."

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1004 | "id" must be provided to create CC_Revolve | Wrong type for `inverted` (JS bool/string), or `id` undefined | Use integer 1/0 for inverted; check the part id |
| 0 | "brep elements of at least one face are not well defined" | Profile crosses the revolve axis | Keep profile entirely on one side of the axis |
| — | "The parameter 'references' must be provided" | Missing `references` | Always pass `references` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

// Create sketch WITH planeId
const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const rectIds = (await api.v1.sketch.rectangle({
  id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
})).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

// Full revolve (washer/ring shape)
const revId = (await api.v1.part.revolve({
  id: partId,
  name: 'Ring',
  references: [regionId],
  axisIds: [yAxisId]
})).result
// revId → 94 (feature ID)

// Partial revolve (quarter turn)
const revId2 = (await api.v1.part.revolve({
  id: partId,
  references: [regionId],
  axisIds: [yAxisId],
  endAngle: Math.PI / 2
})).result

// Inverted (CW instead of CCW)
const revId3 = (await api.v1.part.revolve({
  id: partId,
  references: [regionId],
  axisIds: [yAxisId],
  endAngle: Math.PI,
  inverted: 1  // integer, NOT boolean
})).result

// Expression-driven angle
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'ANG', value: 1.5708 }] })
const revId4 = (await api.v1.part.revolve({
  id: partId,
  references: [regionId],
  axisIds: [yAxisId],
  endAngle: '@expr.ANG'
})).result

// Sketch line as axis (alternative to work axis)
const axisLine = (await api.v1.sketch.line({
  id: skId, startPos: [0, -10, 0], endPos: [0, 40, 0]
})).result
const revId5 = (await api.v1.part.revolve({
  id: partId,
  references: [regionId],
  axisIds: [axisLine]
})).result

// Two work points as axis
const wp1 = (await api.v1.part.workPoint({ id: partId, position: [0, 0, 0] })).result
const wp2 = (await api.v1.part.workPoint({ id: partId, position: [0, 50, 0] })).result
const revId6 = (await api.v1.part.revolve({
  id: partId,
  references: [regionId],
  axisIds: [wp1, wp2]
})).result
```

## Related

[`part.updateRevolve`](updateRevolve.md) · `part.workAxis` · `part.getWorkGeometry` · `sketch.sketchRegion` · `part.extrusion` · `part.boolean`
