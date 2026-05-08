# assembly.planar

Creates a planar constraint between two instances. Allows 3 degrees of freedom: translation along X-axis, translation along Y-axis, and rotation around the Z-axis. The Z-axis translation is fixed via `zOffset`.

## Prerequisites

- An assembly root (`assembly.create`)
- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates
- **Ground at least one instance** with `fastenedOrigin` before applying planar — otherwise the solver repositions BOTH instances

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
- `zOffset` — fixed translation along Z-axis from mate1 to mate2 (default 0). Same semantics as revolute.
- `xOffsetLimits` — `{ min, max }` constraining X translation range. Negative values supported. Set `{ min: null, max: null }` to remove.
- `yOffsetLimits` — `{ min, max }` constraining Y translation range. Same behavior as xOffsetLimits.
- `zRotationLimits` — `{ min, max }` constraining rotation range in radians. Degree strings accepted: `'-45deg'`, `'180deg'`. Set `{ min: null, max: null }` to remove.
- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Identical to revolute/fastened.
- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. Only visible when zRotationLimits lock the joint.

## Alignment Semantics (CRITICAL — differs from cylindrical)

**Same as fastened/revolute.** With zero offsets, inst2 is placed at inst1's origin. The csys is required by the API but only serves as an identifier — it does not define a mounting point.

**All free DOFs default to 0.** Unlike cylindrical (which preserves the initial Z-offset), planar does NOT preserve initial X/Y position or rotation. The solver resets all free DOFs to 0 regardless of the instance's `transformation`. If limits constrain the range, the default(0) is clamped to the nearest valid value (min if 0 < min, max if 0 > max).

## DOF and Behavior

Planar constrains 3 DOF (Z-translation fixed, X-rotation locked, Y-rotation locked), leaving 3 free: X-translation, Y-translation, Z-rotation.

With no limits, the solver places inst2 at default position (x=0, y=0, angle=0 relative to mate1). The free DOFs only become visible/constrained when:
1. `xOffsetLimits` / `yOffsetLimits` constrain the translation ranges
2. `zRotationLimits` constrain the rotation range
3. `moveUnderConstraints` applies motion

## zOffset

Fixed Z displacement from mate1 to mate2. Same as revolute — not a range, not a free DOF.

## xOffsetLimits / yOffsetLimits

Constrain the X or Y translation DOF to a range. The solver starts from default=0 and clamps:
- 0 < min → clamped to min (~0.001 solver epsilon)
- min ≤ 0 ≤ max → stays at 0
- 0 > max → clamped to max

Negative limits work: `{ min: -30, max: -10 }` clamps to max=-10 (since 0 > -10).

**Initial placement is NOT preserved.** Even if the instance starts within the valid range, the solver resets to 0 and clamps.

## zRotationLimits

Same behavior as revolute. Constrains rotation around Z to a range.

- Radians: `{ min: -1.5708, max: 1.5708 }` → ±90°
- Degree strings: `{ min: '-45deg', max: '180deg' }`
- Remove: `{ min: null, max: null }`

Locking at a specific angle: `{ min: '45deg', max: '45deg' }` forces inst2 to rotate 45° relative to mate1.

## Flip

Identical to revolute/fastened. Rotates inst2 before constraint solving:

| flip | Effect |
|------|--------|
| `'Z'` (default) | Identity |
| `'-Z'` | 180° around X |
| `'X'` | Main axis becomes X |
| `'-X'` | Opposite |
| `'Y'` | Main axis becomes Y |
| `'-Y'` | Opposite |

## Reorient

Identical to revolute. Only observable when zRotationLimits lock the joint (e.g., `{ min: 0, max: 0 }`). With free rotation, the DOF absorbs the offset.

With limits locked at angle=0:

| reorient | Physical rotation of inst2 |
|----------|---------------------------|
| `'0'` | Identity |
| `'90'` | 90° CW around Z |
| `'180'` | 180° around Z |
| `'270'` | 270° CW around Z |

## Return Value

- Single call: `id` — the constraint ID
- Batch (array of params): `Array<id>`

## Gotchas

- **Free DOFs reset to 0.** Unlike cylindrical, planar does NOT preserve initial X/Y position. All free DOFs default to 0, clamped by limits. This is a key behavioral difference.
- **Ungrounded instances both move.** Always ground at least one instance with fastenedOrigin.
- **csys position is irrelevant.** The csys ID is required but its origin/axes don't determine alignment.
- **Duplicate names allowed.** Creating two with the same name succeeds silently. `getPlanar` returns the first.
- **Reorient invisible without limits.** Free rotation DOF absorbs the reorient offset.
- **Limits don't affect initial position.** inst2 starts at 0 regardless of limits. Limits are clamping bounds, not initial values.
- **Solver epsilon.** Limits produce positions with ~0.001 offset (e.g., min=10 → x≈10.001).

## Common Errors

| Error | Message | Code |
|-------|---------|------|
| Same instance both mates | "probably belong to the same rigid set" | 1014 |
| Missing mate2 | "Evaluation error in AbstractAPI.PrepareAPIParams" | 0 |
| Missing csys | "'csys' must be provided" | 1004 |
| Invalid flip | "Type 'W' is not supported to use as flip type" | 1013 |
| Invalid reorient | "Type '45' is not supported to use as reorient type" | 1013 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result

const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 80, height: 10 })
const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

const tplB = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Slider' })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

const planarId = (await api.v1.assembly.planar({
  id: asmId,
  name: 'SlideConstraint',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst2], csys: wcsB },
  zOffset: 12,
  xOffsetLimits: { min: 10, max: 60 },
  yOffsetLimits: { min: 5, max: 50 },
  zRotationLimits: { min: 0, max: 0 },
})).result
```

## Related

- `assembly.revolute` — 1 DOF (rotation only), has fixed `zOffset`
- `assembly.cylindrical` — 2 DOF (rotation + Z-translation), preserves initial Z-offset (differs from planar)
- `assembly.fastened` — 0 DOF (rigid)
- `assembly.updatePlanar` — modify after creation
- `assembly.getPlanar` — query by name
- `assembly.slider` — 1 DOF (translation only)
