# assembly.parallel

Parallel constraint between two instances. Only constrains orientation: the mates' Z-axes stay parallel (X- and Y-rotation locked, 2 DOF). 4 DOF stay free: X, Y, Z translation and Z rotation.

Prerequisites: assembly root, two instances whose templates contain a `part.workCSys`. **Ground at least one instance** with `fastenedOrigin` first — otherwise the solver repositions BOTH instances.

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — `{ path: [instanceId], csys: workCSysId, flip?, reorient? }`
- `xOffsetLimits` / `yOffsetLimits` / `zOffsetLimits` — `{ min, max }` per translation; all three work identically and can be combined. Negative values supported; `{ min: N, max: N }` locks the axis; `{ min: null, max: null }` removes
- `zRotationLimits` — `{ min, max }` in radians or degree strings (stored as radians), e.g. `{ min: -1.5708, max: 1.5708 }` = ±90°. `{ min: '45deg', max: '45deg' }` locks inst2 at 45° relative to mate1. `{ min: null, max: null }` removes
- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`; same table as `assembly/fastened`
- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`; as revolute, only visible when `zRotationLimits` lock the joint (free rotation absorbs it)

**No `zOffset` parameter** (unlike planar/revolute). Use `zOffsetLimits: { min: N, max: N }` to fix Z.

## Alignment Semantics (CRITICAL — differs from planar)

**Orientation comes from mate1's csys; position is preserved only when no rotation is needed.**

- If inst2's axes already match mate1's csys (default flip, unrotated csys), there is nothing to solve: its initial X/Y/Z from `transformation` are kept (like cylindrical, unlike planar).
- If aligning requires rotating inst2 (a rotated csys or a **non-default flip**), the solver re-solves and places inst2 **on mate1's csys origin**. Example: mate1 csys `offset [40,0,20]` + `rotation [π/2,0,0]`, inst2 starting at `[200,7,3]` → inst2 at `[40,0,20]`, tilted onto the csys. Use offset limits to re-position afterwards.

Build the csys with `part.workCSys({ offset, rotation })`; `origin`/`xDirection`/`yDirection` are ignored by `workCSys`.

**Limits clamp from the current position** (below min → min, within → preserved, above max → max), with ~0.001 solver epsilon (min=10 → x≈10.001). Limits on one axis don't affect the others. The free DOFs show only via limits or `moveUnderConstraints`.

## Return Value

Constraint ID; array call → `Array<id>`.

## getParallel

`getParallel({ id: asmId, name: 'Par1' })` — `id` is the assembly holding it: the root, an assembly template, or a sub-assembly instance (part instance → "not a Assembly", part template → 1001); `name` is case-sensitive.

Success (maxLevel 31): `{ id, name, mate1: { path, csys, flip, reorient }, mate2: {...}, xOffsetLimits, yOffsetLimits, zOffsetLimits, zRotationLimits }`. All four limit objects are always present (`{ min: null, max: null }` when unset; rotation in radians); flip/reorient are strings.

`result: null`, maxLevel 51 for: non-existent name, empty name `''`, wrong constraint type, instance/template ID as `id`. Array form → `Array<result|null>`; one null raises maxLevel to 51. Duplicate names (silently allowed) → returns the first.

## updateParallel

`updateParallel({ id: constraintId, ... })` — **constraint ID**, not the assembly ID (→ 1007). True partial update; returns the ID, or null + maxLevel 51 on failure. Array form → array of IDs.

- `xOffsetLimits` / `yOffsetLimits` / `zOffsetLimits` / `zRotationLimits` — add/change (solver clamps immediately); `{ min: null, max: null }` removes
- `mate2: { flip: '-Z' }` / `mate2: { reorient: '90' }`
- `name: 'NewName'` — old name immediately unfindable

**Removing limits preserves the last solved position (CRITICAL)** — same as planar. Example: xOffsetLimits [10,20] clamp x to 20; removing them leaves x=20, not the original 40.

Errors are non-destructive:

| Cause | Message | Code |
|---|---|---|
| Assembly ID not constraint ID | "The provided id for the constraint is not a constraint or relation." | 1007 |
| Nonexistent ID | — | 1006 |
| Invalid flip | "Type 'X' is not supported to use as flip type." | 1013 |
| Invalid reorient | "Type '45' is not supported to use as reorient type." | 1013 |

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

const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys' })).result  // csys at part origin

const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys' })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
const inst2 = (await api.v1.assembly.instance({
  productId: tplB, ownerId: asmId, name: 'Block',
  transformation: [[40, 30, 25], [1, 0, 0], [0, 1, 0]],
})).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

const parId = (await api.v1.assembly.parallel({
  id: asmId, name: 'Slide',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst2], csys: wcsB },
  xOffsetLimits: { min: 10, max: 60 },
  yOffsetLimits: { min: 5, max: 50 },
  zOffsetLimits: { min: 10, max: 40 },
  zRotationLimits: { min: 0, max: 0 },
})).result
```

## Related

`assembly.planar` · `assembly.cylindrical` · `assembly.revolute` · `assembly.fastened` · `assembly.slider` · `assembly.updateParallel` · `assembly.getParallel`
