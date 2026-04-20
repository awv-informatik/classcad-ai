# part.chamfer

Creates a chamfer feature on brep edges of a part. Cuts an angled flat face along selected edges.

## Prerequisites

- A part with solid geometry (`part.box`, `part.extrusion`, etc.)
- BRep edge IDs from `part.getGeometryIds`
- **Must call `recalc()` before `getGeometryIds`** — pre-recalc edge IDs are preliminary and only work for EQUAL_DISTANCE. Post-recalc IDs work for all chamfer types.

## Key Parameters

- `id` — **part ID** (not feature ID)
- `references` — array of brep edge IDs. Supports multiple edges in one call — one chamfer feature covers all of them. Corner transitions between adjacent chamfered edges are handled automatically.
- `type` — `"EQUAL_DISTANCE"` (default), `"TWO_DISTANCES"`, `"DISTANCE_ANGLE"`
- `distance1` — chamfer distance (default=2). Used by all types. Accepts `@expr.NAME` strings.
- `distance2` — second distance for TWO_DISTANCES only (default=2). Accepts expressions.
- `angle` — chamfer angle for DISTANCE_ANGLE only (default=C:PI/4). In radians. Accepts expression strings like `'C:PI/6'`.

## Return Value

Returns the chamfer **feature ID** (numeric). This ID is used for `updateChamfer` and `openFeature`/`closeFeature`.

## Chamfer Types

| Type | Behavior |
|---|---|
| `EQUAL_DISTANCE` | Symmetric 45° cut. `distance1` controls cut depth on both adjacent faces equally. |
| `TWO_DISTANCES` | Asymmetric cut. `distance1` and `distance2` control cut depth on each adjacent face independently. |
| `DISTANCE_ANGLE` | Angled cut. `distance1` is the cut depth on one face, `angle` controls the slope (radians). |

## Gotchas

- **Edge IDs require `recalc()` first.** After creating geometry (e.g., `part.box`), call `recalc()` before `getGeometryIds`. Without recalc, the IDs are preliminary — they work for EQUAL_DISTANCE but fail for TWO_DISTANCES and DISTANCE_ANGLE with: `"An element of parameter 'references' has an invalid id!"`.
- **Oversized distance creates degenerate features.** If `distance1` exceeds what the adjacent faces can accommodate, the chamfer is created (non-null result) but with `maxLevel=51` and error `"Chamfer could not be applied to all edges."`. The feature exists in the tree but geometry is broken. Always check `maxLevel >= 51`.
- **Edge IDs change after chamfer creation.** The BRep topology changes when a chamfer is added. If you need to reference edges of the chamfered geometry (e.g., for a second chamfer), call `recalc()` + `getGeometryIds` again.
- **Default distance1=2 is very small.** On typical parts (50-100mm scale), a chamfer at distance1=2 is barely visible. Use 5-15 for visible results.

## updateChamfer

Requires `openFeature` → `updateChamfer` → `closeFeature` pattern. Takes the **chamfer feature ID** (not part ID).

Can update:
- `distance1`, `distance2`, `angle` — change dimensions
- `type` — switch between EQUAL_DISTANCE, TWO_DISTANCES, DISTANCE_ANGLE (provide the new type's specific params)
- `references` — change which edges are chamfered (requires post-recalc edge IDs from current geometry)
- `name` — rename the feature

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ChamferDemo' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

// Must recalc before getGeometryIds for reliable edge IDs
await api.v1.common.recalc({})

const edgeIds = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [
    { pos: [40, 0, 40] },  // top-front edge (midpoint)
    { pos: [80, 30, 40] }, // top-right edge
  ],
})).result.lines

const chamferId = (await api.v1.part.chamfer({
  id: partId,
  name: 'TopChamfer',
  references: edgeIds,
  type: 'EQUAL_DISTANCE',
  distance1: 10,
})).result

// Update: change to asymmetric
await api.v1.part.openFeature({ id: chamferId })
await api.v1.part.updateChamfer({
  id: chamferId,
  type: 'TWO_DISTANCES',
  distance1: 5,
  distance2: 15,
})
await api.v1.part.closeFeature({ id: chamferId })
```

## Related

- `part.fillet` — rounded edge instead of flat chamfer
- `part.updateChamfer` — modify after creation
- `part.getGeometryIds` — find brep edge IDs by position
- `part.openFeature` / `part.closeFeature` — required for updateChamfer
