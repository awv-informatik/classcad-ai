# sketch.rigidSet

Creates a rigid set — a named group of sketch geometry that can be used as input to pattern operations (`linearPattern`, `circularPattern`, `mirrorPattern`).

## Prerequisites

- A sketch (`sketch.create`)
- At least one sketch geometry element (line, arc, circle, point, etc.)

## Key Parameters

- `id` — sketch ID (the sketch containing the geometry)
- `geomIds` — array of sketch geometry IDs to group. Accepts all geometry types: lines, arcs, circles, points. An empty array `[]` is accepted (creates an empty rigid set).

## Return Value

Returns the ID of the created `CC_RigidSet` node. The node is a direct child of the sketch in the structure tree.

**maxLevel** is 31 on success (not 0).

## Structure Tree

The rigid set appears as:
- **class:** `CC_RigidSet`
- **parent:** the sketch node
- **members:**
  - `entities` — array of IDs referencing the member geometry
  - `color` — display color index
  - `lgsState` — solver state (0 = default)

## Gotchas

- **No update method.** There is no `updateRigidSet` — to change membership, delete and recreate.
- **Cross-sketch references silently accepted.** Passing geometry IDs from a different sketch succeeds without error. The rigid set is parented under the target sketch but points to geometry in another sketch. Avoid this — always pass geometry from the same sketch.
- **Empty geomIds is not an error.** `geomIds: []` creates a valid (but empty) rigid set. This is likely not useful.
- **Geometry can belong to multiple rigid sets.** No error or warning when the same geometry ID appears in multiple rigid sets.
- **Deleting the rigid set preserves geometry.** `sketch.deleteObject({ ids: [rigidSetId] })` removes only the grouping node — all member geometry survives.

## Common Errors

- **Invalid geometry ID** (code 1006, level 51): `"An element of parameter \"geomIds\" has an invalid id!"` — returns `null`. Preceded by a warning (level 41): `"ToId()/TOID() didn't get an existing or valid id."`

## Deletion

Use `sketch.deleteObject({ ids: [rigidSetId] })`. This removes only the rigid set grouping — member geometry is preserved. There is no dedicated `deleteRigidSet` API.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create geometry
const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [20, 0, 0] })).result
const l2 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [20, 15, 0] })).result

// Group into rigid set
const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result

// Use in pattern
const pattern = await api.v1.sketch.linearPattern({
  id: skId,
  rigidSetId: rsId,
  xCount: 3,
  xDistance: 40
})
// pattern.result.geometry = [rsId, copy1Id, copy2Id]
```

## Related

- `sketch.linearPattern` — repeats a rigid set in X/Y grid
- `sketch.circularPattern` — repeats a rigid set around a center point
- `sketch.mirrorPattern` — mirrors a rigid set across a line
- `sketch.deleteObject` — delete the rigid set (preserves member geometry)
