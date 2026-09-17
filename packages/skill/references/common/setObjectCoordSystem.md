# common.setObjectCoordSystem

Sets an object's coordinate system (origin + axis directions), physically repositioning/reorienting it in 3D.

## Key Parameters

- `id` — object to transform. Works on parts, entity injections, solid bodies, sketches, work planes/axes/points, part features (`part.box` etc.), curve shapes — no known type rejects it (beyond invalid IDs).
- `origin` — `[x, y, z]`, new origin in global coordinates.
- `xVec` — `[x, y, z]`, new X direction. Auto-normalized (magnitude irrelevant).
- `yVec` — `[x, y, z]`, new Y direction. Auto-normalized; if not perpendicular to `xVec`, orthogonalized (Gram-Schmidt). Z = `xVec × yVec_orthogonalized`.

## Return Value

`VOID` (null). Success: `maxLevel <= 31`.

## Critical Behavior

- **Absolute, not cumulative.** Repeating the same call has no additional effect — unlike `solid.translation` or `transformObjectWithMatrix`.
- **Physically moves geometry** (confirmed via STEP export diffs).
- **Container scope:** on a part or entity injection, all children move together; on a single solid, only that body moves.

## Gotchas

- **Zero-length vectors → error** (level 51): `"Vectors for SetCoordSystem may not have length 0"`.
- **Parallel vectors → error** (level 51, same or opposite direction): `"Vectors for SetCoordSystem may not be parallel"`.
- **Non-orthogonal vectors silently accepted.** Rotation is defined primarily by `xVec`; `yVec` only resolves the remaining degree of freedom. `xVec [1,0,0]` + `yVec [1,1,0]` orthogonalizes to `[0,1,0]` (identity) — nothing moves. Pass orthogonal vectors.
- **Auto-scaling hides origin-only shifts.** Translating a container whose geometry is all inside it gives identical snapshots (renderer auto-zoom). The change is real — verify with a reference body outside the container or STEP data.
- **STEP export doesn't capture sketch coord systems.** Sketch plane changes are real (visible in the sketch renderer) but STEP only holds B-rep geometry.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| "may not have length 0" | Zero-length xVec or yVec | Non-zero vectors |
| "may not be parallel" | xVec ∥ yVec | Vectors must span a plane |
| code 1006 "invalid id" | Nonexistent/invalid ID | Check the ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

// Move the box to [100, 100, 0], default orientation
await api.v1.common.setObjectCoordSystem({ id: boxId, origin: [100, 100, 0], xVec: [1, 0, 0], yVec: [0, 1, 0] })

// Rotate the entire EIF 90° about Z
await api.v1.common.setObjectCoordSystem({ id: eifId, origin: [0, 0, 0], xVec: [0, 1, 0], yVec: [-1, 0, 0] })
```

## Related

`common.transformObjectWithMatrix` · `solid.translation` / `solid.rotation` · `part.workPlane` / `part.updateWorkPlane`
