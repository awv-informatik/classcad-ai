# Changes — entityDeletion training session

## New file: `references/part/entityDeletion.md`

```diff
+# part.entityDeletion
+
+Suppresses geometry from one or more features without removing the features from the design tree. Creates a deletion feature that hides targeted solids. The original features remain in the tree and can be restored by updating or removing the deletion feature.
+
+## Prerequisites
+
+- A part (`part.create`)
+- One or more features with geometry to delete (box, cylinder, extrusion, pattern, etc.)
+
+## Key Parameters
+
+- `id` — the part ID (NOT the feature to delete)
+- `targets` — array of feature IDs or objects with `{ id, indices }`. **All elements must be the same format** — cannot mix plain IDs with objects.
+  - Plain ID: deletes all solids from that feature
+  - `{ id }` (object, no indices): same as plain ID — deletes all solids
+  - `{ id, indices: [0, 2] }`: deletes specific solid instances (0-based). Used for multi-solid features like linearPattern/circularPattern.
+- `name` — optional, defaults to `"EntityDeletion"`
+
+## Return Value
+
+Returns the ID of the newly created entityDeletion feature (not VOID). maxLevel 31 on success.
+
+## Gotchas
+
+- **Cannot target consumed features.** Error code 1014.
+- **Cannot mix target formats.** Error code 1001. Use all-objects format.
+- **Empty targets array fails.**
+- **Renderer may show stale data** — STEP export is ground truth.
+
+## Indices
+
+0-based, matching pattern child instances (LP1_0, LP1_1, etc.).
+
+## Common Errors table, Working Examples, Related APIs
+
+(see full file for details)
+
+# part.updateEntityDeletion
+
+Replaces targets list (not additive). Requires open/close gate.
+Returns deletion feature ID on success.
```
