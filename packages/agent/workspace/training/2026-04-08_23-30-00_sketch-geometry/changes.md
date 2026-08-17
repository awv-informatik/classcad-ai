# Changes — sketch.geometry training

## New file: `references/sketch/geometry.md`

```diff
+# sketch.geometry
+
+Batch-creates one or more sketch geometry items (points, lines, arcs, circles) in a single call. Functionally equivalent to calling `sketch.point`, `sketch.line`, `sketch.circle`, `sketch.arcBy3Points`, `sketch.arcByCenter` individually — this is a convenience wrapper that reduces round-trips.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch (`sketch.create`)
+
+## Key Parameters
+
+- `id` — sketch ID (required)
+- `points` — array of `{ pos: [x,y,z] }`
+- `lines` — array of `{ startPos, endPos }`
+- `arcsBy3Points` — array of `{ startPos, endPos, midPos }` — `midPos` is a point ON the arc, not the center
+- `arcsByCenter` — array of `{ startPos, endPos, centerPos, isClockwise? }` — `isClockwise` defaults to TRUE
+- `circles` — array of `{ centerPos, radius }`
+- `genFixation` — auto-generate fixation constraint at origin (default TRUE)
+- `genIncidence` — auto-generate coincidence constraints when endpoints overlap (default TRUE)
+- `genTangency` — auto-generate tangency constraints between touching curves (default TRUE)
+- `genVertAndHoriz` — auto-generate horizontal/vertical constraints for axis-aligned lines (default TRUE)
+
+All geometry arrays are optional. You can pass any combination, including none at all.
+
+## Return Value
+
+Always returns all 5 arrays (points, lines, arcsBy3Points, arcsByCenter, circles), even for types not requested. IDs in ascending order matching input array order.
+
+## Gotchas
+
+- No input validation for degenerate geometry (zero-radius circles, zero-length lines, negative radius)
+- Empty/missing arrays are fine — no error
+- gen flags affect ALL geometry in the call, not selectively
+- Structure tree contains ALL objects in the drawing, not just what was just created
+
+## Auto-Constraint Flags
+
+Documents the 4 gen flags and their constraint classes (CC_2DFixationConstraint, CC_2DHorizontalConstraint, CC_2DCoincidentConstraint, CC_2DVerticalConstraint). All OFF = 0 constraints.
+
+## Working Example + Related APIs
```
