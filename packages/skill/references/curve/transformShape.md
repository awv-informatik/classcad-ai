# curve.transformShape

Applies a 4x4 transformation matrix (part coordinates) to all curves of a shape — rotation and translation in one call, or a matrix you already have. For translate-only / rotate-only / scale-only use the simpler `translateShape` / `rotateShape` / `scaleShape` (same behavior).

## Key Parameters

- `id` (required) — shape ID (`curve.shape`); part/EI IDs → error 1001
- `matrix` (required) — `Array<Array<real>>`, row-major; upper-left 3x3 = rotation/orientation, last column = translation, bottom row must be `[0, 0, 0, 1]`:
  ```
  [[xVec.x, yVec.x, zVec.x, pos.x],
   [xVec.y, yVec.y, zVec.y, pos.y],
   [xVec.z, yVec.z, zVec.z, pos.z],
   [0,      0,      0,      1     ]]
  ```

## Return Value

VOID (`null`), maxLevel 31, no messages. In-place — the shape ID stays valid.

## Matrix Construction

| Transform | Matrix |
|---|---|
| Translation (≡ `translateShape([tx,ty,tz])`) | `[[1,0,0,tx],[0,1,0,ty],[0,0,1,tz],[0,0,0,1]]` |
| Rotation about Z by θ (≡ `rotateShape([0,0,θ])`) | `[[cos,-sin,0,0],[sin,cos,0,0],[0,0,1,0],[0,0,0,1]]` |
| Rotation about X by θ | `[[1,0,0,0],[0,cos,-sin,0],[0,sin,cos,0],[0,0,0,1]]` |
| Rotation about Y by θ | `[[cos,0,sin,0],[0,1,0,0],[-sin,0,cos,0],[0,0,0,1]]` |

**Combined:** rotation in the 3x3, translation in the 4th column; rotation is applied first, then translation.

## Behavior

- Cumulative (two translations stack); all curves move as a unit; rotation center is the origin (offset shapes orbit, as with `rotateShape`).
- Identity matrix is a silent no-op (maxLevel 31).
- **Non-orthogonal matrices are accepted** (maxLevel 31) — orthogonality is not enforced.
- **Scaling in the matrix is applied, not ignored:** uniform `diag(2,2,2)` on a 30×20 rectangle extrudes to 60×40 (volume ×4, COG scaled). Shear/non-uniform not verified — `scaleShape` is the explicit way to scale.
- **Left-handed matrices (negative determinant, mirror/reflection) are rejected** with error 1014 — use `scaleShape` with a negative factor for point reflection.

## Gotchas

- **`common.recalc` invalidates ALL shape IDs in the drawing** (shapes in multiple parts too) → error 1006; render/export pipelines often recalc internally. Do ALL shape transforms BEFORE any recalc, visualization or export (details: `curve/translateShape`).
- **Empty shapes** cannot be transformed → error 1006. Error messages say `ids` (plural) though the parameter is `id`.
- **`r.graphic` in the response is incremental**, not the full transformed state — don't use it to verify.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1014 | "The provided matrix is left-handed. This is not yet supported" | Negative determinant (reflection/mirror) |
| 1006 | "An element of parameter `ids` has an invalid id!" | Shape ID invalid (after recalc, empty, or deleted) |
| 1001 | "The parameter `id` has a wrong id type! Provide only following id types: [`shape`]" | EI or part ID instead of shape ID |
| 1004 | "The parameter `<matrix\|id>` must be provided in the api call!" | Missing parameter |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [{ xa: 0, ya: 0 }, { xa: 30, ya: 0, r: 3 }, { xa: 30, ya: 20, r: 3 }, { xa: 0, ya: 20 }],
  close: true,
})

// 45° about Z + translate to (60, 20) — result null, maxLevel 31
const c = Math.cos(Math.PI / 4), s = Math.sin(Math.PI / 4)
await api.v1.curve.transformShape({
  id: shapeId,
  matrix: [[c, -s, 0, 60], [s, c, 0, 20], [0, 0, 1, 0], [0, 0, 0, 1]],
})
```

## Related

`curve.translateShape` · `curve.rotateShape` · `curve.scaleShape` · `curve.shape`
