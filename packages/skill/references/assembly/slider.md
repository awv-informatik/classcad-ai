# assembly.slider

Slider constraint between two instances. Constrains 5 DOF, leaving 1 free: translation along mate1's csys Z-axis. X/Y translation are fixed by offset params; all rotation is locked (no rotation limit params).

Prerequisites: assembly root, two instances whose templates contain a `part.workCSys`. **Ground at least one instance** with `fastenedOrigin` first — otherwise the solver repositions BOTH instances.

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — `{ path: [instanceId], csys: workCSysId, flip?, reorient? }`
- `xOffset` / `yOffset` — **fixed** position of inst2's origin in mate1's csys frame (default 0 → on mate1's csys origin in X/Y). Single values, NOT ranges (unlike parallel's `xOffsetLimits`/`yOffsetLimits`)
- `zOffsetLimits` — `{ min, max }` on the free Z. Omit or `{ min: null, max: null }` for unbounded; `{ min: 20, max: 20 }` locks Z at 20
- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`; same table as `assembly/fastened`. Non-default flip actively reorients inst2 (body axes change mapping to world axes)
- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'` = 0/90/180/270° around Z. **Always visible** because rotation is locked (unlike parallel/cylindrical, where free rotation absorbs it)

## Alignment Semantics (CRITICAL)

**The rail is mate1's csys Z-axis.** inst2 takes mate1's csys orientation and slides along its Z; `xOffset`/`yOffset` run along the csys X/Y. Example: mate1 csys `offset [40,0,20]` + `rotation [0,0,π/2]`, `xOffset: 10` → inst2 at `[40,10,z]`, rotated 90° about Z. Build the csys with `part.workCSys({ offset, rotation })`; `origin`/`xDirection`/`yDirection` are ignored by `workCSys`.

**Z keeps the instance's current position along the rail** (unbounded without limits). With `zOffsetLimits`, Z above max → max, below min → min, within → preserved; clamped values carry ~0.001 solver epsilon (min=20 → z≈20.001).

## Return Value

Constraint ID; array call → `Array<id>`.

## getSlider

`getSlider({ id: asmId, name: 'Slide1' })` — `id` is the assembly holding it: the root, an assembly template, or a sub-assembly instance (part instance → "not a Assembly", part template → 1001); `name` is case-sensitive.

Success (maxLevel 31):
```js
{ id, name,
  mate1: { path, csys, flip, reorient }, mate2: { path, csys, flip, reorient },
  xOffset: 25, yOffset: 10,               // numbers
  zOffsetLimits: { min: 5, max: 50 } }    // always present; { min: null, max: null } if unset
```

`result: null`, maxLevel 51 for: non-existent name, empty name `''`, template/instance ID as `id`. Array form → `Array<result|null>`; one null raises maxLevel to 51.

## updateSlider

`updateSlider({ id: constraintId, ... })` — **constraint ID**, not the assembly ID (→ 1007). True partial update; returns the ID, or null + maxLevel 51 on failure. Array form supported.

- `xOffset: 40` / `yOffset: 20` — solver repositions immediately
- `zOffsetLimits: { min: 10, max: 30 }` — solver clamps immediately; `{ min: null, max: null }` removes
- `mate2: { flip: '-Z' }` / `mate2: { reorient: '90' }`
- `name: 'NewName'` — old name immediately unfindable

**Removing limits preserves the last solved position (CRITICAL)** — Z is not reset (same as parallel/planar). Example: limits [10,20] clamp Z to 20; removing them leaves Z=20, not the original 25.

Errors are non-destructive: assembly ID instead of constraint ID → "The provided id for the constraint is not a constraint or relation." (1007); nonexistent ID → 1006.

## Common Errors

| Cause | Message | Code |
|---|---|---|
| Same instance both mates | "probably belong to the same rigid set" | 1014 |
| Missing mate2 or csys | "Evaluation error in AbstractAPI.PrepareAPIParams" | 0 |
| Invalid flip | "Type 'W' is not supported to use as flip type" | 1013 |
| Invalid reorient | "Type '45' is not supported to use as reorient type" | 1013 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result

const tplA = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 20, height: 10 })
const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys' })).result  // csys at part origin

const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplB, name: 'Box', length: 20, width: 20, height: 15 })
const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys' })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Rail' })).result
const inst2 = (await api.v1.assembly.instance({
  productId: tplB, ownerId: asmId, name: 'Block',
  transformation: [[0, 0, 20], [1, 0, 0], [0, 1, 0]],
})).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

const sliderId = (await api.v1.assembly.slider({
  id: asmId, name: 'Slide',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst2], csys: wcsB },
  xOffset: 40,
  zOffsetLimits: { min: 10, max: 50 },
})).result
```

## Related

`assembly.parallel` · `assembly.cylindrical` · `assembly.revolute` · `assembly.fastened` · `assembly.updateSlider` · `assembly.getSlider`
