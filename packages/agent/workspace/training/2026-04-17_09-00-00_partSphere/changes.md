# Changes — part.sphere / part.updateSphere

## New file: `references/part/sphere.md`

```diff
+# part.sphere
+
+Creates a parametric sphere feature inside a part. Unlike `solid.sphere` (direct geometry in an entity injection), `part.sphere` lives in the feature tree, supports `updateSphere`, expression-driven radius, and work coordinate system placement via `references`.
+
+## Prerequisites
+
+- A part (`part.create`)
+
+## Key Parameters
+
+- `id` — **part ID** (not entity injection ID — that's `solid.sphere`)
+- `name` — feature name in the design tree (default: "Sphere")
+- `radius` — sphere radius (default: 100). Must be > 0. Accepts numbers or expression strings (`'@expr.R'`, `'sqrt(900)'`, `'@expr.R * @expr.factor'`)
+- `references` — array of **workCSys IDs only**. Places the sphere center at the coordinate system's origin. Empty array or omitted = drawing origin
+
+## Return Value
+
+Feature ID (numeric) on success, with maxLevel 31 (info).
+
+## Gotchas
+
+- `references` only accepts workcsys IDs (error 1001 for others, result null)
+- Zero/negative radius creates degenerate feature (error 1122, feature ID still returned)
+- Multiple spheres in one part are fine
+
+## Common Errors
+
+| Code | Message | Cause |
+|------|---------|-------|
+| 1122 | "Value for radius must be greater than 0" | Zero or negative radius |
+| 1001 | "wrong id type!" | Non-workCSys ID in references |
+
+## updateSphere
+
+- Requires open/close pattern
+- Returns feature ID on success, null on failure
+- Omitted params keep existing values (partial update)
+- Supports expressions in radius param
+- Can add/remove references, rename feature
+- Without openFeature: null + errors 1200 + 1004
+
+## Expression-Driven Radius + Working Example + Related
+
+(Full content in file)
```
