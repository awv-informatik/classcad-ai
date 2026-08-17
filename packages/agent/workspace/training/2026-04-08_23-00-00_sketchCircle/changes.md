# Changes — sketch.circle training

## New file: `references/sketch/circle.md`

```diff
+# sketch.circle
+
+Creates one or multiple circles in a sketch. Returns the circle ID(s).
+
+## Prerequisites
+- A part (`part.create`)
+- A sketch (`sketch.create` or `part.sketch`)
+
+## Key Parameters
+- `id` (required) — sketch ID
+- `centerPos` (required) — [x,y,z], Z must be 0
+- `radius` (required) — zero and negative values silently accepted
+- `genFixation` (optional, default TRUE) — auto-fixation at origin only
+- `genIncidence` (optional, default TRUE) — auto-coincidence at matching points
+
+## Key Findings
+- Circle creates CC_Circle with one CC_Point child ("center")
+- Each circle consumes 3 IDs (circle + center point + 1 internal)
+- getPositions does NOT work on circle IDs (doc discrepancy) — use getPoints→centerId→getPositions
+- updateGeometry requires BOTH centerPos and radius (partial update → error 1004)
+- Zero and negative radii silently accepted, stored as-is
+- Non-zero Z → error 1014
+- Batch creation returns array of IDs
+- Auto-constraint flags behave same as sketch.point
```
