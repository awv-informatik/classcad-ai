# assembly.revolute

Revolute (hinge) constraint between two instances. Constrains 5 DOF, leaving 1 free: rotation around mate1's csys Z-axis.

Prerequisites: assembly root, two instances whose templates contain a `part.workCSys`. **Ground at least one instance** with `fastenedOrigin` first — otherwise the solver repositions BOTH instances.

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — `{ path: [instanceId], csys: workCSysId, flip?, reorient? }`
- `zOffset` — translation along the joint Z-axis from mate1 to mate2 (default 0)
- `zRotationLimits` — `{ min, max }` in radians or degree strings (`'-45deg'`), stored as radians. `{ min: null, max: null }` removes them. On create, omitting min or max errors
- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`; rotates inst2 before solving. Same table as `assembly/fastened`
- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`; defines the zero-angle reference

## Alignment Semantics (CRITICAL)

**Same as fastened: the csys pair is the mounting definition.** mate2's csys is placed on mate1's csys origin with its Z-axis on mate1's Z-axis; the joint rotates around **mate1's csys Z**. Place the csys at the hinge (`part.workCSys({ offset, rotation })`; `origin`/`xDirection`/`yDirection` are ignored by `workCSys`).

Example: mate1 csys `offset [40,0,20]` + `rotation [π/2,0,0]` (csys Z = world −Y) → inst2 at `[40,0,20]`, tilted onto that axis. Adding `zOffset: 10` → inst2 at `[40,-10,20]`.

## Free Rotation, Limits, Reorient

- Without limits or motion, inst2 **keeps its current angle** about the axis (created at 45° → stays at 45°). The free DOF shows only via `zRotationLimits`, `moveUnderConstraints`, or interacting constraints.
- `zRotationLimits` do NOT affect initial placement; they are enforced during motion. Example values: `{ min: -1.5708, max: 1.5708 }` (±90°), `{ min: '-45deg', max: '180deg' }`.
- `reorient` has NO visible effect while rotation is free (the solver absorbs it). Observable only when limits lock the joint (e.g. `{ min: 0, max: 0 }`) or under motion. With limits locked at 0:

| reorient | Physical rotation of inst2 |
|---|---|
| `'0'` | Identity |
| `'90'` | 90° CW around Z |
| `'180'` | 180° around Z |
| `'270'` | 270° CW around Z |

## Return Value

Constraint ID; array call → `Array<id>`.

## getRevolute

`getRevolute({ id: asmId, name: 'Rev1' })` — `id` is the assembly holding it: the root, an assembly template, or a sub-assembly instance (part instance → "not a Assembly", part template → 1001); `name` is case-sensitive.

Success (maxLevel 31): `{ id, name, mate1: { path, csys, flip, reorient }, mate2: {...}, zOffset, zRotationLimits: { min, max } }`. `zRotationLimits` is always an object (`{ min: null, max: null }` when unset; radians otherwise); flip/reorient are strings.

`result: null`, maxLevel 51 for: non-existent name, empty name `''`, wrong constraint type (lookup is type-specific), instance/template ID as `id`. Array form → `Array<result|null>`; one null raises the envelope maxLevel to 51. Live view: updates show immediately; after a rename only the new name resolves. Duplicate names (silently allowed) → returns the first-created one.

## updateRevolute

`updateRevolute({ id: constraintId, ... })` — **constraint ID**, not the assembly ID (→ 1007). True partial update; returns the ID, or null + maxLevel 51 on failure. Array form → array of IDs.

- `zOffset: 20` — shifts inst2 along Z by exactly the offset (COG verified)
- `zRotationLimits: { min: 0, max: '90deg' }` — add/change; `{ min: null, max: null }` or `zRotationLimits: null` removes both
- **Partial limits work on update (unlike create):** `{ min: '-45deg' }` changes min and keeps max; `{ max: null }` removes max and keeps min; `{}` errors
- `mate2: { flip: '-Z' }` / `mate2: { reorient: '90' }` — path/csys not needed
- `mate2: { path: [newInst], csys: newWcs }` — retarget; the new target moves, the old one stays at its last solved position
- `name: 'NewName'` — old name immediately unfindable

Errors are non-destructive (state fully preserved):

| Cause | Message | Code |
|---|---|---|
| Assembly ID not constraint ID | "The provided id for the constraint is not a constraint or relation." | 1007 |
| Nonexistent ID | "ToId()/TOID() didn't get an existing or valid id." | 1006 |
| Invalid flip | "Type 'X' is not supported to use as flip type." | 1013 |
| Invalid reorient | "Type '45' is not supported to use as reorient type." | 1013 |
| Missing `id` | "'id' must be provided for update." | 1004 |
| Empty limits `{}` | "The object 'zRotationLimits' is empty!" | — |

## Gotchas

- **Missing required params give cryptic errors.** Omitting mate2 or csys → "Evaluation error in AbstractAPI.PrepareAPIParams" (maxLevel 51).

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result

const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys' })).result  // csys at part origin

const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys' })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm' })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

const revId = (await api.v1.assembly.revolute({
  id: asmId, name: 'Hinge',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst2], csys: wcsB },
  zOffset: 10,
  zRotationLimits: { min: '-90deg', max: '90deg' },
})).result
```

## Related

`assembly.fastened` · `assembly.updateRevolute` · `assembly.getRevolute` · `assembly.cylindrical` · `assembly.startMovingUnderConstraints` / `moveUnderConstraints`
