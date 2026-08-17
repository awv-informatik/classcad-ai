# Changes — drawing2d.getBoundaryBoxFromView

## New file: `references/drawing2d/getBoundaryBoxFromView.md`

```diff
+# drawing2d.getBoundaryBoxFromView
+
+Returns the min/max bounding box for each requested 2D view. Use this to measure view extents, verify centering, or compute layout offsets before placing views.
+
+## Prerequisites
+
+- A part or assembly with views already created via `drawing2d.view`
+- Without views: error 1200
+
+## Key Parameters
+
+- `id` — part or assembly ID (same as used for `view()`)
+- `types` — array of view type strings. **Required** — omitting causes error.
+
+## Return Value
+
+`Array<{ min: { x, y, z }, max: { x, y, z } }>` — one entry per existing view. z is always 0.
+**Result order matches the input `types` array order.**
+
+## Gotchas
+
+- Empty `types: []` returns `[]`, NOT all existing views (doc discrepancy)
+- Omitting `types` entirely causes error (parameter is required)
+- Invalid type string fails entire call (error 1013)
+- Non-existent types silently skipped
+- min/max are `{ x, y, z }` objects, not arrays
+- Float noise on RIGHT/LEFT views (~5e-15)
+
+## Bbox Dimensions by View Type (80×60×40 box)
+
+| Type | Width × Height |
+|---|---|
+| TOP / BOTTOM | 80 × 60 |
+| FRONT / BACK | 80 × 40 |
+| RIGHT / LEFT | 60 × 40 |
+| RIGHT_90 / LEFT_90 | 40 × 60 |
+| ISO | ~99 × ~90 |
+
+## Interaction with centerView and placeView
+
+Bboxes reflect current view position including centering and placement offsets.
```
