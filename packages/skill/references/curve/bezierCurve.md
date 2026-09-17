# curve.bezierCurve

Creates one or more Bezier curves of degree n = (control points − 1) in a `curve.shape`.

## Key Parameters (only these two)

- `id` — shape ID (not part or EIF ID)
- `points` — `Array<[x, y, z]>` control points, **at least 2**, each exactly 3 elements. Need not be coplanar (3D supported).

| Points | Degree |
|---|---|
| 2 | 1 (straight segment) |
| 3 | 2 (quadratic) |
| 4 | 3 (cubic — most common) |
| n+1 | n |

High degrees (10+ points) work; the curve then strongly averages all points and becomes very smooth/flat.

## Return Value

`null` (VOID), maxLevel 31. No ID — merges into the shape; no per-curve addressing, update or deletion. Batch: pass an array of parameter objects; single VOID response.

## Gotchas

- **CRITICAL: empty `points: []` CRASHES THE CLASSCAD WORKER** (connection lost, process exits; the worker must be restarted). **Always validate at least 2 entries before calling.**
- **A single point** → error (not a hang): code 0, level 51, `"creation of nurbs curve failed with error: 1007"`.
- **Duplicate control points are accepted silently** — all identical (e.g. `[[10,10,0], [10,10,0], [10,10,0]]`) → maxLevel 31, degenerate zero-length curve, no warning.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1004 | ERROR | `"The parameter \"points\" must be provided..."` | Missing `points` |
| 1001 | ERROR | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Part/EI ID instead of shape ID |
| 0 | ERROR | `"point must have exactly 3 real values"` | 2D point `[x,y]` |
| 0 | ERROR | `"creation of nurbs curve failed with error: 1007"` | Only 1 control point |
| — | CRASH | Worker disconnected | Empty points array `[]` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'BezierPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Curves' })).result

// Cubic (degree 3)
await api.v1.curve.bezierCurve({ id: shapeId, points: [[0, 0, 0], [10, 30, 0], [30, 30, 0], [40, 0, 0]] })

// Batch: quadratic
await api.v1.curve.bezierCurve([{ id: shapeId, points: [[50, 0, 0], [60, 20, 0], [70, 0, 0]] }])
```

## Related

`curve.interpolationCurve` · `curve.line` · `curve.shape`
