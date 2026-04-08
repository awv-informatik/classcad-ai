# Changes — sketch.arcByCenter training

## New file: `references/sketch/arcByCenter.md`

```diff
+# sketch.arcByCenter
+
+Creates one or multiple arcs defined by start, end, and center positions. The center defines the arc radius — both endpoints must lie on the circle of that radius.
+
+## Prerequisites
+- A part (`part.create`)
+- A sketch (`sketch.create` or `part.sketch`)
+
+## Key Parameters
+- `id` (required) — sketch ID
+- `startPos`, `endPos`, `centerPos` (required) — [x, y, z], Z must be 0
+- `isClockwise` (optional, default TRUE) — CW/CCW arc direction
+- `genFixation` (optional, default TRUE) — auto-fix at origin only
+- `genIncidence` (optional, default TRUE) — auto-coinc on exact endpoint match
+
+## Key Findings
+- Radius constraint: |start-center| must equal |end-center|
+- getPositions WORKS directly on arc IDs (unlike circles)
+- getPoints returns {startId, endId, centerId}
+- updateGeometry requires all three positions (no partial updates)
+- isClockwise updatable via updateGeometry
+- Degenerate cases properly rejected (start==end, zero radius, non-zero Z)
+- Structure: CC_CircularArc with child points at offsets +1(end), +2(start), +3(center)
+- Arcs work with sketchRegion via geomIds
```
