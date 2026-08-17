# Changes — mirror & updateMirror training

## New files

### `references/part/mirror.md` (new)

```diff
+# part.mirror
+
+Creates a mirror feature that reflects one or more target features across a work plane, producing mirrored copies as separate bodies.
+
+## Prerequisites
+- A part with at least one feature containing solid geometry
+- A work plane to mirror across
+
+## Key Parameters
+- `id` — part ID
+- `targets` — feature IDs (flat or object format with indices)
+- `references` — work plane ID only (brep faces rejected despite docs)
+- `name` — default "Mirror"
+
+## Gotchas
+- references only accepts work plane IDs (doc says "planes or faces" but faces fail)
+- Mirror creates separate bodies, never merges
+- Empty references creates degenerate feature
+- Chain mirrors work for multi-axis symmetry
+
+## Common Errors
+- 1006: invalid reference/target ID
+- 1004: missing targets or empty targets array
+- 1111: empty references array
```

### `references/part/updateMirror.md` (new)

```diff
+# part.updateMirror
+
+Updates mirror feature name, targets, or reference plane.
+
+## Key findings
+- Requires openFeature/closeFeature (error 1200 without)
+- targets is a full replacement, not additive
+- Same work-plane-only restriction on references
```
