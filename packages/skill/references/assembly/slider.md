# assembly.slider

Creates a slider constraint between two instances. Allows 1 degree of freedom: translation along the Z-axis. All other DOFs are locked — X/Y translation fixed by offset params, all rotation fixed.

## Prerequisites

- An assembly root (`assembly.create`)
- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates
- **Ground at least one instance** with `fastenedOrigin` before applying slider — otherwise the solver repositions BOTH instances

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
- `xOffset` — fixed X position of inst2 relative to mate1's csys (default=0). NOT a range — a single value.
- `yOffset` — fixed Y position of inst2 relative to mate1's csys (default=0). NOT a range — a single value.
- `zOffsetLimits` — `{ min, max }` constraining the free Z-translation DOF. Omit for unbounded Z.
- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Reorients inst2 before constraint solving.
- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. Always visible because rotation DOF is locked.

## Alignment Semantics (CRITICAL)

**X/Y are FIXED, not free.** Unlike parallel (which has xOffsetLimits/yOffsetLimits ranges), slider uses fixed `xOffset` and `yOffset` values. The solver sets inst2's X/Y position to exactly these values relative to mate1's csys origin. Default is 0 for both.

**Z is the one free DOF.** Initial Z position from the instance's `transformation` is preserved. If `zOffsetLimits` are set, Z is clamped to [min, max] with ~0.001 solver epsilon.

**All rotation is locked.** There are no rotation limits params. The mate.reorient param applies a fixed rotation offset (0°, 90°, 180°, 270° around Z) — it's always visible since the rotation DOF is locked (unlike parallel where free rotation absorbs the offset).

## DOF and Behavior

Slider constrains 5 DOF, leaving 1 free:
- **Locked:** X-translation (set by xOffset), Y-translation (set by yOffset), X-rotation, Y-rotation, Z-rotation
- **Free:** Z-translation only

With no zOffsetLimits, Z is unbounded — the instance stays at whatever Z position its transformation specified.

## xOffset / yOffset (fixed positions)

These are NOT limits — they are exact positions. The solver sets inst2's origin to (xOffset, yOffset) in mate1's csys frame.

- `xOffset: 40` → inst2 X = 40
- `yOffset: 15` → inst2 Y = 15
- Default is 0 for both → inst2 is positioned at mate1's csys origin in X/Y

## zOffsetLimits (the free DOF)

Same clamping behavior as all other constraint limits:
- Position above max → clamped to max (~0.001 epsilon)
- Position below min → clamped to min (~0.001 epsilon)
- Position within range → preserved
- `{ min: null, max: null }` → no limits (Z unbounded)
- `{ min: 20, max: 20 }` → lock Z at exactly 20

## Flip

Identical to other kinematic constraints. Reorients inst2 before constraint solving:

| flip | Effect |
|------|--------|
| `'Z'` (default) | Identity |
| `'-Z'` | 180° around X |
| `'X'` | 90° around Y |
| `'-X'` | -90° around Y |
| `'Y'` | -90° around X |
| `'-Y'` | 90° around X |

Non-default flip actively reorients the instance. The body axes change mapping to world axes.

## Reorient

Always visible on slider (unlike parallel/cylindrical where free rotation absorbs the offset). Each step is 90° around Z:
- `'0'` — no rotation
- `'90'` — 90° around Z
- `'180'` — 180° around Z
- `'270'` — 270° around Z

## Return Value

- Single call: `id` — the constraint ID
- Batch (array of params): `Array<id>`

## getSlider

`getSlider({ id: asmId, name: 'Slide1' })` — queries a slider constraint by name.

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
  xOffset: 25,    // number
  yOffset: 10,    // number
  zOffsetLimits: { min: 5, max: 50 }  // or { min: null, max: null } if unset
}
```

- `zOffsetLimits` always present. No limits → `{ min: null, max: null }`.
- `flip` — string: `'Z'`, `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`
- `reorient` — string: `'0'`, `'90'`, `'180'`, `'270'`

### Failure Cases

All return `result: null, maxLevel: 51`:
- Non-existent name
- Empty name `''`
- Template or instance ID passed as `id`

### Batch

Pass array of `{ id, name }`. Returns `Array<result|null>`. One null contaminates maxLevel to 51.

## updateSlider

`updateSlider({ id: constraintId, ... })` — true partial update. Unspecified params preserved. Returns constraint ID on success, null + maxLevel=51 on failure. Supports batch.

**`id` must be the constraint ID** (from `slider()`), NOT the assembly ID. Passing assembly ID gives error 1007.

### What you can update

- `xOffset: 40` — change fixed X position (solver repositions immediately)
- `yOffset: 20` — change fixed Y position
- `zOffsetLimits: { min: 10, max: 30 }` — add/change Z limits (solver clamps immediately)
- `zOffsetLimits: { min: null, max: null }` — remove Z limits
- `mate2: { flip: '-Z' }` — change flip
- `mate2: { reorient: '90' }` — change reorient
- `name: 'NewName'` — rename; old name immediately unfindable via getSlider

### Removing limits preserves position (CRITICAL)

When zOffsetLimits are removed via `{ min: null, max: null }`, the solver does NOT reset Z to its original position. The **last solved position is preserved**. This matches parallel/planar behavior.

Example: slider with zOffsetLimits [10,20] → inst2 Z clamped to 20. Remove limits → inst2 stays at Z=20, not Z=25 (original).

### Errors (all non-destructive)

| Error | Message | Code |
|-------|---------|------|
| Assembly ID not constraint ID | "The provided id for the constraint is not a constraint or relation." | 1007 |
| Nonexistent ID | Error code 1006 |

## Gotchas

- **X/Y are fixed offsets, not ranges.** This is the key difference from parallel (which has xOffsetLimits/yOffsetLimits). Slider has no X/Y freedom.
- **Reorient is always visible.** Unlike parallel/cylindrical where free rotation absorbs the offset, slider locks all rotation, so reorient is a permanent orientation change.
- **Ungrounded instances both move.** Always ground at least one instance with fastenedOrigin.
- **Solver epsilon ~0.001.** Clamped Z positions have tiny offsets (e.g., min=20 → z≈20.001).

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

const tplA = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 20, height: 10 })
const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplB, name: 'Box', length: 20, width: 20, height: 15 })
const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Rail' })).result
const inst2 = (await api.v1.assembly.instance({
  productId: tplB, ownerId: asmId, name: 'Block',
  transformation: [[0, 0, 20], [1, 0, 0], [0, 1, 0]]
})).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

const sliderId = (await api.v1.assembly.slider({
  id: asmId,
  name: 'Slide',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst2], csys: wcsB },
  xOffset: 40,
  yOffset: 0,
  zOffsetLimits: { min: 10, max: 50 },
})).result
```

## Related

- `assembly.parallel` — 4 DOF (X/Y/Z translation + Z rotation)
- `assembly.cylindrical` — 2 DOF (Z-rotation + Z-translation)
- `assembly.revolute` — 1 DOF (Z-rotation only)
- `assembly.fastened` — 0 DOF (rigid)
- `assembly.updateSlider` — modify after creation
- `assembly.getSlider` — query by name
