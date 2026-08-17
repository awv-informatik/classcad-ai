# Changes — part.box training session

## New file: `references/part/box.md`

```diff
+# part.box
+
+Creates a parametric box feature inside a part. Unlike `solid.box` (which creates direct geometry in an entity injection), `part.box` lives in the feature tree, supports `updateBox`, expression-driven dimensions, and work coordinate system placement via `references`.
+
+## Prerequisites
+
+- A part (`part.create`)
+
+## Key Parameters
+
+- `id` — **part ID** (not entity injection ID — that's `solid.box`)
+- `name` — feature name in the design tree (default: "Box")
+- `length`, `width`, `height` — dimensions in X, Y, Z respectively. Default: 100 each. Accept numbers or expression strings (`'@expr.W'`, `'3*25'`, `'sqrt(100)'`)
+- `references` — array of **workCSys IDs only**. Places the box at the coordinate system's origin. Empty array or omitted = drawing origin
+
+## Return Value
+
+Feature ID (numeric) on success, with maxLevel 31 (info). The feature ID is what you pass to `updateBox`, `openFeature`, `closeFeature`, and other feature-targeting APIs.
+
+## Gotchas
+
+- **`references` only accepts `workcsys` IDs.** Passing a work plane, work axis, or work point ID fails with error code 1001.
+- **Zero/negative dimensions create degenerate features.** Returns ID + error (maxLevel 51, code 1122).
+- **Multiple boxes in one part are fine.**
+- **Feature name vs body name:** `updateBox({ name })` changes the feature name but not the internal body child node name.
+
+## Common Errors
+
+| Code | Message | Cause |
+|------|---------|-------|
+| 1122 | "Value for [param] must be greater than 0" | Zero or negative dimension |
+| 1001 | "wrong id type! Provide only following id types: ['workcsys']" | Non-workCSys ID in `references` |
+
+## updateBox
+
+- Requires openFeature/closeFeature pattern
+- `id` is the feature ID (not part ID)
+- Partial updates preserve omitted params
+- Supports expression strings
+- Can add/remove references
+- Geometry regenerates on closeFeature (no separate recalc)
+- Without openFeature: error code 1200
+
+## Expression-Driven Dimensions
+
+Both `@expr.NAME` and inline math expressions work.
+
+## part.box vs solid.box comparison table
+
+| | `part.box` | `solid.box` |
+|---|---|---|
+| Container | Part (feature tree) | Entity injection |
+| Update API | `updateBox` | None |
+| Positioning | `references` (workCSys) | `translation`, `rotation` |
+| Expressions | `@expr.` syntax | Not supported |
+| Feature tree | Yes | No |
```
