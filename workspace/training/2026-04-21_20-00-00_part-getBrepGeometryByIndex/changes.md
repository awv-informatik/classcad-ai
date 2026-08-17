# Changes — part.getBrepGeometryByIndex

## New file: `references/part/getBrepGeometryByIndex.md`

```diff
+# part.getBrepGeometryByIndex
+
+Returns a brep element ID given a 0-based index within its type category. Inverse of `getBrepGeometryIndex`. Points, lines, arcs, NURBS curves, and faces are indexed separately — each type has its own independent index space starting at 0.
+
+## Prerequisites
+
+- A part with geometry (e.g., `part.box`, `part.cylinder`, `part.fillet`, etc.)
+- Works both pre- and post-`recalc()` — pre-recalc returns preliminary IDs, post-recalc returns final IDs. Same index, different ID values.
+
+## Key Parameters
+
+- `id` — the **feature ID** (e.g., the ID returned from `part.box`, `part.fillet`, etc.). **NOT a part ID** — passing a part ID fails with "Index 0 ausserhalb des Arraybereichs".
+- Exactly **one** index parameter must be specified:
+  - `lineIndex` — straight edges
+  - `arcIndex` — circular/arc edges (including fillet arcs)
+  - `faceIndex` — faces (planar, cylindrical, etc.)
+  - `pointIndex` — vertices
+  - `nurbsCurveIndex` — NURBS curve edges (rare — not produced by standard primitives/booleans)
+- `solidIndex` — (optional, default 0) which solid within the feature. Only relevant for multi-solid features.
+
+## Return Value
+
+- **Success:** returns a valid brep element ID with maxLevel=31
+- **Out-of-range:** returns null with maxLevel=51 and descriptive error
+- **No matching type:** returns null with maxLevel=51
+
+## Element Counts by Geometry
+
+| Geometry | Lines | Arcs | Faces | Points | NURBS |
+|---|---|---|---|---|---|
+| Box | 12 | 0 | 6 | 8 | 0 |
+| Cylinder | 1 (seam) | 2 | 3 | 0 | 0 |
+| Sphere | 0 | 1 (seam) | 1 | 2 (poles) | 0 |
+| Cone | 1 (seam) | 2 | 3 | 2 | 0 |
+
+## Gotchas
+
+- Feature ID required (not part ID) — different error than getBrepGeometryIndex
+- Exactly one index param required — zero or multiple rejected
+- Negative indices hit C++ type conversion issues
+- NURBS curves rare — not produced by standard primitives/booleans
+- Deterministic alternative to position-based getGeometryIds lookups
+
+## Working examples, common errors, enumeration pattern, and full pipeline integration included.
```
