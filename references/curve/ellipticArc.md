# curve.ellipticArc

Creates one or more elliptic arc curves — partial ellipses defined by center, two radii, and start/end angles in radians.

## Prerequisites

- A part (`part.create`)
- An entity injection (`part.entityInjection`)
- A shape (`curve.shape`)

## Key Parameters

- `id` — shape ID (not part or EIF ID). Must be a shape container.
- `centerPos` — `[x, y, z]` center of the elliptic arc. Must be 3-element array.
- `startAngle` — start angle in radians. **Must be >= 0 and <= 2*PI.**
- `endAngle` — end angle in radians. **Must be >= 0 and <= 2*PI.**
- `radius1` — radius along the `xAxis` direction. Must be > 0.
- `radius2` — radius perpendicular to `xAxis` (in the arc plane). Must be > 0.
- `xAxis` (optional) — `[x, y, z]` direction vector for `radius1` and angle 0. Default `[1,0,0]`. Non-unit vectors are normalized internally.
- `normal` (optional) — `[x, y, z]` plane normal. Default `[0,0,1]` (XY plane). **Must not be parallel to `xAxis`** — see Gotchas.

## How Angles Work

- **Angle 0** points in the `xAxis` direction from `centerPos`.
- The arc sweeps **counterclockwise** (when viewed from the `normal` direction) from `startAngle` to `endAngle`.
- When `startAngle < endAngle`: creates an arc of `(endAngle - startAngle)` radians.
- When `startAngle > endAngle`: creates the **complement arc** — sweeps counterclockwise from `startAngle` through 2*PI and continues to `endAngle`. For example, `startAngle=PI/2, endAngle=0` creates a 270° arc.
- **Full ellipse:** `startAngle=0, endAngle=2*PI` creates a complete closed ellipse.

## Return Value

Returns `null` (VOID). maxLevel 31 on success. No ID is returned for individual curves.

## Gotchas

- **CRITICAL: Parallel xAxis and normal HANGS THE SERVER.** If `xAxis` is parallel to `normal` (e.g., both `[0,0,1]`), the worker spins at 100% CPU indefinitely. No error is returned. You must `kill -9` the worker and restart. **Always ensure xAxis and normal are not parallel.**
- **CRITICAL: Negative angles likely HANG THE SERVER.** Based on identical engine behavior with `arcByCenterRadAngle`, negative values for `startAngle` or `endAngle` should be assumed to hang. Always validate `>= 0`.
- **CRITICAL: Angles beyond 2*PI likely HANG THE SERVER.** Same assumption as above. Keep angles in `[0, 2*PI]`.
- **CRITICAL: Zero or negative radii likely HANG THE SERVER.** Based on `ellipse` behavior, `radius1 <= 0` or `radius2 <= 0` will hang. Always validate `> 0`.
- **`radius1` and `radius2` are positional, not semantic.** `radius1` is always along `xAxis`, `radius2` is perpendicular. If `radius2 > radius1`, the visual major axis is perpendicular to `xAxis`. There is no requirement that `radius1 > radius2`.
- **Equal radii produce a circular arc.** When `radius1 == radius2`, the result is equivalent to `arcByCenterRadAngle` with that radius.
- **Points must be 3-element arrays.** Passing `[x, y]` (2D) returns error.
- **No per-curve IDs.** Like all curve APIs, arcs merge into the shape's geometry. No per-arc addressing, update, or deletion.

## Safe Parameter Range

```
0 <= startAngle <= 2*PI
0 <= endAngle <= 2*PI
radius1 > 0
radius2 > 0
xAxis NOT parallel to normal
All points must be [x, y, z]
```

## Batch Creation

Pass an array of objects to create multiple arcs in one call:

```js
await api.v1.curve.ellipticArc([
  { id: shapeId, centerPos: [-40, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius1: 20, radius2: 10 },
  { id: shapeId, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI, radius1: 15, radius2: 8 },
])
```

Returns single VOID response, maxLevel 31 on success.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1004 | ERROR | `"The parameter \"radius2\" must be provided..."` | Missing required parameter |
| 1001 | ERROR | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Passed part/EI ID instead of shape ID |
| 0 | ERROR | `"point must have exactly 3 real values"` | Used 2D point `[x,y]` instead of `[x,y,z]` |
| — | HANG | (no response) | Negative angles, angles > 2*PI, parallel xAxis/normal, or radius <= 0 |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ArcPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

// 90° elliptic arc from +X toward +Y
await api.v1.curve.ellipticArc({
  id: shapeId,
  centerPos: [0, 0, 0],
  startAngle: 0,
  endAngle: Math.PI / 2,
  radius1: 30,
  radius2: 15,
})

// Full closed ellipse
await api.v1.curve.ellipticArc({
  id: shapeId,
  centerPos: [60, 0, 0],
  startAngle: 0,
  endAngle: 2 * Math.PI,
  radius1: 20,
  radius2: 10,
})

// Rotated arc — angle 0 points in +Y direction
await api.v1.curve.ellipticArc({
  id: shapeId,
  centerPos: [0, 50, 0],
  startAngle: 0,
  endAngle: Math.PI / 2,
  radius1: 25,
  radius2: 12,
  xAxis: [0, 1, 0],
})
```

## Related

- `curve.ellipse` — full closed ellipse (no angle params needed)
- `curve.arcByCenterRadAngle` — circular arc by angle (single radius)
- `curve.arcByCenter` — circular arc by center, start/end positions, and clockwise flag
- `curve.shape` — create the shape container this requires
