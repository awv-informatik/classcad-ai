# Changes — sketch.copyGeometry training

## New file: `references/sketch/copyGeometry.md`

```diff
+# sketch.copyGeometry
+
+Copies sketch geometry elements within the same sketch, offset by a translation vector.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch (`sketch.create` or `part.sketch`)
+- At least one geometry element in the sketch to copy
+
+## Key Parameters
+
+- **`id`** (required) — sketch ID
+- **`geomIds`** (required) — array of geometry IDs to copy. Accepts lines, circles, arcs, points, and mixed types. One output ID per input element.
+- **`translation`** (required) — `[x, y, z]` offset vector. **This is not optional** — omitting it produces error 1004. `[0, 0, 0]` is valid (copies on top of original).
+- **`doCopyConstraints`** (optional, default TRUE) — whether to copy constraints from the original elements.
+
+## Return Value
+
+**Critical gotcha:** The return value depends entirely on `doCopyConstraints`:
+
+- `doCopyConstraints: true` (or omitted/default) → **result is always `null`**. The copy succeeds (geometry appears), but no IDs are returned. The docs claim `id[]|VOID` but the actual behavior is null.
+- `doCopyConstraints: false` → **result is `id[]`** — an array of new geometry IDs, one per input element in matching order.
+
+**If you need the IDs of copied elements, you must pass `doCopyConstraints: false`.** This is the only way.
+
+## Gotchas
+
+- `translation` is required despite no `[param.translation]` bracket marking in the source docs. Omitting it → error 1004.
+- Empty `geomIds: []` is a silent no-op — null result, maxLevel 31, no messages, no error.
+- Invalid IDs in geomIds → error 1006
+- Null values in geomIds → error 1001
+- The `doCopyConstraints` flag controls the return type, not just constraint behavior. This is undocumented.
+
+## Common Errors
+
+| Code | Message | Cause |
+|------|---------|-------|
+| 1004 | "The parameter \"translation\" must be provided" | Missing `translation` param |
+| 1006 | "An element of parameter \"geomIds\" has an invalid id!" | Non-existent ID in geomIds |
+| 1001 | "An element of parameter \"geomIds\" has the wrong type!" | Null or non-id value in geomIds |
+
+## Working Example + Related APIs included.
```
