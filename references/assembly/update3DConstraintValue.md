# assembly.update3DConstraintValue

Sets the current position within a kinematic constraint's degrees of freedom (DOFs). This is the generic API for driving joints — rotating a revolute, translating a slider, etc.

**This API does NOT update structural constraint parameters** (like `fastened.xOffset` or `revolute.zOffset`). It drives the DOF values — the current joint angle, the current slider position. Use the type-specific `update*` APIs (`updateFastened`, `updateRevolute`, etc.) to change structural params.

## Prerequisites

- An assembly with at least one kinematic constraint (revolute, cylindrical, slider, planar, or parallel)

## Key Parameters

- `id` — constraint ID (required). Must be a constraint type, not assembly/instance/template.
- `name` — which DOF to set. One of: `"X_OFFSET"`, `"Y_OFFSET"`, `"Z_OFFSET"`, `"Z_ROTATION"`. Case-insensitive (`"z_rotation"` works).
- `value` — number (radians for rotation, mm for offsets) or deg string (`"45deg"`, `"-90deg"`, `"180deg"`). Negative values, zero, and large values are all accepted.

**X_ROTATION and Y_ROTATION are NOT valid names.** The API rejects them with error 1013.

## Return Value

- `result: null` (VOID) — always. No ID or value is returned.
- `maxLevel: 31` on success (no messages, no confirmation of what changed)

## DOF Mapping (CRITICAL)

Only DOF-matching names have any effect. Non-DOF names are **silent no-ops** (maxLevel=31, no error).

| Constraint | DOFs | Working names |
|---|---|---|
| revolute | Z rotation | Z_ROTATION |
| cylindrical | Z translation + Z rotation | Z_OFFSET, Z_ROTATION |
| slider | Z translation | Z_OFFSET |
| planar | X/Y translation + Z rotation | X_OFFSET, Y_OFFSET, Z_ROTATION |
| parallel | X/Y translation + Z rotation | X_OFFSET, Y_OFFSET, Z_ROTATION |
| fastened | None (rigid) | None — all 4 are silent no-ops |
| fastenedOrigin | None (rigid) | None — all 4 are silent no-ops |
| spherical | X/Y rotation | **None** — Z_ROTATION is a no-op, X/Y_ROTATION don't exist |

**Spherical joints cannot be driven via this API.** Their DOFs are X and Y rotation, but neither X_ROTATION nor Y_ROTATION is a valid name.

## No Readback

The get* APIs (`getRevolute`, `getCylindrical`, etc.) do NOT return the current DOF value. They only return structural parameters (mates, limits, name). The DOF position can only be verified through `calculateMassProperties` (COG measurement) or `getGeometryPositions`.

## Value Types

- **Numbers** — millimeters for offsets, radians for rotation. `{ value: 1.5708 }` = 90° in radians.
- **Deg strings** — only for Z_ROTATION: `{ value: '45deg' }`, `{ value: '-90deg' }`, `{ value: '180deg' }`. Negative deg strings work.
- **@expr. bindings** — NOT supported. `{ value: '@expr.DISP' }` returns error 1001 "wrong type — should be real".

## Array Form

Batch multiple updates in one call:

```js
await api.v1.assembly.update3DConstraintValue([
  { id: rev1, name: 'Z_ROTATION', value: '90deg' },
  { id: rev2, name: 'Z_ROTATION', value: '45deg' },
])
```

Can update different constraints and different names in one array. Can also update the same constraint with different names:

```js
await api.v1.assembly.update3DConstraintValue([
  { id: cylId, name: 'Z_OFFSET', value: 50 },
  { id: cylId, name: 'Z_ROTATION', value: '90deg' },
])
```

Returns null, maxLevel=31 on success (single result, not per-item).

## Gotchas

- **Silent no-ops on rigid constraints.** Calling with a fastened/fastenedOrigin ID returns success but does nothing. No error, no warning. Easy to mistake for a successful update.
- **Silent no-ops for non-DOF names.** Calling Z_OFFSET on a revolute (which only has Z rotation DOF) returns success but does nothing.
- **No readback.** You cannot query the current DOF value through any API. The only verification is spatial measurement.
- **Each call replaces, not accumulates.** `Z_ROTATION: '45deg'` then `Z_ROTATION: '90deg'` sets the angle to 90°, not 135°.
- **Deg strings only for rotation.** `X_OFFSET: '50mm'` doesn't work — offset values must be numbers.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"name" is not valid. Possible values: ["X_OFFSET","Y_OFFSET","Z_OFFSET","Z_ROTATION"]` | 1013 | Invalid name string (including X_ROTATION, Y_ROTATION) |
| `"id" has wrong id type — provide only "constraint"` | 1001 | Assembly root ID, instance ID, or template ID |
| `"id" has an invalid id` | 1006 | Non-existent ID |
| `"value" has the wrong type — should be (real)` | 1001 | @expr. binding or other non-numeric/non-deg string |

All errors include a cascading internal error: `"[Evaluation error in AssemblyAPI_v1.update3DConstraintValue::PROC:[CCVM::ldm: objId not found]]"` — ignore this, the primary error message is the useful one.

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tpl = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
await api.v1.part.box({ id: tpl, name: 'B', length: 80, width: 15, height: 8 })
const wcs = (await api.v1.part.workCSys({
  id: tpl, name: 'Csys', origin: [0, 0, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Base' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Arm',
  transformation: [[0, 0, 15], [1, 0, 0], [0, 1, 0]] })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcs } })

const revId = (await api.v1.assembly.revolute({
  id: asmId, name: 'Hinge',
  mate1: { path: [inst1], csys: wcs },
  mate2: { path: [inst2], csys: wcs },
  zOffset: 15,
})).result

// Drive the revolute to 90°
await api.v1.assembly.update3DConstraintValue({ id: revId, name: 'Z_ROTATION', value: '90deg' })

// Drive to 45° (replaces, not adds)
await api.v1.assembly.update3DConstraintValue({ id: revId, name: 'Z_ROTATION', value: '45deg' })

// Verify via mass properties (only way to read back the DOF value)
const mp = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
// mp.cog will reflect the 45° rotation
```

## Related

- `assembly.revolute` / `assembly.cylindrical` / `assembly.slider` / `assembly.planar` / `assembly.parallel` — constraints this API drives
- `assembly.updateRevolute` / `assembly.updateCylindrical` / etc. — update structural params (mates, limits, name)
- `assembly.startMovingUnderConstraints` / `moveUnderConstraints` / `finishMovingUnderConstraints` — alternative motion workflow
- `assembly.calculateMassProperties` — verify DOF position (only readback method)
