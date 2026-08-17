# assembly.linearPattern / updateLinearPattern / getLinearPattern

Creates a linear pattern of instances — copies of a seed instance spaced along one or two directions.

## Prerequisites

- An assembly (`assembly.create`)
- A seed instance (`assembly.instance`) with geometry in its template
- A work coordinate system (WCS) in the template for mate1 (and mate2 if using dir2)
- The seed must be grounded (e.g., `fastenedOrigin`) before patterning

## Key Parameters

### linearPattern

- `id` — assembly ID (required)
- `instanceId` — seed instance ID to copy (required)
- `name` — pattern name (default: "LinearPattern")
- `mate1` — defines the first direction axis. Same mate structure as other assembly constraints: `{ path: [instanceId], csys: wcsId, flip?, reorient? }`
- `mate1.flip` — which WCS axis to pattern along. Default `"Z"`. Options: `"X"`, `"-X"`, `"Y"`, `"-Y"`, `"Z"`, `"-Z"`
- `dir1.count` — **total** number of instances including the seed. count=3 means seed + 2 copies. count=1 = seed only (no-op). Minimum useful: 2
- `dir1.distance` — spacing in mm between adjacent instances along the flip axis (default: 100)
- `mate2` — defines the second direction axis for 2D grids. Same structure as mate1. Only needed when using dir2
- `dir2.count` — total instances in the second direction (default: 1)
- `dir2.distance` — spacing in the second direction (default: 100)

### updateLinearPattern

- `id` — **constraint ID** from the create result (`result.constraint`), NOT the assembly ID
- `dir1.count`, `dir1.distance` — new values. Only pass what changed
- Returns `{ constraint, instances }` with updated instance list. Existing instances are repositioned, not deleted. New instances are added for increased count

### getLinearPattern

- `id` — assembly ID
- `name` — pattern name to look up
- Returns full pattern state including both dir1 and dir2 (dir2 shows defaults if not specified at creation)
- Non-existent name → `null` + maxLevel=51

## Return Value

`linearPattern` and `updateLinearPattern` return:
```js
{ constraint: id, instances: Array<id> }
```
- `constraint` — the pattern constraint ID (use this for update/delete)
- `instances` — all instance IDs including the seed. Order: seed first, then copies

## Gotchas

- `dir1.count` includes the seed — count=3 means 3 total, not 3 copies. This differs from what "number of copies" might suggest
- `mate1.flip` determines the pattern direction, NOT the direction vector. Default "Z" patterns along the WCS Z axis
- `mate2` is required for 2D grids (dir2). Without it, dir2 is ignored. Use `mate2.flip` to pick the second axis (e.g., flip="X" for X-direction)
- Total instances for a 2D grid = dir1.count × dir2.count
- `updateLinearPattern` takes the constraint ID, not the assembly ID
- `assembly.calculateMassProperties` has a different return format than `part.calculateMassProperties` — use `part.calculateMassProperties({ id: instanceId })` with `.result.cog` to measure instance positions

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplId, length: 40, width: 30, height: 20 })
const wcsId = (await api.v1.part.workCSys({
  id: tplId, name: 'WCS',
  origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
})).result
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'Seed'
})).result
await api.v1.assembly.fastenedOrigin({
  id: asmId, instance: inst, name: 'FO',
  mate1: { path: [inst], csys: wcsId }
})

// 1D pattern: 3 instances spaced 60mm along Z
const lp = (await api.v1.assembly.linearPattern({
  id: asmId, instanceId: inst, name: 'LP1',
  mate1: { path: [inst], csys: wcsId },
  dir1: { count: 3, distance: 60 }
})).result
// lp.instances = [seed, copy1, copy2] — COGs at z=10, z=70, z=130

// 2D grid: add mate2 + dir2
const grid = (await api.v1.assembly.linearPattern({
  id: asmId, instanceId: inst, name: 'Grid',
  mate1: { path: [inst], csys: wcsId },
  dir1: { count: 3, distance: 60 },
  mate2: { path: [inst], csys: wcsId, flip: 'X' },
  dir2: { count: 2, distance: 50 }
})).result
// grid.instances.length = 6 (3×2)

// Update: change spacing
await api.v1.assembly.updateLinearPattern({
  id: lp.constraint, dir1: { count: 4, distance: 40 }
})

// Retrieve
const info = (await api.v1.assembly.getLinearPattern({
  id: asmId, name: 'LP1'
})).result
```

## Related

- `assembly.circularPattern` — angular pattern around an axis
- `assembly.deleteConstraint` — remove a pattern
- `assembly.fastenedOrigin` — ground the seed instance before patterning
- `assembly.instance` — create the seed instance
