# Changes — sketch.dimension training

## New file: `references/sketch/dimension.md`

```diff
+# sketch.dimension
+
+Creates dimensional constraints in a sketch. Unlike geometric constraints, dimensions carry a numeric value (length, angle, radius) that can be set and updated.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch (`sketch.create`)
+- Sketch geometry to dimension (lines, points, circles, arcs)
+
+## Key Parameters
+
+- **`id`** (required) — sketch ID.
+- **`type`** (required) — one of: `OFFSET`, `HORIZONTAL_DISTANCE`, `VERTICAL_DISTANCE`, `RADIUS`, `DIAMETER`, `ANGLE`, `ANGLEOX`.
+- **`geomIds`** (required) — array of sketch geometry IDs. Required count and valid geometry types depend on type (see table below).
+- **`name`** (optional) — names the dimension object. Appears in the structure tree.
+- **`dimPos`** (optional) — **ANGLE type only.** Position of the dimension text; also selects which angle sector to constrain. Causes error on all other types.
+- **`reflex`** (optional, default FALSE) — **ANGLE type only.** When true, constrains the reflex angle (>180°).
+- **`value`** — **BROKEN. Do not use.** Always fails with "Couldn't set the value for dimension" regardless of type or value format. Use `updateDimension` after creation instead.
+
+## Dimension Types and geomIds (table)
+## Return Value, Critical notes, Working Pattern, Batch Creation
+## updateDimension, updateDimensionPosition
+## Structure Tree, Common Errors, Related
```

Full 120-line file covering all 7 dimension types, geomId rules, the broken `value` param finding, updateDimension/updateDimensionPosition behavior, structure tree classes, and error catalog.
