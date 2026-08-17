# Changes — common.setAppearance training

## New file: `references/common/setAppearance.md`

```diff
+# common.setAppearance
+
+Sets visual appearance properties (color, transparency, faceting quality) on a feature or specific solids within a feature.
+
+## Prerequisites
+
+- A feature with geometry — entity injection features, part features (`part.box`, `part.extrusion`, etc.), or direct solid IDs
+
+## Valid Targets
+
+The `target` must be an **operation/feature ID**. Not all IDs work:
+
+| Target type | Works? | Notes |
+|---|---|---|
+| Entity injection feature ID | ✅ | Primary use case |
+| Part feature ID (`part.box`, `part.extrusion`, etc.) | ✅ | |
+| Direct solid ID (e.g., from `solid.box`) | ✅ | |
+| Part container ID | ❌ | Error 1007: "must be an operation id" |
+| Sketch ID | ❌ | Error 1007: "must be an operation id" |
+| Work geometry ID (work plane, axis, etc.) | ❌ | Error 1007: "must be an operation id" |
+| Invalid/nonexistent ID | ❌ | Error 1006: "invalid id" |
+
+## Key Parameters
+
+- **`target`** — feature ID (plain number) or object `{ id, indices }` for per-solid targeting
+  - `indices` — 0-based array selecting specific solids within a multi-solid feature
+  - Multiple indices in one call: `indices: [0, 2]` works
+  - Empty `indices: []` silently succeeds (no-op)
+  - Out-of-range index → error: "objId not found"
+- **`color`** — `[r, g, b]` array, range 0–255. **Must be exactly 3 elements** — 2 or 4 elements → error 1002
+  - Values outside [0,255] silently accepted (no clamping, no validation)
+  - Float values accepted
+- **`transparency`** — 0 (opaque) to 1 (fully transparent)
+  - Values outside [0,1] silently accepted (no validation)
+- **`chordHeightTol`** — per-feature chord height tolerance (overrides global `setFacetingParameters`)
+- **`angleTol`** — per-feature angle tolerance (overrides global `setFacetingParameters`)
+
+## Return Value
+
+Returns `result: null` (VOID). Success is `maxLevel <= 31`.
+
+## Array Form (Batch)
+
+Accepts an array of param objects to set appearance on multiple targets in one call.
+Can mix plain target IDs and `{ id, indices }` objects in the array.
+
+## Gotchas
+
+- **No range validation** — out-of-range color/transparency values silently accepted
+- **No getAppearance API** — use `requestVisualisation` to read back stored values
+- **Transparency vs opacity naming** — setAppearance takes `transparency`, requestVisualisation returns `opacity`
+- **Harness renderer ignores color** — use requestVisualisation to verify
+- **Empty call is a no-op**
+
+## Per-Feature Faceting
+
+`chordHeightTol` and `angleTol` override global settings per-feature. Visually confirmed. Persists through OFB save/load.
+
+## Common Errors, Working Example, Persistence, Related APIs documented.
```
