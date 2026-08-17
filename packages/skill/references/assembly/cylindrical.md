# assembly.cylindrical

Creates a cylindrical constraint between two instances. Allows 2 degrees of freedom: rotation around the shared Z-axis AND translation along the Z-axis.

## Prerequisites

- An assembly root (`assembly.create`)
- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates
- **Ground at least one instance** with `fastenedOrigin` before applying cylindrical — otherwise the solver repositions BOTH instances

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
- `zOffsetLimits` — `{ min, max }` constraining Z-translation range. Partial limits work: `{ min: 10 }` sets min only. Set `{ min: null, max: null }` to remove. Negative values supported.
- `zRotationLimits` — `{ min, max }` constraining rotation range in radians. Degree strings accepted: `'-45deg'`, `'90deg'` (converted to radians on storage). Set `{ min: null, max: null }` to remove.
- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Identical to revolute/fastened.
- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. Only visible when zRotationLimits lock the joint.

## Alignment Semantics (CRITICAL — differs from revolute)

**X,Y alignment is the same as fastened/revolute.** With default flip, inst2's X,Y position snaps to inst1's origin.

**Z is a FREE DOF.** Unlike revolute (which has a fixed `zOffset` param), cylindrical preserves the initial Z-offset from the instance's transformation. The solver does not move inst2 along Z unless `zOffsetLimits` force clamping.

**No `zOffset` parameter.** Passing `zOffset` is silently ignored — no error, no effect. Use `zOffsetLimits: { min: N, max: N }` to lock inst2 at a specific Z-offset.

## DOF and Behavior

Cylindrical constrains 4 DOF, leaving 2 free: rotation around Z + translation along Z.

With no limits, the solver places inst2 at angle=0 and preserves the initial Z-offset from the instance transformation. The free DOFs only become visible/constrained when:
1. `zOffsetLimits` constrain the translation range
2. `zRotationLimits` constrain the rotation range
3. `moveUnderConstraints` applies motion
4. External constraints interact

## zOffsetLimits

Constrains the Z-translation DOF to a range. The solver clamps the instance's current Z-offset to [min, max]:
- Below min → clamped to min
- Within range → preserved
- Above max → clamped to max

Partial limits: `{ min: 20 }` sets min only (max unconstrained). Negative limits work: `{ min: -20, max: -10 }`.

## zRotationLimits

Same behavior as revolute. Constrains rotation around Z to a range.

- Radians: `{ min: -1.5708, max: 1.5708 }` → ±90°
- Degree strings: `{ min: '-45deg', max: '180deg' }` → converted to radians on storage
- Remove: `{ min: null, max: null }`

## Flip

Identical to revolute/fastened. Rotates inst2 before constraint solving:

| flip | Effect |
|------|--------|
| `'Z'` (default) | Identity |
| `'-Z'` | 180° around X |
| `'X'` | 90° around Y |
| `'-X'` | -90° around Y |
| `'Y'` | -90° around X |
| `'-Y'` | 90° around X |

## Reorient

Identical to revolute. Only observable when zRotationLimits lock the joint (e.g., `{ min: 0, max: 0 }`). With free rotation, the DOF absorbs the offset.

## Return Value

- Single call: `id` — the constraint ID
- Batch (array of params): `Array<id>`

## getCylindrical

`getCylindrical({ id: asmId, name: 'Cyl1' })` — queries by name.

### Parameters

- `id` — **assembly root ID only**. Instance and template IDs return null/error despite docs saying "product or instance."
- `name` — constraint name string (case-sensitive)

### Return Value

Success (`maxLevel: 31`):
```js
{
  id, name,
  mate1: { path, csys, flip, reorient },
  mate2: { path, csys, flip, reorient },
  zOffsetLimits: { min, max },
  zRotationLimits: { min, max }
}
```

- `zOffsetLimits` — always an object, never null. No limits → `{ min: null, max: null }`.
- `zRotationLimits` — always an object, never null. Radians if set, null if not.
- No `zOffset` field exists (unlike getRevolute).

### Failure Cases

All return `result: null, maxLevel: 51`:
- Non-existent name
- Empty name `''`
- Wrong constraint type (e.g., querying a fastenedOrigin)
- Instance or template ID passed as `id`

### Batch

Pass array of `{ id, name }`. Returns `Array<result|null>`. One null contaminates maxLevel to 51.

## updateCylindrical

`updateCylindrical({ id: constraintId, ... })` — true partial update. Unspecified params preserved.

**`id` must be the constraint ID** (from `cylindrical()`), NOT the assembly ID. Passing assembly ID gives error 1007.

### What you can update

- `zOffsetLimits: { min: 10, max: 30 }` — add/change translation limits (instance clamps immediately)
- `zOffsetLimits: { min: null, max: null }` — remove limits
- `zRotationLimits: { min: 0, max: '90deg' }` — add/change rotation limits
- `zRotationLimits: { min: null, max: null }` — remove limits
- `mate2: { flip: '-Z' }` — change flip
- `mate2: { reorient: '90' }` — change reorient
- `name: 'NewName'` — rename; old name immediately unfindable via getCylindrical

## Gotchas

- **No `zOffset` parameter.** Unlike revolute, cylindrical does NOT accept `zOffset`. Passing it is silently ignored. To set a fixed Z position, use `zOffsetLimits: { min: N, max: N }`.
- **Z-offset comes from instance transformation.** The initial Z position is whatever the instance was placed at. The solver preserves it unless limits force clamping.
- **Ungrounded instances both move.** Same as revolute — always ground at least one instance with fastenedOrigin.
- **csys position is irrelevant.** The csys ID is required but its origin/axes don't determine alignment.
- **Duplicate names allowed.** Creating two with the same name succeeds silently.
- **Same-instance error.** Using the same instance for both mates gives error 1014: "probably belong to the same rigid set."
- **Reorient invisible without limits.** Free rotation DOF absorbs the reorient offset.
- **getCylindrical: assembly root ID only.** Instance/template IDs fail despite what the docs say.

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result

const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

const tplB = (await api.v1.assembly.partTemplate({ name: 'Piston' })).result
await api.v1.part.cylinder({ id: tplB, name: 'Rod', radius: 5, height: 50 })
const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
const inst2 = (await api.v1.assembly.instance({
  productId: tplB, ownerId: asmId, name: 'Piston',
  transformation: [[0, 0, 10], [1, 0, 0], [0, 1, 0]]
})).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

const cylId = (await api.v1.assembly.cylindrical({
  id: asmId,
  name: 'PistonSlide',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst2], csys: wcsB },
  zOffsetLimits: { min: 5, max: 40 },
  zRotationLimits: { min: 0, max: 0 },
})).result
```

## Related

- `assembly.revolute` — 1 DOF (rotation only), has fixed `zOffset` instead of `zOffsetLimits`
- `assembly.fastened` — 0 DOF (rigid)
- `assembly.updateCylindrical` — modify after creation
- `assembly.getCylindrical` — query by name
- `assembly.slider` — 1 DOF (translation only)
