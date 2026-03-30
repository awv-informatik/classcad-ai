# Changes — workAxis training session

## New file: `references/part/workAxis.md`

```diff
+# part.workAxis
+
+Creates a work axis feature — an invisible construction line used as a revolve axis, pattern direction, or positioning reference.
+
+## Prerequisites
+
+- A part (`part.create`)
+- For referenced types (POINTDIRECTION, CURVE, 2POINTS, 2PLANES): brep geometry IDs from `part.getGeometryIds` or work geometry IDs
+
+## Key Parameters
+
+- **`id`** (required) — part ID
+- **`name`** — feature name, default `"WorkAxis"`. Duplicate names are allowed but `getWorkGeometry` only returns the first match. Use unique names.
+- **`type`** — one of 5 types (default `"USERDEFINED"`):
+
+| Type | References needed | Description |
+|------|------------------|-------------|
+| `USERDEFINED` | none | Free-standing axis defined by `position` and `direction` |
+| `POINTDIRECTION` | 1 point + 1 direction | Point + direction. Flexible — also accepts two edges. |
+| `CURVE` | 1 edge | Only sketch-arc, sketch-circle, edge-arc, edge-circle, edge-line. **NOT work axis IDs.** |
+| `2POINTS` | 2 points | Two distinct points. Same point twice → error. |
+| `2PLANES` | 2 planes | Intersection line. Parallel planes → error. |
+
+- **`position`** — `[x,y,z]` numeric only. **No expression strings.**
+- **`direction`** — `[x,y,z]` numeric only. Default `[1,0,0]`. Zero vector silently accepted (degenerate).
+
+## Built-in Work Axes
+
+| Name | Direction |
+|------|-----------|
+| `XAxis` | `[1,0,0]` |
+| `YAxis` | `[0,1,0]` |
+| `ZAxis` | `[0,0,1]` |
+
+## Key Gotchas
+
+- Zero direction silently accepted → degenerate axis
+- Expression strings in position/direction arrays → type error
+- CURVE type rejects work axis IDs (doc discrepancy)
+- updateWorkAxis requires openFeature/closeFeature
+- Duplicate names silently allowed
+
+## Includes
+
+- Full error table (8 common errors with causes and fixes)
+- Working example with USERDEFINED, 2PLANES, linearPattern, and update
+- Related APIs section
```
