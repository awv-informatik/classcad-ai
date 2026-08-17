# common.transformObjectWithMatrix

Transforms an object by applying a 4×4 transformation matrix. Unlike `setObjectCoordSystem` (which sets an absolute coordinate frame), this is **cumulative** — each call composes with the current state.

## Prerequisites

- Any valid object ID (solid, entity injection, part, part feature, work plane, work axis, work point, sketch, curve shape)

## Key Parameters

- `id` — ID of any object to transform.
- `matrix` — 4×4 array of arrays. Standard homogeneous transform: upper-left 3×3 is rotation/scale, right column is translation, bottom row must be `[0, 0, 0, 1]`.
- `isGlobal` — (optional, default `TRUE`) Docs say: TRUE if matrix is in global coords, FALSE for local. **In practice, has no observable effect on standalone objects** — tested with explicit OCS rotation, both TRUE and FALSE produce identical results. Likely only meaningful for assembly instances.

## Return Value

`VOID` (null). Success indicated by `maxLevel <= 31`.

## Critical Behavior

- **Cumulative, not absolute.** Each call applies on top of the current state. Two translations of [50,0,0] move to [100,0,0]. To "undo" a transform, apply the inverse matrix. This is the key distinction from `setObjectCoordSystem` (which is absolute/idempotent).
- **Supports scaling.** Both uniform (`[[2,0,0,0],[0,2,0,0],[0,0,2,0],[0,0,0,1]]`) and non-uniform (`[[3,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]`) diagonal scaling work without error. This is more powerful than `curve.transformShape` which requires orthogonal matrices.
- **Identity matrix is a no-op.** Applying the identity matrix leaves geometry unchanged.
- **Container scope.** When applied to a container (EIF, part), ALL child objects transform together. When applied to an individual body, only that body moves.

## Matrix Requirements

The 3×3 upper-left portion must be:
1. **Right-handed** (positive determinant) — mirror/reflection matrices (det < 0) are rejected with error code 1014.
2. **Orthogonal columns** — columns must be perpendicular. Non-uniform magnitudes (diagonal scaling) are fine. Non-orthogonal (shear) matrices are auto-corrected with an error message.

The bottom row must be `[0, 0, 0, 1]` — other values cause an inversion error.

## Gotchas

- **Shear matrices are silently corrected.** A non-orthogonal matrix gets orthogonalized by the server. Geometry DOES change — but to the corrected matrix, not the requested one. Error message: "Transformationmatrix of this object has been set to be uniformed scaled and orthogonal" (level 51). Check `maxLevel` to detect this.
- **No mirror/reflection.** Left-handed matrices (det ≤ 0) are rejected. Use `solid.mirror` for reflection operations.
- **isGlobal has no effect on standalone objects.** Despite the parameter existing, it produces identical results to isGlobal=TRUE for solids, EIFs, and features. Only use it in assembly contexts.
- **Auto-scaling hides translations.** Pure translation on a single body produces identical snapshots due to the renderer's auto-zoom. Verify with STEP export or a reference body.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| "left-handed. This is not yet supported" | 1014 | Matrix determinant ≤ 0 (mirror, zero, projection) | Use only right-handed matrices (det > 0). Use `solid.mirror` for reflections |
| "uniformed scaled and orthogonal" | 0 | Non-orthogonal matrix (shear) | Use orthogonal matrices only. Non-uniform diagonal scaling is OK |
| "Matrix kann nicht invertiert werden" | 0 | Bottom row not [0,0,0,1] | Always use [0,0,0,1] as bottom row |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result

// Translate [100, 50, 0]
await api.v1.common.transformObjectWithMatrix({
  id: boxId,
  matrix: [
    [1, 0, 0, 100],
    [0, 1, 0, 50],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ],
})

// 90° rotation around Z axis (cumulative — adds to previous translation)
await api.v1.common.transformObjectWithMatrix({
  id: boxId,
  matrix: [
    [0, -1, 0, 0],
    [1,  0, 0, 0],
    [0,  0, 1, 0],
    [0,  0, 0, 1],
  ],
})

// Uniform 2× scale (cumulative)
await api.v1.common.transformObjectWithMatrix({
  id: boxId,
  matrix: [
    [2, 0, 0, 0],
    [0, 2, 0, 0],
    [0, 0, 2, 0],
    [0, 0, 0, 1],
  ],
})
```

## Object Type Compatibility

Works on: solid bodies, entity injections, parts, part features (part.box etc.), work planes, work axes, work points. Container transforms (EIF, part) move all children together.

## Comparison: transformObjectWithMatrix vs setObjectCoordSystem

| Aspect | transformObjectWithMatrix | setObjectCoordSystem |
|---|---|---|
| **Mode** | Cumulative — composes with current state | Absolute — sets coord system directly |
| **Idempotent** | No — same call twice = double effect | Yes — same call twice = same result |
| **Scaling** | Supports uniform + non-uniform scaling | No scaling support |
| **Parameters** | 4×4 matrix | origin + xVec + yVec |
| **Use case** | Incremental transforms, animation, scaling | Set a known absolute position/orientation |

## Related

- `common.setObjectCoordSystem` — absolute positioning (set origin + axes)
- `solid.translation` / `solid.rotation` — relative transforms on solids within EIFs (also cumulative)
- `solid.mirror` — for reflection operations (since mirror matrices are rejected here)
- `curve.transformShape` — 4×4 matrix on curve shapes (orthogonal only, no scaling)
