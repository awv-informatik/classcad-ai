# assembly.cylindrical

Creates a cylindrical constraint between two instances, allowing 2 degrees of freedom: rotation around the constraint's Z axis AND translation along that axis. The constraint solver aligns the two WCS Z axes, with free rotation and sliding along the aligned axis.

## Prerequisites

- A root assembly (`assembly.create`)
- At least two instances with work coordinate systems in their templates
- Must be in assembly context (`setCurrentProduct({ id: asmId })`)

## Key Parameters

- `id` (required) — assembly ID where the constraint is created
- `mate1` / `mate2` (both required) — each has:
  - `path` (required) — array with instance ID(s). For top-level instances: `[instId]`
  - `csys` (required) — work coordinate system ID from the instance's template
  - `flip` (optional) — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'` (default `'Z'`). Defines which WCS axis becomes the constraint axis
  - `reorient` (optional) — `'0'` | `'90'` | `'180'` | `'270'` (default `'0'`). Rotation around the main axis in 90° steps. Values are **strings**, not numbers
- `zOffsetLimits` (optional) — object defining translation range along Z axis: `{ min, max }`. **Partial spec allowed on create** — min-only or max-only works (missing side stored as `null`). Accepts numbers (mm). Empty `{}` errors.
- `zRotationLimits` (optional) — object defining rotation range around Z axis: `{ min, max }`. **Both min AND max required on create** — partial limits error with code 1004. Accepts:
  - Radians as numbers: `{ min: -Math.PI/4, max: Math.PI/2 }`
  - Degree expressions as strings: `{ min: '-90deg', max: '120deg' }`
  - Stored internally as radians. Default: `{ min: null, max: null }` (no limits)
- `name` (optional, default `'Cylindrical'`) — constraint name. Duplicates allowed

## Difference from Revolute

- **Revolute** — 1 DOF, free rotation only. Has `zOffset` (fixed offset value) and `zRotationLimits`
- **Cylindrical** — 2 DOF, free rotation AND translation. Has `zOffsetLimits` (min/max range) and `zRotationLimits`. No fixed `zOffset` param

## Return Value

- **Single call:** numeric constraint ID
- **Batch call (array param):** array of constraint IDs
- **On error:** `null` (VOID), maxLevel 51
- **On success:** maxLevel 31 (info level)

## Batch Creation

Pass array of param objects: `cylindrical([{...}, {...}])`. Returns array of IDs.

## Asymmetric Partial Limits on Create

| Limit type | Partial allowed on create? | Partial allowed on update? |
|---|---|---|
| `zOffsetLimits` | **YES** — min-only or max-only | YES |
| `zRotationLimits` | **NO** — both min and max required | YES |

This is a key difference: `zOffsetLimits` accepts partial specs on create while `zRotationLimits` does not. Both accept partial specs on update.

## Deleting Cylindrical Constraints

Use `deleteConstraint({ ids: [constraintId] })` — note the parameter is **`ids`** (plural, array), NOT `id`. Supports batch deletion.

## Gotchas

- **`ids` not `id` for deleteConstraint.** Using `{ id: constraintId }` silently fails with code 1004.
- **Partial zRotationLimits not allowed on create.** If you provide `zRotationLimits`, both `min` and `max` must be present. But `zOffsetLimits` allows partial.
- **reorient values are strings.** Pass `'90'` not `90`. Invalid values like `'45'` error with code 1013.
- **Self-constraint blocked.** Same instance in both mates errors with code 1014.
- **Cross-type name collision.** If a non-cylindrical constraint with the same name was created first, `getCylindrical` will fail to find this constraint. Avoid sharing names across constraint types.
- **No fixed zOffset.** Unlike revolute, cylindrical has no `zOffset` param. Use `zOffsetLimits` with equal min/max to simulate a fixed offset.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"id" must be provided to create CC_CylindricalConstraint` | Missing assembly ID | 1004 |
| `"max" must be provided` | Partial zRotationLimits (only min given) | 1004 |
| `"ids" must be provided` | Used `id` instead of `ids` in deleteConstraint | 1004 |
| `"path" has a wrong id type! ["instance"]` | Template ID in path | 1001 |
| `Type "INVALID" is not supported to use as flip type.` | Invalid flip value | 1013 |
| `Type "45" is not supported to use as reorient type.` | Invalid reorient value | 1013 |
| `mate1 and mate2... same rigid set` | Same instance in both mates | 1014 |
| `The object "zOffsetLimits" is empty!` | Empty `{}` for limits | — |

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'PistonAsm' })).result

const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Cylinder' })).result
await api.v1.part.box({ id: tpl1, name: 'Body', length: 80, width: 50, height: 10 })
const wcs1 = (await api.v1.part.workCSys({
  id: tpl1, name: 'SlideAxis', origin: [40, 25, 10],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Piston' })).result
await api.v1.part.box({ id: tpl2, name: 'Rod', length: 10, width: 10, height: 60 })
const wcs2 = (await api.v1.part.workCSys({
  id: tpl2, name: 'SlideAxis', origin: [5, 5, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

const cId = (await api.v1.assembly.cylindrical({
  id: asmId,
  name: 'PistonSlide',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
  zOffsetLimits: { min: -20, max: 30 },
  zRotationLimits: { min: '-90deg', max: '90deg' },
})).result
```

## Related

- `assembly.updateCylindrical` — modify constraint params after creation
- `assembly.getCylindrical` — retrieve constraint by name
- `assembly.deleteConstraint` — delete constraints (use `ids` array)
- `assembly.revolute` — 1-DOF variant (rotation only, fixed offset)
- `assembly.fastened` — 0-DOF variant (rigid lock)
- `part.workCSys` — create WCS that mates reference
