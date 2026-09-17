# assembly.circularPattern / updateCircularPattern / getCircularPattern

Circular pattern of instances: copies of a seed instance rotated around an axis, optionally with axial offset (helix).

Prerequisites: assembly, a seed instance with geometry, a workCSys in the template for mate1. The seed must be grounded (e.g. `fastenedOrigin`) before patterning.

## Key Parameters

### circularPattern

- `id` — assembly ID (required)
- `instanceId` — seed instance (required)
- `name` — default `"CircularPattern"`
- `mate1` — rotation axis: `{ path: [instanceId], csys: wcsId, flip?, reorient? }`. `flip` (default `"Z"`) picks the csys axis; rotation is in the plane perpendicular to it. The axis passes through the csys origin — instances rotate around that point, not around the seed
- `instanceCount` — **total** instances including the seed (default 1). count=4 at 90° → 0°, 90°, 180°, 270°. Minimum useful: 2
- `angle` — angle **between adjacent copies** (default 0), radians or degree string (`'90deg'`). Total span = angle × (instanceCount − 1)
- `offset` — axial distance between adjacent copies (default 0); non-zero makes a helix. offset=25, instanceCount=6 → last copy 125mm from the seed along the axis

### updateCircularPattern

- `id` — **constraint ID** (`result.constraint`), NOT the assembly ID
- Pass only changed `instanceCount` / `angle` / `offset`; degree strings work
- Returns `{ constraint, instances }`

### getCircularPattern

- `id` — assembly ID; `name` — pattern name
- Returns full state. **Angle is always radians** (`'120deg'` → `2.0943951023931953`). Non-existent name → `null`, maxLevel 51

## Return Value

`circularPattern` / `updateCircularPattern` → `{ constraint: id, instances: Array<id> }`. `constraint` is used for update/delete; `instances` includes the seed.

## Gotchas

- Verify instance positions via `coordinateSystem` in the structure tree (`part.` and `assembly.calculateMassProperties` return the same format; measuring an instance materializes it).

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplId, length: 30, width: 20, height: 15 })
const wcsId = (await api.v1.part.workCSys({ id: tplId, name: 'WCS' })).result
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Seed' })).result
await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst], csys: wcsId } })

// 4 instances at 90° around Z (add offset: 25 for a helix)
const cp = (await api.v1.assembly.circularPattern({
  id: asmId, instanceId: inst, name: 'CP1',
  mate1: { path: [inst], csys: wcsId },
  instanceCount: 4, angle: '90deg',
})).result

await api.v1.assembly.updateCircularPattern({ id: cp.constraint, instanceCount: 5, angle: '72deg' })
const info = (await api.v1.assembly.getCircularPattern({ id: asmId, name: 'CP1' })).result
// info.angle = 1.2566... (radians)
```

## Related

`assembly.linearPattern` · `assembly.deleteConstraint` · `assembly.fastenedOrigin` · `assembly.instance`
