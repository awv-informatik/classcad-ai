# Faceting Concepts — chordHeightTol, angleTol, Quality vs Performance

Tessellation (faceting) turns curved CAD surfaces into triangle meshes for rendering, export, and analysis. Two parameters control it.

## chordHeightTol

Max perpendicular distance (model units) between the true surface and the flat triangle approximating it — for an arc, the gap between arc and chord. Lower = closer to the surface = more triangles.

Sphere r=20, angleTol=0:

| chordHeightTol | Vertices | Visual quality |
|---|---|---|
| 0.001 | 115,461 | Ultra-fine, indistinguishable from smooth |
| 0.01 | 8,385 | Very smooth |
| 0.05 | 2,017 | Smooth, faint facets |
| **0.1 (default)** | **1,697** | **Good balance** |
| 0.5 | 277 | Facets visible on curves |
| 1 | 153 | Clearly faceted |
| 5 | 85 | Low-poly |
| 10 | 45 | Very coarse polyhedron |

100× tighter tolerance → ~50–70× more vertices on curved surfaces (sphere r=20: 1 → 0.01 gives 123 → 8,131; 0.1 → 0.001 gives 1,635 → 114,951).

## angleTol

Max angle (degrees) between normals of adjacent triangles. Lower = more gradual normal changes = more triangles = smoother shading. **0 = disabled** (only chord matters). A fully independent constraint, not a chord modifier.

Sphere r=20, chord effectively disabled:

| angleTol (°) | 1 | 3 | 5 | 10 | 15 | 30 | 60 | 90 | 180 |
|---|---|---|---|---|---|---|---|---|---|
| Vertices | 131,845 | 8,385 | 8,385 | 2,145 | 561 | 154 | 45 | 20 | 0 (degenerate, no mesh) |

## How They Interact

Both constraints are satisfied; the one demanding more triangles decides: `final_vertices ≈ max(vertices_from_chord, vertices_from_angle)`.

| Scenario (sphere r=20) | cht | at | Verts | Dominates |
|---|---|---|---|---|
| Chord tight, angle loose | 0.1 | 30° | 1,697 | Chord (1697 vs 154) |
| Chord loose, angle tight | 1 | 5° | 8,385 | Angle (8385 vs 153) |
| Both tight | 0.01 | 5° | 8,385 | Tie (~8385 each) |
| Both loose | 5 | 30° | 153 | Angle (154 vs 85) |

chordHeightTol = geometric accuracy, angleTol = shading smoothness. For most applications chordHeightTol alone (angleTol=0) suffices.

## Only Curved Surfaces Are Affected

Planar faces always use the minimum triangles — a box has 24 vertices (8 corners × 3 normals) at any tolerance:

| Geometry | Curvature | cht=0.01 | cht=0.1 | cht=1 | cht=5 |
|---|---|---|---|---|---|
| Box | None | 24 | 24 | 24 | 24 |
| Cylinder/Cone | Single | 514 | 258 | 66 | 34 |
| Sphere | Double | 8,385 | 1,697 | 153 | 85 |

Doubly-curved surfaces give 6-16× more vertices than singly-curved at the same tolerance (curvature in U and V).

## Edge Tessellation

`chordHeightTol` also sets edge polyline density (with `doCurveTessellation=true`): a cylinder's 3 edges go from 516 points at cht=0.01 to 20 at cht=5. With `doCurveTessellation=false` edges are analytic (`lines`/`arcs` instead of polylines).

## Per-Entity vs Global

`facetingParamsMode` (`setDatabaseSettings`):

- **0 (global):** all entities use the global values from `setDatabaseSettings`/`setFacetingParameters`; per-entity overrides ignored.
- **1 (per-entity, default):** each entity uses its own params from `setAppearance({ target: featureId, chordHeightTol, angleTol })`; entities without them use the globals.

`requestVisualisation` reports the effective tolerance per entity in `container.properties.chordHeightTol`. Use case: fine tessellation on focal geometry, coarse on background parts.

## STL Export Has Its Own Tessellation

`common.save({ format: 'STL', stl: { facetingTol, angleTol } })` is independent of database settings. Defaults `facetingTol=0.1` (same concept as chordHeightTol), `angleTol=6` — much tighter than the database default (0°/disabled).

## Practical Recommendations

| Use case | chordHeightTol | angleTol |
|---|---|---|
| Default / general | 0.1 | 0 |
| Fine visualization | 0.05 | 0 |
| 3D printing / CNC | 0.01-0.05 | 0 |
| Quick preview | 0.5-1 | 0 |
| Performance-critical | 1-5 | 0 |
| Shading quality | 0.1 | 5-10 |
| Measurement/analysis | 0.001-0.01 | 0 |

Set `chordHeightTol` first (primary lever); add `angleTol` only for smooth shading independent of accuracy.

## Where Faceting Is Configured

| API | Sets | Partial updates? | Notes |
|---|---|---|---|
| `setDatabaseSettings` | All 8 fields (mode, chord, angle, …) | Yes | Primary configuration API |
| `setFacetingParameters` | chord + angle | No (both required) | Stricter validation |
| `setAppearance` | Per-entity chord + angle | Yes | Only applies in mode=1 |
| `save({ stl: {...} })` | STL chord + angle | n/a | Independent of database settings |

## Related

`common.getDatabaseSettings` / `common.setDatabaseSettings` · `common.getFacetingParameters` / `common.setFacetingParameters` · `common.setAppearance` · `common.requestVisualisation` · `common.save`
