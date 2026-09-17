# assembly.startMovingUnderConstraints / moveUnderConstraints / finishMovingUnderConstraints

Three-step workflow (MUC) for moving instances while respecting assembly constraints; the solver projects the requested motion onto the available DOF. Needs an assembly root and at least one instance; constraints are optional (free instances work too).

```
startMovingUnderConstraints → moveUnderConstraints (1+ calls) → finishMovingUnderConstraints
```

All three return VOID (null), maxLevel 31.

## startMovingUnderConstraints

| Param | Required | Description |
|---|---|---|
| `id` | yes | Assembly root ID |
| `instanceIds` | yes | Instances to move — all move together with the same transform. `[]` is silently accepted |
| `pivotInfo` | yes | `[x, y, z]` world-space rotation center for **unconstrained** instances; **ignored** for constrained joints (revolute, cylindrical, spherical) — the constraint's axis/point wins |
| `mucType` | yes | `'ROTATION'`, `'TRANSLATION_1D'`, or `'TRANSLATION_2D'` |

| mucType | `rotation` | `offset` |
|---|---|---|
| `ROTATION` | ✅ applied | ✅ applied |
| `TRANSLATION_1D` / `TRANSLATION_2D` | ❌ silently ignored | ✅ applied |

## moveUnderConstraints

| Param | Required | Default | Description |
|---|---|---|---|
| `id` | yes | — | Assembly root ID |
| `rotation` | no | identity | `{ xDir, yDir, zDir }` basis vectors |
| `offset` | no | `[0,0,0]` | `[x, y, z]` translation; no bounds (negative and 1e6+ work) |

### CRITICAL: absolute within a session, cumulative across sessions

- **Within a session**, each move is absolute from the position at `startMoving` time — a second move replaces the first. A move with `offset: [0,0,0]` (or no params) returns to the session-start position: an undo without `finish`.
- **Each new session** starts from the current (finished) position, and the basis is a delta from there, not from the constraint zero: session 1 with a 30° basis → 30°; session 2 with a 30° basis → 60°. An identity basis does NOT return to constraint zero.
- To animate [0°, 30°, 60°, 90°]: either one session with moves at 0°, 30°, 60°, 90° (each replaces), or separate sessions whose bases are the INCREMENTAL rotation from the previous end. For an absolute angle across sessions, track the accumulated rotation and compute the remaining delta.

### Rotation basis vectors

Three **orthogonal** direction vectors, not angles. **Non-orthogonal bases are silently ignored** (no error, no rotation).

```js
// 90° CLOCKWISE around Z (viewed from +Z): an instance at (80,0) ends at (0,−80)
rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] }
// 90° counter-clockwise around Z
rotation: { xDir: [0, 1, 0], yDir: [-1, 0, 0], zDir: [0, 0, 1] }
// 45° CLOCKWISE around Z
rotation: { xDir: [0.707, -0.707, 0], yDir: [0.707, 0.707, 0], zDir: [0, 0, 1] }
// 45° around X
rotation: { xDir: [1, 0, 0], yDir: [0, 0.707, -0.707], zDir: [0, 0.707, 0.707] }
```

**Order: rotation around the pivot first, then world-space translation.** Instance COG (80,10,5) with the clockwise 90° Z basis + offset (0,20,0) → (10,-60,5): rotate (80,10)→(10,-80), then +(0,20).

### Solver projection (all silent — no error, no warning)

- Motion along a constrained axis is ignored — for a revolute, `offset` has zero effect even combined with rotation.
- Motion beyond `zRotationLimits` is clamped to the limit.
- Grounded instances (`fastenedOrigin`) cannot move — all DOF locked.

## finishMovingUnderConstraints

`{ id }` (assembly root). Commits the current position; it persists (written into the instance transform) and survives OFB save/load. start → finish with no move commits "no motion".

## State Machine

| From → To | Safe? | Notes |
|---|---|---|
| idle → start | ✅ | Normal entry |
| start → move / move → move | ✅ | Last move replaces previous |
| move → finish | ✅ | Commits last move |
| start → finish | ✅ | Commits no change |
| finish → finish | ✅ | Idempotent no-op |
| start → start | ✅ | Second overwrites first |
| finish → start | ✅ | New session |
| idle → move | ❌ | **Worker crash** (connection lost, process exits) |
| idle → finish | ❌ | **Worker crash** |

The sequence is not strictly enforced, but out-of-order calls crash the worker — always use start → move → finish. (`moveUnderConstraints` with an invalid assembly ID gives a clean "has an invalid id" error.)

## Constraint Compatibility

| Constraint | Free DOF | ROTATION | TRANSLATION_1D | TRANSLATION_2D |
|---|---|---|---|---|
| fastenedOrigin / fastened | 0 | no motion | no motion | no motion |
| revolute | 1 (Z rot) | ✅ Z rotation | no motion | no motion |
| slider | 1 (Z trans) | no motion | ✅ Z translation | no motion |
| cylindrical | 2 (Z rot + Z trans) | ✅ Z rotation | ✅ Z translation | no motion |
| planar | 3 (X/Y trans + Z rot) | ✅ Z rotation | ✅ on free axis | ✅ X/Y translation |
| spherical | 3 (X/Y/Z rot) | ✅ all axes | no motion | no motion |
| unconstrained | 6 | ✅ full | ✅ full | ✅ full |

## Gotchas

- **transformInstance on a constrained instance lasts only until the next solve.** It moves immediately (fastened at x=60, +50 → x=110); the next solve (e.g. `updateFastened`, `part.updateExpression` on an instanced part) puts it back (x=60). Use MUC for constrained motion, transformInstance/transformInstanceTo for unconstrained.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"instanceIds" must be provided` / `"pivotInfo" must be provided` / `"mucType" must be provided` | 1004 | Missing param |
| `"mucType" is not valid` | 1013 | Invalid value (lists valid options) |
| `"id" has an invalid id!` | 1006 | Bad assembly ID |
| `"instanceIds" has an invalid id!` | 1006 | Bad instance ID in array |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Wcs' })).result  // csys at part origin
const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
await api.v1.part.box({ id: tplB, name: 'Arm', length: 80, width: 20, height: 8 })
const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Wcs' })).result

await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm' })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })
await api.v1.assembly.revolute({
  id: asmId, name: 'Hinge',
  mate1: { path: [inst1], csys: wcsA },
  mate2: { path: [inst2], csys: wcsB },
})

// Rotate the arm 90° around the hinge
await api.v1.assembly.startMovingUnderConstraints({
  id: asmId, instanceIds: [inst2], pivotInfo: [0, 0, 0], mucType: 'ROTATION',
})
await api.v1.assembly.moveUnderConstraints({
  id: asmId, rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] },
})
await api.v1.assembly.finishMovingUnderConstraints({ id: asmId })
```

## Related

`assembly.transformInstance` · `assembly.transformInstanceTo` · `assembly.revolute` / `assembly.cylindrical` / `assembly.slider` / `assembly.planar` / `assembly.spherical`
