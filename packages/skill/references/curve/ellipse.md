# curve.ellipse

Creates a closed ellipse in a shape container (`curve.shape` inside `part.entityInjection`).

## Key Parameters

- `id` — shape ID (not part or EIF ID)
- `centerPos` — `[x, y, z]`; 2D `[x, y]` → "If point is defined as array, it must have exactly 3 real values"
- `radius1` — radius along `xAxis`; must be > 0
- `radius2` — radius perpendicular to `xAxis` in the ellipse plane; must be > 0
- `xAxis` (optional) — direction of `radius1`, default `[1,0,0]`, normalized internally
- `normal` (optional) — plane normal, default `[0,0,1]` (XY). **Must be orthogonal to `xAxis`**, else `The parameter "normal" and "xAxis" must be orthogonal.` — e.g. normal `[1,0,0]` needs `xAxis` `[0,1,0]` or `[0,0,1]`.

## Return Value

`null` (VOID); the ellipse is added to the shape, no curve ID. Batch (array of parameter objects) returns a single envelope with `result: null`, each ellipse added to its shape.

## Gotchas

- **`radius1 <= 0` or `radius2 <= 0` is rejected** (code 1014, maxLevel 51, `"The parameters \"radius1\" and \"radius2\" must both be greater than 0."`). Previously hung the server — fixed alongside `curve.circle`.
- **`xAxis` sets the `radius1` direction, not the "major axis".** If `radius2 > radius1`, the visual major axis is perpendicular to `xAxis`. Radii are freely swappable (no `radius1 > radius2` requirement); equal radii give a circle.

## Common Errors

| Error | Code | Meaning |
|-------|------|---------|
| `The parameter "radius1" must be provided` | 1004 | Missing required param |
| `The parameter "id" has a wrong id type` | 1001 | Part/EIF ID instead of shape ID |
| `point must have exactly 3 real values` | 0 | 2D point `[x,y]` |
| `The parameters "radius1" and "radius2" must both be greater than 0.` | 1014 | Either radius `<= 0` |
| `The parameter "normal" and "xAxis" must be orthogonal.` | — | Non-orthogonal `normal`/`xAxis` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

// XY plane, radius1 along X
await api.v1.curve.ellipse({ id: shapeId, centerPos: [0, 0, 0], radius1: 40, radius2: 20 })

// radius1 along Y (rotated)
await api.v1.curve.ellipse({ id: shapeId, centerPos: [100, 0, 0], radius1: 40, radius2: 20, xAxis: [0, 1, 0] })

// YZ plane — xAxis orthogonal to normal
await api.v1.curve.ellipse({ id: shapeId, centerPos: [200, 0, 0], radius1: 30, radius2: 15, normal: [1, 0, 0], xAxis: [0, 1, 0] })

// Batch
await api.v1.curve.ellipse([
  { id: shapeId, centerPos: [-40, 100, 0], radius1: 20, radius2: 10 },
  { id: shapeId, centerPos: [40, 100, 0], radius1: 15, radius2: 15 },
])
```

## Related

`curve.ellipticArc` · `curve.circle` · `curve.shape`
