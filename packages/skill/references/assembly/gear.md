# assembly.gear

Gear relation linking two **revolute** constraints: when one rotates, the other rotates by the ratio, with optional angular offset.

## Prerequisites

- An assembly root with **two revolute constraints**. No other type is accepted — cylindrical, planar, slider, spherical, fastened, fastenedOrigin all fail with `"wrong id type! Provide only following id types: [\"revoluteconstraint\"]"` (despite docs saying "constraint")
- At least one instance grounded with `fastenedOrigin` (otherwise solver behavior is unpredictable)

## Key Parameters

- `id` — assembly root ID (required)
- `constr1Id` / `constr2Id` — revolute constraint IDs (required). Passing the same revolute for both is silently allowed
- `ratio` — rotational ratio (default 1)
- `offset` — angular offset for constr2 in radians (default 0); degree strings accepted (`'-30deg'`)
- `name` — default `"GearRelation"`

## Coupling Formula (CRITICAL)

Physical rotation of constr2's mate2 instance:

```
arm2_rotation = -(ratio × constr1_angle) + offset
```

- **Positive ratio** → counter-rotating (meshing gears)
- **Negative ratio** → co-rotating (belt/chain drive)
- **ratio=0** → decoupled; arm2 doesn't rotate
- **offset** → constant angle added to arm2

Measured via COG:

| ratio | offset | constr1 angle | arm2 physical rotation |
|---|---|---|---|
| 2.0 | 0 | +45° | -90° (counter) |
| 2.0 | 0 | +90° | -180° (counter) |
| -2.0 | 0 | +45° | +90° (co-rotating) |
| 0 | 0 | +45° | 0° (decoupled) |
| 1.0 | 90° | 0° | +90° |
| 1.0 | 90° | +45° | +45° |

## Driving Gear Motion

Drive constr1 with `update3DConstraintValue({ id: rev1Id, name: 'Z_ROTATION', value: '45deg' })`; the gear propagates to constr2. **Do not drive constr2 directly.**

Without a drive: offset=0 → both revolutes at angle 0. Offset≠0 → the solver splits the offset across both free revolutes (ratio 1, offset 90°: both arms at 45°, repeatable; neither at 0). To place a specific arm at a specific angle, drive constr1 explicitly.

## Return Value

Gear relation ID; array call → `Array<id>`.

## updateGear

`updateGear({ id: gearId, ... })` — **gear relation ID**, not the assembly ID (→ 1007). True partial update: `ratio`, `offset` (radians or degree string), `name` (old name immediately unfindable via getGear), `constr1Id` / `constr2Id` (retarget).

## getGear

`getGear({ id: asmId, name: 'MyGear' })` — `id` is the assembly holding it: the root, an assembly template, or a sub-assembly instance (part instance → "not a Assembly", part template → 1001); `name` case-sensitive. Success (maxLevel 31): `{ id, name, constr1Id, constr2Id, ratio, offset }` with offset in radians. `result: null`, maxLevel 51 for: non-existent name, empty name, part instance/template ID as `id`.

## Gotchas

- **calculateMassProperties materializes instances.** After `calculateMassProperties(instanceId)`, constraint updates (including gear-driven motion) may not propagate to the materialized instance. Measure only after final positioning.

## Common Errors

| Cause | Message | Code |
|---|---|---|
| Non-revolute constraint | "wrong id type! Provide only: [\"revoluteconstraint\"]" | 1001 |
| Non-existent constraint ID | "invalid id!" | 1006 |
| Missing required param | "must be provided" | 1004 |
| Assembly ID for updateGear | "not a constraint or relation" | 1007 |
| getGear failures | "couldn't be found a constraint with name..." | 0 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result

const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys' })).result  // csys at part origin

const tplB = (await api.v1.assembly.partTemplate({ name: 'Gear1' })).result
await api.v1.part.box({ id: tplB, name: 'Box', length: 60, width: 15, height: 8 })
const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys' })).result

const tplC = (await api.v1.assembly.partTemplate({ name: 'Gear2' })).result
await api.v1.part.box({ id: tplC, name: 'Box', length: 40, width: 12, height: 6 })
const wcsC = (await api.v1.part.workCSys({ id: tplC, name: 'Csys' })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Gear1' })).result
const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Gear2' })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

const rev1 = (await api.v1.assembly.revolute({
  id: asmId, name: 'Rev1',
  mate1: { path: [inst1], csys: wcsA }, mate2: { path: [inst2], csys: wcsB }, zOffset: 10,
})).result
const rev2 = (await api.v1.assembly.revolute({
  id: asmId, name: 'Rev2',
  mate1: { path: [inst1], csys: wcsA }, mate2: { path: [inst3], csys: wcsC }, zOffset: 20,
})).result

// 2:1 counter-rotating
await api.v1.assembly.gear({ id: asmId, name: 'MeshGear', constr1Id: rev1, constr2Id: rev2, ratio: 2.0 })

// Drive gear1 by 45° → gear2 rotates -90°
await api.v1.assembly.update3DConstraintValue({ id: rev1, name: 'Z_ROTATION', value: '45deg' })
```

## Related

`assembly.revolute` · `assembly.updateGear` · `assembly.getGear` · `assembly.group` · `assembly.update3DConstraintValue`
