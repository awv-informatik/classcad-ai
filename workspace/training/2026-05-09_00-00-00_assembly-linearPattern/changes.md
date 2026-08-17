# Changes — assembly.linearPattern / assembly.circularPattern

## New files

### `references/assembly/linearPattern.md` (new)

```diff
+# assembly.linearPattern / updateLinearPattern / getLinearPattern
+
+Creates a linear pattern of instances — copies of a seed instance spaced along one or two directions.
+
+## Key findings documented:
+- dir1.count is total including seed (not number of copies)
+- mate1.flip determines pattern axis (default "Z")
+- mate2 + dir2 create 2D grids, total = count1 × count2
+- updateLinearPattern takes constraint ID, not assembly ID
+- Existing instances are repositioned on update, not deleted
+- getLinearPattern always returns dir2 (with defaults if unset)
```

### `references/assembly/circularPattern.md` (new)

```diff
+# assembly.circularPattern / updateCircularPattern / getCircularPattern
+
+Creates a circular pattern of instances rotated around an axis, optionally with helix offset.
+
+## Key findings documented:
+- instanceCount includes seed
+- angle is between adjacent copies (not total span)
+- Degree strings ('90deg') accepted, stored/returned as radians
+- offset produces helix along rotation axis
+- updateCircularPattern takes constraint ID, not assembly ID
+- getCircularPattern always returns angle in radians
```
