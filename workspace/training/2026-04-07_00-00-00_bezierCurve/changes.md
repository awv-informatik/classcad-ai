# Changes — curve.bezierCurve training session

## New file: `references/curve/bezierCurve.md`

```diff
+# curve.bezierCurve
+
+Creates one or more Bezier curves of degree n, where n = (number of control points - 1).
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
+- `points` — `Array<[x, y, z]>` control points. Minimum 2 points required. Each point must be a 3-element array.
+
+That's it — only two parameters. No optional parameters exist.
+
+## Degree and Control Points
+
+- **2 points** → degree 1 (straight line segment)
+- **3 points** → degree 2 (quadratic Bezier)
+- **4 points** → degree 3 (cubic Bezier — most common)
+- **n+1 points** → degree n
+
+High-degree curves (10+ control points) are supported. At high degrees, the curve strongly averages all control points and becomes very smooth/flat.
+
+## Return Value
+
+Returns `null` (VOID). maxLevel 31 on success. No ID is returned — the curve merges into the shape's geometry like all curve APIs.
+
+## Gotchas
+
+- **CRITICAL: Empty points array `[]` HANGS THE SERVER.**
+- **Minimum 2 control points.** Single point = error code 1007.
+- **Duplicate control points accepted silently.** Creates degenerate zero-length curve.
+- **Points must be 3-element arrays.** 2D points = error.
+- **No per-curve IDs.** Curves merge into shape geometry.
+- **3D curves supported.** Control points don't need to be coplanar.
+
+## Common Errors
+
+| Code | Level | Message | Cause |
+|------|-------|---------|-------|
+| 1004 | ERROR | Missing "points" parameter | No points param |
+| 1001 | ERROR | Wrong id type | Non-shape ID |
+| 0 | ERROR | Point must have exactly 3 real values | 2D points |
+| 0 | ERROR | Creation of nurbs curve failed (1007) | Only 1 control point |
+| — | HANG | (no response) | Empty points array |
```
