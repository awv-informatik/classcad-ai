# Skill Changes — part.slice and part.updateSlice

## New files

- `references/part/slice.md` — LLM doc for `part.slice`
- `references/part/updateSlice.md` — LLM doc for `part.updateSlice`

## Diff

```diff
diff --git a/references/part/slice.md b/references/part/slice.md
new file mode 100644
--- /dev/null
+++ b/references/part/slice.md
@@ -0,0 +1,102 @@
+# part.slice
+
+Creates a slice feature that cuts solids at a work plane, keeping one side and discarding the other.
+
+## Prerequisites
+
+- A part (`part.create`)
+- At least one solid feature (e.g., `part.box`, `part.cylinder`, etc.)
+- A work plane to slice at (built-in like `'Top'` or custom via `part.workPlane`)
+
+## Key Parameters
+
+- `id` — part ID (not feature ID)
+- `targets` — features to slice. Accepts plain IDs `[featureId]` or objects `[{ id: featureId, indices: [0] }]`. All target features are **consumed** after the operation.
+- `reference` — work plane ID to slice at. **Required** despite being marked optional in the API docs. Omitting it gives error code 1004.
+- `inverted` — which side to keep. `0` (FALSE, default): keep the side along the plane's normal vector (+normal). `1` (TRUE): keep the opposite side (-normal).
+- `name` — optional, defaults to `"Slice"`.
+
+## Return Value
+
+Returns a **new feature ID** — not the target ID. This is the same pattern as `part.boolean`.
+
+## Consumption Behavior
+
+**Target features are consumed.** Reusing them gives error code 1014.
+
+## Gotchas
+
+- **`reference` is required.** Omitting it always errors (code 1004).
+- **Plane missing the solid is a silent no-op.** Succeeds, solid preserved.
+- **Angled planes work.** Non-axis-aligned cuts supported.
+
+## Common Errors
+
+- Code 1004: missing reference
+- Code 1001: null reference (wrong plane name)
+- Code 1014: reusing consumed target
+
+(Full examples and multi-target usage included in the file)

diff --git a/references/part/updateSlice.md b/references/part/updateSlice.md
new file mode 100644
--- /dev/null
+++ b/references/part/updateSlice.md
@@ -0,0 +1,66 @@
+# part.updateSlice
+
+Updates an existing slice feature — changes reference plane, inverted flag, targets, or name.
+Requires `openFeature`/`closeFeature` gate. Returns same slice feature ID.
+
+## Gotchas
+
+- `openFeature` mandatory — code 1200 without it
+- Only pass params you want to change
+
+(Full examples included in the file)
```
