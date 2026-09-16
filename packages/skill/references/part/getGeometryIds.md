# part.getGeometryIds

Finds brep geometry elements (edges, faces, vertices) by providing positions on or near them. This is the primary way to get brep element IDs for use with `fillet`, `chamfer`, `workPlane`, `workAxis`, `compositeCurve`, and other APIs that take brep references.

## Prerequisites

- A part with geometry (e.g., `part.box`, `part.cylinder`, etc.)
- **No `recalc()` needed before querying.** Ids queried right after creating a feature work with fillet and all chamfer types. Re-query after later changes to the geometry.

## Key Parameters

- `id` — the **part** ID (not the feature ID)
- `lines` — `[{ pos: [x,y,z] }]` — find straight edges by a point on the edge (use midpoint)
- `arcs` — `[{ pos: [x,y,z] }]` — find non-circular arc edges (e.g., fillet arcs)
- `circles` — `[{ pos: [x,y,z] }]` — find circular edges (works for cylinders, cones, and any near-360° arc)
- `points` — `[{ pos: [x,y,z] }]` — find vertices by exact position
- `planes` — `[{ positions: [[x,y,z], ...] }]` — find flat faces
- `cylinders` — `[{ positions: [[x,y,z], ...] }]` — find cylindrical faces (one off-seam point is enough)
- `cones` — `[{ positions: [[x,y,z], ...] }]` — find conical faces
- `spheres` — `[{ positions: [[x,y,z], ...] }]` — find spherical faces
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

### Curved faces: one off-seam position is enough

A single position on the surface finds a curved face (`cylinders: [{ positions: [[0, r, z]] }]`) — as long as it is not on the seam line (next section). A point on the seam line alone fails with "no geometry could be found"; with several positions, one off-seam point is enough.

### Circles vs arcs

- **`circles`** — for circular/near-full-circle edges. Works on cylinders, cones, spheres — any edge that forms a circle or near-circle. Despite the brep internally storing these as arcs (due to seam lines), the `circles` param finds them.
- **`arcs`** — for non-circular arcs only (e.g., fillet arcs, partial arcs). Does NOT find circular edges on cylinders/cones.

### Seam vertex avoidance

Cylinders, cones, and spheres have a **seam line** in the local +X direction (`[+radius, 0, z]` for a cylinder at the part origin). Points on it fail: the seam vertex for `circles` lookups, and any point of the seam line for `cylinders` face lookups (e.g. `[15, 0, 30]` on a Ø30×60 cylinder). Use any other position: a rim/surface point at 90° or 180° (`[0, r, z]`, `[-r, 0, z]`), or the circle center for solid caps.

### Position tolerance

Two lookup regimes:
1. **Point ON a brep surface** — the API finds the nearest element of the requested type on that face. Works even if the point is far from the nearest edge (e.g., center of a face finds the nearest edge when querying `lines`).
2. **Point NOT on any surface** (floating in space) — tolerance is very tight, roughly <0.05 units. A point 0.001 off works; 0.1 off fails.

For reliable results, use positions that are exactly on the geometry: edge midpoints, face centers, or vertex coordinates.

### No-match entries are EMPTY ARRAYS, not null

A query entry with no match comes back as `[]` *inside* the result array — e.g. querying
`arcs`+`circles`+`lines` at one position can return `{ arcs: [6513], circles: [[]], lines: [[]] }`.
`.filter(Boolean)` keeps the empty arrays (truthy!), and feeding them into
`getGeometryPositions.elems` silently degrades the whole call (entries with no positions).
Flatten and keep numeric ids only: `[...arcs, ...circles, ...lines].flat().filter(x => typeof x === 'number')`
(verified 2026-08-10).

### Revolve rim circles may be unreachable by edge lookup — use the face

Rim circles are found by `circles` at an off-seam rim point (revolve about Y, rim r=40 at y=0: `[0,0,40]` and `[-40,0,0]` hit, the seam point `[40,0,0]` misses; `arcs` never finds full circles). In one sprocket model (after booleans) the outer rim circles of a hub OD
were NOT found by `arcs` or `circles` at an on-edge position, while `lines` happily returned
a far-away straight edge (looks like a hit, is a red herring — always verify the found id via
`getGeometryPositions`). Robust alternative: look up the **cylindrical face**
(`cylinders: [{ positions: [p1, p2] }]`) and read `getGeometryPositions(faceId)` — it returns the
seam-line + the two rim-circle midpoints, which carry the radius and both end positions
(verified 2026-08-10, sprocket hub).

### Probe positions can land inside holes

A position mathematically on a surface may sit exactly where a later cut removed it (e.g. both
hub-surface probes at +Y/+Z azimuths landed inside the two radial set-screw holes → "face not
found"). When a lookup unexpectedly fails, check what OTHER features intersect the probe point
before doubting the geometry.

### IDs change after topology operations

Fillet, chamfer, boolean, and other topology-modifying features change brep IDs. After any such operation, re-query with `getGeometryIds`. Never cache brep IDs across topology changes.

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

### Curved face lookup (off-seam point)

```js
const r = await api.v1.part.getGeometryIds({
  id: partId,
  cylinders: [{ positions: [[0, radius, height/2]] }],  // 90° from the +X seam line
})
```

## Related

`part.getGeometryPositions` · `part.getBrepGeometryIndex` / `part.getBrepGeometryByIndex` · `part.fillet` / `part.chamfer` · `part.workPlane` / `part.workAxis` · `part.compositeCurve`
