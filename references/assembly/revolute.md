# assembly.revolute

Creates a revolute (hinge) constraint between two instances. Allows 1 degree of freedom: rotation around the shared Z-axis.

## Prerequisites

- An assembly root (`assembly.create`)
- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates
- **Ground at least one instance** with `fastenedOrigin` before applying revolute — otherwise the solver repositions BOTH instances

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
- `zOffset` — translation along the revolute Z-axis from mate1 to mate2 (default 0)
- `zRotationLimits` — `{ min, max }` defining the angular range in radians. Also accepts degree strings: `'-45deg'`, `'180deg'`. Stored internally as radians. Set `{ min: null, max: null }` to remove limits.
- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Rotates inst2's orientation before constraint solving.
- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. Defines the zero-angle reference for the revolute joint.

## Alignment Semantics (CRITICAL)

**Same as fastened.** With zero offsets, inst2 is placed at inst1's origin regardless of csys positions. The csys is required by the API but only serves as an identifier — it does not define a mounting point.

The csys position and orientation have NO effect on the base alignment. To offset inst2 along the rotation axis, use `zOffset`.

## DOF and Behavior

Revolute constrains 5 DOF, leaving 1 free: rotation around the Z-axis of the joint. The "Z-axis" is the world Z-axis when both mates use default axes (`xDirection: [1,0,0], yDirection: [0,1,0]`).

With no rotation limits and no motion commands, the solver places inst2 at the default rotation (angle=0). The free DOF only becomes visible when:
1. `zRotationLimits` constrain the range
2. `moveUnderConstraints` applies motion
3. External constraints interact with the revolute

## zOffset

Shifts inst2 along the revolute Z-axis. With default csys axes, this is the world Z-axis.

Example: `zOffset: 25` moves inst2's origin 25 units above inst1's origin along Z.

## zRotationLimits

Defines the angular range for the free rotation DOF. Does NOT affect initial placement — the arm stays at angle=0 when created. Limits are enforced during motion.

- Radians: `{ min: -1.5708, max: 1.5708 }` → ±90°
- Degree strings: `{ min: '-45deg', max: '180deg' }` → converted to radians on storage
- Remove: `{ min: null, max: null }`

## Flip

Rotates inst2 before constraint solving. Identical to fastened flip behavior:

| flip | Effect | Rotation |
|------|--------|----------|
| `'Z'` (default) | Identity | None |
| `'-Z'` | Upside down | 180° around X |
| `'X'` | X becomes main axis | 90° around Y |
| `'-X'` | X down | -90° around Y |
| `'Y'` | Y becomes main axis | -90° around X |
| `'-Y'` | Y down | 90° around X |

## Reorient

Defines the zero-angle reference for the revolute joint. Has NO visible effect when the rotation DOF is free (unconstrained) because the solver absorbs the angular offset.

**Only observable when:**
- `zRotationLimits` lock or constrain the rotation (e.g., `{ min: 0, max: 0 }` forces angle=0 relative to the reoriented reference)
- Motion is applied via `moveUnderConstraints`

With limits locked at angle=0:

| reorient | Physical rotation of inst2 |
|----------|---------------------------|
| `'0'` | Identity |
| `'90'` | 90° CW around Z |
| `'180'` | 180° around Z |
| `'270'` | 270° CW around Z |

## Return Value

- Single call: `id` — the constraint ID
- Array call: `Array<id>`

## getRevolute

`getRevolute({ id: asmId, name: 'Rev1' })` — returns full constraint state:
```js
{
  id, name,
  mate1: { path, csys, flip, reorient },
  mate2: { path, csys, flip, reorient },
  zOffset,
  zRotationLimits: { min, max }  // radians or null
}
```
Non-existent name → `result: null, maxLevel: 51`.

## updateRevolute

`updateRevolute({ id: constraintId, ... })` — true partial update. Unspecified params preserved.

- `zOffset: 20` — update offset, preserves everything else
- `zRotationLimits: { min: 0, max: '90deg' }` — add/change limits
- `zRotationLimits: { min: null, max: null }` — remove limits
- `mate2: { flip: '-Z' }` — change flip (no need to include path/csys for flip-only update)
- `name: 'NewName'` — rename; old name immediately unfindable via getRevolute

## Gotchas

- **Ungrounded instances both move.** If neither instance has a fastenedOrigin, the solver repositions both to satisfy the constraint. Always ground at least one instance first.
- **csys position is irrelevant.** The csys ID is required but its origin/axes don't determine alignment. inst2 goes to inst1's origin with zero offsets.
- **Duplicate names allowed.** Creating two revolute constraints with the same name succeeds silently. `getRevolute` may return either one.
- **Reorient is invisible without limits.** The free rotation DOF absorbs the reorient offset. Only visible when limits lock the joint or motion is applied.
- **Limits don't affect initial position.** inst2 starts at angle=0 regardless of limits. Limits are enforced during subsequent motion.
- **Missing required params give cryptic errors.** Omitting mate2 or csys produces "Evaluation error in AbstractAPI.PrepareAPIParams" (maxLevel=51).

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result

const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm' })).result

// Ground the base
await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

// Create revolute hinge
const revId = (await api.v1.assembly.revolute({
  id: asmId,
  name: 'Hinge',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst2], csys: wcsB },
  zOffset: 10,
  zRotationLimits: { min: '-90deg', max: '90deg' },
})).result
```

## Related

- `assembly.fastened` — rigid constraint (0 DOF), same alignment semantics
- `assembly.updateRevolute` — modify after creation
- `assembly.getRevolute` — query by name
- `assembly.cylindrical` — 2 DOF (rotation + translation along axis)
- `assembly.startMovingUnderConstraints` / `moveUnderConstraints` — animate the revolute DOF
