# assembly.parallel

Creates a parallel constraint between two instances, allowing 4 degrees of freedom: rotation around Z axis AND translation along all 3 axes (X, Y, Z). The constraint solver aligns the two WCS Z axes to be parallel, with free rotation around Z and free translation in X, Y, and Z.

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
- `xOffsetLimits` (optional) — object defining translation range along X axis: `{ min, max }`
- `yOffsetLimits` (optional) — object defining translation range along Y axis: `{ min, max }`
- `zOffsetLimits` (optional) — object defining translation range along Z axis: `{ min, max }`
- `zRotationLimits` (optional) — object defining rotation range around Z axis: `{ min, max }`. Accepts:
  - Radians as numbers: `{ min: 0, max: Math.PI/2 }`
  - Degree expressions as strings: `{ min: '0deg', max: '90deg' }`
  - Stored internally as radians. Default: `{ min: null, max: null }` (no limits)
- `name` (optional, default `'Parallel'`) — constraint name. Duplicates allowed

## Difference from Other Kinematic Constraints

- **Revolute** — 1 DOF: rotation around Z. Has `zOffset` (fixed) and `zRotationLimits`
- **Cylindrical** — 2 DOF: rotation around Z + translation along Z. Has `zOffsetLimits` (range) and `zRotationLimits`
- **Planar** — 3 DOF: rotation around Z + translation along X + translation along Y. Has `zOffset` (fixed), `xOffsetLimits`, `yOffsetLimits`, and `zRotationLimits`
- **Parallel** — 4 DOF: rotation around Z + translation along X, Y, and Z. Has `xOffsetLimits`, `yOffsetLimits`, `zOffsetLimits` (all ranges), and `zRotationLimits`. No fixed offset — all 3 translation axes have optional range limits

## Return Value

- **Single call:** numeric constraint ID
- **Batch call (array param):** array of constraint IDs
- **On error:** `null` (VOID), maxLevel 51
- **On success:** maxLevel 31 (info level)

## Batch Creation

Pass array of param objects: `parallel([{...}, {...}])`. Returns array of IDs.

## Deleting Parallel Constraints

Use `deleteConstraint({ ids: [constraintId] })` — note the parameter is **`ids`** (plural, array), NOT `id`.

## Gotchas

- **No fixed offsets.** Unlike planar (which has a fixed `zOffset`), parallel has NO fixed offset parameters — only range limits. All translations are free unless constrained by limits.
- **`ids` not `id` for deleteConstraint.** Using `{ id: constraintId }` silently fails.
- **reorient values are strings.** Pass `'90'` not `90`.
- **Self-constraint blocked.** Same instance in both mates errors with code 1014 ("same rigid set").
- **Missing mate2 gives cryptic error.** "Evaluation error in AbstractAPI.PrepareAPIParams" rather than a clear message about the missing mate.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `mate1 and mate2... same rigid set` | Same instance in both mates | 1014 |
| `wrong type! It should be of type (object)` | Passed string instead of object for limits | 1001 |
| `[Evaluation error in AbstractAPI.PrepareAPIParams]` | Missing mate1 or mate2 | 0 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'ParallelAsm' })).result

const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
const wcs1 = (await api.v1.part.workCSys({
  id: tpl1, name: 'ParRef', origin: [50, 40, 10],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Mover' })).result
await api.v1.part.box({ id: tpl2, name: 'Block', length: 30, width: 30, height: 20 })
const wcs2 = (await api.v1.part.workCSys({
  id: tpl2, name: 'ParRef', origin: [15, 15, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

const cId = (await api.v1.assembly.parallel({
  id: asmId,
  name: 'FloatPar',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
  xOffsetLimits: { min: -40, max: 40 },
  yOffsetLimits: { min: -30, max: 30 },
  zOffsetLimits: { min: 0, max: 50 },
  zRotationLimits: { min: '0deg', max: '180deg' },
})).result
```

## Related

- `assembly.updateParallel` — modify constraint params after creation
- `assembly.getParallel` — retrieve constraint by name
- `assembly.deleteConstraint` — delete constraints (use `ids` array)
- `assembly.planar` — 3-DOF variant (no Z translation freedom)
- `assembly.cylindrical` — 2-DOF variant (rotation + Z translation only)
- `assembly.revolute` — 1-DOF variant (rotation only)
- `part.workCSys` — create WCS that mates reference
