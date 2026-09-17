# sketch.updateSketchRegion

Replaces the geometry of one or more existing sketch regions. **Replace, not merge** — passing a subset of the original IDs removes the rest.

## Key Parameters

- `regions` (required) — array of `{ id, geomIds }`, one per region:
  - `id` — existing `CC_SketchRegion` ID (type `sketchregion`)
  - `geomIds` — `sketch-curve` IDs (lines, arcs, circles). **Points are rejected (1001)** — stricter than `sketchRegion` creation.

## Return Value

VOID, maxLevel 31, empty messages.

## Behavior

- **Atomic batches.** One bad entry (wrong type, invalid ID) fails the whole call — no region updated. Validate first.
- Region name is preserved (`getSketchRegion` still works).
- Same geomIds again: no-op. Duplicates (`[id1, id1, id2]`) stored as-is. `regions: []`: silent no-op (null, maxLevel 31).
- **Cross-sketch geometry silently accepted** — no check that curves belong to the region's sketch; may break downstream.
- **Cannot clear a region:** `geomIds: []` throws an internal error (`Index 0 ausserhalb des Arraybereichs`); region unchanged.

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| `"id" has a wrong id type! Provide only following id types: ["sketchregion"]` | 1001 | Non-region ID (sketch, part, curve) in `regions[].id` |
| `"id" has an invalid id!` | 1006 | Nonexistent region ID |
| `"geomIds" has a wrong id type! Provide only following id types: ["sketch-curve"]` | 1001 | Non-curve ID (point, part, sketch) |
| `"geomIds" has an invalid id!` | 1006 | Nonexistent curve ID |
| `Evaluation error ... Index 0 ausserhalb des Arraybereichs` | 0 | Empty `geomIds: []` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect, name: 'Profile' })).result
const tri = (await api.v1.sketch.line([
  { id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] },
  { id: skId, startPos: [60, 0, 0], endPos: [30, 40, 0] },
  { id: skId, startPos: [30, 40, 0], endPos: [0, 0, 0] },
])).result

// Batch form: regions: [{ id: r1, geomIds: [...] }, { id: r2, geomIds: [circleId] }]
await api.v1.sketch.updateSketchRegion({ regions: [{ id: regionId, geomIds: tri }] })
const geom = await api.v1.sketch.getGeometry({ id: regionId }) // { arcs: [], circles: [], lines: tri, points: [] }
```

## Related

`sketch.sketchRegion` · `sketch.getSketchRegion` · `sketch.getGeometry` · `part.getSketchRegion`
