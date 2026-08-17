# Changes — curve.arcByCenter

## New file: `references/curve/arcByCenter.md`

```diff
+# curve.arcByCenter
+
+Creates one or more arcs defined by center point, start point, end point, and a clockwise flag.
+The radius is determined by the distance from center to start. The `isClockwise` flag selects
+which of the two possible arcs (major or minor) is drawn.
+
+## Key findings documented:
+
+- isClockwise=TRUE (default) sweeps clockwise → major arc for acute angles
+- isClockwise=FALSE sweeps counterclockwise → minor arc for acute angles
+- startPos == endPos creates a FULL CIRCLE (not an error)
+- startPos and endPos must be equidistant from centerPos (same radius)
+- CRITICAL: center == start/end HANGS THE SERVER (zero radius → infinite loop)
+- Batch creation supported via array parameter
+- Fully 3D — arc plane determined by the three points
+- Points must be [x,y,z] — no 2D shorthand
+- isClockwise accepts boolean and numeric values
+- No update/delete methods for individual arcs
+- All error codes and messages documented from live testing
+- Working examples: simple arc, rounded rectangle corner, full circle
```
