# common.transformObjectWithMatrix

Transforms an object with a 4×4 matrix. **Cumulative** — each call composes with the current state (unlike the absolute `setObjectCoordSystem`).

## Key Parameters

- `id` — any object: solid, entity injection, part, part feature (`part.box` etc.), work plane/axis/point, sketch, curve shape. Containers (EIF, part) move all children together; a single body moves alone.
- `matrix` — 4×4 array of arrays: upper-left 3×3 rotation/scale, right column translation, bottom row `[0, 0, 0, 1]`.
- `isGlobal` — optional, default `TRUE` (docs: TRUE = global coords, FALSE = local). **No observable effect on standalone objects** — with explicit OCS rotation, TRUE and FALSE gave identical results for solids, EIFs and features. Likely only meaningful for assembly instances.

## Return Value

`VOID` (null). Success: `maxLevel <= 31`.

## Behavior

- **Cumulative.** Two translations of [50,0,0] → [100,0,0]. Undo = apply the inverse matrix.
- **Scaling works** — uniform (`[[2,0,0,0],[0,2,0,0],[0,0,2,0],[0,0,0,1]]`) and non-uniform diagonal (`[[3,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]`), unlike `curve.transformShape` (orthogonal matrices only).
- Identity matrix is a no-op.

## Matrix Requirements

The 3×3 part must be:
1. **Right-handed** (det > 0) — mirror/reflection (det < 0) rejected with 1014. Use `solid.mirror` for reflections.
2. **Orthogonal columns** — diagonal scaling (non-uniform magnitudes) is fine. Shear matrices are orthogonalized by the server: geometry DOES change, but to the corrected matrix, with a level-51 message "Transformationmatrix of this object has been set to be uniformed scaled and orthogonal" — check `maxLevel`.

Bottom row other than `[0, 0, 0, 1]` → inversion error.

**Auto-scaling hides translations** — pure translation of a single body gives identical snapshots (renderer auto-zoom). Verify with STEP export or a reference body.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| "left-handed. This is not yet supported" | 1014 | det ≤ 0 (mirror, zero, projection) | Right-handed only; `solid.mirror` for reflections |
| "uniformed scaled and orthogonal" | 0 | Shear (non-orthogonal) | Orthogonal matrices; diagonal scaling OK |
| "Matrix kann nicht invertiert werden" | 0 | Bottom row not [0,0,0,1] | Use [0,0,0,1] |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result

// Translate [100, 50, 0]
await api.v1.common.transformObjectWithMatrix({
  id: boxId,
  matrix: [[1, 0, 0, 100], [0, 1, 0, 50], [0, 0, 1, 0], [0, 0, 0, 1]],
})
// Then rotate 90° about Z (composes with the translation)
await api.v1.common.transformObjectWithMatrix({
  id: boxId,
  matrix: [[0, -1, 0, 0], [1, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
})
// Then uniform 2× scale
await api.v1.common.transformObjectWithMatrix({
  id: boxId,
  matrix: [[2, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 1]],
})
```

## vs setObjectCoordSystem

| Aspect | transformObjectWithMatrix | setObjectCoordSystem |
|---|---|---|
| Mode | Cumulative | Absolute |
| Same call twice | Double effect | Same result |
| Scaling | Uniform + non-uniform | None |
| Parameters | 4×4 matrix | origin + xVec + yVec |
| Use case | Incremental transforms, animation, scaling | Known absolute position/orientation |

## Related

`common.setObjectCoordSystem` · `solid.translation` / `solid.rotation` · `solid.mirror` · `curve.transformShape`
