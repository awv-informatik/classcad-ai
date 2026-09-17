# assembly.planar

Planar constraint between two instances. Constrains 3 DOF (Z translation fixed via `zOffset`, X- and Y-rotation locked), leaving 3 free: X translation, Y translation, Z rotation.

Prerequisites: assembly root, two instances whose templates contain a `part.workCSys`. **Ground at least one instance** with `fastenedOrigin` first — otherwise the solver repositions BOTH instances.

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — `{ path: [instanceId], csys: workCSysId, flip?, reorient? }`
- `zOffset` — fixed translation along Z from mate1 to mate2 (default 0). Same as revolute: not a range, not free
- `xOffsetLimits` / `yOffsetLimits` — `{ min, max }` on X / Y translation. Negative values supported. `{ min: null, max: null }` removes
- `zRotationLimits` — `{ min, max }` in radians or degree strings (stored as radians), e.g. `{ min: -1.5708, max: 1.5708 }` = ±90°. `{ min: '45deg', max: '45deg' }` locks inst2 at 45° relative to mate1. `{ min: null, max: null }` removes
- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`; same table as `assembly/fastened`
- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`; as revolute, only visible when `zRotationLimits` lock the joint (free rotation absorbs it). With limits locked at 0: `'90'` = 90° CW around Z, `'180'` = 180°, `'270'` = 270° CW

## Alignment Semantics (CRITICAL — differs from cylindrical)

**The plane is mate1's csys XY-plane.** mate2's csys is placed in that plane with its Z-axis on mate1's Z-axis; `zOffset` moves along mate1's csys Z. Example: mate1 csys `offset [40,0,20]` + `rotation [π/2,0,0]` (csys Z = world −Y), `zOffset: 10` → inst2 at `[40,-10,20]`, tilted onto the csys. Build the csys with `part.workCSys({ offset, rotation })`; `origin`/`xDirection`/`yDirection` are ignored by `workCSys`.

**Free translations start at 0; free rotation is kept.** Unlike cylindrical, planar places inst2 at x=0, y=0 in mate1's csys regardless of the instance's `transformation` — even if it starts inside the valid range. Rotation about Z keeps the current angle (created at 45° → stays at 45°). Limits are clamping bounds applied to that 0, not initial values:

| Limits vs 0 | Result |
|---|---|
| 0 < min | clamped to min (~0.001 epsilon, min=10 → x≈10.001) |
| min ≤ 0 ≤ max | stays at 0 |
| 0 > max | clamped to max (e.g. `{ min: -30, max: -10 }` → -10) |

The free DOFs show only via limits or `moveUnderConstraints`.

## Return Value

Constraint ID; array call → `Array<id>`.

## getPlanar

`getPlanar({ id: asmId, name: 'Planar1' })` — `id` is the assembly holding it: the root, an assembly template, or a sub-assembly instance (part instance → "not a Assembly", part template → 1001); `name` is case-sensitive.

Success (maxLevel 31): `{ id, name, mate1: { path, csys, flip, reorient }, mate2: {...}, zOffset, xOffsetLimits, yOffsetLimits, zRotationLimits }`. All limit objects are always present (`{ min: null, max: null }` when unset; numbers / radians otherwise); flip/reorient are strings.

`result: null`, maxLevel 51 for: non-existent name, wrong constraint type (e.g. a revolute name), bogus or instance ID as `id` (error code 1006). Array form → `Array<result|null>`. Live view: updates show immediately; after a rename only the new name resolves. Duplicate names (silently allowed) → returns the first.

## updatePlanar

`updatePlanar({ id: constraintId, ... })` — **constraint ID**, not the assembly ID (→ 1007). True partial update; returns the ID, or null + maxLevel 51 on failure. Array form → array of IDs.

- `zOffset: 40` — COG.z changes by exactly the delta
- `xOffsetLimits` / `yOffsetLimits` / `zRotationLimits` — add/change (solver re-clamps from default 0); `{ min: null, max: null }` removes
- `mate2: { flip: '-Z' }` (or `reorient`) — path and csys can be omitted
- `name: 'NewName'` — old name immediately unfindable

**Removing limits preserves the last solved position (CRITICAL — differs from create).** The DOF is not reset to 0. Example: yOffsetLimits [30,70] → y≈30; remove → stays y≈30. Applies to all three limit types.

Errors are non-destructive (state fully preserved):

| Cause | Message | Code |
|---|---|---|
| Assembly ID not constraint ID | "The provided id for the constraint is not a constraint or relation." | 1007 |
| Nonexistent ID | "The provided constraint id does not exist." | 1006 |
| Missing `id` | "'id' must be provided for update." | 1004 |

## Common Errors

| Cause | Message | Code |
|---|---|---|
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
const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys' })).result  // csys at part origin

const tplB = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys' })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Slider' })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

const planarId = (await api.v1.assembly.planar({
  id: asmId, name: 'SlideConstraint',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst2], csys: wcsB },
  zOffset: 12,
  xOffsetLimits: { min: 10, max: 60 },
  yOffsetLimits: { min: 5, max: 50 },
  zRotationLimits: { min: 0, max: 0 },
})).result
```

## Related

`assembly.revolute` · `assembly.cylindrical` · `assembly.fastened` · `assembly.slider` · `assembly.startMovingUnderConstraints` / `moveUnderConstraints`
