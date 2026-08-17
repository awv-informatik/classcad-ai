# Changes — transformationByCSys training

## New files

- `references/part/transformationByCSys.md` — LLM doc for `part.transformationByCSys`
- `references/part/updateTransformationByCSys.md` — LLM doc for `part.updateTransformationByCSys`

## Diff

```diff
diff --git a/references/part/transformationByCSys.md b/references/part/transformationByCSys.md
new file mode 100644
+# part.transformationByCSys
+
+Creates a parametric transformation feature that repositions target features using the matrix between two work coordinate systems. This is the most general parametric transform — it handles translation, rotation, and combined transforms in a single feature.
+
+## Prerequisites
+
+- A part (`part.create`) with at least one feature containing solid geometry
+- Two work coordinate systems (`part.workCSys`) — one defining "from" and one defining "to"
+
+## Key Parameters
+
+- `id` — **part ID** (not feature ID)
+- `targets` — array of feature IDs to transform. Accepts flat IDs `[featureId]` or object format `[{ id: featureId, indices: [0] }]`
+- `references` — **exactly 2** WCS IDs: `[toWCS, fromWCS]`. Index 0 = "to", index 1 = "from". The transform computes the matrix from the "from" WCS to the "to" WCS and applies it to the targets.
+- `name` — feature name (default `"TransformationByCSys"`)
+
+## Return Value
+
+Feature ID (numeric) on success, maxLevel=31.
+
+## How It Works
+
+The transformation is the matrix that maps the "from" coordinate system to the "to" coordinate system. If both WCS are at the origin with no rotation, the transform is identity (no movement). To translate, give the WCS different offsets. To rotate, give them different rotations. To do both, use both.
+
+**Reference order matters:** `references: [wcsTo, wcsFrom]` moves geometry from wcsFrom-space to wcsTo-space. Swap them to reverse the direction.
+
+## Gotchas
+
+- **Exactly 2 references required.** Fewer or more gives error code 1002.
+- **Empty targets array** gives a confusing error (code 1004: "type '0' is not supported") instead of a clear message.
+- **`updateTransformationByCSys` requires `openFeature`/`closeFeature`.** Without it: error code 1200 "feature is not allowed to update. It's not active and open."
+- **All WCS references must exist BEFORE the transform feature in the tree.** If you create a new WCS after `openFeature`, it won't be recognized as a valid reference for the update (error code 1001: wrong type). Create all WCS references first, then create the transform.
+- **This is a MOVE, not a copy.** Target features physically relocate. Non-targeted features stay put.
+- **Multiple targets move together** as a group, maintaining relative positions.
+- Both WCS types work: `CUSTOM` (offset/rotation) and `XYAXISORIGIN` (work point references).
+
+## Common Errors
+
+| Code | Message | Cause |
+|---|---|---|
+| 1002 | "references has invalid number of elements! There should be 2" | Passed fewer or more than 2 WCS IDs |
+| 1004 | "type '0' is not supported in PrepareAPIParams" | Empty targets array |
+| 1200 | "feature is not allowed to update. It's not active and open" | Called `updateTransformationByCSys` without `openFeature` |
+| 1001 | "element of 'references' has the wrong type" | WCS created after `openFeature` — not visible in rolled-back tree |

diff --git a/references/part/updateTransformationByCSys.md b/references/part/updateTransformationByCSys.md
new file mode 100644
+# part.updateTransformationByCSys
+
+Updates an existing transformationByCSys feature. Can change targets, references, or name.
+
+## Prerequisites
+
+- An existing `transformationByCSys` feature
+- The feature must be opened with `openFeature` before updating and closed with `closeFeature` after
+- Any WCS references used in the update must already exist in the feature tree BEFORE the transform feature
+
+## Key Parameters
+
+- `id` — **feature ID** (the transformationByCSys feature, not the part)
+- `targets` — (optional) new array of feature IDs to transform
+- `references` — (optional) new pair of WCS IDs `[toWCS, fromWCS]`
+- `name` — (optional) new feature name
+
+All parameters except `id` are optional — omitted values keep existing settings.
+
+## Return Value
+
+Feature ID (same as input) on success, maxLevel=31. Returns null with maxLevel=51 on error.
+
+## Gotchas
+
+- **Must wrap with `openFeature`/`closeFeature`.** Without it: error 1200.
+- **Cannot reference WCS created after `openFeature`.** The GhostRollbackBar rolls back the model state — any WCS created in the rolled-back state won't be recognized as a valid reference. Create all WCS before the transform feature.
+- **Changing targets reverts previous targets** to their pre-transform positions.
```
