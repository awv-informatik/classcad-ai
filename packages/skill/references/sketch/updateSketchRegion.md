# sketch.updateSketchRegion

Replaces the geometry of one or more existing sketch regions. This is a **replace** operation, not a merge — the region's geometry list is fully overwritten with the new `geomIds`.

## Prerequisites

- An existing sketch region (`sketch.sketchRegion`)

## Key Parameters

- `regions` — array of `{ id, geomIds }` objects (required). Each entry updates one region.
  - `id` — region ID (type: `sketchregion`). Must be an existing `CC_SketchRegion` ID.
  - `geomIds` — array of sketch curve IDs (type: `sketch-curve`). Lines, arcs, circles all accepted. **Points are NOT accepted** (unlike `sketchRegion` creation which accepts both curves and points).

## Return Value

`VOID` (null). maxLevel=31 on success. Empty messages array.

## Behavior

- **Replace, not merge.** The region's geometry is fully replaced. Passing a subset of the original IDs removes the rest.
- **Batch support.** Multiple regions can be updated in one call via the `regions` array.
- **Atomic batches.** If any entry in the `regions` array has an error (wrong ID type, invalid ID), the **entire batch fails** — no regions are updated, even the valid ones.
- **Name preserved.** Updating geometry does not affect the region's name. `getSketchRegion` by name still works after update.
- **Same geometry is fine.** Re-assigning the same geomIds is a no-op (no error).
- **Duplicates preserved.** Passing `[id1, id1, id2]` stores duplicates as-is — no deduplication.
- **Cross-sketch geometry accepted.** Geometry from a different sketch is silently accepted. No validation that curves belong to the region's parent sketch. May cause issues downstream.
- **Empty regions array.** `regions: []` is a silent no-op (null, maxLevel=31).

## Gotchas

- **Cannot clear a region.** Passing `geomIds: []` throws an internal error (`Index 0 ausserhalb des Arraybereichs`), not a clean API error. The region is not modified.
- **Points rejected.** `sketch-point` type IDs cause error 1001. Only `sketch-curve` IDs are accepted — this is stricter than `sketchRegion` creation.
- **Batch atomicity.** A single bad entry kills the whole batch. Validate all IDs before calling.

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| `"id" has a wrong id type! Provide only following id types: ["sketchregion"]` | 1001 | Passed a non-region ID (sketch, part, curve) as `regions[].id` |
| `"id" has an invalid id!` | 1006 | Passed a nonexistent region ID |
| `"geomIds" has a wrong id type! Provide only following id types: ["sketch-curve"]` | 1001 | Passed a non-curve ID (point, part, sketch) in `geomIds` |
| `"geomIds" has an invalid id!` | 1006 | Passed a nonexistent curve ID |
| `Evaluation error ... Index 0 ausserhalb des Arraybereichs` | 0 | Passed empty `geomIds: []` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create initial geometry and region
const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect, name: 'Profile' })).result

// Create new geometry
const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [30, 40, 0] })).result
const l3 = (await api.v1.sketch.line({ id: skId, startPos: [30, 40, 0], endPos: [0, 0, 0] })).result

// Replace region geometry
await api.v1.sketch.updateSketchRegion({
  regions: [{ id: regionId, geomIds: [l1, l2, l3] }],
})

// Verify
const geom = await api.v1.sketch.getGeometry({ id: regionId })
// geom.result = { arcs: [], circles: [], lines: [l1, l2, l3], points: [] }
```

### Batch update

```js
await api.v1.sketch.updateSketchRegion({
  regions: [
    { id: region1, geomIds: [line1, line2, line3] },
    { id: region2, geomIds: [circleId] },
  ],
})
```

## Related

- `sketch.sketchRegion` — create a region (accepts curves AND points)
- `sketch.getSketchRegion` — find region by name
- `sketch.getGeometry` — verify region contents after update
- `part.getSketchRegion` — find region by name across all sketches in a part
