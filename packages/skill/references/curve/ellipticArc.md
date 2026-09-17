# curve.ellipticArc

Creates one or more elliptic arcs (partial ellipses: center, two radii, start/end angles in radians) in a `curve.shape`.

## Key Parameters

- `id` — shape ID (not part or EIF ID)
- `centerPos` — `[x, y, z]`, exactly 3 elements (2D → error)
- `startAngle`, `endAngle` — radians, keep in `[0, 2π]`
- `radius1` — along `xAxis`; `radius2` — perpendicular to `xAxis` in the arc plane. Both must be > 0.
- `xAxis` (optional, default `[1,0,0]`) — direction of `radius1` and angle 0; normalized internally
- `normal` (optional, default `[0,0,1]`, XY) — **must be orthogonal to `xAxis`**; a parallel pair → `The parameter "normal" and "xAxis" must be orthogonal.`

## How Angles Work

Identical to `curve.arcByCenterRadAngle`: angle 0 points along `xAxis`; sweeps **counterclockwise** viewed from `normal`; `startAngle > endAngle` gives the **complement arc** (`PI/2 → 0` = 270°); `0 → 2*PI` gives a complete closed ellipse. **Negative angles and angles beyond 2π are accepted** (maxLevel 31, no hang) — keep them in `[0, 2π]` for predictable arcs.

## Return Value

`null` (VOID), maxLevel 31. No ID — merges into the shape; no per-arc addressing, update or deletion. Batch: pass an array of parameter objects; single VOID response.

## Gotchas

- **`radius1 <= 0` or `radius2 <= 0` is rejected** (code 1014, maxLevel 51, `"The parameters \"radius1\" and \"radius2\" must both be greater than 0."`). Previously hung the server — fixed alongside `curve.circle`.
- **Radii are positional, not semantic:** `radius1` is always along `xAxis`; if `radius2 > radius1` the visual major axis is perpendicular to `xAxis`. No `radius1 > radius2` requirement. Equal radii → circular arc, equivalent to `arcByCenterRadAngle`.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1004 | `"The parameter \"radius2\" must be provided..."` | Missing required parameter |
| 1001 | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Part/EI ID instead of shape ID |
| 0 | `"point must have exactly 3 real values"` | 2D point `[x,y]` |
| 1014 | `"The parameters \"radius1\" and \"radius2\" must both be greater than 0."` | Either radius `<= 0` |
| — | "normal" and "xAxis" must be orthogonal | xAxis parallel to normal |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ArcPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

// 90° elliptic arc from +X toward +Y
await api.v1.curve.ellipticArc({ id: shapeId, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius1: 30, radius2: 15 })

// Full closed ellipse
await api.v1.curve.ellipticArc({ id: shapeId, centerPos: [60, 0, 0], startAngle: 0, endAngle: 2 * Math.PI, radius1: 20, radius2: 10 })

// Angle 0 along +Y
await api.v1.curve.ellipticArc({ id: shapeId, centerPos: [0, 50, 0], startAngle: 0, endAngle: Math.PI / 2, radius1: 25, radius2: 12, xAxis: [0, 1, 0] })
```

## Related

`curve.ellipse` · `curve.arcByCenterRadAngle` · `curve.arcByCenter` · `curve.shape`
