# assembly.spherical

Creates a spherical (ball joint) constraint between two instances, allowing 3 rotational degrees of freedom. The WCS origins of mate1 and mate2 are aligned, and the second instance is free to rotate in all directions around that point. Optionally limit the Y-axis rotation.

## Prerequisites

- A root assembly (`assembly.create`)
- At least two instances with work coordinate systems in their templates
- Must be in assembly context (`setCurrentProduct({ id: asmId })`)

## Key Parameters

- `id` (required) — assembly ID where the constraint is created
- `mate1` / `mate2` (both required) — each has:
  - `path` (required) — array with instance ID(s). For top-level instances: `[instId]`
  - `csys` (required) — work coordinate system ID from the instance's template
  - `flip` (optional) — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'` (default `'Z'`). Defines which WCS axis becomes the main axis
  - `reorient` (optional) — `'0'` | `'90'` | `'180'` | `'270'` (default `'0'`). Rotation around the main axis in 90° steps. Values are **strings**, not numbers
- `yRotationLimits` (optional) — object with a **single** property `max`. Unlike revolute/cylindrical which have `{ min, max }`, spherical only has `{ max }`. Accepts:
  - Radians as number: `{ max: 1.57 }`
  - Degree expression as string: `{ max: '45deg' }`
  - Stored internally as radians. Default: `{ max: null }` (no limit)
- `name` (optional, default `'Spherical'`) — constraint name. Duplicates allowed

## Difference from Other Kinematic Constraints

- **Revolute** — 1 DOF: rotation around Z only. Has `zOffset` + `zRotationLimits: { min, max }`
- **Cylindrical** — 2 DOF: rotation + translation along Z. Has `zOffsetLimits` + `zRotationLimits: { min, max }`
- **Slider** — 1 DOF: translation along Z only. Has `xOffset`, `yOffset` + `zOffsetLimits: { min, max }`
- **Spherical** — 3 DOF: all rotations. Has only `yRotationLimits: { max }` (no min, no offsets)

## Return Value

- **Single call:** numeric constraint ID
- **Batch call (array param):** array of constraint IDs
- **On error:** `null` (VOID), maxLevel 51
- **On success:** maxLevel 31 (info level)

## Batch Creation

Pass array of param objects: `spherical([{...}, {...}])`. Returns array of IDs.

## Deleting Spherical Constraints

Use `deleteConstraint({ ids: [constraintId] })` — note the parameter is **`ids`** (plural, array), NOT `id`. Using singular `id` silently fails with code 1004.

## Gotchas

- **yRotationLimits has only `max`, no `min`.** Unlike revolute/cylindrical constraints which use `{ min, max }`, spherical only supports `{ max }`.
- **Empty `yRotationLimits: {}` errors.** Passing an empty object fails with code 1003. Either provide `{ max: value }` or omit the parameter entirely.
- **Negative max is silently accepted.** Passing `yRotationLimits: { max: -1 }` succeeds without error — behavior undefined.
- **`ids` not `id` for deleteConstraint.** Using `{ id: constraintId }` fails with code 1004.
- **reorient values are strings.** Pass `'90'` not `90`. Invalid values like `'45'` error with code 1013.
- **Self-constraint blocked.** Same instance in both mates errors with code 1014.
- **Cross-type name collision.** If a non-spherical constraint with the same name was created first, `getSpherical` may fail. Use unique names across constraint types.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"id" must be provided to create CC_SphericalConstraint` | Missing assembly ID | 1004 |
| `"The object "yRotationLimits" is empty!"` | Empty `{}` for limits | 1003 |
| `"ids" must be provided` | Used `id` instead of `ids` in deleteConstraint | 1004 |
| `"path" has a wrong id type! ["instance"]` | Template ID in path | 1001 |
| `Type "INVALID" is not supported to use as flip type.` | Invalid flip value | 1013 |
| `Type "45" is not supported to use as reorient type.` | Invalid reorient value | 1013 |
| `mate1 and mate2... same rigid set` | Same instance in both mates | 1014 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'BallJointAsm' })).result

const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 60, height: 10 })
const wcs1 = (await api.v1.part.workCSys({
  id: tpl1, name: 'BallSocket', origin: [40, 30, 10],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
await api.v1.part.box({ id: tpl2, name: 'Rod', length: 10, width: 10, height: 60 })
const wcs2 = (await api.v1.part.workCSys({
  id: tpl2, name: 'BallJoint', origin: [5, 5, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

const cId = (await api.v1.assembly.spherical({
  id: asmId,
  name: 'BallJoint1',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
  yRotationLimits: { max: '45deg' },
})).result
```

## Related

- `assembly.updateSpherical` — modify constraint params after creation
- `assembly.getSpherical` — retrieve constraint by name
- `assembly.deleteConstraint` — delete constraints (use `ids` array)
- `assembly.revolute` — 1-DOF rotation variant
- `assembly.cylindrical` — 2-DOF rotation + translation variant
- `assembly.fastened` — 0-DOF rigid lock
- `part.workCSys` — create WCS that mates reference
