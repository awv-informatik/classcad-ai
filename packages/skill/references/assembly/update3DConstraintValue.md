# assembly.update3DConstraintValue

Drives a kinematic constraint's degrees of freedom — the current joint angle of a revolute, the current slider position, etc.

**Does NOT change structural parameters** (`fastened.xOffset`, `revolute.zOffset`, …) — use the type-specific `update*` APIs for those.

Prerequisites: an assembly with a kinematic constraint (revolute, cylindrical, slider, planar, parallel).

## Key Parameters

- `id` — required; constraint ID (not assembly/instance/template)
- `name` — `"X_OFFSET"`, `"Y_OFFSET"`, `"Z_OFFSET"`, or `"Z_ROTATION"`, case-insensitive (`"z_rotation"` works). **`X_ROTATION`/`Y_ROTATION` are invalid** (1013)
- `value` — number (mm for offsets, radians for rotation, e.g. 1.5708 = 90°) or, **for Z_ROTATION only**, a deg string (`'45deg'`, `'-90deg'`, `'180deg'`). Negative, zero, and large values accepted. `'50mm'` offsets don't work; `@expr.` bindings are NOT supported (1001)

## Return Value

Always `null` (VOID), maxLevel 31 on success — no messages, no confirmation of what changed.

## DOF Mapping (CRITICAL)

Only names matching a DOF have an effect; anything else is a **silent no-op** (maxLevel 31, no error — easy to mistake for success).

| Constraint | DOFs | Working names |
|---|---|---|
| revolute | Z rotation | Z_ROTATION |
| cylindrical | Z translation + Z rotation | Z_OFFSET, Z_ROTATION |
| slider | Z translation | Z_OFFSET |
| planar | X/Y translation + Z rotation | X_OFFSET, Y_OFFSET, Z_ROTATION |
| parallel | X/Y/Z translation + Z rotation | X_OFFSET, Y_OFFSET, Z_OFFSET, Z_ROTATION |
| fastened / fastenedOrigin | None (rigid) | None — all 4 are no-ops |
| spherical | X/Y rotation | **None** — Z_ROTATION is a no-op and X/Y_ROTATION don't exist, so spherical joints cannot be driven here |

## Behavior

- **Replaces, not accumulates:** `'45deg'` then `'90deg'` → 90°, not 135°.
- **No readback:** `getRevolute`, `getCylindrical`, etc. return only structural params (mates, limits, name). Read placement from the tree: `(await api.tree({ refresh: true }))[instanceId].coordinateSystem` → `[origin, xDir, yDir, zDir]` (after `Z_ROTATION: '90deg'`, xDir = [0,1,0]).
- **Array form** — different constraints and/or names on the same constraint in one call; returns a single null, maxLevel 31:

```js
await api.v1.assembly.update3DConstraintValue([
  { id: cylId, name: 'Z_OFFSET', value: 50 },
  { id: cylId, name: 'Z_ROTATION', value: '90deg' },
])
```

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"name" is not valid. Possible values: ["X_OFFSET","Y_OFFSET","Z_OFFSET","Z_ROTATION"]` | 1013 | Invalid name (incl. X_ROTATION, Y_ROTATION) |
| `"id" has wrong id type — provide only "constraint"` | 1001 | Assembly root, instance, or template ID |
| `"id" has an invalid id` | 1006 | Non-existent ID |
| `"value" has the wrong type — should be (real)` | 1001 | @expr. binding or other non-numeric/non-deg string |

Every error also carries a cascading `"[Evaluation error in AssemblyAPI_v1.update3DConstraintValue::PROC:[CCVM::ldm: objId not found]]"` — ignore it; the primary message is the useful one.

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tpl = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
await api.v1.part.box({ id: tpl, name: 'B', length: 80, width: 15, height: 8 })
const wcs = (await api.v1.part.workCSys({ id: tpl, name: 'Csys' })).result  // csys at part origin
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Base' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Arm2' })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcs } })
const revId = (await api.v1.assembly.revolute({
  id: asmId, name: 'Hinge',
  mate1: { path: [inst1], csys: wcs },
  mate2: { path: [inst2], csys: wcs },
  zOffset: 15,
})).result

await api.v1.assembly.update3DConstraintValue({ id: revId, name: 'Z_ROTATION', value: '45deg' })

// Verify via placement (measuring the instance itself would materialize it)
const place = (await api.tree({ refresh: true }))[inst2].coordinateSystem
// place[1] (xDir) ≈ [0.707, 0.707, 0]
```

## Related

`assembly.revolute` / `cylindrical` / `slider` / `planar` / `parallel` · `assembly.updateRevolute` / `updateCylindrical` · `assembly.startMovingUnderConstraints` / `moveUnderConstraints` / `finishMovingUnderConstraints` · `assembly/generic`
