# part.getGeometryPositions

Inverse of `getGeometryIds`. Given brep element IDs, returns the positions that uniquely identify each element. Use this to serialize brep references for later reconstruction via `getGeometryIds`.

## Prerequisites

- A part with geometry (e.g., `part.box`, `part.cylinder`, etc.)
- Valid brep element IDs (from `getGeometryIds`, `getBrepGeometryByIndex`, or similar)
- Works both pre- and post-`recalc()` — positions are correct either way, but IDs differ (preliminary vs final)

## Key Parameters

- `elems` — array of brep element IDs. Accepts any brep element type: `edge-line`, `edge-arc`, `edge-circle`, `vertex`, `face-plane`, `face-cylindrical`, `face-conical`, `face-spherical`, `edge-nurbs`, `face-nurbs`
- Does NOT take a part ID — pass brep element IDs directly
- Mixed element types allowed in a single call
- Elements from different bodies in the same part can be queried together

## Return Value

```js
{
  result: Array<{ id: id, positions: Array<{ x: number, y: number, z: number }> }>,
  messages?: [...],
  maxLevel?: number
}
```

- `result[i]` corresponds to `elems[i]` — **output order matches input order**
- Positions are `{x, y, z}` objects (not `[x, y, z]` arrays)
- Number of positions depends on element type (see table below)

## Positions by Element Type

| Element type | Positions returned | Count |
|---|---|---|
| Vertex | The vertex coordinate | 1 |
| Line (straight edge) | Edge midpoint | 1 |
| Arc (fillet arc, etc.) | Arc midpoint (at parametric middle) | 1 |
| Circle (circular edge) | Arc midpoint at angle π from seam (= `(-radius, ~0, z)` for Z-axis) | 1 |
| Plane face | Midpoints of all adjacent edges | N (= edge count, e.g., 4 for box face) |
| Cylindrical face | Midpoints of adjacent edges: seam line + 2 circles | 3 |
| Conical face | Midpoints of adjacent edges: seam line + 2 circles | 3 |

For faces, positions are the midpoints of adjacent edges — not points on the face surface.

## Round-Trip: getGeometryPositions → getGeometryIds

Positions from `getGeometryPositions` can be fed directly back to `getGeometryIds` to re-find the same elements:

- **Lines:** use `lines: [{ pos: [x, y, z] }]` with the single midpoint position
- **Points:** use `points: [{ pos: [x, y, z] }]` with the vertex position
- **Planes:** use `planes: [{ positions: [[x,y,z], ...] }]` with the edge midpoint array — even 1 midpoint suffices for flat faces
- **Circles:** use `circles: [{ pos: [x, y, z] }]` with the circle midpoint

This round-trip is verified and produces the same IDs.

## Gotchas

### Invalid IDs fail the entire call

If any element in `elems` is invalid (nonexistent, wrong type), the entire call returns `result: null` with maxLevel 51. Valid elements in the same batch are NOT returned. Validate IDs before calling.

### Only brep element IDs accepted

Passing a part ID, feature ID, or any non-brep ID fails with: "wrong id type! Provide only following id types: ['edge-line','edge-arc','edge-circle','vertex','face-plane','face-cylindrical','face-conical','face-spherical','edge-nurbs','face-nurbs']"

### Positions are {x,y,z} objects, not arrays

Return positions use `{x: number, y: number, z: number}` format. To use with `getGeometryIds` (which expects `[x,y,z]` arrays), convert: `[pos.x, pos.y, pos.z]`.

### Duplicate IDs are not deduplicated

Passing the same ID twice produces two entries in the result array.

### Floating point noise on curved geometry

Circle and arc midpoints may have near-zero values (e.g., `y: 2.45e-15` instead of `0`). This is floating point noise — treat values < 1e-10 as zero.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| "An element of parameter 'elems' has an invalid id!" | Nonexistent brep ID | Verify IDs are valid and from current recalc state |
| "wrong id type!" | Passed part/feature ID instead of brep element | Use `getGeometryIds` or `getBrepGeometryByIndex` to get brep IDs first |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
await api.v1.common.recalc({})

// Get edge IDs
const geoIds = await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [0, 0, 20] }, { pos: [40, 0, 0] }],
})
const edgeIds = geoIds.result.lines  // [102, 98]

// Get positions for those edges
const r = await api.v1.part.getGeometryPositions({ elems: edgeIds })
// r.result = [
//   { id: 102, positions: [{ x: 0, y: 0, z: 20 }] },
//   { id: 98,  positions: [{ x: 40, y: 0, z: 0 }] },
// ]
```

### Round-trip example

```js
// Get position for an edge
const pos = (await api.v1.part.getGeometryPositions({ elems: [edgeId] })).result[0]
const p = pos.positions[0]

// Re-find the same edge using the returned position
const refound = await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [p.x, p.y, p.z] }],
})
// refound.result.lines[0] === edgeId  // true
```

## Related

- `part.getGeometryIds` — inverse operation: given positions, returns brep element IDs
- `part.getBrepGeometryIndex` / `part.getBrepGeometryByIndex` — index-based brep access
- `part.fillet` / `part.chamfer` — primary consumers of brep element IDs
