# Changes — circularPattern training session

## New files

### references/part/circularPattern.md (new)

```diff
+# part.circularPattern
+
+Creates a circular pattern feature that repeats one or more target features around an axis, producing evenly spaced rotated copies.
+
+## Prerequisites
+- A part (`part.create`) with at least one feature containing solid geometry
+- A rotation axis reference: work axis, brep edge, or work points
+
+## Key Parameters
+- `id` — **part ID** (not feature ID)
+- `targets` — array of feature IDs to pattern (flat IDs or object format with indices)
+- `references` — array containing a work axis ID or brep edge ID defining the rotation axis
+- `angle` — angular spacing in radians (or @expr.NAME). Default 0.
+- `count` — total including original (or @expr.NAME). Default 2.
+- `inverted` — 1 to reverse direction. Default 0.
+- `merged` — **currently broken** — always fails with error 1001
+- `name` — feature name (default "CircularPattern")
+
+## Gotchas
+- angle=0 stacks copies at same position, NOT equal spacing
+- count includes the original
+- merged: 1 fails with boolean error 1001
+- inverted and negative angle both reverse direction
+- Default rotation is CCW (right-hand rule)
+- Brep edges work as axis references
+- Multiple targets patterned together
+
+## Working Example — 6-arm radial pattern, expression-driven spacing
```
