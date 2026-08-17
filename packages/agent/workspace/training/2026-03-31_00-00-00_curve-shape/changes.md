# Changes — curve.shape / deleteShape / cleanShape

## New file: `references/curve/shape.md`

```diff
+# curve.shape / deleteShape / cleanShape
+
+Shape containers hold 2D/3D curves inside an entity injection. All curve creation APIs (`curve.line`, `curve.circle`, etc.) require a shape ID as their `id` parameter.
+
+## curve.shape — Create a shape container
+
+### Prerequisites
+- An entity injection feature (`part.entityInjection`)
+
+### Key Parameters
+- `id` (required) — ID of the entity injection feature. Must be an EI ID, not a part ID.
+- `name` (optional) — display name. Default: `"Shape"`. Duplicate names auto-suffix.
+
+### Return Value
+Returns a numeric shape ID for use with all `curve.*` creation APIs.
+
+### Structure Tree
+Shape nodes are `CC_CurveEntity` (not `CC_Shape`), children of the EI node.
+Key properties: `geometryIdList`, `consumed` (always 1), `parent`.
+Curves are NOT child nodes — they exist in geometry data via `geometryIdList`.
+
+### Gotchas
+- Only accepts EI IDs (not part IDs)
+- No retrieval API — store shape ID at creation
+- Rename with `setObjectName`
+- Multiple shapes per EI supported
+
+## curve.deleteShape
+- Takes `ids` array of shape IDs. Deletes shapes + curves.
+- Only accepts shape IDs (error 1001 for wrong types)
+- Empty array = noop. Double-delete = error 1006.
+
+## curve.cleanShape
+- Takes `ids` array. Removes curves, keeps containers.
+- ALWAYS reports maxLevel=51 with internal error — this is a server bug, operation succeeds
+- Cleaned shapes accept new curves normally
+- Do not treat maxLevel=51 as failure for this API
```
