# Changes — rotation training session

## New files

### references/part/rotation.md (new)

```diff
+# part.rotation
+
+Creates a parametric rotation feature that rotates target features around an axis.
+
+## Key findings
+- Rotates in-place, not a copy — for copies use circularPattern
+- Angle in radians, CCW default, CW with inverted=1
+- Expression-driven angle via @expr. syntax
+- Multiple targets rotate together
+- Unlike solid.rotation, creates a feature in design tree
+
+## Working Example — 45° rotation, expression-driven
```
