# part.getGeometryIds

Finds brep geometry elements (edges, faces, vertices) by providing positions on or near them. This is the primary way to get brep element IDs for use with `fillet`, `chamfer`, `workPlane`, `workAxis`, `compositeCurve`, and other APIs that take brep references.

## Prerequisites

- A part with geometry (e.g., `part.box`, `part.cylinder`, etc.)
- **Must call `recalc()` before querying.** Pre-recalc IDs are "preliminary" — they differ from post-recalc IDs and may fail with some APIs (e.g., TWO_DISTANCES chamfer). Always recalc first.

## Key Parameters

- `id` — the **part** ID (not the feature ID)
- `lines` — `[{ pos: [x,y,z] }]` — find straight edges by a point on the edge (use midpoint)
- `arcs` — `[{ pos: [x,y,z] }]` — find non-circular arc edges (e.g., fillet arcs)
- `circles` — `[{ pos: [x,y,z] }]` — find circular edges (works for cylinders, cones, and any near-360° arc)
- `points` — `[{ pos: [x,y,z] }]` — find vertices by exact position
- `planes` — `[{ positions: [[x,y,z], ...] }]` — find flat faces
- `cylinders` — `[{ positions: [[x,y,z], [x,y,z], ...] }]` — find cylindrical faces (2+ points required)
- `cones` — `[{ positions: [[x,y,z], [x,y,z], ...] }]` — find conical faces (2+ points required)
- `spheres` — `[{ positions: [[x,y,z], [x,y,z], ...] }]` — find spherical faces (2+ points required)
- `nurbsCurves` — `[{ pos: [x,y,z] }]` — find NURBS curve edges (freeform geometry only)
- `nurbsSurfaces` — `[{ positions: [[x,y,z], ...] }]` — find NURBS faces (freeform geometry only)

All params are optional — query only the types you need.

## Return Value

```js
{
  result: { lines: id[], planes: id[], circles: id[], ... },
  messages?: [...],
  maxLevel?: number
}
```

- Result only includes the categories you queried (not all 10)
- Results are **ordered** — output[i] corresponds to input[i]
- Failed lookups return `[]` at that index, not null
- maxLevel=51 (ERROR) if any lookup fails, but other lookups still succeed

## Gotchas

### Position types differ between edges and faces

- **Edges** (lines, arcs, circles, nurbsCurves): use `pos` (singular) — a single `[x,y,z]` point
- **Faces** (planes, cylinders, cones, spheres, nurbsSurfaces): use `positions` (plural) — an array of `[x,y,z]` points

### Curved faces need 2+ positions

Flat faces (`planes`) work with a single position. But curved faces (`cylinders`, `cones`, `spheres`, `nurbsSurfaces`) **need at least 2 positions** to disambiguate. With 1 position, the lookup fails (maxLevel 51). Use points on the surface, or edge midpoints of adjacent edges.

### Circles vs arcs

- **`circles`** — for circular/near-full-circle edges. Works on cylinders, cones, spheres — any edge that forms a circle or near-circle. Despite the brep internally storing these as arcs (due to seam lines), the `circles` param finds them.
- **`arcs`** — for non-circular arcs only (e.g., fillet arcs, partial arcs). Does NOT find circular edges on cylinders/cones.

### Seam vertex avoidance

Cylinders, cones, and spheres have a **seam line** in the +X direction. The seam vertex (at [+radius, 0, Z]) causes `circles` lookups to fail. Use any other position: the center of the circle, a rim point at 90° or 180°, or the midpoint opposite the seam (at [-radius, 0, Z]).

### Position tolerance

Two lookup regimes:
1. **Point ON a brep surface** — the API finds the nearest element of the requested type on that face. Works even if the point is far from the nearest edge (e.g., center of a face finds the nearest edge when querying `lines`).
2. **Point NOT on any surface** (floating in space) — tolerance is very tight, roughly <0.05 units. A point 0.001 off works; 0.1 off fails.

For reliable results, use positions that are exactly on the geometry: edge midpoints, face centers, or vertex coordinates.

### IDs change after topology operations

Fillet, chamfer, boolean, and other topology-modifying features change all brep IDs. After any such operation, call `recalc()` then re-query with `getGeometryIds`. Never cache brep IDs across topology changes.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"At the given position: [{x,y,z}] no geometry could be found for the type: ..."` | Position too far from geometry, wrong type, or at seam vertex | Verify position is on the geometry; avoid seam vertex; check geometry type |
| Failed lookups return `[]` at index | Per-position failure in a batch query | Check the specific position; other results in the batch are still valid |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
await api.v1.common.recalc({})

// Find edges for filleting (use midpoint positions)
const r = await api.v1.part.getGeometryIds({
  id: partId,
  lines: [
    { pos: [0, 0, 20] },   // front-left vertical edge
    { pos: [80, 0, 20] },  // front-right vertical edge
  ],
})
// r.result.lines = [102, 103]

// Use directly with fillet
await api.v1.part.fillet({
  id: partId,
  references: r.result.lines,
  radius: 5,
})
```

### Box edge midpoint positions (L×W×H at origin)

```
Bottom: [L/2,0,0], [L,W/2,0], [L/2,W,0], [0,W/2,0]
Top:    [L/2,0,H], [L,W/2,H], [L/2,W,H], [0,W/2,H]
Vertical: [0,0,H/2], [L,0,H/2], [L,W,H/2], [0,W,H/2]
```

### Cylinder/cone circular edges

```js
// Use center or non-seam rim point — NOT [+radius, 0, Z]
const r = await api.v1.part.getGeometryIds({
  id: partId,
  circles: [{ pos: [0, 0, height] }],  // center of top circle
})
```

**Circle-center lookup only works when the center lies ON a face.** A solid cylinder's top-circle center sits on the cap face → regime 1 (nearest-on-face) finds it. For HOLE mouths the center floats in the void → regime 2 (<0.05 tolerance) → lookup fails with "no geometry could be found". Verified 2026-06-10 on Ø18.63/Ø10/Ø8.1 hole rims: center probes all failed, rim points at 90° off-seam all succeeded. For holes, always probe a rim point: `[cx, cy + r, z]`. Note the seam direction is the cylinder's LOCAL +x — for a hole drilled along world X via a rotated csys (`rotation [0, π/2, 0]`), the seam maps to world −Z, so a world-+Y rim point is safely off-seam.

### Curved face lookup (2+ positions required)

```js
const r = await api.v1.part.getGeometryIds({
  id: partId,
  cylinders: [{ positions: [[radius, 0, height/2], [0, radius, height/2]] }],
})
```

## Related

- `part.getGeometryPositions` — inverse operation: given brep IDs, returns identifying positions
- `part.getBrepGeometryIndex` / `part.getBrepGeometryByIndex` — index-based brep access
- `part.fillet` / `part.chamfer` — primary consumers of edge IDs from this API
- `part.workPlane` / `part.workAxis` — can use brep face/edge IDs as references
- `part.compositeCurve` — uses brep edge IDs
