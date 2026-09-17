# part.getGeometryPositions

Inverse of `getGeometryIds`: given brep element IDs, returns positions that uniquely identify each element — for serializing brep references and re-finding them via `getGeometryIds`. Works pre- and post-`recalc()` (positions correct either way; IDs differ, preliminary vs final).

## Key Parameters

- `elems` — array of brep element IDs (no part ID). Types: `edge-line`, `edge-arc`, `edge-circle`, `vertex`, `face-plane`, `face-cylindrical`, `face-conical`, `face-spherical`, `edge-nurbs`, `face-nurbs`. Mixed types and elements from different bodies in the same part allowed in one call.

## Return Value

```js
{ result: Array<{ id, positions: Array<{ x, y, z }> }>, messages?, maxLevel? }
```

- `result[i]` corresponds to `elems[i]`; duplicate IDs are not deduplicated
- Positions are `{x, y, z}` **objects** — convert for `getGeometryIds`: `[pos.x, pos.y, pos.z]`
- Curved geometry shows float noise (e.g. `y: 2.45e-15`) — treat < 1e-10 as zero

| Element type | Positions returned | Count |
|---|---|---|
| Vertex | Vertex coordinate | 1 |
| Line | Edge midpoint | 1 |
| Arc (fillet arc, etc.) | Midpoint at parametric middle | 1 |
| Circle | Midpoint at angle π from seam (= `(-radius, ~0, z)` for Z-axis) | 1 |
| Plane face | Midpoints of all adjacent edges | N (e.g. 4 for a box face) |
| Cylindrical / conical face | Adjacent edge midpoints: seam line + 2 circles | 3 |

For faces these are edge midpoints, not points on the face surface.

## Round-Trip → getGeometryIds

Verified to return the same IDs:
- **Lines:** `lines: [{ pos: [x,y,z] }]` with the midpoint
- **Points:** `points: [{ pos }]` with the vertex
- **Planes:** `planes: [{ positions: [[x,y,z], ...] }]` — even 1 midpoint suffices
- **Circles:** `circles: [{ pos }]` with the circle midpoint

## Gotchas

- **One invalid ID fails the whole call** — `result: null`, maxLevel 51; valid elements in the batch are NOT returned. Validate IDs first.
- **Only brep element IDs** — part/feature IDs fail with "wrong id type! Provide only following id types: ['edge-line','edge-arc','edge-circle','vertex','face-plane','face-cylindrical','face-conical','face-spherical','edge-nurbs','face-nurbs']"

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| "An element of parameter 'elems' has an invalid id!" | Nonexistent brep ID | Use IDs from the current recalc state |
| "wrong id type!" | Part/feature ID | Get brep IDs via `getGeometryIds` / `getBrepGeometryByIndex` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
await api.v1.common.recalc({})

const edgeIds = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [0, 0, 20] }, { pos: [40, 0, 0] }],
})).result.lines // e.g. [102, 98]

const r = await api.v1.part.getGeometryPositions({ elems: edgeIds })
// [{ id: 102, positions: [{ x: 0, y: 0, z: 20 }] }, { id: 98, positions: [{ x: 40, y: 0, z: 0 }] }]

// Round-trip: re-find the first edge from its position
const p = r.result[0].positions[0]
const refound = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [p.x, p.y, p.z] }] })).result.lines[0]
// refound === edgeIds[0]
```

## Related

`part.getGeometryIds` · `part.getBrepGeometryIndex` / `part.getBrepGeometryByIndex` · `part.fillet` / `part.chamfer`
