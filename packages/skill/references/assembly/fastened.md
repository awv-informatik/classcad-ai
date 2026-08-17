# assembly.fastened

Creates a rigid constraint between two instances, locking their relative position and orientation. The primary constraint type for fixing parts together in an assembly.

## Prerequisites

- An assembly root (`assembly.create`)
- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
- `xOffset` / `yOffset` / `zOffset` — translation from inst1's origin in **world frame** (NOT in csys frame)
- `xRotation` / `yRotation` / `zRotation` — rotation of inst2 around inst1's origin. Radians, or `"Ndeg"` string (e.g., `'45deg'`, `'90deg'`)
- `useCurrentTransform` — `1` (TRUE) to lock the current relative position as the constraint, back-computing equivalent offsets
- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Rotates inst2 to redefine the "main axis"
- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. CW rotation around the main axis in 90° steps

## Alignment Semantics (CRITICAL)

**The csys position and axes do NOT determine the base alignment.** With zero offsets and no rotation, inst2 is placed at inst1's origin regardless of where the csys origins are in their templates. The csys is required by the API but only serves as an identifier — it does not define a mounting point.

To position inst2 at a specific location relative to inst1, use `xOffset`/`yOffset`/`zOffset`. To preserve the current arrangement, use `useCurrentTransform: 1`.

**Offsets are in the world/assembly frame**, not in the csys local frame. A rotated csys does not remap offset directions.

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
- **Csys swap.** Changing `mate1.csys` or `mate2.csys` stores the new ID but has NO spatial effect (same as creation — csys is irrelevant to positioning).
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

- **CSys does NOT define the alignment point.** This is the most important thing to understand. Unlike typical CAD mate constraints, the csys origin has no effect on where inst2 is placed. Offsets are the only translation mechanism.
- **Offsets are world-frame.** Rotating the csys axes does not remap offset directions.
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
const wcs = (await api.v1.part.workCSys({
  id: tpl, name: 'Mate', origin: [0, 0, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result
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

- `assembly.fastenedOrigin` — locks an instance to the assembly origin (only mate1)
- `assembly.updateFastened` — modify constraint params
- `assembly.getFastened` — query constraint by name
- `assembly.instance` — create instances to constrain
- `part.workCSys` — create the csys required by mate params
