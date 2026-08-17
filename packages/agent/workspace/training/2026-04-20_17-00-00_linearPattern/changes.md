# Changes — linearPattern training session

## New files

### references/part/linearPattern.md (new)

```diff
+# part.linearPattern
+
+Creates a linear pattern feature that repeats one or more target features along one or two directions, producing evenly spaced copies.
+
+## Prerequisites
+- A part (`part.create`) with at least one feature containing solid geometry
+- A direction reference: work axis, brep edge, or two work points
+
+## Key Parameters
+- `id` — **part ID** (not feature ID)
+- `targets` — array of feature IDs to pattern (flat IDs or object format with indices)
+- `dir1` — required first direction: references, distance, count, inverted, merged
+- `dir2` — optional second direction for 2D grids
+- `name` — feature name (default "LinearPattern")
+
+## Gotchas
+- count includes the original (count=4 → 1 original + 3 copies)
+- count=0 errors with misleading message
+- inverted and merged use numeric 0/1
+- merged: 1 performs boolean union
+- Two work points define custom direction
+- Brep edges work as direction references
+- Multiple targets patterned together
+
+## Working Example — 1D, 2D grid, and expression-driven patterns
```

### references/part/updateLinearPattern.md (new)

```diff
+# part.updateLinearPattern
+
+Modifies an existing linear pattern feature. Partial updates supported.
+
+## Key findings
+- Requires openFeature/closeFeature gate
+- Partial dir1/dir2 updates work
+- Can add dir2 via update (1D → 2D)
+- merged can be toggled via update
+
+## Working Example — update count, add dir2, toggle merged
```
