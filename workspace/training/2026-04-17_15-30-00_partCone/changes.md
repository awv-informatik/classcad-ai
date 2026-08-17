# Changes — part.cone training session

## New file: `references/part/cone.md`

```diff
+# part.cone
+
+Creates a parametric cone (frustum) feature inside a part. Unlike `solid.cone` (direct geometry in an entity injection), `part.cone` lives in the feature tree, supports `updateCone`, expression-driven dimensions, and work coordinate system placement via `references`.
+
+## Prerequisites
+
+- A part (`part.create`)
+
+## Key Parameters
+
+- `id` — **part ID** (not entity injection ID — that's `solid.cone`)
+- `name` — feature name in the design tree (default: "Cone")
+- `bDiameter` — bottom diameter (default: 50). Must be > 0.
+- `tDiameter` — top diameter (default: 0.1). Must be > 0. **Cannot be 0** — true cone apex is not supported.
+- `height` — height in Z direction (default: 100). Must be > 0.
+- `references` — array of **workCSys IDs only**. Places the cone at the coordinate system's origin. Empty array or omitted = drawing origin.
+
+All dimension params accept numbers or expression strings (`'@expr.BD'`, `'4*20'`, `'sqrt(100)'`).
+
+## Return Value
+
+Feature ID (numeric) on success, with maxLevel 31 (info). The feature ID is what you pass to `updateCone`, `openFeature`, `closeFeature`, and other feature-targeting APIs.
+
+## Gotchas
+
+- **`tDiameter` cannot be 0.** The default 0.1 exists because a true cone point is invalid. Error 1122: "Value for top diameter must be greater than 0."
+- **All dimensions must be > 0.** Zero or negative values for any of bDiameter, tDiameter, height produce error 1122 but still create a degenerate feature (feature ID returned, no valid geometry).
+- **`references` only accepts workCSys IDs.** Passing a work plane, work axis, or work point ID fails with error 1001.
+- **`tDiameter > bDiameter` is valid** — produces an inverted cone (wider at top).
+- **`tDiameter = bDiameter` is valid** — produces a cylinder.
+- **`getExpression` does not read cone feature members.** Use the structure tree to verify values.
+
+## Common Errors
+
+| Code | Message | Cause |
+|------|---------|-------|
+| 1122 | "Value for [param] must be greater than 0" | Zero or negative dimension |
+| 1001 | "wrong id type!" | Non-workCSys ID in `references` |
+
+## updateCone
+
+- Requires open/close pattern
+- Partial updates: omitted params keep existing values
+- Supports expression-driven dimensions
+- Can add/remove references
+- Without openFeature: errors 1200 + 1004
+
+## Expression-Driven Dimensions
+
+Both `@expr.NAME` and inline math work at creation and update. Changing expressions + recalc updates the cone.
+
+## Working Example + Related APIs included.
```
