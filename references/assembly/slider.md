# assembly.slider

Creates a slider constraint between two instances, allowing 1 degree of freedom: translation along the constraint's Z axis. No rotation is permitted — the orientation is fully locked. Think of it as a linear guide or prismatic joint.

## Prerequisites

- A root assembly (`assembly.create`)
- At least two instances with work coordinate systems in their templates
- Must be in assembly context (`setCurrentProduct({ id: asmId })`)

## Key Parameters

- `id` (required) — assembly ID where the constraint is created
- `mate1` / `mate2` (both required) — each has:
  - `path` (required) — array with instance ID(s). For top-level instances: `[instId]`
  - `csys` (required) — work coordinate system ID from the instance's template
  - `flip` (optional) — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'` (default `'Z'`). Defines which WCS axis becomes the slide axis
  - `reorient` (optional) — `'0'` | `'90'` | `'180'` | `'270'` (default `'0'`). Rotation around the main axis in 90° steps. Values are **strings**, not numbers
- `xOffset` (optional, default 0) — fixed offset along X axis from mate1 to mate2 (mm). This is a constant displacement, not a range
- `yOffset` (optional, default 0) — fixed offset along Y axis from mate1 to mate2 (mm). Same — constant, not a range
- `zOffsetLimits` (optional) — object defining translation range along Z axis: `{ min, max }`. **Partial spec allowed on create** — min-only or max-only works (missing side stored as `null`). Empty `{}` errors with code 1003
- `name` (optional, default `'Slider'`) — constraint name. Duplicates allowed

## Difference from Cylindrical and Revolute

- **Revolute** — 1 DOF, free rotation only. Has `zOffset` (fixed) and `zRotationLimits`
- **Cylindrical** — 2 DOF, free rotation AND translation. Has `zOffsetLimits` and `zRotationLimits`
- **Slider** — 1 DOF, free translation only. Has `xOffset`, `yOffset` (fixed transverse), and `zOffsetLimits`. No rotation params at all

## Return Value

- **Single call:** numeric constraint ID
- **Batch call (array param):** array of constraint IDs
- **On error:** `null` (VOID), maxLevel 51
- **On success:** maxLevel 31 (info level)

## Batch Creation

Pass array of param objects: `slider([{...}, {...}])`. Returns array of IDs.

## Deleting Slider Constraints

Use `deleteConstraint({ ids: [constraintId] })` — note the parameter is **`ids`** (plural, array), NOT `id`. Using singular `id` silently fails with code 1004.

## Gotchas

- **`ids` not `id` for deleteConstraint.** Using `{ id: constraintId }` fails with code 1004.
- **xOffset/yOffset are fixed offsets, not limits.** They set constant transverse displacement. Only zOffsetLimits defines a range.
- **reorient values are strings.** Pass `'90'` not `90`. Invalid values like `'45'` error with code 1013.
- **Self-constraint blocked.** Same instance in both mates errors with code 1014.
- **Cross-type name collision.** If a non-slider constraint with the same name was created first, `getSlider` will fail to find this constraint. Avoid sharing names across constraint types.
- **getSlider requires assembly ID.** Passing an instance ID returns null with maxLevel 51.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"id" must be provided to create CC_SliderConstraint` | Missing assembly ID | 1004 |
| `"The object "zOffsetLimits" is empty!"` | Empty `{}` for limits | 1003 |
| `"ids" must be provided` | Used `id` instead of `ids` in deleteConstraint | 1004 |
| `"path" has a wrong id type! ["instance"]` | Template ID in path | 1001 |
| `Type "INVALID" is not supported to use as flip type.` | Invalid flip value | 1013 |
| `Type "45" is not supported to use as reorient type.` | Invalid reorient value | 1013 |
| `mate1 and mate2... same rigid set` | Same instance in both mates | 1014 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'LinearGuide' })).result

const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
await api.v1.part.box({ id: tpl1, name: 'RailBody', length: 100, width: 20, height: 10 })
const wcs1 = (await api.v1.part.workCSys({
  id: tpl1, name: 'SlideAxis', origin: [50, 10, 5],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Carriage' })).result
await api.v1.part.box({ id: tpl2, name: 'Block', length: 20, width: 20, height: 15 })
const wcs2 = (await api.v1.part.workCSys({
  id: tpl2, name: 'SlideAxis', origin: [10, 10, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

const cId = (await api.v1.assembly.slider({
  id: asmId,
  name: 'Guide',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
  xOffset: 10,
  yOffset: -5,
  zOffsetLimits: { min: -40, max: 40 },
})).result
```

## Related

- `assembly.updateSlider` — modify constraint params after creation
- `assembly.getSlider` — retrieve constraint by name
- `assembly.deleteConstraint` — delete constraints (use `ids` array)
- `assembly.cylindrical` — 2-DOF variant (rotation + translation)
- `assembly.revolute` — 1-DOF rotation variant
- `assembly.fastened` — 0-DOF variant (rigid lock)
- `part.workCSys` — create WCS that mates reference
