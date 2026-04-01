# curve.arcByCenterRadAngle

Creates one or more arcs defined by center position, radius, and start/end angles (in radians). The arc sweeps **counterclockwise** (relative to `normal`) from `startAngle` to `endAngle`.

## Prerequisites

- A shape (`curve.shape`) inside an entity injection (`part.entityInjection`)

## Key Parameters

- `id` (required) — shape ID. Must be a shape, not part or EI.
- `centerPos` (required) — `[x, y, z]` center of the arc.
- `startAngle` (required) — start angle in radians. **Must be >= 0.**
- `endAngle` (required) — end angle in radians. **Must be >= 0 and <= 2*PI.**
- `radius` (required) — arc radius. Positive values only.
- `xAxis` (optional, default `[1,0,0]`) — reference direction for angle 0. The arc starts at `centerPos + radius * normalize(xAxis)` when `startAngle=0`.
- `normal` (optional, default `[0,0,1]`) — arc plane normal. Defines which direction is "counterclockwise." **Must not be parallel to `xAxis`.**

All points must be `[x, y, z]` — no 2D shorthand.

## How Angles Work

- **Angle 0** points in the `xAxis` direction from `centerPos`.
- The arc sweeps **counterclockwise** (when viewed from the `normal` direction) from `startAngle` to `endAngle`.
- When `startAngle < endAngle`: creates an arc of `(endAngle - startAngle)` radians.
- When `startAngle > endAngle`: creates the **complement arc** — sweeps counterclockwise from `startAngle` through 2*PI and continues to `endAngle`. For example, `startAngle=PI/2, endAngle=0` creates a 270° arc, not a 90° clockwise arc.
- **Full circle:** `startAngle=0, endAngle=2*PI` creates a complete circle.

## Gotchas

- **CRITICAL: Negative angles HANG THE SERVER.** Any negative value for `startAngle` or `endAngle` (even `-0.1`) causes the ClassCAD worker to spin at 100% CPU indefinitely. No error is returned. You must `kill -9` the worker and restart. **Always validate that both angles are >= 0 before calling.**
- **CRITICAL: Angles beyond 2*PI HANG THE SERVER.** `endAngle=4*PI` or any value > 2*PI causes the same hang. Exactly 2*PI is fine (creates full circle), but nothing beyond.
- **CRITICAL: Parallel xAxis and normal can HANG THE SERVER.** The docs say "should be different" — violating this causes inconsistent behavior: some parallel pairs work, others hang. **Always ensure xAxis and normal are not parallel.**
- **No clockwise sweep.** There is no `isClockwise` flag. To get a clockwise-looking arc, use reversed angles (start > end), which produces the complement counterclockwise arc.
- **No individual arc IDs.** Like other curve APIs, arcs merge into the shape's geometry. No per-arc addressing or deletion.
- Instead of negative angles, use the equivalent positive angle: `-PI/2` → `3*PI/2`.

## Safe Angle Range

```
0 <= startAngle <= 2*PI
0 <= endAngle <= 2*PI
xAxis NOT parallel to normal
radius > 0
```

## Return Value

Returns VOID (null). maxLevel 31 on success. No ID returned.

## Batch Creation

Pass an array of objects to create multiple arcs in one call:

```js
await api.v1.curve.arcByCenterRadAngle([
  { id: shapeId, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 10 },
  { id: shapeId, centerPos: [30, 0, 0], startAngle: Math.PI / 4, endAngle: Math.PI, radius: 8 },
])
```

Returns single VOID response, maxLevel 31 on success.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1004 | ERROR | `"The parameter \"<name>\" must be provided..."` | Missing required parameter |
| 1001 | ERROR | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Passed part/EI ID instead of shape ID |
| — | HANG | (no response) | Negative angles, angles > 2*PI, parallel xAxis/normal, or radius <= 0 |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ArcPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

// 90° arc from +X toward +Y
await api.v1.curve.arcByCenterRadAngle({
  id: shapeId,
  centerPos: [0, 0, 0],
  startAngle: 0,
  endAngle: Math.PI / 2,
  radius: 10,
})

// Full circle
await api.v1.curve.arcByCenterRadAngle({
  id: shapeId,
  centerPos: [30, 0, 0],
  startAngle: 0,
  endAngle: 2 * Math.PI,
  radius: 15,
})

// Rounded rectangle corner (bottom-right, using 3*PI/2 instead of -PI/2)
const w = 80, h = 50, r = 10
await api.v1.curve.line({ id: shapeId, startPos: [r, 0, 0], endPos: [w - r, 0, 0] })
await api.v1.curve.arcByCenterRadAngle({
  id: shapeId,
  centerPos: [w - r, r, 0],
  startAngle: 3 * Math.PI / 2,
  endAngle: 2 * Math.PI,
  radius: r,
})

// Arc with custom xAxis (angle 0 points in +Y direction)
await api.v1.curve.arcByCenterRadAngle({
  id: shapeId,
  centerPos: [50, 50, 0],
  startAngle: 0,
  endAngle: Math.PI / 2,
  radius: 10,
  xAxis: [0, 1, 0],
})
```

## Related

- `curve.shape` — create the container this consumes
- `curve.arcByCenter` — arc by center, start point, end point, and clockwise flag (uses positions, not angles)
- `curve.arcBy3Points` — arc defined by 3 points (no center/angles needed)
- `curve.circle` — simpler full circle (but `arcByCenterRadAngle` with 0→2*PI also works)
- `curve.line` — commonly paired for closed profiles (e.g., rounded rectangles)
