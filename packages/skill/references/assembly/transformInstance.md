# assembly.transformInstance

Applies a **relative** 4x4 transformation to an instance: `new_transform = M × current_transform`. A delta, not an absolute position (for absolute placement use `transformInstanceTo`).

Prerequisites: an assembly with instances.

## Key Parameters

- `id` — required; instance ID (CC_ProductReference or CC_ProductReferenceET)
- `transformation` — required; 4x4 row-major `[[R00,R01,R02,Tx],[R10,R11,R12,Ty],[R20,R21,R22,Tz],[0,0,0,1]]`. Must be orthogonal (right-handed); the 3x3 rotation part is normalized after composition (see scale gotcha)
- `isLocal` — `FALSE` (default): world coordinates. `TRUE`: owner's (parent assembly's) frame — **critical for sub-assembly work**: in a rotated sub-assembly the transform follows its local axes

## Return Value

VOID (null), maxLevel 31. Array form `[{ id, transformation, isLocal }, ...]` processes each independently and returns a single VOID.

## Composition

Left-multiplication: translation in M is added in world space (owner space with isLocal TRUE); rotation in M rotates around the world origin (owner origin), **not** the instance's local origin. Calls accumulate. Identity is a no-op.

With a sub-assembly rotated 90° about Z (local X → world Y), +30 in the matrix X column moves the instance along world X with `isLocal: FALSE`, along world Y with `isLocal: TRUE`.

## Propagation Rules (CRITICAL)

| Instance type | Effect |
|---|---|
| **Root-level** (CC_ProductReference under AssemblyRoot) | Moves ONLY the target; sibling instances of the same template unaffected |
| **Expanded-tree** (CC_ProductReferenceET under a sub-assembly instance) | Propagates to the template's corresponding instance, then ALL instances of that template — silently, no warning; COG changes across the whole assembly |

So transforming a child inside one sub-assembly instance changes that child in ALL instances of the sub-assembly.

## Gotchas

- **Scale matrices are silently accepted** (maxLevel 31), despite the docs saying "scaling is ignored". The rotation part is renormalized, but the translation column has already absorbed the scale: a 2×identity matrix moves an instance at `[20, 30, 0]` to `[40, 60, 0]`.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"transformation" must be provided` | 1004 | Missing transformation |
| `The provided matrix is left-handed. This is not yet supported.` | 1014 | Mirror/reflection matrix (det(R) = -1) |
| `invalid id` | 1006 | Nonexistent instance ID |
| `ToId() didn't get an existing or valid id` | 0 (warn) | Accompanies 1006 |

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

// +40 in X → at [50, 0, 0]
await api.v1.assembly.transformInstance({
  id: inst, transformation: [[1,0,0,40],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
})
// Rotate 90° around Z (relative, about the world origin) → at [0, 50, 0] rotated 90°Z
await api.v1.assembly.transformInstance({
  id: inst, transformation: [[0,-1,0,0],[1,0,0,0],[0,0,1,0],[0,0,0,1]],
})
```

## Related

`assembly.transformInstanceTo` · `assembly.instance` · `assembly.startMovingUnderConstraints` / `moveUnderConstraints` / `finishMovingUnderConstraints`
