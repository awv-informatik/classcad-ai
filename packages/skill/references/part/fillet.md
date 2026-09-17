# part.fillet

Creates a constant-radius fillet (rounded edge) feature on brep edges of a part. Internally `CC_ConstantRadiusFillet`.

## Key Parameters

- `id` — **part ID** (not feature ID)
- `references` — array of brep edge IDs (from `part.getGeometryIds`). One feature covers all edges; corners where filleted edges meet get smooth spherical blending automatically.
- `name` — default=`"Fillet"`
- `radius` — default=2. Accepts numbers, `@expr.NAME`, and inline math like `'5/2'` or `'10+5'`.

## Return Value

Fillet **feature ID** (numeric) — used for `updateFillet` and `openFeature`/`closeFeature`.

## Gotchas

- **Recalc optional.** Fillet works with pre-recalc edge IDs; edge IDs differ between pre-recalc (e.g. 75) and post-recalc (e.g. 135) states.
- **Oversized radius → degenerate feature.** Non-null result but `maxLevel=51`, `"Fillet could not be applied to all edges."`; feature stays in the tree with broken geometry. Always check `maxLevel >= 51`.
- **Empty `references: []`** returns a non-null feature ID with `maxLevel=51` — feature in tree, no geometry.
- **Edge IDs change after the fillet** — `recalc()` + `getGeometryIds` again for subsequent features.
- **Default radius=2 is barely visible** on 50–100mm parts; use 5–15.
- **Bounding box unchanged** — fillet only removes material.

## Common Errors

| Error | Code | Cause / Fix |
|---|---|---|
| `"An element of parameter 'references' has an invalid id!"` | 1006 | Edge ID doesn't exist — re-query after topology changes |
| `"Fillet could not be applied to all edges."` | 0 | Radius too large — reduce or pick other edges |
| `"Could not convert api params."` | 1000 | Invalid `radius` (e.g. unresolvable expression) |
| `"There is no entity for X (CC_ConstantRadiusFillet)."` | 1111 | Empty or invalid references |

## updateFillet

`openFeature` → `updateFillet` → `closeFeature`, with the **fillet feature ID**. Updatable:
- `radius` — number, `@expr.NAME`, or inline math; bindings can be added post-creation and reverted to numbers
- `references` — post-recalc edge IDs from current geometry
- `name` — geometry unchanged; radius + name can change in the same call

Gotchas:
- **Without `openFeature`:** result=null, maxLevel=51, code 1200 "The provided feature is not allowed to update. It's not active and open." (plus cascade code 1004).
- **Oversized update** gives the same `maxLevel=51` / "Fillet could not be applied to all edges." — check maxLevel.
- **Rescue:** open a failed fillet and update to a valid radius → maxLevel back to 31; no delete/recreate needed.
- Repeated open→update→close cycles are fine.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'FilletDemo' })).result
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
await api.v1.common.recalc({})

const edgeIds = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [40, 0, 40] }, { pos: [80, 30, 40] }], // top-front, top-right edge midpoints
})).result.lines

const filletId = (await api.v1.part.fillet({ id: partId, name: 'TopFillet', references: edgeIds, radius: 10 })).result

// Update: bind radius to an expression
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'filletR', value: 15 }] })
await api.v1.part.openFeature({ id: filletId })
await api.v1.part.updateFillet({ id: filletId, radius: '@expr.filletR' })
await api.v1.part.closeFeature({ id: filletId })

// Second fillet: re-query edge IDs after topology change
await api.v1.common.recalc({})
const newEdges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 0] }] })).result.lines
await api.v1.part.fillet({ id: partId, name: 'BottomFillet', references: newEdges, radius: 8 })
```

## Related

`part.chamfer` / `part.updateChamfer` · `part.getGeometryIds` · `part.openFeature` / `part.closeFeature`
