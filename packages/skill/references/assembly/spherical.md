# assembly.spherical

Creates a spherical (ball-joint) constraint between two instances. Locks 3 translational DOF (origins coincide), leaves all 3 rotational DOF free.

## Prerequisites

- An assembly root (`assembly.create`)
- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates
- **Ground at least one instance** with `fastenedOrigin` before applying spherical — otherwise the solver repositions BOTH instances

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
- `yRotationLimits` — `{ max }` defining max rotation around Y-axis. Accepts radians (number) or degree strings (`'45deg'`). Stored internally as radians. Omit or pass `null` for no limit.
- `name` — constraint name (default `"Spherical"`)

## Alignment Semantics (CRITICAL)

**Same as all other assembly constraints.** The csys position and axes have NO spatial effect. With zero offsets, inst2 is placed at inst1's origin regardless of where the csys origins are in their templates. The csys is required by the API but only serves as an identifier.

**No offset params.** Unlike revolute (zOffset), cylindrical (zOffset), slider (xOffset/yOffset), or parallel (xOffset/yOffset/zOffset), spherical has NO offset parameters. The only way to separate the two instances is through `moveUnderConstraints` or by removing the constraint.

## DOF and Behavior

Spherical constrains 3 DOF, leaving 3 free:
- **Locked:** X-translation, Y-translation, Z-translation (origins coincide)
- **Free:** X-rotation, Y-rotation, Z-rotation (all rotations unconstrained)

With no motion commands, the solver places inst2 at the default rotation (identity). The free rotation DOFs only become active via `moveUnderConstraints` or when external constraints interact.

## flip and reorient — NO EFFECT

Because all 3 rotation DOFs are free, `mate.flip` and `mate.reorient` have no observable effect on a spherical constraint. The solver absorbs any applied orientation since rotation is unconstrained. This differs from:
- **slider** (all rotation locked → flip/reorient always visible)
- **revolute** (1 rotation free, 2 locked → some flips visible)
- **parallel** (some rotations free → some flips absorbed)

The params are accepted without error but produce no change in positioning.

## yRotationLimits

Optional constraint on Y-axis rotation. Only has a `max` field (no `min`).

- `yRotationLimits: { max: 0.785 }` — radians (~45°)
- `yRotationLimits: { max: '45deg' }` — degree string, stored as 0.7853981633974483
- Omit entirely or `yRotationLimits: null` — no limit (free rotation)

`getSpherical` always returns `yRotationLimits: { max: ... }` where max is a number or `null`.

## Return Value

- Single call: `id` — the constraint ID
- Array call: `Array<id>` — one ID per constraint

## getSpherical

`getSpherical({ id: assemblyId, name: 'BallJoint' })` — query by name.

- Takes **assembly/product ID** (NOT instance ID). Instance ID returns null.
- Returns: `{ id, name, mate1, mate2, yRotationLimits }` with full mate details (path, csys, flip, reorient)
- Not found: `result: null`, maxLevel=51, error code 0

## updateSpherical

`updateSpherical({ id: constraintId, ... })` — takes **constraint ID** (NOT assembly ID).

True partial update — only specified params change, unspecified are preserved.

- **Add/change yRotationLimits:** `{ id, yRotationLimits: { max: '60deg' } }`
- **Remove yRotationLimits:** `{ id, yRotationLimits: null }`
- **Rename:** `{ id, name: 'NewName' }` — old name immediately unfindable
- **Remate:** `{ id, mate2: { path: [newInst], csys: wcs } }` — repositions new instance

## Batch Creation

Pass an array of param objects to create multiple constraints in one call:

```js
await api.v1.assembly.spherical([
  { id: asmId, name: 'Ball_A', mate1: {...}, mate2: {...} },
  { id: asmId, name: 'Ball_B', mate1: {...}, mate2: {...}, yRotationLimits: { max: '90deg' } },
])
// Returns: [constraintIdA, constraintIdB]
```

## Common Errors

| Error | Code | Cause |
|---|---|---|
| "belong to the same rigid set" | 1014 | Same instance in both mates |
| "csys must be provided" | 1004 | Missing csys in mate |
| "not supported as flip type" | 1013 | Invalid flip string |
| "wrong id type, provide instance" | 1001 | Template ID in path instead of instance ID |
| "not an assembly id" | 1007 | Instance/template ID passed as `id` |
| "not a constraint or relation" | 1007 | Assembly ID passed to updateSpherical |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tpl = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 10, height: 8 })
const wcs = (await api.v1.part.workCSys({
  id: tpl, name: 'Mate', origin: [0, 0, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tpl2, name: 'B', length: 60, width: 60, height: 10 })
const wcs2 = (await api.v1.part.workCSys({
  id: tpl2, name: 'Mate', origin: [0, 0, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst1 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId })).result

await api.v1.assembly.fastenedOrigin({
  id: asmId, mate1: { path: [inst1], csys: wcs2 },
})

const sId = (await api.v1.assembly.spherical({
  id: asmId, name: 'BallJoint',
  mate1: { path: [inst1], csys: wcs2 },
  mate2: { path: [inst2], csys: wcs },
  yRotationLimits: { max: '45deg' },
})).result

// Query
const state = (await api.v1.assembly.getSpherical({ id: asmId, name: 'BallJoint' })).result

// Update
await api.v1.assembly.updateSpherical({ id: sId, yRotationLimits: { max: '90deg' } })

// Remove limits
await api.v1.assembly.updateSpherical({ id: sId, yRotationLimits: null })
```

## Related

- `assembly.fastened` — 0 DOF (all locked)
- `assembly.revolute` — 1 DOF (Z-rotation)
- `assembly.cylindrical` — 2 DOF (Z-rotation + Z-translation)
- `assembly.slider` — 1 DOF (Z-translation)
- `assembly.planar` — 3 DOF (X/Y translation + Z-rotation)
- `assembly.parallel` — 5 DOF (all translations + Z-rotation + one more)
