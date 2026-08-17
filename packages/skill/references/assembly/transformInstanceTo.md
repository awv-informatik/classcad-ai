# assembly.transformInstanceTo

Sets the **absolute** position and orientation of an instance using `[origin, xDir, yDir]` format. Unlike `transformInstance` (which applies a relative 4x4 delta), this overwrites the instance's transform completely.

## Prerequisites

- An assembly with instances already created (`assembly.create` + `assembly.instance`)

## Key Parameters

- `id` — instance ID (CC_ProductReference or CC_ProductReferenceET). Required. Must be an instance type — template IDs are rejected (error 1001).
- `transformation` — `[[ox, oy, oz], [xx, xy, xz], [yx, yy, yz]]` — 3-point array: origin, x-direction, y-direction. z-direction is derived from cross(xDir, yDir). **Only the 3-point format is accepted** — 4x4 matrices are rejected with error 1002.
- `isLocal` — `FALSE` (default): coordinates are in world/global frame. `TRUE`: coordinates are in the owner's (parent assembly's) local frame.

## Return Value

`VOID` (null). maxLevel=31 on success.

## Transform Format

The `[origin, xDir, yDir]` format defines a coordinate system:
- **origin** — absolute position of the instance
- **xDir** — direction of the instance's local X axis
- **yDir** — direction of the instance's local Y axis
- **zDir** — automatically computed as cross(xDir, yDir)

Identity transform (no rotation, at origin): `[[0,0,0], [1,0,0], [0,1,0]]`

### Vector handling

- **Non-unit vectors are normalized.** `[2,0,0]` is treated the same as `[1,0,0]` — no scaling effect.
- **Non-orthogonal vectors are orthogonalized.** The system keeps xDir's direction, computes z=cross(x,y), then corrects y=cross(z,x). Gram-Schmidt style.
- **Left-handed systems are impossible** with this format — cross(x,y) always produces a right-handed frame (unlike the 4x4 format which can produce left-handed matrices).

## Absolute vs Relative

This API is **absolute** — it sets the instance's transform, not adds to it. Calling it twice with different positions moves the instance to the second position, discarding the first. Compare:

| API | Transform type | Format | Effect |
|---|---|---|---|
| `transformInstanceTo` | Absolute | `[origin, xDir, yDir]` (3 points) | Sets position/orientation |
| `transformInstance` | Relative | 4x4 matrix | Composes with current: new = M × current |

## Propagation Rules

Same as `transformInstance`:

| Instance type | What happens |
|---|---|
| **Root-level** (CC_ProductReference under AssemblyRoot) | Moves ONLY the target instance. Siblings are unaffected. |
| **Expanded-tree** (CC_ProductReferenceET under a sub-assembly instance) | Propagates to the template's corresponding instance, then updates ALL other instances of that template. |

**ET propagation detail:** When you transform an ET instance with `isLocal: FALSE`, the system converts the global position to the template's local frame before storing. All instances of that template then get the same child position in their local frame. You cannot position the same child differently in different instances of a sub-assembly.

## isLocal Behavior

With a sub-assembly rotated 90° around Z (local X → world Y):

| isLocal | `[30, 0, 0]` as origin | World position |
|---|---|---|
| `FALSE` (default) | Global [30, 0, 0] | Instance at world [30, 0, 0] |
| `TRUE` | Local [30, 0, 0] in owner's frame | Instance at world [0, 30, 0] (rotated) |

`isLocal: TRUE` also transforms the direction vectors through the owner's frame.

## Batch Form

Accepts an array of `{ id, transformation, isLocal }` objects. Each is processed independently. Returns single VOID result.

```js
await api.v1.assembly.transformInstanceTo([
  { id: inst1, transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] },
  { id: inst2, transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]] },
])
```

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"transformation" must be provided` | 1004 | Missing transformation param |
| `"id" must be provided` | 1004 | Missing id param |
| `"transformation" has invalid number of elements! There should be 3` | 1002 | Wrong array size (e.g., 4x4 matrix, 2 points, empty) |
| `"id" has a wrong id type` | 1001 | Template ID instead of instance ID |
| `ToId()/TOID() didn't get an existing or valid id` | 0 | Nonexistent instance ID |
| `Vectors for SetCoordSystem may not have length 0` | 0 (eval error) | Zero-length direction vector |
| `Vectors for SetCoordSystem may not be parallel` | 0 (eval error) | Collinear xDir and yDir |

## Gotchas

- **No 4x4 matrix support.** Unlike `assembly.instance` (which accepts both 3-point and 4x4), this API ONLY accepts the 3-point `[origin, xDir, yDir]` format. Passing a 4x4 matrix produces error 1002.
- **Non-orthogonal vectors are silently corrected.** The system orthogonalizes without warning — xDir is kept, yDir is adjusted. This can produce unexpected orientations if you pass approximate vectors.
- **ET propagation is silent.** No warning that sibling instances were also modified.

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'Inst1',
})).result

// Place at [50, 30, 0], no rotation
await api.v1.assembly.transformInstanceTo({
  id: inst,
  transformation: [[50, 30, 0], [1, 0, 0], [0, 1, 0]],
})

// Rotate 90° around Z at [50, 30, 0]
await api.v1.assembly.transformInstanceTo({
  id: inst,
  transformation: [[50, 30, 0], [0, 1, 0], [-1, 0, 0]],
})

// Place at origin with 90° rotation around X
await api.v1.assembly.transformInstanceTo({
  id: inst,
  transformation: [[0, 0, 0], [1, 0, 0], [0, 0, 1]],
})
```

## Related

- `assembly.transformInstance` — applies relative 4x4 delta (composes with current transform)
- `assembly.instance` — create instances with initial transform (accepts both 3-point and 4x4)
- `assembly.startMovingUnderConstraints` / `moveUnderConstraints` / `finishMovingUnderConstraints` — constraint-respecting motion
