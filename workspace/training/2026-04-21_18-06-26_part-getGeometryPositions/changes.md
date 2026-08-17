# Changes

New file: `references/part/getGeometryPositions.md`

```diff
+# part.getGeometryPositions
+
+Inverse of `getGeometryIds`. Given brep element IDs, returns the positions that uniquely identify each element. Use this to serialize brep references for later reconstruction via `getGeometryIds`.
+
+## Prerequisites
+
+- A part with geometry (e.g., `part.box`, `part.cylinder`, etc.)
+- Valid brep element IDs (from `getGeometryIds`, `getBrepGeometryByIndex`, or similar)
+- Works both pre- and post-`recalc()` — positions are correct either way, but IDs differ (preliminary vs final)
+
+## Key Parameters
+
+- `elems` — array of brep element IDs. Accepts any brep element type: `edge-line`, `edge-arc`, `edge-circle`, `vertex`, `face-plane`, `face-cylindrical`, `face-conical`, `face-spherical`, `edge-nurbs`, `face-nurbs`
+- Does NOT take a part ID — pass brep element IDs directly
+- Mixed element types allowed in a single call
+- Elements from different bodies in the same part can be queried together
+
+## Return Value
+
+- `result[i]` corresponds to `elems[i]` — output order matches input order
+- Positions are `{x, y, z}` objects (not `[x, y, z]` arrays)
+- Number of positions depends on element type (vertex=1, line=1, arc=1, circle=1, plane=N, cylinder=3, cone=3)
+
+## Positions by Element Type
+
+| Element type | Positions returned | Count |
+|---|---|---|
+| Vertex | The vertex coordinate | 1 |
+| Line (straight edge) | Edge midpoint | 1 |
+| Arc (fillet arc, etc.) | Arc midpoint (at parametric middle) | 1 |
+| Circle (circular edge) | Arc midpoint at angle π from seam | 1 |
+| Plane face | Midpoints of all adjacent edges | N |
+| Cylindrical face | Midpoints of adjacent edges: seam line + 2 circles | 3 |
+| Conical face | Midpoints of adjacent edges: seam line + 2 circles | 3 |
+
+## Key Findings
+
+- Round-trip `getGeometryIds → getGeometryPositions → getGeometryIds` produces same IDs ✓
+- Invalid IDs fail the ENTIRE call (result: null), not individual entries
+- Positions are {x,y,z} objects, not arrays — must convert for getGeometryIds
+- Works pre-recalc with correct positions (but IDs differ from post-recalc)
+- Duplicate IDs not deduplicated
+- Mixed element types and cross-body queries work in single call
```
