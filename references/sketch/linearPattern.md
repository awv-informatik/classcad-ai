# sketch.linearPattern

Patterns a rigid set (or single geometry element) in a linear/rectangular grid arrangement within a sketch.

## Prerequisites

- A sketch (`sketch.create`)
- A rigid set (`sketch.rigidSet`) OR a single sketch geometry ID (line, arc, circle, etc.)

## Key Parameters

- `id` — sketch ID
- `rigidSetId` — rigid set ID **or** a single geometry ID (the API auto-wraps singles into a rigid set internally)
- `xCount` / `yCount` — total number of items along each axis **including the original**. `xCount: 3` = original + 2 copies. Default: 1. Must be >1 on at least one axis to produce copies.
- `xDistance` / `yDistance` — spacing between neighboring items along each axis. Default: 0.

## Return Value

```js
{
  constraint: id,           // pattern constraint node ID
  dimensions: [id|null, id|null],  // [xDimensionId, yDimensionId]
  geometry: Array<id>       // all rigid set IDs (original + copies)
}
```

- `geometry.length` = `xCount × yCount`
- `geometry[0]` = the original rigid set (or auto-created rigid set wrapping a single geometry)
- `dimensions[0]` = xDistance dimension ID, or `null` if X axis unused (xCount ≤ 1)
- `dimensions[1]` = yDistance dimension ID, or `null` if Y axis unused (yCount ≤ 1)
- maxLevel is 31 on success

## Gotchas

- **Count includes the original.** `xCount: 3` means 3 total, not 3 copies. To get N copies, set count to N+1.
- **Negative distance is valid.** Copies go in the negative direction. No error.
- **Zero distance is valid.** All copies stack at the same position. No error, but useless.
- **Count=0 and negative counts are silent no-ops.** geometry contains only the original, dimensions are [null, null], but a constraint node is still created. No error.
- **Fractional counts are floored.** `xCount: 2.5` → 2 total (original + 1 copy).
- **Single geometry ID works as rigidSetId.** The API auto-wraps it. The first ID in the returned `geometry` array will be a new rigid set ID, not the original geometry ID.
- **Multiple `part.create` calls in one session invalidate prior IDs.** Build each pattern in a fresh, cleared drawing.

## Updating Pattern Spacing

The dimension IDs in the return value are standard sketch dimensions. Update spacing after creation:

```js
await api.v1.sketch.updateDimension({ id: xDimId, value: 40 })
```

No `openFeature`/`closeFeature` needed — this is a sketch-level dimension update.

## Deleting a Pattern

Use `sketch.deleteObject({ ids: [constraintId] })` to remove the pattern constraint. **Copied geometry survives** — copies become independent sketch geometry. The constraint and dimension nodes are removed.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create geometry
const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [15, 0, 0] })).result
const l2 = (await api.v1.sketch.line({ id: skId, startPos: [15, 0, 0], endPos: [15, 10, 0] })).result

// Group into rigid set
const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result

// 3×2 grid: 3 along X (spacing 30), 2 along Y (spacing 25)
const r = await api.v1.sketch.linearPattern({
  id: skId,
  rigidSetId: rsId,
  xCount: 3,
  xDistance: 30,
  yCount: 2,
  yDistance: 25,
})
// r.result.geometry.length = 6 (3×2)
// r.result.dimensions = [xDimId, yDimId]

// Update X spacing later
await api.v1.sketch.updateDimension({ id: r.result.dimensions[0], value: 50 })
```

## Related

- `sketch.rigidSet` — create the rigid set input
- `sketch.circularPattern` — pattern around a center point
- `sketch.mirrorPattern` — mirror across a line
- `sketch.updateDimension` — change pattern spacing after creation
- `sketch.deleteObject` — delete the pattern constraint (preserves geometry)
