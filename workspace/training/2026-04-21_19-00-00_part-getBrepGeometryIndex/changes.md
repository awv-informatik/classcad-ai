# Changes — part.getBrepGeometryIndex

## New file: `references/part/getBrepGeometryIndex.md`

```diff
+# part.getBrepGeometryIndex
+
+Returns the 0-based index of a brep element within its type category in a brep container. Points, lines, arcs, NURBS curves, and faces are indexed separately — each type has its own independent index space starting at 0.
+
+## Prerequisites
+
+- A part with geometry (e.g., `part.box`, `part.cylinder`, etc.)
+- Valid brep element IDs (from `getGeometryIds`, `getBrepGeometryByIndex`, or similar)
+- Works both pre- and post-`recalc()` — indices are stable across recalc (only IDs change)
+
+## Key Parameters
+
+- `id` — the **feature ID** (e.g., the ID returned from `part.box`, `part.fillet`, etc.). **NOT a part ID** — passing a part ID fails with "Not a brep!" error.
+- `geomId` — the brep element ID to index. Must be a valid brep element (edge, face, or vertex).
+- `solidIndex` — (optional, default 0) which solid within the feature. Only relevant for multi-solid features (e.g., boolean with `keepTools: true`). Out-of-range values produce error.
+
+## Return Value
+
+- **Success:** returns the index (≥ 0) with maxLevel=31
+- **Cross-body (-1):** geomId not in specified feature's brep → returns -1 with maxLevel=31 (not an error)
+- **Error (null):** invalid geomId, wrong ID type, or invalid solidIndex → returns null with maxLevel=51
+
+## Gotchas
+
+- Feature ID required (not part ID) — doc discrepancy
+- -1 return is a membership test, not an error
+- Indices stable across recalc (IDs change, indices don't)
+- solidIndex out-of-range errors in German
+
+## Common Errors, Working Example, Membership Test, Related APIs
```
