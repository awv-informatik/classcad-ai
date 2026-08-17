# Changes — part.extrusion training

## New file: `references/part/extrusion.md`

```diff
+# part.extrusion
+
+Creates a parametric extrusion feature inside a part by sweeping a 2D sketch profile along a direction. Unlike `solid.extrusion` (direct geometry in an EIF), this lives in the feature tree, supports `updateExtrusion`, and can be driven by expressions.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch with `planeId` set (e.g., `sketch.create({ id: partId, planeId: topPlaneId })`)
+- Either a sketch region (`sketch.sketchRegion`) or sketch contour elements (line IDs forming a closed loop)
+
+## Key Parameters
+
+- `id` — **part ID** (not sketch ID, not region ID, not EIF ID)
+- `references` — **required**. Array of sketch region IDs or sketch contour element IDs (line IDs). Both work.
+- `type` — UP (default), DOWN, SYMMETRIC, CUSTOM
+- `limit2` — distance (default: 100). Negative reverses direction.
+- `limit1` — start offset, CUSTOM only (default: 0)
+- `direction` — CUSTOM only, magnitude irrelevant
+- `taperAngle` — radians, positive = inward, negative = outward
+- `capEnds` — integer 1/0 (NOT strings)
+
+## Key Findings
+
+- Sketch must have planeId set or extrusion produces Sketch.GetNormal error
+- references accepts both region IDs and contour element IDs (line IDs)
+- capEnds requires integer booleans — strings rejected
+- direction silently ignored for non-CUSTOM types
+- direction magnitude irrelevant (unlike solid.extrusion)
+- limit2=0 creates degenerate feature
+- negative limit2 reverses direction (valid)
+- direction can't be perpendicular to sketch normal
+- works on any sketch plane (not just XY)
```
