# Changes — translation training session

## New files

### references/part/translation.md (new)

```diff
+# part.translation
+
+Creates a parametric translation feature that MOVES target features along a direction.
+
+## Key findings
+- This is a MOVE, not a copy — targeted features shift position
+- Non-targeted features stay in place
+- distance=0 valid (no-op placeholder)
+- inverted=1 reverses direction
+- Two work points define custom direction
+- Expression-driven distance via @expr. syntax
+- Multiple targets move together
+- Unlike solid.translation, creates a feature in design tree
+
+## Working Example — basic translation, expression-driven
```
