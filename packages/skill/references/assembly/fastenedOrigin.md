# assembly.fastenedOrigin

Locks an instance to the assembly origin (world [0,0,0]). Unlike `fastened` (which constrains two instances relative to each other), fastenedOrigin only takes `mate1` and positions the instance relative to the global origin.

## Prerequisites

- An assembly root (`assembly.create`)
- An instance (`assembly.instance`) with a work coordinate system (`part.workCSys`) in its template

## Key Parameters

- `id` — assembly root ID (required)
- `mate1.path` — `[instanceId]` (required)
- `mate1.csys` — work coordinate system ID from the template (required but has **no spatial effect**)
- `mate1.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Rotates the instance orientation before offsets
- `mate1.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. CW rotation around the main axis in 90° steps
- `xOffset` / `yOffset` / `zOffset` — translation from assembly origin in **world frame** (default 0)
- `xRotation` / `yRotation` / `zRotation` — rotation around assembly origin. Radians (number) or deg string (e.g., `'90deg'`, `'45deg'`)
- `useCurrentTransform` — `1` (TRUE) to back-compute offsets from the current instance position (no movement)
- `name` — constraint name (default `"FastenedOrigin"`)

## Alignment Semantics (CRITICAL)

**The csys has NO spatial effect.** Position, origin, and axis orientation of the csys are all irrelevant — tested with csys at origin, at box center, and with rotated axes; all produce identical positioning. The csys is required by the API but serves only as an identifier.

With zero offsets and no rotation, the instance is placed at the assembly origin [0,0,0]. Offsets translate from there in world frame. Rotations rotate around the origin before offsets are applied.

## Return Value

- Single call: `id` — the constraint ID
- Array call: `Array<id>`

## useCurrentTransform

When `useCurrentTransform: 1`, the constraint freezes the current instance position by back-computing equivalent offsets. No movement occurs. The back-computed offsets exactly match the instance's transformation coordinates.

## getFastenedOrigin

See dedicated doc: `getFastenedOrigin.md`

## updateFastenedOrigin

`updateFastenedOrigin({ id: constraintId, xOffset: 100 })` — true partial update. Only specified params change; unspecified params are preserved. Takes the **constraint ID** (not assembly ID).

### Key Behaviors

- **True partial update.** Setting `xOffset: 100` preserves yOffset, zOffset, rotations, flip, reorient — including mate1 sub-params.
- **Zeroing works.** `xOffset: 0` and `zRotation: 0` reset those params.
- **Rename.** `updateFastenedOrigin({ id, name: 'New' })` renames. Old name immediately unfindable via getFastenedOrigin.
- **useCurrentTransform in update.** Back-computes offsets from current position, same as at creation.
- **Empty update.** `updateFastenedOrigin({ id })` is a valid no-op — COG and state both unchanged.

### Updating mate1 Sub-Params

All mate1 sub-params can be updated independently. Pass `mate1: { flip: '-Z' }` without specifying path or csys — other mate1 fields are preserved.

- **mate1.flip** — instance repositions immediately. All 6 values work in updates.
- **mate1.reorient** — instance repositions immediately. All 4 values work.
- **mate1.csys** — stored ID changes but has no spatial effect (same as creation).
- **mate1.path** — retargets the constraint to a different instance. The new instance is repositioned. **The old instance retains its last constrained position** (does not revert to initial transformation).

### Batch Updates

Pass an array of update objects to update multiple constraints in one call:

```js
await api.v1.assembly.updateFastenedOrigin([
  { id: foA, xOffset: 10, yOffset: 50 },
  { id: foB, xOffset: 70, zRotation: '45deg' },
  { id: foC, mate1: { flip: '-Z' }, xOffset: 130 },
])
// Returns array of constraint IDs: [foA, foB, foC]
```

### Combined Updates

Multiple param types can be updated in a single call (flip + reorient + offsets + rotations). Application order matches creation: orientation (flip/reorient) → translation (offsets) → rotation.

## Gotchas

- **CSys does NOT define a mounting point.** Same as `fastened` — the csys is a dummy identifier.
- **Offsets are world-frame.** A rotated csys does not remap offset directions.
- **Duplicate constraints silently accepted.** Two fastenedOrigin constraints on the same instance both succeed (no error), but the first one wins — the second has no effect on positioning.
- **Deg strings → radians.** Stored internally as radians. getFastenedOrigin returns radians.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"id" must be provided to create CC_FastenedOriginConstraint` | 1004 | Missing assembly id |
| `"mate1" must be provided` | 1004 | Missing mate1 |
| `invalid id in csys` | 1006 | Bad csys ID |
| `Type "X" is not supported as flip type` | 1013 | Invalid flip string |
| `not an assembly id` | 1007 | Instance/template ID passed as `id` |
| `path has wrong id type` | 1001 | Template ID in path instead of instance ID |
| `constraint id does not exist` | 1006 | Bad ID in updateFastenedOrigin |

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

const inst = (await api.v1.assembly.instance({
  productId: tpl, ownerId: asmId, name: 'Base',
  transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result

// Lock to assembly origin with offset
const foId = (await api.v1.assembly.fastenedOrigin({
  id: asmId, name: 'FO_Base',
  mate1: { path: [inst], csys: wcs },
  xOffset: 50, zRotation: '90deg',
})).result

// Freeze current position
await api.v1.assembly.fastenedOrigin({
  id: asmId, name: 'FO_Frozen',
  mate1: { path: [inst], csys: wcs },
  useCurrentTransform: 1,
})

// Update
await api.v1.assembly.updateFastenedOrigin({ id: foId, xOffset: 80, yOffset: 10 })

// Query
const state = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Base' })).result
```

## Related

- `assembly.fastened` — constrains two instances relative to each other (uses mate1 AND mate2)
- `assembly.updateFastenedOrigin` — modify constraint params
- `assembly.getFastenedOrigin` — query constraint by name
- `assembly.instance` — create instances to constrain
- `part.workCSys` — create the csys required by mate params
