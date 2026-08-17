# assembly.gear

Creates a gear relation linking two **revolute** constraints. When one revolute rotates, the other rotates proportionally by the gear ratio with optional angular offset.

## Prerequisites

- An assembly root (`assembly.create`)
- **Two revolute constraints** (`assembly.revolute`). No other constraint type is accepted — cylindrical, planar, slider, spherical, fastened, fastenedOrigin all fail with: `"wrong id type! Provide only following id types: [\"revoluteconstraint\"]"`
- At least one instance grounded with `fastenedOrigin` (otherwise solver behavior is unpredictable)

## Key Parameters

- `id` — assembly root ID (required)
- `constr1Id` — ID of the first revolute constraint (required)
- `constr2Id` — ID of the second revolute constraint (required)
- `ratio` — rotational velocity ratio (default 1). See coupling formula below.
- `offset` — angular offset for constr2 in radians (default 0). Accepts degree strings: `'45deg'`, `'90deg'`, `'-30deg'`.
- `name` — relation name (default "GearRelation")

## Coupling Formula (CRITICAL)

The physical rotation of constr2's mate2 instance follows:

```
arm2_rotation = -(ratio × constr1_angle) + offset
```

- **Positive ratio** → counter-rotating (meshing gears). arm2 rotates opposite to arm1.
- **Negative ratio** → co-rotating (belt/chain drive). arm2 rotates same direction as arm1.
- **ratio=0** → decoupled. arm2 doesn't rotate regardless of constr1.
- **offset** → constant angular displacement added to arm2's position.

### Examples (verified via COG measurement)

| ratio | offset | constr1 angle | arm2 physical rotation |
|---|---|---|---|
| 2.0 | 0 | +45° | -90° (counter) |
| 2.0 | 0 | +90° | -180° (counter) |
| -2.0 | 0 | +45° | +90° (co-rotating) |
| 0 | 0 | +45° | 0° (decoupled) |
| 1.0 | 90° | 0° | +90° |
| 1.0 | 90° | +45° | +45° |

## Driving Gear Motion

Use `update3DConstraintValue` on the driving constraint (constr1):

```js
await api.v1.assembly.update3DConstraintValue({
  id: rev1Id, name: 'Z_ROTATION', value: '45deg',
})
```

The gear automatically propagates to constr2. **Do not drive constr2 directly** — the gear controls it.

### Solver behavior without drive

With offset=0 and no drive, both revolutes start at angle=0 (gear satisfied trivially). With offset≠0, the solver finds an arbitrary equilibrium distributing the constraint across both free revolute DOFs. To get predictable behavior with offset, **always explicitly drive constr1** via `update3DConstraintValue`.

## Return Value

- Single call: `id` — the gear relation ID
- Array call: `Array<id>`

## updateGear

`updateGear({ id: gearId, ... })` — true partial update. Unspecified params preserved.

**`id` must be the gear relation ID** (returned from `gear()`), NOT the assembly ID. Passing assembly ID → error code 1007.

### What you can update

- `ratio: 0.5` — change gear ratio
- `offset: '90deg'` — change angular offset (radians or degree string)
- `name: 'NewName'` — rename; old name immediately unfindable via getGear
- `constr1Id` / `constr2Id` — retarget to different revolute constraints

## getGear

`getGear({ id: asmId, name: 'MyGear' })` — queries a gear relation by name.

### Parameters

- `id` — **assembly root ID only**. Instance IDs and template IDs fail with "not a Assembly".
- `name` — relation name string (case-sensitive)

### Return Value

Success (`maxLevel: 31`):
```js
{
  id,           // gear relation ID
  name,         // string
  constr1Id,    // revolute constraint ID
  constr2Id,    // revolute constraint ID
  ratio,        // number
  offset,       // number (radians — degree strings converted on storage)
}
```

Failure (all return `result: null, maxLevel: 51`):
- Non-existent name
- Empty name
- Instance or template ID passed as `id`

## Gotchas

- **Revolute-only.** Despite docs saying "constraint", gear only accepts revolute constraint IDs. Cylindrical, fastened, etc. all fail.
- **Counter-rotation is built in.** Positive ratio means opposite rotation direction (like meshing gears). Use negative ratio for same-direction coupling (belt/pulleys).
- **Self-linking is silently allowed.** Passing the same revolute for both constr1 and constr2 succeeds without error.
- **Offset without drive is unpredictable.** The solver redistributes offset across free revolute DOFs. Always explicitly drive constr1 to get deterministic positions.
- **calculateMassProperties materializes instances.** After calling `calculateMassProperties(instanceId)`, constraint updates (including gear-driven motion) may not propagate to the materialized instance. Measure only after final positioning.

## Common Errors

| Error | Message | Code |
|---|---|---|
| Non-revolute constraint | "wrong id type! Provide only: [\"revoluteconstraint\"]" | 1001 |
| Non-existent constraint ID | "invalid id!" | 1006 |
| Missing required param | "must be provided" | 1004 |
| Assembly ID for updateGear | "not a constraint or relation" | 1007 |
| Assembly root for getGear failures | "couldn't be found a constraint with name..." | 0 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result

const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

const tplB = (await api.v1.assembly.partTemplate({ name: 'Gear1' })).result
await api.v1.part.box({ id: tplB, name: 'Box', length: 60, width: 15, height: 8 })
const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

const tplC = (await api.v1.assembly.partTemplate({ name: 'Gear2' })).result
await api.v1.part.box({ id: tplC, name: 'Box', length: 40, width: 12, height: 6 })
const wcsC = (await api.v1.part.workCSys({ id: tplC, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Gear1' })).result
const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Gear2' })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

const rev1 = (await api.v1.assembly.revolute({
  id: asmId, name: 'Rev1',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst2], csys: wcsB },
  zOffset: 10,
})).result

const rev2 = (await api.v1.assembly.revolute({
  id: asmId, name: 'Rev2',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst3], csys: wcsC },
  zOffset: 20,
})).result

// Gear: 2:1 counter-rotating ratio
const gearId = (await api.v1.assembly.gear({
  id: asmId, name: 'MeshGear',
  constr1Id: rev1, constr2Id: rev2,
  ratio: 2.0,
})).result

// Drive: rotate gear1 by 45° → gear2 rotates -90°
await api.v1.assembly.update3DConstraintValue({
  id: rev1, name: 'Z_ROTATION', value: '45deg',
})
```

## Related

- `assembly.revolute` — the constraint type gear operates on
- `assembly.updateGear` — modify after creation
- `assembly.getGear` — query by name
- `assembly.group` — groups instances together (different from gear)
- `assembly.update3DConstraintValue` — drives rotation that gear propagates
