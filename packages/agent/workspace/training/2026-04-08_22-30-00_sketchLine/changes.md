# Changes — sketch.line training

## New file: `references/sketch/line.md`

```diff
+# sketch.line
+
+Creates one or multiple lines in a sketch. Returns the line ID(s).
+
+## Prerequisites
+- A part (`part.create`)
+- A sketch (`sketch.create` or `part.sketch`)
+
+## Key Parameters
+- `id` (required) — sketch ID
+- `startPos` (required) — [x,y,z], Z must be 0
+- `endPos` (required) — [x,y,z], Z must be 0
+- `genFixation` (optional, default TRUE) — auto-fixation at origin
+- `genIncidence` (optional, default TRUE) — auto-coincidence at shared endpoints
+- `genVertAndHoriz` (optional, default TRUE) — auto H/V constraints for axis-aligned lines
+- `genTangency` (optional, default TRUE) — auto-tangency with arcs
+
+## Key Findings
+- Line creates CC_Line with two CC_Point children (startPoint, endPoint)
+- Each line consumes 4 IDs (line + 2 points + 1 internal)
+- Batch creation returns array of IDs, auto-constraints generated between batch members
+- updateGeometry requires BOTH startPos and endPos (partial update → error 1004)
+- Degenerate lines (startPos == endPos) are silently accepted
+- Non-zero Z → error 1014
+- Auto-constraint flags are independent of each other
```
