# curve.transformShape

Applies a 4x4 transformation matrix to all curves in a shape. Combines translation and rotation in a single call. The matrix is in part coordinates.

## Prerequisites

- A shape (`curve.shape`) containing at least one curve
- **Do NOT call `common.recalc` between shape creation/modification and transformShape** — recalc invalidates shape IDs (same bug as `translateShape`/`rotateShape`)

## Key Parameters

- `id` (required) — shape ID (from `curve.shape`). Only shape IDs accepted; part/EI IDs give error 1001.
- `matrix` (required) — 4x4 transformation matrix as `Array<Array<real>>`, row-major. Format:
  ```
  [[xVec.x, yVec.x, zVec.x, pos.x],
   [xVec.y, yVec.y, zVec.y, pos.y],
   [xVec.z, yVec.z, zVec.z, pos.z],
   [0,      0,      0,      1     ]]
  ```
  - Upper-left 3x3 = rotation/orientation
  - Last column (first 3 rows) = translation
  - Bottom row must be `[0, 0, 0, 1]`

## Return Value

Returns VOID (`null`). On success, `maxLevel` is 31 (info). No messages on success.

## Matrix Construction

**Pure translation** (equivalent to `translateShape({ translation: [tx, ty, tz] })`):
```
[[1, 0, 0, tx],
 [0, 1, 0, ty],
 [0, 0, 1, tz],
 [0, 0, 0, 1 ]]
```

**Rotation around Z** (angle θ, equivalent to `rotateShape({ rotation: [0, 0, θ] })`):
```
[[cos(θ), -sin(θ), 0, 0],
 [sin(θ),  cos(θ), 0, 0],
 [0,       0,      1, 0],
 [0,       0,      0, 1]]
```

**Rotation around X** (angle θ):
```
[[1, 0,       0,      0],
 [0, cos(θ), -sin(θ), 0],
 [0, sin(θ),  cos(θ), 0],
 [0, 0,       0,      1]]
```

**Rotation around Y** (angle θ):
```
[[ cos(θ), 0, sin(θ), 0],
 [ 0,      1, 0,      0],
 [-sin(θ), 0, cos(θ), 0],
 [ 0,      0, 0,      1]]
```

**Combined rotation + translation** — put rotation in the 3x3 and translation in the 4th column. The matrix applies rotation first, then translation (i.e., the translation is in the rotated frame).

## Behavior

- **In-place mutation.** The shape ID remains valid after transformation. No new shape is created.
- **Cumulative.** Each call adds to the current state. Two sequential translations stack.
- **All curves move together.** Lines, circles, arcs, polylines — everything in the shape transforms as a unit.
- **Identity matrix** `[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]` is a silent noop (maxLevel 31).
- **Rotation center is the origin.** Same as `rotateShape` — shapes offset from origin will orbit around (0,0,0).

## Gotchas

- **`common.recalc` invalidates shape IDs.** After calling `recalc`, `transformShape` fails with error 1006. **Render/export pipelines often trigger recalc internally.** Always do ALL shape transforms BEFORE any recalc, visualization, or export step.
- **Recalc invalidates ALL shape IDs in the drawing**, not just the shape being operated on. If you have shapes in multiple parts, one recalc invalidates them all.
- **Empty shapes cannot be transformed.** A shape with no curves gives error 1006.
- **Error message says `ids` (plural)** even though the parameter is `id` (singular). Same as translateShape/rotateShape.
- **Non-orthogonal matrices are accepted** (maxLevel 31) — orthogonality is not enforced.
- **Scaling in the matrix is applied, not ignored.** A uniform `diag(2,2,2)` on a 30×20 rectangle extrudes to 60×40 (volume ×4, COG scaled). Shear/non-uniform matrices were not verified — `scaleShape` is the explicit way to scale.
- **Left-handed matrices ARE properly rejected.** A matrix with negative determinant (e.g., mirror/reflection) returns error 1014 with a clear message.
- **The graphic data in the response is incremental**, not the full transformed state. Do not use `r.graphic` to verify transform results.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1014 | ERROR | "The provided matrix is left-handed. This is not yet supported" | Matrix has negative determinant (reflection/mirror) |
| 1006 | ERROR | "An element of parameter `ids` has an invalid id!" | Shape ID invalid (after recalc, empty shape, or deleted shape) |
| 1001 | ERROR | "The parameter `id` has a wrong id type! Provide only following id types: [`shape`]" | Passed EI ID or part ID instead of shape ID |
| 1004 | ERROR | "The parameter `matrix` must be provided in the api call!" | Missing `matrix` parameter |
| 1004 | ERROR | "The parameter `id` must be provided in the api call!" | Missing `id` parameter |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result

// Create some geometry
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [
    { xa: 0, ya: 0 },
    { xa: 30, ya: 0, r: 3 },
    { xa: 30, ya: 20, r: 3 },
    { xa: 0, ya: 20 },
  ],
  close: true,
})

// 45° rotation around Z + translate to (60, 20)
const c = Math.cos(Math.PI / 4) // ~0.7071
const s = Math.sin(Math.PI / 4)
await api.v1.curve.transformShape({
  id: shapeId,
  matrix: [
    [c, -s, 0, 60],
    [s,  c, 0, 20],
    [0,  0, 1,  0],
    [0,  0, 0,  1],
  ],
})
// result: null, maxLevel: 31
```

## When to Use vs. translateShape/rotateShape

- **Use `transformShape`** when you need to apply rotation + translation in a single call, or when you already have a transformation matrix from another source.
- **Use `translateShape`/`rotateShape`** for simple translate-only or rotate-only operations — simpler API, same behavior.
- **Use `scaleShape`** for scaling when you only need a scale factor.

## Related

`curve.translateShape` · `curve.rotateShape` · `curve.scaleShape` · `curve.shape`
