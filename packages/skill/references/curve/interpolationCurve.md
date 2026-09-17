# curve.interpolationCurve

Creates a spline passing **through** every given point in a `curve.shape` (unlike `bezierCurve`, which only approximates its control points).

## Key Parameters (only these two)

- `id` — shape ID (not part or EIF ID)
- `points` — `Array<[x, y, z]>`, each exactly 3 elements, **at least 2**, no consecutive duplicates. Need not be coplanar (3D supported).

No degree parameter: degree = points − 1 (2 → line segment, 3 → quadratic, 4 → cubic, most common). The docs' "needs always degree + 1 points" is backwards — you supply points, the degree follows.

## Return Value

`null` (VOID), maxLevel 31. No ID — merges into the shape; no per-curve addressing, update or deletion. Batch: pass an array of parameter objects; single VOID response.

## Gotchas

- **Fewer than 2 points (`[]` or one point) is rejected**: code 1014, `"The parameter \"points\" must contain at least 2 points."`
- **Consecutive duplicate points are rejected** (adjacent pair with exactly equal x, y, z): code 1014, `"The parameter \"points\" must not contain consecutive duplicate points."` Stricter than `bezierCurve`, which tolerates duplicates (no chord-length parameterization).

## Interpolation vs Bezier

With the same points, `interpolationCurve` is **larger/more extreme** — it must hit every point, whereas Bezier pulls less aggressively toward interior control points. Use interpolation to hit exact positions; Bezier for smooth control with points as "magnets".

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1004 | `"The parameter \"points\" must be provided..."` | Missing `points` |
| 1001 | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Part/EI ID instead of shape ID |
| 0 | `"If point is defined as array, it must have exactly 3 real values"` | 2D point `[x,y]` |
| 1014 | `"The parameter \"points\" must contain at least 2 points."` | `[]` or 1 entry |
| 1014 | `"The parameter \"points\" must not contain consecutive duplicate points."` | Adjacent identical points |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'InterpPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Curves' })).result

// Cubic interpolation through 4 points
await api.v1.curve.interpolationCurve({ id: shapeId, points: [[0, 0, 0], [10, 30, 0], [30, 30, 0], [40, 0, 0]] })

// Batch
await api.v1.curve.interpolationCurve([
  { id: shapeId, points: [[50, 0, 0], [55, 15, 0], [60, 0, 0]] },
  { id: shapeId, points: [[70, 0, 0], [75, 15, 0], [80, 0, 0]] },
])
```

## Related

`curve.bezierCurve` · `curve.line` · `curve.shape`
