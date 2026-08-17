# part.fillet

Creates a constant-radius fillet (rounded edge) feature on brep edges of a part. Internally named `CC_ConstantRadiusFillet`.

## Prerequisites

- A part with solid geometry (`part.box`, `part.extrusion`, etc.)
- BRep edge IDs from `part.getGeometryIds`

## Key Parameters

- `id` — **part ID** (not feature ID)
- `references` — array of brep edge IDs. Supports multiple edges in one call — one fillet feature covers all of them. Corner transitions where filleted edges meet are handled automatically with smooth spherical blending.
- `name` — feature name (default=`"Fillet"`)
- `radius` — fillet radius (default=2). Accepts numeric values, `@expr.NAME` strings for expression bindings, and inline math expressions like `'5/2'` or `'10+5'`.

## Return Value

Returns the fillet **feature ID** (numeric). This ID is used for `updateFillet` and `openFeature`/`closeFeature`.

## Gotchas

- **Recalc is optional but recommended.** Unlike chamfer (which requires recalc for some types), fillet works with pre-recalc edge IDs. However, recalc is still recommended for consistency — edge IDs differ between pre-recalc (e.g., 75) and post-recalc (e.g., 135) states.
- **Oversized radius creates degenerate features.** If radius exceeds what the adjacent faces can accommodate, the fillet is created (non-null result) but with `maxLevel=51` and error `"Fillet could not be applied to all edges."`. The feature exists in the tree but geometry is broken. Always check `maxLevel >= 51`.
- **Empty `references` array creates a degenerate feature.** Passing `[]` returns a non-null feature ID with `maxLevel=51` — the feature is created in the tree but has no geometry.
- **Edge IDs change after fillet creation.** BRep topology changes when a fillet is added. If you need edge IDs for subsequent features (another fillet, chamfer, etc.), call `recalc()` + `getGeometryIds` again.
- **Default radius=2 is very small.** On typical parts (50-100mm scale), a fillet at radius=2 is barely visible. Use 5-15 for visible results.
- **Bounding box is unchanged.** Fillet is subtractive — it rounds edges by removing material. It never extends the geometry beyond the original bounding box.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"An element of parameter 'references' has an invalid id!"` (code 1006) | Edge ID doesn't exist | Re-query edge IDs with `getGeometryIds` after any topology change |
| `"Fillet could not be applied to all edges."` (code 0) | Radius too large for geometry | Reduce radius or select different edges |
| `"Could not convert api params."` (code 1000) | Invalid `radius` value (e.g., unresolvable expression) | Check expression exists and syntax is correct |
| `"There is no entity for X (CC_ConstantRadiusFillet)."` (code 1111) | Empty or invalid references | Provide valid edge IDs |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'FilletDemo' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

// Recalc recommended for reliable edge IDs
await api.v1.common.recalc({})

const edgeIds = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [
    { pos: [40, 0, 40] },  // top-front edge (midpoint)
    { pos: [80, 30, 40] }, // top-right edge
  ],
})).result.lines

const filletId = (await api.v1.part.fillet({
  id: partId,
  name: 'TopFillet',
  references: edgeIds,
  radius: 10,
})).result

// For a second fillet, re-query edge IDs after topology change
await api.v1.common.recalc({})
const newEdges = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [40, 0, 0] }],
})).result.lines

const fillet2Id = (await api.v1.part.fillet({
  id: partId,
  name: 'BottomFillet',
  references: newEdges,
  radius: 8,
})).result
```

## updateFillet

Requires `openFeature` → `updateFillet` → `closeFeature` pattern. Takes the **fillet feature ID** (not part ID).

Can update:
- `radius` — change the fillet radius. Accepts numeric values, `@expr.NAME` strings, and inline math. You can add expression bindings post-creation and revert to numeric values later.
- `references` — change which edges are filleted. Requires post-recalc edge IDs from the current geometry (edge IDs change after any topology-modifying operation).
- `name` — rename the feature (geometry unchanged).

### updateFillet Gotchas

- **Must call `openFeature` first.** Without it: result=null, maxLevel=51, error code 1200 "The provided feature is not allowed to update. It's not active and open." (plus cascade error code 1004).
- **Can make valid fillets degenerate.** Updating to an oversized radius produces the same `maxLevel=51` / "Fillet could not be applied to all edges." error as creation. Always check maxLevel after update.
- **Can rescue degenerate fillets.** If a fillet is in a failed state (oversized radius), opening it and updating to a valid radius restores it (maxLevel drops to 31). No need to delete and recreate.
- **Multiple sequential updates work.** Repeated open→update→close cycles on the same feature are fine — no state accumulation or degradation. Radius + name can be changed in the same call.

### updateFillet Working Example

```js
// Update radius
await api.v1.part.openFeature({ id: filletId })
await api.v1.part.updateFillet({ id: filletId, radius: 15 })
await api.v1.part.closeFeature({ id: filletId })

// Move fillet to different edges (must re-query edge IDs first)
await api.v1.common.recalc({})
const newEdges = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [0, 30, 40] }],
})).result.lines

await api.v1.part.openFeature({ id: filletId })
await api.v1.part.updateFillet({ id: filletId, references: newEdges })
await api.v1.part.closeFeature({ id: filletId })

// Add expression binding post-creation
await api.v1.part.openFeature({ id: filletId })
await api.v1.part.updateFillet({ id: filletId, radius: '@expr.filletR' })
await api.v1.part.closeFeature({ id: filletId })
```

## Related

- `part.chamfer` / `part.updateChamfer` — flat angled cut instead of rounded edge
- `part.getGeometryIds` — find brep edge IDs by position
- `part.openFeature` / `part.closeFeature` — required for updateFillet
