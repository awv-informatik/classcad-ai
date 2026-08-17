# assembly.transformInstance

Applies a **relative** 4x4 transformation matrix to an instance. The matrix composes with the instance's current transform: `new_transform = M × current_transform`. This is a delta — not an absolute position.

## Prerequisites

- An assembly with instances already created (`assembly.create` + `assembly.instance`)

## Key Parameters

- `id` — instance ID (CC_ProductReference or CC_ProductReferenceET). Required.
- `transformation` — 4x4 row-major matrix `[[R00,R01,R02,Tx],[R10,R11,R12,Ty],[R20,R21,R22,Tz],[0,0,0,1]]`. Required. Must be orthogonal (right-handed). The 3x3 rotation part is normalized after composition — see scale matrix gotcha below.
- `isLocal` — `FALSE` (default): matrix is in world/global coordinates. `TRUE`: matrix is relative to the owner's (parent assembly's) coordinate frame. **Critical for sub-assembly work** — when a sub-assembly is rotated, `isLocal: TRUE` applies the transform in the sub-assembly's local axes, not world axes.

## Return Value

`VOID` (null). maxLevel=31 on success.

## Composition Order

The transform is applied as left-multiplication: `new = M × current`. This means:
- **Translation [Tx,Ty,Tz]** in M is added in world space (or owner space if isLocal:TRUE)
- **Rotation** in M rotates around the world origin (or owner origin if isLocal:TRUE), not around the instance's local origin
- Transforms **accumulate** — chaining multiple calls works correctly

## Propagation Rules (CRITICAL)

The behavior depends on the instance type:

| Instance type | What happens |
|---|---|
| **Root-level** (CC_ProductReference under AssemblyRoot) | Moves ONLY the target instance. Sibling instances of the same template are **unaffected**. |
| **Expanded-tree** (CC_ProductReferenceET under a sub-assembly instance) | Propagates to the template's corresponding instance, then updates ALL other instances of that template. |

**This means:** transforming a child inside one sub-assembly instance changes the same child in ALL instances of that sub-assembly. Use `transformInstanceTo` if you need per-instance absolute positioning instead.

## Gotchas

- **Scale matrices are silently accepted.** The docs say "scaling is ignored," but this is misleading. A scale matrix (e.g., 2×identity) is accepted without error (maxLevel=31). The 3x3 rotation part is renormalized after composition. However, the translation column has already absorbed the scaling from the matrix multiplication. Effect: a 2x scale matrix applied to an instance at position `[20, 30, 0]` moves it to `[40, 60, 0]` — the position is effectively doubled.
- **Left-handed matrices rejected** with error 1014: "The provided matrix is left-handed. This is not yet supported."
- **ET propagation is silent.** No warning that sibling instances were also modified. The COG changes across the entire assembly.
- **Identity matrix is a no-op.** Returns successfully, instance unchanged.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"transformation" must be provided` | 1004 | Missing transformation param |
| `The provided matrix is left-handed` | 1014 | Mirror/reflection matrix (det(R) = -1) |
| `invalid id` | 1006 | Nonexistent instance ID |
| `ToId() didn't get an existing or valid id` | 0 (warn) | Accompanies code 1006 |

## isLocal Behavior

With a sub-assembly rotated 90° around Z (local X → world Y):

| isLocal | +30 in matrix X column | World effect |
|---|---|---|
| `FALSE` (default) | +30 world X | Instance moves in world X |
| `TRUE` | +30 local X | Instance moves in world Y (because owner's X is rotated to world Y) |

## Batch Form

Accepts an array of `{ id, transformation, isLocal }` objects. Each is processed independently. Returns single VOID result.

```js
await api.v1.assembly.transformInstance([
  { id: inst1, transformation: [[1,0,0,10],[0,1,0,0],[0,0,1,0],[0,0,0,1]] },
  { id: inst2, transformation: [[1,0,0,20],[0,1,0,0],[0,0,1,0],[0,0,0,1]] },
])
```

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'Inst1',
  transformation: [[10, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result

// Translate +40 in X (relative to current position)
await api.v1.assembly.transformInstance({
  id: inst,
  transformation: [[1,0,0,40],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
})
// Instance now at [50, 0, 0]

// Rotate 90° around Z (relative)
await api.v1.assembly.transformInstance({
  id: inst,
  transformation: [[0,-1,0,0],[1,0,0,0],[0,0,1,0],[0,0,0,1]],
})
// Instance now at [50, 0, 0] rotated 90°Z
```

## Related

- `assembly.transformInstanceTo` — sets absolute position (not relative)
- `assembly.instance` — create instances with initial transform
- `assembly.startMovingUnderConstraints` / `moveUnderConstraints` / `finishMovingUnderConstraints` — constraint-respecting motion
