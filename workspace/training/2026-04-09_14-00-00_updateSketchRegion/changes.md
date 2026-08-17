# Changes — sketch.updateSketchRegion training

## New file: `references/sketch/updateSketchRegion.md`

```diff
+# sketch.updateSketchRegion
+
+Replaces the geometry of one or more existing sketch regions. This is a **replace** operation, not a merge — the region's geometry list is fully overwritten with the new `geomIds`.
+
+## Prerequisites
+
+- An existing sketch region (`sketch.sketchRegion`)
+
+## Key Parameters
+
+- `regions` — array of `{ id, geomIds }` objects (required). Each entry updates one region.
+  - `id` — region ID (type: `sketchregion`). Must be an existing `CC_SketchRegion` ID.
+  - `geomIds` — array of sketch curve IDs (type: `sketch-curve`). Lines, arcs, circles all accepted. **Points are NOT accepted** (unlike `sketchRegion` creation which accepts both curves and points).
+
+## Return Value
+
+`VOID` (null). maxLevel=31 on success. Empty messages array.
+
+## Behavior
+
+- **Replace, not merge.** The region's geometry is fully replaced.
+- **Batch support.** Multiple regions in one call.
+- **Atomic batches.** One bad entry kills the whole batch.
+- **Name preserved.** Geometry update doesn't affect region name.
+- **Duplicates preserved.** No deduplication.
+- **Cross-sketch geometry accepted.** No validation curves belong to parent sketch.
+
+## Gotchas
+
+- Cannot clear a region (empty geomIds errors)
+- Points rejected (stricter than creation)
+- Batch atomicity (validate before calling)
+
+## Common Errors, Working Example, Related sections included.
```

## Modified file: `references/sketch/sketchRegion.md`

```diff
 ### sketch.updateSketchRegion

-Updates one or more regions with new geometry. Takes a `regions` array where each entry has `id` (region ID) and `geomIds` (new curve IDs). Returns VOID. Supports batch updates (multiple regions in one call).
-
-```js
-await api.v1.sketch.updateSketchRegion({
-  regions: [{ id: regionId, geomIds: newCurveIds }],
-})
-// result: null (VOID), maxLevel: 31
-```
+Replaces region geometry. See [updateSketchRegion.md](updateSketchRegion.md) for full details. Key differences from creation: only accepts `sketch-curve` (not points), batches are atomic, empty `geomIds` errors.
```
