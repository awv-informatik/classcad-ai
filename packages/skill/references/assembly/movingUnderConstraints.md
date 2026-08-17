# assembly.startMovingUnderConstraints / moveUnderConstraints / finishMovingUnderConstraints

Three-step workflow for moving instances while respecting assembly constraints. The constraint solver projects the requested motion onto the available degrees of freedom.

## Prerequisites

- An assembly root (`assembly.create`)
- At least one instance (`assembly.instance`)
- Constraints are optional — works on unconstrained (free) instances too

## Workflow

```
startMovingUnderConstraints → moveUnderConstraints (1+ calls) → finishMovingUnderConstraints
```

1. **start** — declares which instances will move, the motion type, and the pivot point
2. **move** — applies a rotation and/or translation; can be called multiple times (each call REPLACES the previous, not accumulates)
3. **finish** — commits the final position; the moved position persists

## startMovingUnderConstraints

| Param | Required | Description |
|---|---|---|
| `id` | yes | Assembly root ID |
| `instanceIds` | yes | Array of instance IDs to move |
| `pivotInfo` | yes | `[x, y, z]` pivot point for rotation |
| `mucType` | yes | `'ROTATION'`, `'TRANSLATION_1D'`, or `'TRANSLATION_2D'` |

### mucType determines which motion is applied

| mucType | rotation param | offset param |
|---|---|---|
| `ROTATION` | ✅ applied | ✅ applied |
| `TRANSLATION_1D` | ❌ silently ignored | ✅ applied |
| `TRANSLATION_2D` | ❌ silently ignored | ✅ applied |

Use `ROTATION` when you need to rotate an instance. TRANSLATION modes silently ignore the rotation param.

### pivotInfo

Defines the rotation center. For **constrained** joints (revolute, cylindrical, spherical), `pivotInfo` is **ignored** — the constraint's axis/point takes precedence. For **unconstrained** instances, `pivotInfo` defines the world-space rotation center.

## moveUnderConstraints

| Param | Required | Default | Description |
|---|---|---|---|
| `id` | yes | — | Assembly root ID |
| `rotation` | no | identity | `{ xDir, yDir, zDir }` — basis vectors defining the rotation |
| `offset` | no | `[0,0,0]` | `[x, y, z]` translation vector |

### CRITICAL: moves are absolute from session start, not incremental

Each `moveUnderConstraints` call sets the position **from where the instance was at `startMoving` time**. Calling it twice with the same rotation replaces (not accumulates). Within a single session, each move is absolute from the session-start position.

### Rotation accumulates across sessions

Each new `start → move → finish` session starts from the instance's **current position** (wherever finish left it). The rotation basis vectors in `moveUnderConstraints` are applied as a **delta from session start**, not from the constraint's zero position. This means:

- Session 1: 30° basis from 0° → instance at 30°
- Session 2: 30° basis from 30° → instance at 60° (not 30°)
- Identity rotation (no-op basis) keeps the instance at session start — it does NOT return to constraint zero

To reach a specific absolute angle from the constraint zero, you must track the accumulated rotation and compute the remaining delta. To animate through angles [0°, 30°, 60°, 90°], either:
- Use a single session and call move multiple times with 0°, 30°, 60°, 90° basis vectors (each replaces the previous), OR
- Use separate sessions, but each basis represents the INCREMENTAL rotation from the previous session's end position

### Constraint solver projection

The solver projects the requested motion onto the available DOF:
- Motion along a constrained axis is silently ignored (no error, no warning)
- Motion beyond `zRotationLimits` is silently clamped to the limit
- Grounded instances (`fastenedOrigin`) cannot be moved — all DOF are locked

### Rotation via basis vectors

The `rotation` param uses three **orthogonal** direction vectors, not angles:

```js
// 90° CCW around Z:
rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] }

// 45° CCW around Z:
rotation: { xDir: [0.707, -0.707, 0], yDir: [0.707, 0.707, 0], zDir: [0, 0, 1] }

// 45° around X:
rotation: { xDir: [1, 0, 0], yDir: [0, 0.707, -0.707], zDir: [0, 0.707, 0.707] }

// Identity (no rotation):
rotation: { xDir: [1, 0, 0], yDir: [0, 1, 0], zDir: [0, 0, 1] }
```

**Non-orthogonal basis vectors are silently ignored** — no error, no warning, no rotation applied. Always ensure xDir, yDir, zDir are mutually perpendicular.

### Composition order: rotation first, then translation

When both `rotation` and `offset` are provided, rotation is applied first around the pivot point, then translation is applied in world-space. Confirmed numerically: for an instance at COG (80,10,5), a 90° Z rotation + offset(0,20,0) yields COG (10,-60,5) = rotate(80,10)→(10,-80) then +(0,20)→(10,-60).

### Identity move as undo

Calling `moveUnderConstraints` with `offset: [0,0,0]` (or no params at all) returns the instance to its position at session start. This effectively undoes all prior moves within the current session without needing `finishMovingUnderConstraints`.

## finishMovingUnderConstraints

| Param | Required | Description |
|---|---|---|
| `id` | yes | Assembly root ID |

Commits the current position. The moved position **persists** — it does not revert, and survives OFB save/load cycles (the position is written into the instance transform). Calling finish twice is safe (idempotent). Calling start → finish without any move in between is also safe (commits the "no motion" state).

## Return Values

All three APIs return `VOID` (null) with maxLevel=31 on success.

## Server Leniency

The three-step workflow is **not strictly enforced**, but skipping steps is dangerous:
- `moveUnderConstraints` without prior `startMoving`: **hangs the worker** (100% CPU, requires kill -9)
- `finishMovingUnderConstraints` without prior `startMoving`: **hangs the worker** (100% CPU, requires kill -9)
- Double `startMovingUnderConstraints` without finish: second start succeeds
- Double `finishMovingUnderConstraints`: safe, idempotent (second call is a no-op)
- `moveUnderConstraints` with invalid assembly ID: **hangs the worker** (100% CPU)

**Always use the full start → move → finish sequence.** Out-of-order calls risk worker hangs.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"instanceIds" must be provided` | 1004 | Missing instanceIds param |
| `"pivotInfo" must be provided` | 1004 | Missing pivotInfo param |
| `"mucType" must be provided` | 1004 | Missing mucType param |
| `"mucType" is not valid` | 1013 | Invalid value (lists valid options) |
| `"id" has an invalid id!` | 1006 | Bad assembly ID |
| `"instanceIds" has an invalid id!` | 1006 | Bad instance ID in array |

Empty `instanceIds` array (`[]`) is silently accepted without error.

## Gotchas

- **Moves are absolute, not incremental.** Within a session, each `moveUnderConstraints` replaces the previous result. The position is always relative to the session start, not the last move.
- **Non-orthogonal basis vectors are silently ignored.** No error, no warning, no rotation. Always verify your basis vectors are mutually perpendicular.
- **mucType matters for rotation.** TRANSLATION modes silently ignore the `rotation` param. Only `ROTATION` mode applies rotations.
- **Constrained axis motion is silently ignored.** No error or warning — the solver just projects onto available DOF. For revolute joints, the `offset` param has zero effect even when combined with rotation.
- **Rotation limits are silently clamped.** No error for beyond-limit requests.
- **pivotInfo is ignored for constrained joints.** The constraint's axis/point takes precedence.
- **Multi-instance motion works.** All instances in `instanceIds` move together with the same transform.
- **Worker hang risk.** Calling `moveUnderConstraints` without a prior `startMoving`, or with an invalid assembly ID, can hang the worker at 100% CPU. Always follow the full start → move → finish sequence.
- **No bounds on offset values.** Negative and very large (1e6+) offsets work fine — no overflow or bounds checking.
- **transformInstance has no lasting effect on constrained instances.** The API call succeeds but the constraint solver snaps the position back. Use MUC for constrained motion, transformInstance/transformInstanceTo for unconstrained.

## State Machine

| From → To | Safe? | Notes |
|---|---|---|
| idle → start | ✅ | Normal entry |
| start → move | ✅ | Normal flow |
| move → move | ✅ | Last move replaces previous |
| move → finish | ✅ | Commits last move |
| start → finish | ✅ | Commits no-change |
| finish → finish | ✅ | Idempotent |
| start → start | ✅ | Second overwrites first |
| finish → start | ✅ | New session |
| idle → move | ❌ | **Worker hang** (100% CPU) |
| idle → finish | ❌ | **Worker hang** (100% CPU) |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
const wcsA = (await api.v1.part.workCSys({
  id: tplA, name: 'Wcs', origin: [0,0,0],
  xDirection: [1,0,0], yDirection: [0,1,0],
})).result

const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
await api.v1.part.box({ id: tplB, name: 'Arm', length: 80, width: 20, height: 8 })
const wcsB = (await api.v1.part.workCSys({
  id: tplB, name: 'Wcs', origin: [0,0,0],
  xDirection: [1,0,0], yDirection: [0,1,0],
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst1 = (await api.v1.assembly.instance({
  productId: tplA, ownerId: asmId, name: 'Base',
  transformation: [[0,0,0], [1,0,0], [0,1,0]],
})).result
const inst2 = (await api.v1.assembly.instance({
  productId: tplB, ownerId: asmId, name: 'Arm',
  transformation: [[0,0,0], [1,0,0], [0,1,0]],
})).result

await api.v1.assembly.fastenedOrigin({
  id: asmId, name: 'Ground',
  mate1: { path: [inst1], csys: wcsA },
})
await api.v1.assembly.revolute({
  id: asmId, name: 'Hinge',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst2], csys: wcsB },
})

// Rotate the arm 90° around the hinge
await api.v1.assembly.startMovingUnderConstraints({
  id: asmId,
  instanceIds: [inst2],
  pivotInfo: [0, 0, 0],
  mucType: 'ROTATION',
})
await api.v1.assembly.moveUnderConstraints({
  id: asmId,
  rotation: { xDir: [0,-1,0], yDir: [1,0,0], zDir: [0,0,1] },
})
await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
```

## Constraint Compatibility

| Constraint | Free DOF | ROTATION | TRANSLATION_1D | TRANSLATION_2D |
|---|---|---|---|---|
| fastenedOrigin | 0 | no motion | no motion | no motion |
| fastened | 0 | no motion | no motion | no motion |
| revolute | 1 (Z rot) | ✅ Z rotation | no motion | no motion |
| slider | 1 (Z trans) | no motion | ✅ Z translation | no motion |
| cylindrical | 2 (Z rot + Z trans) | ✅ Z rotation | ✅ Z translation | no motion |
| planar | 3 (X/Y trans + Z rot) | ✅ Z rotation | ✅ on free axis | ✅ X/Y translation |
| spherical | 3 (X/Y/Z rot) | ✅ all axes | no motion | no motion |
| unconstrained | 6 | ✅ full | ✅ full | ✅ full |

## Related

- `assembly.transformInstance` — relative 4x4 delta (ignores constraints)
- `assembly.transformInstanceTo` — absolute position (ignores constraints)
- `assembly.revolute` / `assembly.cylindrical` / `assembly.slider` / `assembly.planar` / `assembly.spherical` — constraint types that define available DOF
