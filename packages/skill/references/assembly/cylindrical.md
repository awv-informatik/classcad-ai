# assembly.cylindrical

Cylindrical constraint between two instances. Constrains 4 DOF, leaving 2 free: rotation around AND translation along mate1's csys Z-axis.

Prerequisites: assembly root, two instances whose templates contain a `part.workCSys`. **Ground at least one instance** with `fastenedOrigin` first — otherwise the solver repositions BOTH instances.

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — `{ path: [instanceId], csys: workCSysId, flip?, reorient? }`
- `zOffsetLimits` — `{ min, max }` on Z translation. Partial (`{ min: 10 }`) and negative (`{ min: -20, max: -10 }`) limits work. `{ min: null, max: null }` removes
- `zRotationLimits` — `{ min, max }` in radians or degree strings (stored as radians), e.g. `{ min: -1.5708, max: 1.5708 }` = ±90°. `{ min: null, max: null }` removes
- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`; same table as `assembly/fastened`
- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`; as revolute, only visible when `zRotationLimits` lock the joint (e.g. `{ min: 0, max: 0 }`) — free rotation absorbs it

**No `zOffset` parameter.** Passing it is silently ignored (no error, no effect). To fix Z, use `zOffsetLimits: { min: N, max: N }`.

## Alignment Semantics (CRITICAL — differs from revolute)

**The axis is mate1's csys Z-axis.** inst2 is moved onto that axis (mate2's csys origin on the line, axes aligned). Example: mate1 csys `offset [40,0,20]` + `rotation [π/2,0,0]` (csys Z = world −Y), inst2 starting at `[200,7,3]` → inst2 at `[40,7,20]`: on the axis, keeping its position along it. Build the csys with `part.workCSys({ offset, rotation })`; `origin`/`xDirection`/`yDirection` are ignored by `workCSys`.

**Z along the axis is free and comes from the instance's transformation.** With no limits the solver keeps inst2's current angle (created at 45° → stays at 45°) and preserves the initial Z-offset; it does not move inst2 along Z unless `zOffsetLimits` force clamping:

| Current Z vs limits | Result |
|---|---|
| below min | clamped to min |
| within range | preserved |
| above max | clamped to max |

The free DOFs show only via limits, `moveUnderConstraints`, or interacting constraints.

## Return Value

Constraint ID; array call → `Array<id>`.

## getCylindrical

`getCylindrical({ id: asmId, name: 'Cyl1' })` — `id` is the assembly holding it: the root, an assembly template, or a sub-assembly instance (part instance → "not a Assembly", part template → 1001); `name` is case-sensitive.

Success (maxLevel 31): `{ id, name, mate1: { path, csys, flip, reorient }, mate2: {...}, zOffsetLimits: { min, max }, zRotationLimits: { min, max } }`. Both limit objects are always present (`null` values when unset; rotation in radians). No `zOffset` field (unlike getRevolute).

`result: null`, maxLevel 51 for: non-existent name, empty name `''`, wrong constraint type (e.g. a fastenedOrigin), instance/template ID as `id`. Array form → `Array<result|null>`; one null raises maxLevel to 51.

## updateCylindrical

`updateCylindrical({ id: constraintId, ... })` — **constraint ID**, not the assembly ID (→ 1007). True partial update.

- `zOffsetLimits: { min: 10, max: 30 }` — add/change (instance clamps immediately); `{ min: null, max: null }` removes
- `zRotationLimits: { min: 0, max: '90deg' }` — add/change; `{ min: null, max: null }` removes
- `mate2: { flip: '-Z' }` / `mate2: { reorient: '90' }`
- `name: 'NewName'` — old name immediately unfindable

## Gotchas

- **Duplicate names allowed** silently.
- **Same instance in both mates** → error 1014: "probably belong to the same rigid set."

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result

const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys' })).result  // csys at part origin

const tplB = (await api.v1.assembly.partTemplate({ name: 'Piston' })).result
await api.v1.part.cylinder({ id: tplB, name: 'Rod', diameter: 10, height: 50 })
const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys' })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
const inst2 = (await api.v1.assembly.instance({
  productId: tplB, ownerId: asmId, name: 'Piston',
  transformation: [[0, 0, 10], [1, 0, 0], [0, 1, 0]],
})).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

const cylId = (await api.v1.assembly.cylindrical({
  id: asmId, name: 'PistonSlide',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst2], csys: wcsB },
  zOffsetLimits: { min: 5, max: 40 },
  zRotationLimits: { min: 0, max: 0 },
})).result
```

## Related

`assembly.revolute` · `assembly.fastened` · `assembly.updateCylindrical` · `assembly.getCylindrical` · `assembly.slider`
