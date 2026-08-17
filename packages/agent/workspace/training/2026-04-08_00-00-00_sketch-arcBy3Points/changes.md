# Changes — sketch.arcBy3Points training

## New file: `references/sketch/arcBy3Points.md`

```diff
+# sketch.arcBy3Points
+
+Creates one or multiple arcs defined by start, mid, and end positions in a sketch.
+
+## Key findings documented:
+
+- midPos does double duty: selects circle AND selects which arc (major/minor)
+- Internal representation identical to arcByCenter (CC_CircularArc)
+- Server computes center from 3 points; getPositions/getPoints return computed center
+- Update uses `arcsByCenter` key in updateGeometry (not a 3-point variant)
+- genTangency generates CC_2DTangentSketchConstraint for arc-to-arc only, NOT line-to-arc
+- genFixation/genIncidence behavior matches arcByCenter
+- Degenerate points (collinear/coincident) → "Invalid arc parameters" error
+- Batch error isolation: valid entries succeed despite invalid entries returning null
+- Non-zero Z → error 1014 (same as all sketch geometry)
```

Full diff: 167 lines added (new file).
