# curve.interpolationCurve

Creates an interpolation curve (spline) that passes **through** all given points. Unlike `bezierCurve` which only approximates toward control points, interpolation curves hit every point exactly.

## Prerequisites

- A part (`part.create`)
- An entity injection (`part.entityInjection`)
- A shape (`curve.shape`)

## Key Parameters

- `id` — shape ID (not part or EIF ID). Must be a shape container.
- `points` — `Array<[x, y, z]>` of interpolation points. Minimum 2 points required (`< 2` is rejected with code 1014). Each point must be a 3-element array. Consecutive duplicates are rejected with code 1014.

That's it — only two parameters. No degree parameter — degree is determined automatically as (number of points - 1).

## Point Count and Degree

- **2 points** → degree 1 (straight line segment)
- **3 points** → degree 2 (quadratic interpolation)
- **4 points** → degree 3 (cubic — most common)
- **n points** → degree n-1

The docs say "needs always degree + 1 points" — this is backwards: you supply the points, and the degree follows.

## Return Value

Returns `null` (VOID). maxLevel 31 on success. No ID is returned — the curve merges into the shape's geometry like all curve APIs.

## Gotchas

- **`points` with fewer than 2 entries is rejected** with code 1014, message `"The parameter \"points\" must contain at least 2 points."` Applies to empty `[]` and single-point `[[x,y,z]]`. Previously hung the server in an infinite loop — fixed on branch `fix/curve-interpolationCurve-duplicate-points-hang`.
- **Consecutive duplicate points are rejected** with code 1014, message `"The parameter \"points\" must not contain consecutive duplicate points."` Applies to any adjacent pair where x, y, and z are all exactly equal. Stricter than `bezierCurve`, which still tolerates duplicates because it doesn't use chord-length parameterization.
- **Points must be 3-element arrays.** `[x, y]` (2D) returns error: `"If point is defined as array, it must have exactly 3 real values"`.
- **No per-curve IDs.** Like all curve APIs, curves merge into the shape. No per-curve addressing, update, or deletion.
- **3D curves are supported.** Points don't need to be coplanar.

## Interpolation vs Bezier

With the same control points, `interpolationCurve` produces a **larger/more extreme** curve than `bezierCurve` because it must pass through every point. Bezier curves only approximate toward interior control points, pulling less aggressively.

Use `interpolationCurve` when you need the curve to hit exact positions. Use `bezierCurve` when you want smooth control with the points acting as "magnets."

## Batch Creation

Pass an array of objects to create multiple interpolation curves in one call:

```js
await api.v1.curve.interpolationCurve([
  { id: shapeId, points: [[0, 0, 0], [5, 15, 0], [10, 0, 0]] },
  { id: shapeId, points: [[20, 0, 0], [25, 15, 0], [30, 0, 0]] },
])
```

Returns single VOID response, maxLevel 31 on success.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1004 | ERROR | `"The parameter \"points\" must be provided..."` | Missing `points` parameter |
| 1001 | ERROR | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Passed part/EI ID instead of shape ID |
| 0 | ERROR | `"If point is defined as array, it must have exactly 3 real values"` | Used 2D point `[x,y]` instead of `[x,y,z]` |
| 1014 | ERROR | `"The parameter \"points\" must contain at least 2 points."` | `points` is `[]` or has only 1 entry |
| 1014 | ERROR | `"The parameter \"points\" must not contain consecutive duplicate points."` | Two adjacent points have identical x/y/z |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'InterpPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Curves' })).result

// Cubic interpolation through 4 points
await api.v1.curve.interpolationCurve({
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

- `curve.bezierCurve` — curve that approximates toward control points (doesn't pass through them)
- `curve.line` — straight line (simpler than degree-1 interpolation)
- `curve.shape` — create the shape container this requires
