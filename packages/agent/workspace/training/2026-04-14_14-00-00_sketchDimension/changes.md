# Skill Changes — sketch.dimension training

## New file: `references/sketch/dimension.md`

```diff
+# sketch.dimension
+
+Creates dimensional constraints in a sketch. Dimensions are active constraints — they drive the solver to resize/reposition geometry to match the specified value.
+
+**Critical:** The constraint solver only runs when the sketch has an explicit `planeId`. Without it, dimensions are stored but never enforced.
+
+## Prerequisites
+- A part, a sketch with planeId, sketch geometry, FIXATION anchor
+
+## Key Parameters
+- id (required), type (required), geomIds (required)
+- value (optional — numbers, formulas, 'Ndeg'; @expr.NAME does NOT work)
+- name (optional), dimPos (optional), reflex (optional, ANGLE only)
+
+## Dimension Types (7 total)
+- OFFSET: CC_LinearFeatureDimension, 1 line or 2 lines
+- HORIZONTAL_DISTANCE: CC_LinearFeatureDimension, 1 line or 2 points
+- VERTICAL_DISTANCE: CC_LinearFeatureDimension, 1 line or 2 points
+- RADIUS: CC_RadialFeatureDimension, 1 circle/arc
+- DIAMETER: CC_DiameterFeatureDimension, 1 circle/arc (value = diameter)
+- ANGLE: CC_AngularFeatureDimension, 2 lines (dimPos selects sector, reflex for >180)
+- ANGLEOX: CC_AngularFeatureDimension, 1 line (angle to X axis)
+
+## Key findings
+- Solver resizes geometry immediately when value differs from current state
+- Auto-value (omit value) locks current measurement
+- @expr.NAME fails in value param — use updateDimension after creation
+- Negative values create broken dimensions (ID returned but maxLevel=51)
+- Batch creation works (array in → array out)
+- Non-null result ≠ success — always check maxLevel
```
