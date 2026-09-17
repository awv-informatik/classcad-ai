# curve.arcByCenterRadAngle

Creates one or more arcs from center, radius and start/end angles (radians) in a `curve.shape`. Sweeps **counterclockwise** (viewed from `normal`) from `startAngle` to `endAngle`.

## Key Parameters

- `id` (required) — shape ID (not part or EI)
- `centerPos` (required) — `[x, y, z]` (no 2D shorthand)
- `startAngle` (required) — radians, keep `>= 0`
- `endAngle` (required) — radians, keep in `[0, 2π]`
- `radius` (required) — must be > 0; `radius <= 0` → code 1014
- `xAxis` (optional, default `[1,0,0]`) — direction of angle 0: the arc starts at `centerPos + radius * normalize(xAxis)` when `startAngle=0`
- `normal` (optional, default `[0,0,1]`) — plane normal, defines "counterclockwise". **Must be orthogonal to `xAxis`** — a parallel pair (e.g. `xAxis: [0,0,1]` with default normal) → `The parameter "normal" and "xAxis" must be orthogonal.`

## How Angles Work

- `startAngle < endAngle` → arc of `endAngle − startAngle` radians.
- `startAngle > endAngle` → the **complement arc**, CCW through 2π on to `endAngle` (`startAngle=PI/2, endAngle=0` → 270° arc, not a 90° clockwise arc). There is no `isClockwise` flag; reversed angles are the only way to get a clockwise-looking arc.
- `startAngle=0, endAngle=2*PI` → full circle.
- **Negative angles and angles beyond 2π are accepted** (`startAngle: -0.1`, `endAngle: 4π`: maxLevel 31, no hang), but keep angles in `[0, 2π]` for predictable arcs — use `3*PI/2` instead of `-PI/2`.

## Return Value

VOID (null), maxLevel 31. No ID — arcs merge into the shape's geometry; no per-arc addressing or deletion. Batch: pass an array of parameter objects; single VOID response.

## Gotchas

- **`radius <= 0` is rejected** (code 1014, maxLevel 51, `"The parameter \"radius\" must be greater than 0."`). Previously hung the server — fixed alongside `curve.circle`.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1004 | `"The parameter \"<name>\" must be provided..."` | Missing required parameter |
| 1001 | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Part/EI ID instead of shape ID |
| 1014 | `"The parameter \"radius\" must be greater than 0."` | `radius <= 0` |
| — | "normal" and "xAxis" must be orthogonal | xAxis parallel to normal |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ArcPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

// 90° arc from +X toward +Y
await api.v1.curve.arcByCenterRadAngle({ id: shapeId, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 10 })

// Full circle
await api.v1.curve.arcByCenterRadAngle({ id: shapeId, centerPos: [30, 0, 0], startAngle: 0, endAngle: 2 * Math.PI, radius: 15 })

// Bottom-right rounded-rectangle corner: 3*PI/2 instead of -PI/2
const w = 80, r = 10
await api.v1.curve.line({ id: shapeId, startPos: [r, 0, 0], endPos: [w - r, 0, 0] })
await api.v1.curve.arcByCenterRadAngle({ id: shapeId, centerPos: [w - r, r, 0], startAngle: 3 * Math.PI / 2, endAngle: 2 * Math.PI, radius: r })

// Custom xAxis: angle 0 points along +Y
await api.v1.curve.arcByCenterRadAngle({ id: shapeId, centerPos: [50, 50, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 10, xAxis: [0, 1, 0] })
```

## Related

`curve.shape` · `curve.arcByCenter` · `curve.arcBy3Points` · `curve.circle` · `curve.line`
