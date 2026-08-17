# curve.bezierCurve

Creates one or more Bezier curves of degree n, where n = (number of control points - 1).

## Prerequisites

- A part (`part.create`)
- An entity injection (`part.entityInjection`)
- A shape (`curve.shape`)

## Key Parameters

- `id` — shape ID (not part or EIF ID). Must be a shape container.
- `points` — `Array<[x, y, z]>` control points. Minimum 2 points required. Each point must be a 3-element array.

That's it — only two parameters. No optional parameters exist.

## Degree and Control Points

- **2 points** → degree 1 (straight line segment)
- **3 points** → degree 2 (quadratic Bezier)
- **4 points** → degree 3 (cubic Bezier — most common)
- **n+1 points** → degree n

High-degree curves (10+ control points) are supported. At high degrees, the curve strongly averages all control points and becomes very smooth/flat.

## Return Value

Returns `null` (VOID). maxLevel 31 on success. No ID is returned — the curve merges into the shape's geometry like all curve APIs.

## Gotchas

- **CRITICAL: Empty points array `[]` HANGS THE SERVER.** The worker spins at 100% CPU indefinitely. No error is returned. You must `kill -9` the worker and restart. **Always validate that points array is non-empty before calling.**
- **Minimum 2 control points.** A single point fails with error code 0, level 51: `"creation of nurbs curve failed with error: 1007"`. Not a hang, just an error.
- **Duplicate control points are accepted silently.** All points identical (e.g., `[[10,10,0], [10,10,0], [10,10,0]]`) succeeds with maxLevel 31 — creates a degenerate zero-length curve. No warning.
- **Points must be 3-element arrays.** `[x, y]` (2D) returns error: `"point must have exactly 3 real values"`.
- **No per-curve IDs.** Like all curve APIs, curves merge into the shape. No per-curve addressing, update, or deletion.
- **3D curves are supported.** Control points don't need to be coplanar.

## Batch Creation

Pass an array of objects to create multiple Bezier curves in one call:

```js
await api.v1.curve.bezierCurve([
  { id: shapeId, points: [[0, 0, 0], [10, 30, 0], [30, 30, 0], [40, 0, 0]] },
  { id: shapeId, points: [[50, 0, 0], [60, 20, 0], [70, 0, 0]] },
])
```

Returns single VOID response, maxLevel 31 on success.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1004 | ERROR | `"The parameter \"points\" must be provided..."` | Missing `points` parameter |
| 1001 | ERROR | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Passed part/EI ID instead of shape ID |
| 0 | ERROR | `"point must have exactly 3 real values"` | Used 2D point `[x,y]` instead of `[x,y,z]` |
| 0 | ERROR | `"creation of nurbs curve failed with error: 1007"` | Only 1 control point (need >= 2) |
| — | HANG | (no response) | Empty points array `[]` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'BezierPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Curves' })).result

// Cubic Bezier (degree 3)
await api.v1.curve.bezierCurve({
  id: shapeId,
  points: [
    [0, 0, 0],
    [10, 30, 0],
    [30, 30, 0],
    [40, 0, 0],
  ],
})
```

## Related

- `curve.interpolationCurve` — curve that passes through all points (unlike Bezier, which only approximates)
- `curve.line` — straight line (simpler than degree-1 Bezier)
- `curve.shape` — create the shape container this requires
