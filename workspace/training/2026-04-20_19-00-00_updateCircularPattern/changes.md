# Changes — updateCircularPattern training session

## New files

### references/part/updateCircularPattern.md (new)

```diff
+# part.updateCircularPattern
+
+Modifies an existing circular pattern feature. Partial updates supported.
+
+## Key findings
+- Requires openFeature/closeFeature gate
+- Partial updates work (count, angle, inverted, references, targets — each independently)
+- Rotation axis can be changed via update (reorients entire pattern)
+- Targets can be added/removed via update
+- merged still fails (inherits boolean error 1001 from circularPattern)
+
+## Working Example — update count, change axis, change angle + invert
```
