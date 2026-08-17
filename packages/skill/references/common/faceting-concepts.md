# Faceting Concepts — chordHeightTol, angleTol, Quality vs Performance

Tessellation (faceting) converts curved CAD surfaces into triangle meshes for rendering, export, and analysis. Two parameters control mesh quality: `chordHeightTol` and `angleTol`. Understanding how they work, interact, and when to adjust them is critical for agents working with mesh data.

## What chordHeightTol Means

**Chord height tolerance** is the maximum perpendicular distance (in model units) between the true curved surface and the flat tessellation triangle that approximates it. Think of an arc: the "chord height" is the gap between the arc and the straight chord connecting two points on it.

- Lower value = triangles must stay closer to the true surface = more triangles = smoother mesh
- Higher value = triangles can deviate further = fewer triangles = faster but more faceted

**Scaling behavior** (sphere r=20, angleTol=0):

| chordHeightTol | Vertices | Visual quality |
|---|---|---|
| 0.001 | 115,461 | Ultra-fine, indistinguishable from smooth |
| 0.01 | 8,385 | Very smooth |
| 0.05 | 2,017 | Smooth, faint facets visible |
| **0.1 (default)** | **1,697** | **Good balance** |
| 0.5 | 277 | Facets visible on curves |
| 1 | 153 | Clearly faceted |
| 5 | 85 | Low-poly look |
| 10 | 45 | Very coarse polyhedron |

The relationship is super-linear: 100x tighter tolerance produces ~1000x more vertices. Halving the tolerance roughly doubles the vertex count on curved surfaces.

## What angleTol Means

**Angle tolerance** is the maximum angle (in degrees) between the surface normals of adjacent tessellation triangles. On a sphere, adjacent triangles' normals diverge proportionally to their size — small triangles have nearly parallel normals, large ones have a big angle between them.

- Lower angle = normals must change gradually = more triangles = smoother shading transitions
- Higher angle = normals can jump sharply = fewer triangles = faceted appearance
- **0 = disabled** (only chord tolerance matters)

**Scaling behavior** (sphere r=20, chordHeightTol effectively disabled):

| angleTol (°) | Vertices |
|---|---|
| 1 | 131,845 |
| 3 | 8,385 |
| 5 | 8,385 |
| 10 | 2,145 |
| 15 | 561 |
| 30 | 154 |
| 60 | 45 |
| 90 | 20 |
| 180 | 0 (degenerate — no mesh) |

angleTol is a fully independent constraint, not just a modifier for chordHeightTol.

## How They Interact

When both are set, the tessellation engine satisfies **both constraints simultaneously**. The more restrictive constraint (whichever demands more triangles) determines the mesh density. This is effectively a MAX operation:

```
final_vertices ≈ max(vertices_from_chord, vertices_from_angle)
```

Examples (sphere r=20):

| Scenario | cht | at | Verts | Which dominates? |
|---|---|---|---|---|
| Chord tight, angle loose | 0.1 | 30° | 1,697 | Chord (demands 1697 vs 154) |
| Chord loose, angle tight | 1 | 5° | 8,385 | Angle (demands 8385 vs 153) |
| Both tight | 0.01 | 5° | 8,385 | Tie (both demand ~8385) |
| Both loose | 5 | 30° | 153 | Angle (demands 154 vs 85) |

**When to use both:** Set chordHeightTol for geometric accuracy (how close the mesh is to the true surface) and angleTol for visual smoothness (how smooth shading transitions look). For most applications, chordHeightTol alone (with angleTol=0) is sufficient.

## Only Curved Surfaces Are Affected

Flat faces (planes) are always tessellated with the minimum number of triangles regardless of tolerance. A box has exactly 24 vertices (8 corners × 3 normals) at any tolerance:

| Geometry | Curvature | cht=0.01 | cht=0.1 | cht=1 | cht=5 |
|---|---|---|---|---|---|
| Box | None (planar) | 24 | 24 | 24 | 24 |
| Cylinder/Cone | Single | 514 | 258 | 66 | 34 |
| Sphere | Double | 8,385 | 1,697 | 153 | 85 |

Doubly-curved surfaces (sphere) generate 6-16x more vertices than singly-curved surfaces (cylinder) at the same tolerance, because curvature exists in both U and V directions.

## Edge Tessellation

`chordHeightTol` also controls edge polyline density (when `doCurveTessellation=true`). A cylinder's 3 edges go from 516 edge points at cht=0.01 down to 20 at cht=5. With `doCurveTessellation=false`, edges become analytic curves (lines and arcs arrays instead of polylines).

## Per-Entity vs Global Faceting

Two modes controlled by `facetingParamsMode` in `setDatabaseSettings`:

- **mode=0 (global):** All entities use the global `chordHeightTol`/`angleTol` from `setDatabaseSettings`/`setFacetingParameters`. Per-entity overrides are ignored.
- **mode=1 (per-entity, default):** Each entity uses its own tessellation parameters, set via `setAppearance({ target: featureId, chordHeightTol: ..., angleTol: ... })`. Entities without explicit per-entity params use the global defaults.

Per-entity faceting is visible in `requestVisualisation` results: `container.properties.chordHeightTol` reports the effective tolerance for that entity.

**Use case:** Set high-quality tessellation on focal geometry (parts the user is looking at) and coarse tessellation on background/distant parts.

## STL Export Has Its Own Tessellation

`common.save({ format: 'STL', stl: { facetingTol, angleTol } })` uses its **own tessellation** independent of database settings. Defaults: `facetingTol=0.1`, `angleTol=6`. The `facetingTol` param is the same concept as `chordHeightTol` — max distance from true surface to triangulated approximation. STL angleTol default (6°) is much tighter than the database default (0°/disabled).

## Practical Recommendations

| Use case | chordHeightTol | angleTol | Notes |
|---|---|---|---|
| **Default / general use** | 0.1 | 0 | Good balance for most CAD work |
| **Fine visualization** | 0.05 | 0 | Smooth curves, moderate vertex count |
| **3D printing / CNC** | 0.01-0.05 | 0 | Tight tolerance for manufacturing |
| **Quick preview** | 0.5-1 | 0 | Fast, clearly faceted |
| **Performance-critical** | 1-5 | 0 | Minimal mesh, very coarse |
| **Shading quality** | 0.1 | 5-10 | Adds angle constraint for smooth shading |
| **Measurement/analysis** | 0.001-0.01 | 0 | Very high accuracy, large mesh |

**Key rule:** Set `chordHeightTol` first (it's the primary lever). Only add `angleTol` if you need smooth shading independent of geometric accuracy. Most applications work fine with `angleTol=0` (disabled).

## Where Faceting Is Configured

| API | What it sets | Partial updates? | Notes |
|---|---|---|---|
| `setDatabaseSettings` | All 8 fields (incl. mode, chord, angle) | Yes | Primary configuration API |
| `setFacetingParameters` | chord + angle only | No (both required) | Convenience API, stricter validation |
| `setAppearance` | Per-entity chord + angle | Yes | Only applies in mode=1 |
| `save({ stl: {...} })` | STL export chord + angle | n/a | Independent of database settings |

## Related

- `common.getDatabaseSettings` / `common.setDatabaseSettings` — global tessellation control
- `common.getFacetingParameters` / `common.setFacetingParameters` — chord/angle convenience API
- `common.setAppearance` — per-entity tessellation overrides
- `common.requestVisualisation` — retrieve tessellated mesh data
- `common.save` — export with format-specific tessellation (STL facetingTol)
