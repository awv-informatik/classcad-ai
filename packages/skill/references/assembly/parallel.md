# assembly.parallel

Creates a parallel constraint between two instances. Allows 4 degrees of freedom: translation along X, Y, and Z axes, plus rotation around the Z-axis. Only constrains orientation — the Z-axes of both mates stay parallel (X-rotation and Y-rotation locked).

## Prerequisites

- An assembly root (`assembly.create`)
- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates
- **Ground at least one instance** with `fastenedOrigin` before applying parallel — otherwise the solver repositions BOTH instances

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
- `xOffsetLimits` — `{ min, max }` constraining X translation range. Negative values supported. Set `{ min: null, max: null }` to remove.
- `yOffsetLimits` — `{ min, max }` constraining Y translation range. Same behavior as xOffsetLimits.
- `zOffsetLimits` — `{ min, max }` constraining Z translation range. Same behavior as xOffsetLimits.
- `zRotationLimits` — `{ min, max }` constraining rotation range in radians. Degree strings accepted: `'-45deg'`, `'90deg'`. Set `{ min: null, max: null }` to remove.
- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Rotates inst2's orientation before constraint solving.
- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. Only visible when zRotationLimits lock the joint.

## Alignment Semantics (CRITICAL — differs from planar)

**No `zOffset` fixed parameter.** Unlike planar and revolute, parallel has NO fixed `zOffset`. All three translations are free DOFs, constrained only by their respective `*OffsetLimits`.

**Initial position is preserved (like cylindrical, unlike planar).** With default flip and no limits, the solver preserves the instance's initial X, Y, and Z position from its `transformation`. This is because the constraint only enforces orientation (axes parallel) — if the axes are already aligned, there's nothing to solve.

**Flip triggers a full re-solve.** With non-default flip (e.g., `'-Z'`), the solver actively re-solves and resets inst2 to mate1's origin (same alignment as fastened/revolute). The position is NOT preserved when flip changes orientation.

**Limits clamp from current position.** When offset limits are applied, the solver clamps the current position to the valid range (with ~0.001 solver epsilon). Limits on one axis don't affect other axes.

## DOF and Behavior

Parallel constrains 2 DOF (X-rotation and Y-rotation locked), leaving 4 free: X-translation, Y-translation, Z-translation, Z-rotation.

With no limits and default flip, the solver preserves all initial positions. The free DOFs only become visible/constrained when:
1. `xOffsetLimits` / `yOffsetLimits` / `zOffsetLimits` constrain translation ranges
2. `zRotationLimits` constrains the rotation range
3. `moveUnderConstraints` applies motion

## Offset Limits (x, y, z)

All three work identically. The solver clamps the current position to [min, max]:
- Position below min → clamped to min (~0.001 epsilon)
- Position within range → preserved
- Position above max → clamped to max

All three can be set simultaneously. Negative limits work: `{ min: -30, max: -10 }`.

To lock an axis at a specific position: `{ min: N, max: N }`.

## zRotationLimits

Same behavior as revolute/cylindrical. Constrains rotation around Z to a range.

- Radians: `{ min: -1.5708, max: 1.5708 }` → ±90°
- Degree strings: `{ min: '-45deg', max: '180deg' }` → converted to radians on storage
- Remove: `{ min: null, max: null }`

Locking at a specific angle: `{ min: '45deg', max: '45deg' }` forces inst2 to rotate 45° relative to mate1.

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

**Warning:** Non-default flip causes the solver to re-solve, resetting inst2 to mate1's origin. Use offset limits to position inst2 after flipping.

## Reorient

Identical to revolute. Only observable when zRotationLimits lock the joint. With free rotation, the DOF absorbs the offset.

## Return Value

- Single call: `id` — the constraint ID
- Batch (array of params): `Array<id>`

## getParallel

`getParallel({ id: asmId, name: 'Par1' })` — queries a parallel constraint by name.

### Parameters

- `id` — **assembly root ID only**. Instance and template IDs return null/error.
- `name` — constraint name string (case-sensitive)

### Return Value

Success (`maxLevel: 31`):
```js
{
  id, name,
  mate1: { path, csys, flip, reorient },
  mate2: { path, csys, flip, reorient },
  xOffsetLimits: { min, max },
  yOffsetLimits: { min, max },
  zOffsetLimits: { min, max },
  zRotationLimits: { min, max }
}
```

- All four limit objects always present. No limits → `{ min: null, max: null }`.
- `zRotationLimits` values in radians (degree strings converted on storage).
- `flip` — string: `'Z'`, `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`
- `reorient` — string: `'0'`, `'90'`, `'180'`, `'270'`

### Failure Cases

All return `result: null, maxLevel: 51`:
- Non-existent name
- Empty name `''`
- Wrong constraint type
- Instance or template ID passed as `id`

### Batch

Pass array of `{ id, name }`. Returns `Array<result|null>`. One null contaminates maxLevel to 51.

## updateParallel

`updateParallel({ id: constraintId, ... })` — true partial update. Unspecified params preserved. Returns constraint ID on success, null + maxLevel=51 on failure. Supports batch.

**`id` must be the constraint ID** (from `parallel()`), NOT the assembly ID. Passing assembly ID gives error 1007.

### What you can update

- `xOffsetLimits: { min: 10, max: 50 }` — add/change X limits (solver clamps immediately)
- `yOffsetLimits: { min: -20, max: 30 }` — add/change Y limits
- `zOffsetLimits: { min: 5, max: 40 }` — add/change Z limits
- `zRotationLimits: { min: '-45deg', max: '90deg' }` — add/change rotation limits
- `xOffsetLimits: { min: null, max: null }` — remove X limits (same for y, z, zRotation)
- `mate2: { flip: '-Z' }` — change flip
- `mate2: { reorient: '90' }` — change reorient
- `name: 'NewName'` — rename; old name immediately unfindable via getParallel
- Batch: `updateParallel([{ id: c1, ... }, { id: c2, ... }])` — returns `[c1Id, c2Id]`

### Removing limits preserves position (CRITICAL)

When limits are removed via `{ min: null, max: null }`, the solver does NOT reset the DOF to its original position. The **last solved position is preserved**. This matches planar behavior.

Example: parallel with xOffsetLimits [10,20] → inst2 clamped to x=20. Remove limits → inst2 stays at x=20, not x=40 (original).

### Errors (all non-destructive)

| Error | Message | Code |
|-------|---------|------|
| Assembly ID not constraint ID | "The provided id for the constraint is not a constraint or relation." | 1007 |
| Nonexistent ID | Error code 1006 |
| Invalid flip | "Type 'X' is not supported to use as flip type." | 1013 |
| Invalid reorient | "Type '45' is not supported to use as reorient type." | 1013 |

## Gotchas

- **Position preserved with default flip only.** With default flip 'Z' and no limits, all initial positions are preserved. Non-default flip triggers a re-solve that resets inst2 to mate1's origin. Use offset limits to re-position after flipping.
- **No `zOffset` parameter.** Unlike planar/revolute, parallel has no fixed z-offset. Use `zOffsetLimits: { min: N, max: N }` to lock Z at a specific value.
- **Ungrounded instances both move.** Always ground at least one instance with fastenedOrigin.
- **csys position is irrelevant.** The csys ID is required but its origin/axes don't determine alignment.
- **Duplicate names allowed.** Creating two with the same name succeeds silently. `getParallel` returns the first.
- **Solver epsilon ~0.001.** Clamped positions have tiny offsets (e.g., min=10 → x≈10.001).
- **Reorient invisible without limits.** Free rotation DOF absorbs the reorient offset.

## Common Errors

| Error | Message | Code |
|-------|---------|------|
| Same instance both mates | "probably belong to the same rigid set" | 1014 |
| Missing mate2 or csys | "Evaluation error in AbstractAPI.PrepareAPIParams" | 0 |
| Invalid flip | "Type 'W' is not supported to use as flip type" | 1013 |
| Invalid reorient | "Type '45' is not supported to use as reorient type" | 1013 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result

const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
const inst2 = (await api.v1.assembly.instance({
  productId: tplB, ownerId: asmId, name: 'Block',
  transformation: [[40, 30, 25], [1, 0, 0], [0, 1, 0]]
})).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

const parId = (await api.v1.assembly.parallel({
  id: asmId,
  name: 'Slide',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst2], csys: wcsB },
  xOffsetLimits: { min: 10, max: 60 },
  yOffsetLimits: { min: 5, max: 50 },
  zOffsetLimits: { min: 10, max: 40 },
  zRotationLimits: { min: 0, max: 0 },
})).result
```

## Related

- `assembly.planar` — 3 DOF (X,Y translation + Z rotation, Z-translation fixed by zOffset)
- `assembly.cylindrical` — 2 DOF (Z-rotation + Z-translation)
- `assembly.revolute` — 1 DOF (Z-rotation only)
- `assembly.fastened` — 0 DOF (rigid)
- `assembly.slider` — 1 DOF (translation only)
- `assembly.updateParallel` — modify after creation
- `assembly.getParallel` — query by name
