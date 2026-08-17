# Changes — part.revolve training

## New file: `references/part/revolve.md`

```diff
+# part.revolve
+
+Creates a parametric revolve feature by rotating a 2D sketch profile around an axis. Produces solids of revolution — cylinders, rings, domes, or any lathe shape. Lives in the feature tree, supports `updateRevolve`, and can be driven by expressions.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch with `planeId` set (same requirement as extrusion)
+- Either a sketch region (`sketch.sketchRegion`) or sketch contour elements (line IDs forming a closed loop)
+- An axis: a work axis, sketch line, brep edge, or two points
+
+## Key Parameters
+
+- `id` — **part ID** (not sketch ID, not feature ID)
+- `references` — **required**. Array of sketch region IDs or sketch contour element IDs (line IDs). Both work identically. Must form a closed profile.
+- `axisIds` — **required**. Array of IDs defining the rotation axis. Two forms:
+  - Single line: `[workAxisId]` or `[sketchLineId]` or `[brepEdgeId]`
+  - Two points: `[point1Id, point2Id]` (work points, sketch points, or brep vertices)
+- `startAngle` — start angle in radians (default: 0). Accepts numbers or `@expr.NAME` strings.
+- `endAngle` — end angle in radians (default: 2*PI). Accepts numbers or `@expr.NAME` strings.
+- `inverted` — **integer boolean** (1 or 0, NOT JS `true`/`false`, NOT string `'TRUE'`/`'FALSE'`). `0` (default) = CCW rotation, `1` = CW rotation.
+- `name` — feature name (default: "Revolve")
+
+## Angle Behavior (table)
+## Return Value
+## Gotchas (7 items)
+## Common Errors (3 entries)
+## Working Example (full, tested)
+## Related (6 links)
```

Full file: 140 lines covering all parameters, angle behavior table, cross-part bug, inverted integer-boolean gotcha, expression support, axis types, and working examples.
