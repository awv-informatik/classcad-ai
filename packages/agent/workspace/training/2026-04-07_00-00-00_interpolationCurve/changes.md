# Changes — curve.interpolationCurve

## New file: `references/curve/interpolationCurve.md`

```diff
+# curve.interpolationCurve
+
+Creates an interpolation curve (spline) that passes **through** all given points. Unlike `bezierCurve` which only approximates toward control points, interpolation curves hit every point exactly.
+
+## Prerequisites
+
+- A part (`part.create`)
+- An entity injection (`part.entityInjection`)
+- A shape (`curve.shape`)
+
+## Key Parameters
+
+- `id` — shape ID (not part or EIF ID). Must be a shape container.
+- `points` — `Array<[x, y, z]>` of interpolation points. Minimum 2 points required. Each point must be a 3-element array.
+
+That's it — only two parameters. No degree parameter — degree is determined automatically as (number of points - 1).
+
+## Point Count and Degree
+
+- **2 points** → degree 1 (straight line segment)
+- **3 points** → degree 2 (quadratic interpolation)
+- **4 points** → degree 3 (cubic — most common)
+- **n points** → degree n-1
+
+## Gotchas
+
+- **CRITICAL: Single point HANGS THE SERVER.**
+- **CRITICAL: Duplicate consecutive points HANG THE SERVER.** Stricter than bezierCurve.
+- **CRITICAL: All-identical points HANG THE SERVER.**
+- **Empty points array `[]` almost certainly hangs.**
+- Points must be 3-element arrays.
+- 3D curves supported.
+
+## Interpolation vs Bezier
+
+interpolationCurve passes through all points. bezierCurve only approximates.
+
+## Batch Creation, Common Errors, Working Example, Related — see full file.
```
