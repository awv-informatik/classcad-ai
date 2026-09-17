# solid.fillet

Rounds one or more brep edges in an entity injection feature (EIF). Modifies the solid(s) in place — no new entity.

## Key Parameters

- `id` — EIF ID (not the solid ID, not the part ID)
- `radius` — fillet radius. Positive; zero is accepted but a no-op; negative → error.
- `geomIds` — array of brep edge IDs (negative numbers, brep sub-element convention). May include edges from different solids in the same EIF.

## Return Value

`id[]` — the **same IDs** as the modified solids: `[solidId]` for one solid, all affected solid IDs for a cross-solid fillet. `null` with `maxLevel: 51` on failure.

## Getting Edge IDs

1. **`part.getGeometryIds` (position-based — preferred).** Pass a point on the edge (typically its midpoint) and the **part ID**, not the EIF: `getGeometryIds({ id: partId, lines: [{ pos: [40, -30, 0] }] })` → `result.lines[0]` (e.g. `-21`). More reliable across solid types and survives brep rebuilds.
2. **`part.getBrepGeometryByIndex` (index-based).** `{ id: eifId, lineIndex: 0 }` → line edge (box edges, seam lines, e.g. `-20`); `{ id: eifId, arcIndex: 0 }` → arc/circle edge (cylinder/cone rims, e.g. `-8`); add `solidIndex: 1` for the second solid in the EIF. Without `solidIndex` it defaults to solid 0. Works well for primitives; may return nothing for extrusions.

| Solid | Line edges | Arc edges | Notes |
|---|---|---|---|
| Box | 12 | 0 | All edges are lines |
| Cylinder | 1 (seam) | 2 (top + bottom circles) | Use `arcIndex` for rim edges |
| Cone | 1 (seam) | 2 (top + bottom circles) | Same as cylinder |
| Extrusion | varies | varies | `lineIndex` may return 0 — use `getGeometryIds` |

## Gotchas

- **Edge IDs invalidate after each fillet call** (brep topology is rebuilt). Re-query edges before every further fillet — a stale ID fails.
- **Radius limit is geometry-dependent** (faces adjacent to the edge). On a 40×30×20 box, radius 16 on a 40-long edge works (volume drop exact). Test incrementally; check `maxLevel` and volume.
- **Invalid geomIds → full failure**, no partial application (non-edge IDs such as solid/part IDs, nonexistent IDs).
- **Irreversible** in EIF context: no `deleteFillet` / `updateFillet`. To undo, recreate the solid.

## Common Errors

| Scenario | maxLevel | Message |
|---|---|---|
| Negative radius | 51 | "Set the parameter \"id\" = VOID is not allowed" (misleading) |
| Non-edge ID in geomIds | 51 | NullMem type error (internal) |
| Nonexistent ID in geomIds | 51 | "Set the parameter \"id\" = VOID is not allowed" |
| Radius too large | 51 | "Set the parameter \"id\" = VOID is not allowed" |
| Stale edge ID (after brep rebuild) | 51 | NullMem type error |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'FilletDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

// Top edge midpoints (z=20 for a centered 80x60x40 box)
const geo = await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [0, -30, 20] }, { pos: [40, 0, 20] }, { pos: [0, 30, 20] }, { pos: [-40, 0, 20] }],
})
const r = await api.v1.solid.fillet({ id: eifId, radius: 8, geomIds: geo.result.lines })
// r.result = [boxId] — same solid, modified in place

// Sequential fillet: the IDs above are now stale — re-query by position
const bottomEdge = (await api.v1.part.getGeometryIds({
  id: partId, lines: [{ pos: [0, -30, -20] }],
})).result.lines[0]
await api.v1.solid.fillet({ id: eifId, radius: 5, geomIds: [bottomEdge] })
```

## Related

`part.getGeometryIds` · `part.getBrepGeometryByIndex` · `part.getGeometryPositions` · `solid.offset`
