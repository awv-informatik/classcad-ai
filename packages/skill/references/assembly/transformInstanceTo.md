# assembly.transformInstanceTo

Sets the **absolute** position and orientation of an instance in `[origin, xDir, yDir]` format, overwriting its transform (a second call discards the first). Compare `transformInstance`, which composes a relative 4x4 delta (`new = M × current`).

Prerequisites: an assembly with instances.

## Key Parameters

- `id` — required; instance ID (CC_ProductReference or CC_ProductReferenceET). Template IDs → 1001
- `transformation` — required; `[[ox, oy, oz], [xx, xy, xz], [yx, yy, yz]]`: origin, x-direction, y-direction; zDir = cross(xDir, yDir). Identity: `[[0,0,0], [1,0,0], [0,1,0]]`. **Only this 3-point format** — 4x4 matrices (unlike `assembly.instance`) → error 1002
- `isLocal` — `FALSE` (default): world frame. `TRUE`: owner's (parent assembly's) frame; direction vectors are transformed through it too. With a sub-assembly rotated 90° about Z, origin `[30,0,0]` lands at world `[30,0,0]` (FALSE) or `[0,30,0]` (TRUE)

## Vector Handling

- **Normalized:** `[2,0,0]` ≡ `[1,0,0]`, no scaling.
- **Silently orthogonalized:** xDir is kept, z = cross(x,y), then y = cross(z,x). Approximate vectors can yield unexpected orientations.
- **Always right-handed** — left-handed frames are impossible in this format.

## Return Value

VOID (null), maxLevel 31. Array form `[{ id, transformation, isLocal }, ...]` processes each independently, returns a single VOID.

## Propagation Rules

Same as `transformInstance`: a root-level instance moves alone (siblings unaffected); an expanded-tree instance (CC_ProductReferenceET) propagates to the template's corresponding instance and ALL instances of that template, silently. With `isLocal: FALSE`, the global position is converted to the template's local frame before storing, so every instance of the sub-assembly gets the same local child position — you cannot position the same child differently per instance.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"transformation" must be provided` / `"id" must be provided` | 1004 | Missing param |
| `"transformation" has invalid number of elements! There should be 3` | 1002 | Wrong size (4x4, 2 points, empty) |
| `"id" has a wrong id type` | 1001 | Template ID instead of instance ID |
| `ToId()/TOID() didn't get an existing or valid id` | 0 | Nonexistent instance ID |
| `Vectors for SetCoordSystem may not have length 0` | 0 (eval error) | Zero-length direction vector |
| `Vectors for SetCoordSystem may not be parallel` | 0 (eval error) | Collinear xDir and yDir |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })
await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result

// At [50, 30, 0], rotated 90° around Z
await api.v1.assembly.transformInstanceTo({
  id: inst, transformation: [[50, 30, 0], [0, 1, 0], [-1, 0, 0]],
})
// At origin, rotated 90° around X
await api.v1.assembly.transformInstanceTo({
  id: inst, transformation: [[0, 0, 0], [1, 0, 0], [0, 0, 1]],
})
```

## Related

`assembly.transformInstance` · `assembly.instance` · `assembly.startMovingUnderConstraints` / `moveUnderConstraints` / `finishMovingUnderConstraints`
