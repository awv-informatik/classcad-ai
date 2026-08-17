# Changes — sketch.deleteSketch training (2026-04-08)

Updated `references/sketch/deleteSketch.md` with findings from live testing.

## Key additions

1. **All-or-nothing behavior** — mixed valid/invalid IDs abort the entire call, no partial deletion
2. **Feature dependency behavior** — deleting a sketch used by extrusion leaves broken features (not cascaded)
3. **deleteObject vs deleteSketch** — clarified that deleteObject cannot delete whole sketches
4. **Full error code catalogue** — added codes 1001 (wrong type), 1004 (missing param), string conversion warning
5. **Sketch geometry cleanup** — confirmed all inner geometry is deleted with the sketch
6. **Safe bulk delete pattern** — added example for deleting one-at-a-time to avoid all-or-nothing

## Diff

```diff
diff --git a/references/sketch/deleteSketch.md b/references/sketch/deleteSketch.md
index 94f7fcd..0435575 100644
--- a/references/sketch/deleteSketch.md
+++ b/references/sketch/deleteSketch.md
@@ -4,7 +4,7 @@ Deletes one or more sketches by their IDs.

 ## Prerequisites

-- Existing sketch IDs (`sketch.create`)
+- Existing sketch IDs (`sketch.create` or `part.sketch`)

 ## Key Parameters

@@ -22,14 +22,25 @@ Returns VOID on success. maxLevel=31.

 - **Empty array is a no-op.** `ids: []` succeeds silently (maxLevel=31, no error). Does nothing.
 - **Invalid/already-deleted IDs produce errors.** maxLevel=51, error code 1006. You get both a warning (41, "ToId() didn't get valid id") and an error (51, "invalid id").
-- **Deletion is immediate.** After deletion, `part.getSketch` for that sketch name returns null with error.
-- **Removes all 3 internal objects.** The `CC_Sketch`, `CC_SketchReference`, and `CC_SketchDimensionSet` nodes are all removed.
+- **All-or-nothing on mixed IDs.** If any ID in the array is invalid, **no sketches are deleted** — not even the valid ones. The entire operation aborts. This is not partial success.
+- **Deletion is immediate.** After deletion, `part.getSketch` for that sketch name returns null with error 1015.
+- **Removes all 3 internal objects.** The `CC_Sketch`, `CC_SketchReference`, and `CC_SketchDimensionSet` nodes are all removed from the structure tree.
+- **Sketch geometry is deleted too.** Lines, circles, rectangles, constraints — everything inside the sketch is removed.
+- **Dependent features become broken, not deleted.** If the sketch was used by a feature (e.g., extrusion), the feature node persists in the tree but errors on re-evaluation ("CCObject can not be opened"). The solid geometry remains as stale mesh data but cannot be regenerated. maxLevel=51 is returned with error messages.
+- **Wrong ID type gives code 1001.** Passing a part ID or other non-sketch ID gives "wrong id type! Provide only following id types: ['sketch']" — different from the 1006 "invalid id" error for nonexistent IDs.

 ## Common Errors

 | Error | Code | Cause |
 |-------|------|-------|
 | "invalid id" | 1006 | Non-existent or already-deleted sketch ID |
+| "wrong id type" | 1001 | ID exists but is not a sketch (e.g., part ID, negative number) |
+| "parameter 'ids' must be provided" | 1004 | `ids` param omitted entirely |
+| "string couldn't be converted to an id" | 0 (warning) | String value passed instead of numeric ID |
+
+## deleteObject vs deleteSketch
+
+`sketch.deleteObject` cannot delete whole sketches. It only handles sub-sketch items: dimensions, sketch-curves, sketch-points, 2D constraints, sketch regions. To delete entire sketches, use `deleteSketch`.

 ## Working Example

@@ -37,11 +48,18 @@ Returns VOID on success. maxLevel=31.
 // Delete single
 await api.v1.sketch.deleteSketch({ ids: [sketchId] })

-// Delete multiple
+// Delete multiple (all-or-nothing — all must be valid)
 await api.v1.sketch.deleteSketch({ ids: [sk1, sk2, sk3] })
+
+// Safe pattern: validate before bulk delete
+const ids = [sk1, sk2, sk3]
+for (const id of ids) {
+  await api.v1.sketch.deleteSketch({ ids: [id] })
+}
 ```

 ## Related

-- `sketch.create` — create sketches
+- `sketch.create` / `part.sketch` — create sketches
+- `sketch.deleteObject` — delete sub-sketch items (geometry, constraints, dimensions)
 - `part.getSketch` — verify sketch exists before/after deletion
```
