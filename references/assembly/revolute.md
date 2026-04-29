# assembly.revolute

Creates a revolute (hinge) constraint between two instances, allowing 1 degree of freedom: rotation around the constraint's Z axis. The constraint solver repositions mate2's instance to align the two WCS origins, with free rotation around the aligned Z axis.

## Prerequisites

- A root assembly (`assembly.create`)
- At least two instances with work coordinate systems in their templates
- Must be in assembly context (`setCurrentProduct({ id: asmId })`)

## Key Parameters

- `id` (required) — assembly ID where the constraint is created
- `mate1` / `mate2` (both required) — each has:
  - `path` (required) — array with instance ID(s). For top-level instances: `[instId]`
  - `csys` (required) — work coordinate system ID from the instance's template
  - `flip` (optional) — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'` (default `'Z'`). Defines which WCS axis becomes the rotation axis
  - `reorient` (optional) — `'0'` | `'90'` | `'180'` | `'270'` (default `'0'`). Rotation around the main axis in 90° steps. Values are **strings**, not numbers
- `zOffset` (optional, default 0) — offset along the rotation axis from mate1 to mate2. Accepts positive and negative values
- `zRotationLimits` (optional) — object defining rotation range: `{ min, max }`. **Both min AND max must be provided** — partial limits (min-only or max-only) error. Accepts:
  - Radians as numbers: `{ min: -Math.PI/4, max: Math.PI/2 }`
  - Degree expressions as strings: `{ min: '-90deg', max: '120deg' }`
  - Stored internally as radians. Default: `{ min: null, max: null }` (no limits)
- `name` (optional, default `'Revolute'`) — constraint name. Duplicates allowed

## Difference from Fastened

- **Fastened** — 0 DOF, rigid lock between instances (has xOffset/yOffset/zOffset and xRotation/yRotation/zRotation)
- **Revolute** — 1 DOF, free rotation around the Z axis (has only zOffset and zRotationLimits). No xOffset/yOffset or rotation params

## Return Value

- **Single call:** numeric constraint ID
- **Batch call (array param):** array of constraint IDs
- **On error:** `null` (VOID), maxLevel 51
- **On success:** maxLevel 31 (info level)

## Batch Creation

Pass array of param objects: `revolute([{...}, {...}])`. Returns array of IDs.

## getRevolute

`getRevolute({ id: asmId, name: 'constraintName' })` — retrieves constraint by name on the assembly.

Returns: `{ id, name, mate1: { csys, flip, path, reorient }, mate2: {...}, zOffset, zRotationLimits: { min, max } }`

- Does NOT include current rotation angle — only the constraint definition
- Returns first match if multiple constraints share the same name
- Returns null + maxLevel 51 if not found

## updateRevolute

`updateRevolute({ id: constraintId, ... })` — update any property by constraint ID. See `references/assembly/updateRevolute.md` for full docs.

- All properties updatable: name, zOffset, zRotationLimits, mate1/mate2 (path, csys, flip, reorient)
- **Partial zRotationLimits allowed** (unlike create): can set min-only or max-only
- Pass `zRotationLimits: null` to remove all limits; `{ max: null }` to remove just max
- Can retarget to a different instance via `mate.path` + `mate.csys`
- Returns constraint ID on success (maxLevel 31)

## Deleting Revolute Constraints

Use `deleteConstraint({ ids: [constraintId] })` — note the parameter is **`ids`** (plural, array), NOT `id`. Supports batch deletion: `deleteConstraint({ ids: [id1, id2] })`.

## Gotchas

- **`ids` not `id` for deleteConstraint.** Using `{ id: constraintId }` silently fails with error code 1004. Always use `{ ids: [constraintId] }`.
- **Partial zRotationLimits not allowed.** If you provide `zRotationLimits`, both `min` and `max` must be present. Omitting one errors: `"max" must be provided` (code 1004).
- **Multiple revolute constraints on same instance pair allowed.** Useful for hinge pairs (e.g., top and bottom hinges on a door). Each constraint can reference different WCS on the same instances.
- **reorient values are strings.** Pass `'90'` not `90`. Invalid values like `'45'` error with code 1013.
- **getRevolute returns first match.** If multiple constraints share a name, only the first is returned.
- **Cross-type name collision.** All get* methods find the FIRST constraint by name regardless of type. If a cylindrical was created before a revolute with the same name, `getRevolute` will fail. Use unique names across constraint types.
- **Self-constraint blocked.** Same instance in both mates errors with code 1014.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"id" must be provided to create CC_RevoluteConstraint` | Missing assembly ID | 1004 |
| `"max" must be provided` | Partial zRotationLimits (only min given) | 1004 |
| `"ids" must be provided` | Used `id` instead of `ids` in deleteConstraint | 1004 |
| `"path" has a wrong id type! ["instance"]` | Template ID in path | 1001 |
| `"path" has an invalid id!` | Nonexistent ID in path | 1006 |
| `Type "45" is not supported to use as reorient type` | Invalid reorient value | 1013 |
| `mate1 and mate2... same rigid set` | Same instance in both mates | 1014 |
| `[Evaluation error in AbstractAPI.PrepareAPIParams]` | Missing mate1 or mate2 | 0 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'HingeAsm' })).result

const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
const wcs1 = (await api.v1.part.workCSys({
  id: tpl1, name: 'HingeAxis', origin: [40, 25, 10],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
await api.v1.part.box({ id: tpl2, name: 'Arm', length: 10, width: 30, height: 70 })
const wcs2 = (await api.v1.part.workCSys({
  id: tpl2, name: 'HingeAxis', origin: [5, 15, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({
  productId: tpl1, ownerId: asmId, name: 'BaseInst',
})).result
const inst2 = (await api.v1.assembly.instance({
  productId: tpl2, ownerId: asmId, name: 'ArmInst',
})).result

const cId = (await api.v1.assembly.revolute({
  id: asmId,
  name: 'Hinge1',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
  zOffset: 5,
  zRotationLimits: { min: '-90deg', max: '120deg' },
})).result

// Update later
await api.v1.assembly.updateRevolute({
  id: cId,
  zRotationLimits: { min: '0deg', max: '180deg' },
})

// Delete when done
await api.v1.assembly.deleteConstraint({ ids: [cId] })
```

## Related

- `assembly.updateRevolute` — modify constraint params after creation
- `assembly.getRevolute` — retrieve constraint by name
- `assembly.deleteConstraint` — delete constraints (use `ids` array)
- `assembly.fastened` — rigid constraint (0 DOF) for comparison
- `assembly.cylindrical` — similar but allows translation along rotation axis (2 DOF)
- `part.workCSys` — create WCS that mates reference
