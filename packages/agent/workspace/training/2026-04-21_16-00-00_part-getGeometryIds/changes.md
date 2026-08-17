# Skill Changes — part.getGeometryIds

## New file: `references/part/getGeometryIds.md`

```diff
+# part.getGeometryIds
+
+Finds brep geometry elements (edges, faces, vertices) by providing positions on or near them. This is the primary way to get brep element IDs for use with `fillet`, `chamfer`, `workPlane`, `workAxis`, `compositeCurve`, and other APIs that take brep references.
+
+## Prerequisites
+
+- A part with geometry (e.g., `part.box`, `part.cylinder`, etc.)
+- **Must call `recalc()` before querying.** Pre-recalc IDs are "preliminary" — they differ from post-recalc IDs and may fail with some APIs (e.g., TWO_DISTANCES chamfer). Always recalc first.
+
+## Key Parameters
+
+- `id` — the **part** ID (not the feature ID)
+- `lines` — `[{ pos: [x,y,z] }]` — find straight edges by a point on the edge (use midpoint)
+- `arcs` — `[{ pos: [x,y,z] }]` — find non-circular arc edges (e.g., fillet arcs)
+- `circles` — `[{ pos: [x,y,z] }]` — find circular edges (works for cylinders, cones, and any near-360° arc)
+- `points` — `[{ pos: [x,y,z] }]` — find vertices by exact position
+- `planes` — `[{ positions: [[x,y,z], ...] }]` — find flat faces
+- `cylinders` — `[{ positions: [[x,y,z], [x,y,z], ...] }]` — find cylindrical faces (2+ points required)
+- `cones` — `[{ positions: [[x,y,z], [x,y,z], ...] }]` — find conical faces (2+ points required)
+- `spheres` — `[{ positions: [[x,y,z], [x,y,z], ...] }]` — find spherical faces (2+ points required)
+- `nurbsCurves` — `[{ pos: [x,y,z] }]` — find NURBS curve edges (freeform geometry only)
+- `nurbsSurfaces` — `[{ positions: [[x,y,z], ...] }]` — find NURBS faces (freeform geometry only)
+
+[... full file contents in the diff above ...]
```
