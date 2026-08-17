# Changes — openFeature / closeFeature

## New file: `references/part/openFeature.md`

```diff
+# part.openFeature / part.closeFeature
+
+Gate pattern required before ANY `update*` API call. `openFeature` sets the feature as active for editing; `closeFeature` commits changes and recalculates geometry.
+
+## Prerequisites
+
+- A part with at least one feature (box, cylinder, workPlane, etc.)
+- The feature ID (not the part ID)
+
+## The Pattern
+
+```js
+await api.v1.part.openFeature({ id: featureId })
+await api.v1.part.updateBox({ id: featureId, height: 120 })
+await api.v1.part.closeFeature({ id: featureId })
+// geometry is now updated — no recalc() needed
+```
+
+**This is not optional.** Calling any `update*` without `openFeature` first produces error 51.
+
+## Key Parameters
+
+Both take a single `id` parameter — the feature ID to open/close.
+**Accepted ID types:** feature, workgeometry, sketch, constraint, relation.
+
+## Return Value
+
+Both return VOID (null). maxLevel 31 = success.
+
+## Rules
+
+- One feature at a time (global lock)
+- Gate blocks ALL operations (creates too, not just updates)
+- Multiple updates OK within one session
+- closeFeature auto-recalculates
+- Close without open is harmless no-op
+- Match update type to feature type
+- @expr. syntax works in updates
+
+## Common Errors (4 documented with cause + fix)
+## Working Example (box + cylinder sequential edits)
+## Related APIs
```
