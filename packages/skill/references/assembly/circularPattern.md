# assembly.circularPattern / updateCircularPattern / getCircularPattern

Creates a circular pattern of instances — copies of a seed instance rotated around an axis, optionally with axial offset (helix).

## Prerequisites

- An assembly (`assembly.create`)
- A seed instance (`assembly.instance`) with geometry in its template
- A work coordinate system (WCS) in the template for mate1
- The seed must be grounded (e.g., `fastenedOrigin`) before patterning

## Key Parameters

### circularPattern

- `id` — assembly ID (required)
- `instanceId` — seed instance ID to copy (required)
- `name` — pattern name (default: "CircularPattern")
- `mate1` — defines the rotation axis. `{ path: [instanceId], csys: wcsId, flip?, reorient? }`
- `mate1.flip` — which WCS axis to rotate around. Default `"Z"`. Rotation happens in the plane perpendicular to this axis
- `instanceCount` — **total** number of instances including the seed (default: 1). count=4 means seed + 3 copies. Minimum useful: 2
- `angle` — angle **between adjacent copies** in radians (default: 0). Also accepts degree strings like `'90deg'`, `'120deg'`, `'45deg'`
- `offset` — distance along the rotation axis between adjacent copies (default: 0). Non-zero offset produces a helix

### updateCircularPattern

- `id` — **constraint ID** from the create result (`result.constraint`), NOT the assembly ID
- `instanceCount`, `angle`, `offset` — new values. Only pass what changed. Degree strings work here too
- Returns `{ constraint, instances }` with updated instance list

### getCircularPattern

- `id` — assembly ID
- `name` — pattern name to look up
- Returns full pattern state. **Angle is always returned in radians** regardless of input format (e.g., `'120deg'` → `2.0943951023931953`)
- Non-existent name → `null` + maxLevel=51

## Return Value

`circularPattern` and `updateCircularPattern` return:
```js
{ constraint: id, instances: Array<id> }
```
- `constraint` — pattern constraint ID (use for update/delete)
- `instances` — all instance IDs including the seed

## Gotchas

- `instanceCount` includes the seed — count=4 at angle=90° gives 4 instances at 0°, 90°, 180°, 270°
- `angle` is between adjacent copies, not the total angular span. Total span = angle × (instanceCount - 1)
- Degree strings like `'60deg'` are converted to radians internally. `getCircularPattern` always returns radians
- The rotation axis passes through the WCS origin. Instances rotate around that point, not around the seed
- `offset` is per-copy along the rotation axis — offset=25 with instanceCount=6 means the last copy is 125mm from the seed along the axis
- `updateCircularPattern` takes the constraint ID, not the assembly ID
- Use `part.calculateMassProperties({ id: instanceId }).result.cog` to verify instance positions — `assembly.calculateMassProperties` has different return field names

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplId, length: 30, width: 20, height: 15 })
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

// 4 instances at 90° intervals around Z
const cp = (await api.v1.assembly.circularPattern({
  id: asmId, instanceId: inst, name: 'CP1',
  mate1: { path: [inst], csys: wcsId },
  instanceCount: 4,
  angle: Math.PI / 2  // or '90deg'
})).result

// Helix: 6 instances, 60° apart, 25mm axial offset each
const helix = (await api.v1.assembly.circularPattern({
  id: asmId, instanceId: inst, name: 'Helix',
  mate1: { path: [inst], csys: wcsId },
  instanceCount: 6,
  angle: '60deg',
  offset: 25
})).result

// Update: change to 5 at 72° each
await api.v1.assembly.updateCircularPattern({
  id: cp.constraint, instanceCount: 5, angle: '72deg'
})

// Retrieve (angle returned in radians)
const info = (await api.v1.assembly.getCircularPattern({
  id: asmId, name: 'CP1'
})).result
// info.angle = 1.2566... (72° in radians)
```

## Related

- `assembly.linearPattern` — linear spacing pattern
- `assembly.deleteConstraint` — remove a pattern
- `assembly.fastenedOrigin` — ground the seed instance before patterning
- `assembly.instance` — create the seed instance
