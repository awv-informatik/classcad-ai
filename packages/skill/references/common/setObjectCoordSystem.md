# common.setObjectCoordSystem

Sets the coordinate system (origin + axis directions) of an object, physically repositioning and/or reorienting it in 3D space.

## Prerequisites

- Any valid object ID (part, entity injection, solid, sketch, work geometry, part feature, curve shape)

## Key Parameters

- `id` — ID of the object to transform. Works on virtually any object type.
- `origin` — `[x, y, z]` — new origin position in global coordinates.
- `xVec` — `[x, y, z]` — new X axis direction. Auto-normalized — magnitude doesn't matter, only direction.
- `yVec` — `[x, y, z]` — new Y axis direction. Auto-normalized. If not perpendicular to `xVec`, the server orthogonalizes it (Gram-Schmidt). Z axis is derived as `xVec × yVec_orthogonalized`.

## Return Value

`VOID` (null). Success indicated by `maxLevel <= 31`.

## Critical Behavior

- **Absolute, not cumulative.** This sets the object's coord system to the specified values. Calling it twice with the same values is idempotent — no additional effect. It does NOT accumulate transformations like `solid.translation` does.
- **Physically moves geometry.** This is a real transformation — the object's position and orientation change in world space. Confirmed via STEP export diffs.
- **Container scope:** When applied to a container (part, entity injection), ALL child objects move/rotate together. When applied to an individual body (solid), only that body moves — siblings are unaffected.

## Gotchas

- **Zero-length vectors → ERROR.** Both `xVec` and `yVec` must have non-zero length. Error: `"Vectors for SetCoordSystem may not have length 0"` (level 51).
- **Parallel vectors → ERROR.** `xVec` and `yVec` must not be collinear (same or opposite direction). Error: `"Vectors for SetCoordSystem may not be parallel"` (level 51).
- **Non-orthogonal vectors are silently accepted.** The server orthogonalizes `yVec` against `xVec`. The rotation is primarily defined by `xVec` direction — `yVec` just resolves the remaining rotational degree of freedom. If `xVec` is [1,0,0] and `yVec` is [1,1,0], the orthogonalized `yVec` becomes [0,1,0] (identity), so nothing moves. Use orthogonal vectors explicitly to avoid surprises.
- **Auto-scaling hides origin-only shifts.** When applying to a container with all geometry inside, a pure translation (origin shift with identity axes) produces visually identical snapshots due to the renderer's auto-zoom. The change IS real (verified via STEP export) — use a reference body outside the container, or compare STEP data, to confirm.
- **STEP export doesn't capture sketch coord systems.** Sketch plane changes are real (visible in the sketch renderer) but not reflected in STEP export, which only represents B-rep geometry.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| "may not have length 0" | Zero-length xVec or yVec | Use non-zero direction vectors |
| "may not be parallel" | xVec ∥ yVec | Ensure vectors span a 2D plane |
| code 1006 "invalid id" | Nonexistent or invalid ID | Check the ID exists |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

// Move the box to [100, 100, 0] with default orientation
await api.v1.common.setObjectCoordSystem({
  id: boxId,
  origin: [100, 100, 0],
  xVec: [1, 0, 0],
  yVec: [0, 1, 0],
})

// Rotate entire EIF 90° around Z axis
await api.v1.common.setObjectCoordSystem({
  id: eifId,
  origin: [0, 0, 0],
  xVec: [0, 1, 0],
  yVec: [-1, 0, 0],
})
```

## Object Type Compatibility

Works on: parts, entity injections, solid bodies, sketches, work planes, work axes, work points, part features (part.box etc.), curve shapes. No known object type that rejects it (beyond invalid IDs).

## Related

- `common.transformObjectWithMatrix` — transform with a 4x4 matrix (more general, supports isGlobal flag)
- `solid.translation` / `solid.rotation` — relative transforms on solids (cumulative, not absolute)
- `part.workPlane` / `part.updateWorkPlane` — alternative way to position work planes
