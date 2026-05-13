# curve.ellipse

Creates a closed ellipse curve in a shape container.

## Prerequisites

- A part (`part.create`)
- An entity injection (`part.entityInjection`)
- A shape (`curve.shape`)

## Key Parameters

- `id` — shape ID (not part or EIF ID). Must be a shape container.
- `centerPos` — `[x, y, z]` center of the ellipse. Must be 3-element array.
- `radius1` — radius along the `xAxis` direction. Must be > 0; the API rejects `radius1 <= 0` with error code 1014.
- `radius2` — radius perpendicular to `xAxis` (in the ellipse plane). Must be > 0; the API rejects `radius2 <= 0` with error code 1014.
- `xAxis` (optional) — `[x, y, z]` direction vector for `radius1`. Default `[1,0,0]`. Non-unit vectors are normalized internally.
- `normal` (optional) — `[x, y, z]` plane normal. Default `[0,0,1]` (XY plane). **Must differ from `xAxis`** — see Gotchas.

## Return Value

Returns `null` (VOID). The ellipse is added to the shape. No ID is returned for the individual curve.

## Gotchas

- **`radius1 <= 0` or `radius2 <= 0` is rejected with a proper error** (code 1014, maxLevel 51, message `"The parameters \"radius1\" and \"radius2\" must both be greater than 0."`). Previously hung the server in an infinite loop — fixed alongside `curve.circle` in the same branch.
- **`xAxis == normal` is a silent failure.** No error is raised (maxLevel stays at 31), but the ellipse degenerates to a line segment along the normal axis. All geometry collapses — X and Y coordinates become 0. The docs say `normal` "should be different to xAxis" but this is not enforced with an error.
- **`xAxis` controls `radius1` direction, not "major axis" direction.** If `radius2 > radius1`, the visual major axis is perpendicular to `xAxis`. The naming is positional, not semantic.
- **`radius1` and `radius2` are freely swappable.** There is no requirement that `radius1 > radius2`. Equal radii (`r1 == r2`) produce a circle.
- **Points must be 3-element arrays.** Passing `[x, y]` (2D) returns error: "If point is defined as array, it must have exactly 3 real values".

## Common Errors

| Error | Code | Meaning |
|-------|------|---------|
| `The parameter "radius1" must be provided` | 1004 | Missing required param |
| `The parameter "id" has a wrong id type` | 1001 | Passed part/EIF ID instead of shape ID |
| `point must have exactly 3 real values` | 0 | Used 2D point `[x,y]` instead of `[x,y,z]` |
| `The parameters "radius1" and "radius2" must both be greater than 0.` | 1014 | Either radius `<= 0` |

## Batch Creation

Supports array param for batch creation:

```js
await api.v1.curve.ellipse([
  { id: shapeId, centerPos: [-40, 0, 0], radius1: 20, radius2: 10 },
  { id: shapeId, centerPos: [0, 0, 0], radius1: 15, radius2: 15 },
  { id: shapeId, centerPos: [40, 0, 0], radius1: 25, radius2: 8 },
])
```

Returns single envelope with `result: null`. All ellipses are added to their respective shapes.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

// Basic ellipse in XY plane, major axis along X
await api.v1.curve.ellipse({
  id: shapeId,
  centerPos: [0, 0, 0],
  radius1: 40,
  radius2: 20,
})

// Rotated ellipse — major axis along Y
await api.v1.curve.ellipse({
  id: shapeId,
  centerPos: [0, 0, 0],
  radius1: 40,
  radius2: 20,
  xAxis: [0, 1, 0],
})

// Ellipse in YZ plane
await api.v1.curve.ellipse({
  id: shapeId,
  centerPos: [0, 0, 0],
  radius1: 30,
  radius2: 15,
  normal: [1, 0, 0],
})
```

## Related

- `curve.ellipticArc` — partial ellipse arc (adds `startAngle`, `endAngle`)
- `curve.circle` — full circle (single radius; same `radius <= 0` rejection behavior)
- `curve.shape` — create the shape container this requires
