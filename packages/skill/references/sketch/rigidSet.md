# sketch.rigidSet

Creates a rigid set — a group of sketch geometry used as input to `linearPattern`, `circularPattern`, `mirrorPattern`.

## Key Parameters

- `id` — sketch containing the geometry
- `geomIds` — geometry IDs to group (lines, arcs, circles, points). `[]` is accepted and creates an empty (useless) set.

## Return Value

ID of the new `CC_RigidSet` node (direct child of the sketch), maxLevel 31. Members: `entities` (member geometry IDs), `color` (display color index), `lgsState` (solver state, 0 = default).

## Gotchas

- **No update method** (`updateRigidSet` doesn't exist) — delete and recreate to change membership.
- **Delete via `sketch.deleteObject({ ids: [rigidSetId] })`** — removes only the grouping; member geometry survives. No `deleteRigidSet`.
- **Cross-sketch IDs silently accepted** — the set is parented under the target sketch but points into another sketch. Always pass geometry from the same sketch.
- **Geometry can be in multiple rigid sets** without error or warning.

## Common Errors

- **1006** (level 51): `"An element of parameter \"geomIds\" has an invalid id!"`, result `null`; preceded by level-41 warning `"ToId()/TOID() didn't get an existing or valid id."`

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [20, 0, 0] })).result
const l2 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [20, 15, 0] })).result

const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result
const pattern = await api.v1.sketch.linearPattern({ id: skId, rigidSetId: rsId, xCount: 3, xDistance: 40 })
// pattern.result.geometry = [rsId, copy1Id, copy2Id]
```

## Related

`sketch.linearPattern` · `sketch.circularPattern` · `sketch.mirrorPattern` · `sketch.deleteObject`
