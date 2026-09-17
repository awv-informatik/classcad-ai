# part.getGeometryIds

Finds brep elements (edges, faces, vertices) from positions on or near them. The primary way to get brep IDs for `fillet`, `chamfer`, `workPlane`, `workAxis`, `compositeCurve`, and other APIs taking brep references.

**No `recalc()` needed before querying.** Ids queried right after creating a feature work with fillet and all chamfer types. Re-query after later geometry changes.

## Key Parameters

All optional — query only the types you need.

| Param | Shape | Finds |
|---|---|---|
| `id` | part ID | (the **part**, not the feature) |
| `lines` | `[{ pos: [x,y,z] }]` | straight edges (use midpoint) |
| `arcs` | `[{ pos }]` | non-circular arc edges (e.g. fillet arcs) |
| `circles` | `[{ pos }]` | circular edges (cylinders, cones, any near-360° arc) |
| `points` | `[{ pos }]` | vertices, exact position |
| `planes` | `[{ positions: [[x,y,z], ...] }]` | flat faces |
| `cylinders` | `[{ positions }]` | cylindrical faces (one off-seam point is enough) |
| `cones` | `[{ positions }]` | conical faces |
| `spheres` | `[{ positions }]` | spherical faces |
| `nurbsCurves` | `[{ pos }]` | NURBS edges (freeform only) |
| `nurbsSurfaces` | `[{ positions }]` | NURBS faces (freeform only) |

Edges use `pos` (singular, one point); faces use `positions` (plural, array of points).

Box (L×W×H at origin) edge midpoints:

```
Bottom:   [L/2,0,0], [L,W/2,0], [L/2,W,0], [0,W/2,0]
Top:      [L/2,0,H], [L,W/2,H], [L/2,W,H], [0,W/2,H]
Vertical: [0,0,H/2], [L,0,H/2], [L,W,H/2], [0,W,H/2]
```

## Return Value

`{ result: { lines: id[], planes: id[], circles: id[], ... }, messages?, maxLevel? }`

- Only queried categories are present
- **Ordered** — output[i] corresponds to input[i]
- A failed lookup yields `[]` at that index (not null); maxLevel=51 if any lookup fails, other lookups still succeed

## Gotchas

### No-match entries are EMPTY ARRAYS, not null

Querying `arcs`+`circles`+`lines` at one position can return `{ arcs: [6513], circles: [[]], lines: [[]] }`. `.filter(Boolean)` keeps the empty arrays (truthy!), and feeding them into `getGeometryPositions.elems` silently degrades the whole call (entries with no positions). Flatten and keep numeric ids only: `[...arcs, ...circles, ...lines].flat().filter(x => typeof x === 'number')`.

### Circles vs arcs

- **`circles`** — circular/near-full-circle edges on cylinders, cones, spheres. Finds them even though the brep stores them as arcs (seam lines).
- **`arcs`** — non-circular/partial arcs only (fillet arcs). Does NOT find circular edges on cylinders/cones.

### Seam avoidance

Cylinders, cones, and spheres have a **seam line** in local +X (`[+radius, 0, z]` for a cylinder at the part origin). Points on it fail: the seam vertex for `circles`, and any seam-line point for `cylinders` faces (e.g. `[15, 0, 30]` on a Ø30×60 cylinder) — "no geometry could be found". Use another position: a rim/surface point at 90° or 180° (`[0, r, z]`, `[-r, 0, z]`), or the circle center for solid caps. With several `positions`, one off-seam point is enough.

### Position tolerance — two regimes

1. **Point ON a brep surface** — finds the nearest element of the requested type on that face, even far from it (e.g. face center finds the nearest edge for `lines`).
2. **Point NOT on any surface** — very tight, roughly <0.05 units (0.001 off works; 0.1 off fails).

Prefer exact positions: edge midpoints, face centers, vertex coordinates.

**Circle-center lookup only works when the center lies ON a face.** A solid cylinder's top-circle center sits on the cap (regime 1). A HOLE mouth center floats in the void (regime 2) → "no geometry could be found" (Ø18.63/Ø10/Ø8.1 hole rims: all center probes failed, rim points at 90° off-seam all succeeded). For holes, probe a rim point: `[cx, cy + r, z]`. The seam is the cylinder's LOCAL +x — for a hole drilled along world X via a rotated csys (`rotation [0, π/2, 0]`), the seam maps to world −Z, so a world-+Y rim point is off-seam.

### Revolve rim circles may be unreachable by edge lookup — use the face

Rim circles are found by `circles` at an off-seam rim point (revolve about Y, rim r=40 at y=0: `[0,0,40]` and `[-40,0,0]` hit, seam point `[40,0,0]` misses; `arcs` never finds full circles). In one sprocket model (after booleans) the hub OD's outer rim circles were NOT found by `arcs` or `circles` at an on-edge position, while `lines` returned a far-away straight edge (looks like a hit, is a red herring — always verify found ids via `getGeometryPositions`). Robust alternative: look up the **cylindrical face** (`cylinders: [{ positions: [p1, p2] }]`) and read `getGeometryPositions(faceId)` — seam-line + two rim-circle midpoints, carrying radius and both end positions.

### Probe positions can land inside holes

A point mathematically on a surface may sit where a later cut removed it (both hub-surface probes at +Y/+Z azimuths landed inside two radial set-screw holes → "face not found"). On an unexpected failure, check which other features intersect the probe point.

### IDs change after topology operations

Fillet, chamfer, boolean, etc. change brep IDs. Re-query after each; never cache brep IDs across topology changes.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"At the given position: [{x,y,z}] no geometry could be found for the type: ..."` | Too far from geometry, wrong type, or seam | Verify position on geometry; avoid seam; check type |
| `[]` at an index | Per-position failure in a batch | Other results in the batch are still valid |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

const r = await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [0, 0, 20] }, { pos: [80, 0, 20] }], // front-left / front-right vertical edges
})
await api.v1.part.fillet({ id: partId, references: r.result.lines, radius: 5 })

// Cylinder: circle via cap center (NOT [+r, 0, z]), face via off-seam point
await api.v1.common.clear() // one root part per drawing
const cylPart = (await api.v1.part.create({ name: 'Cyl' })).result
await api.v1.part.cylinder({ id: cylPart, diameter: 30, height: 60 })
const c = await api.v1.part.getGeometryIds({
  id: cylPart,
  circles: [{ pos: [0, 0, 60] }],
  cylinders: [{ positions: [[0, 15, 30]] }], // 90° from the +X seam
})
```

## Related

`part.getGeometryPositions` · `part.getBrepGeometryIndex` / `part.getBrepGeometryByIndex` · `part.fillet` / `part.chamfer` · `part.workPlane` / `part.workAxis` · `part.compositeCurve`
