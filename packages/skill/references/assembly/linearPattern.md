# assembly.linearPattern / updateLinearPattern / getLinearPattern

Linear pattern of instances: copies of a seed instance spaced along one or two directions.

Prerequisites: assembly, a seed instance with geometry, a workCSys in the template for mate1 (and mate2 for dir2). The seed must be grounded (e.g. `fastenedOrigin`) before patterning.

## Key Parameters

### linearPattern

- `id` — assembly ID (required)
- `instanceId` — seed instance (required)
- `name` — default `"LinearPattern"`
- `mate1` — first direction: `{ path: [instanceId], csys: wcsId, flip?, reorient? }`. The pattern runs along the csys Z-axis after `flip` (default `"Z"`; `"X"`, `"-X"`, `"Y"`, `"-Y"`, `"-Z"` pick another axis). A csys rotated `[π/2,0,0]` (Z → world −Y) with distance 50 puts the copy at [0,−50,0]
- `dir1.count` — **total** instances including the seed (count=3 → seed + 2 copies; count=1 → no-op). Minimum useful: 2
- `dir1.distance` — spacing between adjacent instances in mm (default 100)
- `mate2` — second direction for 2D grids, same structure. **Required for dir2** — without it dir2 is ignored. Pick the axis with `mate2.flip` (e.g. `'X'`)
- `dir2.count` (default 1) / `dir2.distance` (default 100). Grid total = dir1.count × dir2.count, e.g. `mate2: { path: [inst], csys: wcs, flip: 'X' }, dir2: { count: 2, distance: 50 }` with dir1.count 3 → 6 instances

### updateLinearPattern

- `id` — **constraint ID** (`result.constraint`), NOT the assembly ID
- Pass only changed values (`dir1.count`, `dir1.distance`, ...). Existing instances are repositioned, not deleted; new ones are added for a higher count
- Returns `{ constraint, instances }` with the updated list

### getLinearPattern

- `id` — assembly ID; `name` — pattern name
- Returns full state including dir1 and dir2 (dir2 shows defaults if not specified). Non-existent name → `null`, maxLevel 51

## Return Value

`linearPattern` / `updateLinearPattern` → `{ constraint: id, instances: Array<id> }`. `constraint` is used for update/delete; `instances` lists the seed first, then the copies.

## Gotchas

- Verify instance positions via `coordinateSystem` in the structure tree (`part.` and `assembly.calculateMassProperties` return the same format; measuring an instance materializes it).

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplId, length: 40, width: 30, height: 20 })
const wcsId = (await api.v1.part.workCSys({ id: tplId, name: 'WCS' })).result
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Seed' })).result
await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst], csys: wcsId } })

// 3 instances spaced 60mm along Z — COGs at z=10, 70, 130
const lp = (await api.v1.assembly.linearPattern({
  id: asmId, instanceId: inst, name: 'LP1',
  mate1: { path: [inst], csys: wcsId },
  dir1: { count: 3, distance: 60 },
})).result

await api.v1.assembly.updateLinearPattern({ id: lp.constraint, dir1: { count: 4, distance: 40 } })
const info = (await api.v1.assembly.getLinearPattern({ id: asmId, name: 'LP1' })).result
```

## Related

`assembly.circularPattern` · `assembly.deleteConstraint` · `assembly.fastenedOrigin` · `assembly.instance`
