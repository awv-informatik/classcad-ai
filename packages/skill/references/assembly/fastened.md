# assembly.fastened

Creates a rigid constraint between two instances, locking their relative position and orientation. The primary constraint type for fixing parts together in an assembly.

## Prerequisites

- An assembly root (`assembly.create`)
- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
- `xOffset` / `yOffset` / `zOffset` — translation of mate2's csys from mate1's csys, along **mate1's csys axes**
- `xRotation` / `yRotation` / `zRotation` — rotation of inst2 around the axes of mate1's csys. Radians, or `"Ndeg"` string (e.g., `'45deg'`, `'90deg'`)
- `useCurrentTransform` — `1` (TRUE) to lock the current relative position as the constraint, back-computing equivalent offsets
- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Rotates inst2 to redefine the "main axis"
- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. CW rotation around the main axis in 90° steps

## Alignment Semantics (CRITICAL)

**The csys pair is the mounting definition.** inst2 is moved so that mate2's csys coincides with mate1's csys — origin on origin, axes on axes. Offsets and rotations are then applied in mate1's csys frame.

| Template csys (both instances of a 40×30×20 plate, inst1 at origin) | Params | inst2 placement |
|---|---|---|
| mate1 at origin, mate2 at origin | — | `[0,0,0]` |
| mate1 `offset [40,0,20]`, mate2 at origin | — | `[40,0,20]` |
| mate1 `offset [40,0,20]`, mate2 `offset [10,0,0]` | — | `[30,0,20]` (mate2's csys lands on mate1's) |
| mate1 `offset [40,0,20]` + `rotation [0,0,π/2]`, mate2 at origin | — | `[40,0,20]`, rotated 90° about Z |
| same rotated mate1 | `xOffset: 50` | `[40,50,20]` — offset runs along mate1's csys X (world Y) |

To position inst2, put a csys where the parts meet (driven by expressions if it should follow parameters, e.g. `offset: '[0,0,@expr.H]'`) and use offsets for the remaining distance. To keep the current arrangement, use `useCurrentTransform: 1`.

Build each csys with `part.workCSys({ offset, rotation })` (or `type: 'XYAXISORIGIN'` with references). `origin`/`xDirection`/`yDirection` are not `workCSys` parameters and are ignored, which leaves the csys at the part origin.

## Flip and Reorient

`flip` rotates inst2 before offsets are applied:

| flip | Effect | Rotation |
|---|---|---|
| `'Z'` (default) | Identity | None |
| `'-Z'` | Upside down | 180° around X axis |
| `'X'` | X becomes main axis | 90° around Y axis |
| `'-X'` | X down | -90° around Y axis |
| `'Y'` | Y becomes main axis | -90° around X axis |
| `'-Y'` | Y down | 90° around X axis |

`reorient` adds a clockwise rotation around the main axis (after flip):

| reorient | Rotation |
|---|---|
| `'0'` (default) | None |
| `'90'` | -90° CW around main axis |
| `'180'` | 180° around main axis |
| `'270'` | -270° CW (= 90° CCW) around main axis |

## Return Value

- Single call: `id` — the constraint ID
- Array call: `Array<id>`

## useCurrentTransform

When `useCurrentTransform: 1` (TRUE), the constraint locks the current relative transform of inst2 vs inst1. The API back-computes equivalent offsets. No movement occurs. Useful when instances are already positioned correctly and you want to "freeze" the arrangement.

## getFastened

See dedicated doc: `references/assembly/getFastened.md`. Query by name, returns full constraint state. Only accepts assembly root ID (not instance IDs).

## updateFastened

`updateFastened({ id: constraintId, xOffset: 100 })` — partial update. Only specified params change; unspecified params are preserved.

### Key Behaviors

- **True partial update.** Set `xOffset: 100` and `yOffset`, `zOffset`, rotations, flip, reorient all stay unchanged.
- **Zeroing works.** `zRotation: 0` removes rotation. `xOffset: 0` removes offset. The instance moves back.
- **Name update.** `updateFastened({ id: fId, name: 'New' })` renames the constraint. Old name immediately becomes unfindable via `getFastened`.
- **Mate path swap.** Passing `mate2: { path: [newInst], csys: wcs }` reassigns the constraint to a different instance. The previously constrained instance stays at its current position (no snap-back). The new instance is immediately repositioned.
- **Csys swap.** Changing `mate1.csys` or `mate2.csys` re-mounts inst2 on the new csys immediately (e.g. origin csys → csys at `[40,0,20]` moves inst2 from `[0,0,0]` to `[40,0,20]`).
- **Flip/reorient via update.** Must include `path` and `csys` in the mate object alongside flip/reorient. Produces same spatial effects as at creation time.
- **useCurrentTransform in update.** Back-computes offsets from the current relative position. No movement occurs. If the instance is already at the constraint position, offsets stay the same.
- **Empty update.** `updateFastened({ id: fId })` (no params besides id) is a valid no-op — returns the constraint ID with maxLevel=31.
- **Array form.** `updateFastened([{ id: fId1, xOffset: 80 }, { id: fId2, zRotation: '90deg' }])` updates multiple constraints at once, returns `[id1, id2]`.

### updateFastened Errors

| Error | Code | Cause |
|---|---|---|
| `"constraint id does not exist"` | 1006 | Invalid/nonexistent ID |
| `"not a constraint or relation"` | 1007 | Assembly root or instance ID passed as constraint |
| `"invalid id" in csys` | 1006 | Bad csys ID |
| `"not supported as flip type"` | 1013 | Invalid flip string |

Failed updates do NOT corrupt the constraint. All params remain unchanged after an error.

## Gotchas

- **The csys defines the mount point and orientation.** mate2's csys is placed on mate1's csys; offsets and rotations are measured in mate1's csys frame.
- **Use an explicit `part.workCSys`.** The built-in `Origin` from `getWorkGeometry` is a work point and is rejected as `csys` (`wrong id type ... ["workcsys"]`).
- **Geometry changes do not re-solve on `common.recalc()`.** When a csys moves because its part changed (e.g. `offset: '[0,0,@expr.H]'` after an expression update), `recalc()` regenerates the part but leaves inst2 where it was. The assembly solve runs at the end of `part.updateExpression` on a part that is instanced in the assembly, and on `updateFastened`. See `recipes/assembly-parameters`.
- **Duplicate names allowed.** Creating two constraints with the same name succeeds silently. `getFastened` returns the first match.
- **Self-fastened rejected cleanly.** Same instance in both mates returns error 1014, does NOT hang.
- **"deg" strings convert to radians.** Stored internally as radians.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"id" must be provided` | 1004 | Missing assembly id |
| `"mate1" must be provided` | 1004 | Missing mate1 |
| `"mate2" must be provided` | 1004 | Missing mate2 |
| `paths belong to same rigid set` | 1014 | Same instance in both mates |
| `invalid id` | 1006 | Bad csys ID |
| `not supported as flip type` | 1013 | Invalid flip string |
| `couldn't find constraint with name X` | 0 | getFastened with non-existent name |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
const wcs = (await api.v1.part.workCSys({ id: tpl, name: 'Mate' })).result  // csys at part origin
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({
  productId: tpl, ownerId: asmId, name: 'A',
})).result
const inst2 = (await api.v1.assembly.instance({
  productId: tpl, ownerId: asmId, name: 'B',
  transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result

// Basic: place inst2 at 50mm along X from inst1
const fId = (await api.v1.assembly.fastened({
  id: asmId, name: 'Joint',
  mate1: { path: [inst1], csys: wcs },
  mate2: { path: [inst2], csys: wcs },
  xOffset: 50,
})).result

// With rotation: 90° around Z + offset
await api.v1.assembly.fastened({
  id: asmId, name: 'Rotated',
  mate1: { path: [inst1], csys: wcs },
  mate2: { path: [inst2], csys: wcs },
  xOffset: 100, zRotation: '90deg',
})

// Freeze current position
await api.v1.assembly.fastened({
  id: asmId, name: 'Frozen',
  mate1: { path: [inst1], csys: wcs },
  mate2: { path: [inst2], csys: wcs },
  useCurrentTransform: 1,
})

// Update
await api.v1.assembly.updateFastened({ id: fId, xOffset: 80, zOffset: 10 })

// Query
const state = (await api.v1.assembly.getFastened({ id: asmId, name: 'Joint' })).result
```

## Related

`assembly.fastenedOrigin` · `assembly.updateFastened` · `assembly.getFastened` · `assembly.instance` · `part.workCSys`
