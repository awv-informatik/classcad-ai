# assembly.planar

Creates a planar constraint between two instances, allowing 3 degrees of freedom: rotation around the Z axis AND translation along X and Y axes. The constraint solver aligns the two WCS Z axes, with free rotation around Z and free sliding along X and Y.

## Prerequisites

- A root assembly (`assembly.create`)
- At least two instances with work coordinate systems in their templates
- Must be in assembly context (`setCurrentProduct({ id: asmId })`)

## Key Parameters

- `id` (required) — assembly ID where the constraint is created
- `mate1` / `mate2` (both required) — each has:
  - `path` (required) — array with instance ID(s). For top-level instances: `[instId]`
  - `csys` (required) — work coordinate system ID from the instance's template
  - `flip` (optional) — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'` (default `'Z'`). Defines which WCS axis becomes the constraint's main axis
  - `reorient` (optional) — `'0'` | `'90'` | `'180'` | `'270'` (default `'0'`). Rotation around the main axis in 90° steps. Values are **strings**, not numbers
- `zOffset` (optional, default 0) — fixed offset along the Z axis from mate1 to mate2. This is a fixed value, not a range
- `xOffsetLimits` (optional) — object defining translation range along X axis: `{ min, max }`. **Partial spec allowed on create** — min-only or max-only works. Empty `{}` errors (code 1003)
- `yOffsetLimits` (optional) — object defining translation range along Y axis: `{ min, max }`. **Partial spec allowed on create** — same as xOffsetLimits
- `zRotationLimits` (optional) — object defining rotation range around Z axis: `{ min, max }`. **Both min AND max required on create** — partial limits error with code 1004. Accepts:
  - Radians as numbers: `{ min: -Math.PI/4, max: Math.PI/2 }`
  - Degree expressions as strings: `{ min: '-90deg', max: '120deg' }`
  - Stored internally as radians. Default: `{ min: null, max: null }` (no limits)
- `name` (optional, default `'Planar'`) — constraint name. Duplicates allowed

## Difference from Revolute and Cylindrical

- **Revolute** — 1 DOF: rotation around Z. Has `zOffset` (fixed) and `zRotationLimits`
- **Cylindrical** — 2 DOF: rotation around Z + translation along Z. Has `zOffsetLimits` (range) and `zRotationLimits`. No fixed `zOffset`
- **Planar** — 3 DOF: rotation around Z + translation along X + translation along Y. Has `zOffset` (fixed), `xOffsetLimits` (range), `yOffsetLimits` (range), and `zRotationLimits`

## Asymmetric Partial Limits on Create

| Limit type | Partial allowed on create? | Partial allowed on update? |
|---|---|---|
| `xOffsetLimits` | **YES** — min-only or max-only | YES |
| `yOffsetLimits` | **YES** — min-only or max-only | YES |
| `zRotationLimits` | **NO** — both min and max required | YES |

## Return Value

- **Single call:** numeric constraint ID
- **Batch call (array param):** array of constraint IDs
- **On error:** `null` (VOID), maxLevel 51
- **On success:** maxLevel 31 (info level)

## Batch Creation

Pass array of param objects: `planar([{...}, {...}])`. Returns array of IDs.

## Deleting Planar Constraints

Use `deleteConstraint({ ids: [constraintId] })` — note the parameter is **`ids`** (plural, array), NOT `id`.

## Gotchas

- **`ids` not `id` for deleteConstraint.** Using `{ id: constraintId }` silently fails with code 1004.
- **Partial zRotationLimits not allowed on create.** If you provide `zRotationLimits`, both `min` and `max` must be present. But `xOffsetLimits`/`yOffsetLimits` allow partial.
- **Empty `{}` for limits errors.** Pass at least one of min/max, or omit the param entirely. Empty object errors with code 1003.
- **reorient values are strings.** Pass `'90'` not `90`. Invalid values like `'45'` error with code 1013.
- **Self-constraint blocked.** Same instance in both mates errors with code 1014.
- **Cross-type name collision.** All get* methods find the FIRST constraint by name regardless of type. Use unique names across constraint types.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"id" must be provided to create CC_PlanarConstraint` | Missing assembly ID | 1004 |
| `"max" must be provided` | Partial zRotationLimits (only min given) | 1004 |
| `"ids" must be provided` | Used `id` instead of `ids` in deleteConstraint | 1004 |
| `"path" has a wrong id type! ["instance"]` | Template ID in path | 1001 |
| `The object "xOffsetLimits" is empty!` | Empty `{}` for limits | 1003 |
| `Type "INVALID" is not supported to use as flip type.` | Invalid flip value | 1013 |
| `Type "45" is not supported to use as reorient type.` | Invalid reorient value | 1013 |
| `mate1 and mate2... same rigid set` | Same instance in both mates | 1014 |
| `[Evaluation error in AbstractAPI.PrepareAPIParams]` | Missing mate1 or mate2 | 0 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'SliderAsm' })).result

const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
const wcs1 = (await api.v1.part.workCSys({
  id: tpl1, name: 'PlanarRef', origin: [50, 40, 10],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
await api.v1.part.box({ id: tpl2, name: 'Block', length: 30, width: 30, height: 20 })
const wcs2 = (await api.v1.part.workCSys({
  id: tpl2, name: 'PlanarRef', origin: [15, 15, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

const cId = (await api.v1.assembly.planar({
  id: asmId,
  name: 'SlidePlane',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
  zOffset: 5,
  xOffsetLimits: { min: -40, max: 40 },
  yOffsetLimits: { min: -30, max: 30 },
  zRotationLimits: { min: '-90deg', max: '90deg' },
})).result
```

## Related

- `assembly.updatePlanar` — modify constraint params after creation
- `assembly.getPlanar` — retrieve constraint by name
- `assembly.deleteConstraint` — delete constraints (use `ids` array)
- `assembly.revolute` — 1-DOF variant (rotation only)
- `assembly.cylindrical` — 2-DOF variant (rotation + Z translation)
- `assembly.slider` — another multi-DOF constraint type
- `part.workCSys` — create WCS that mates reference
