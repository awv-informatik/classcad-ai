# Changes — sketch.linearPattern

## New file: `references/sketch/linearPattern.md`

```diff
+# sketch.linearPattern
+
+Patterns a rigid set (or single geometry element) in a linear/rectangular grid arrangement within a sketch.
+
+## Prerequisites
+
+- A sketch (`sketch.create`)
+- A rigid set (`sketch.rigidSet`) OR a single sketch geometry ID (line, arc, circle, etc.)
+
+## Key Parameters
+
+- `id` — sketch ID
+- `rigidSetId` — rigid set ID **or** a single geometry ID (the API auto-wraps singles into a rigid set internally)
+- `xCount` / `yCount` — total number of items along each axis **including the original**. `xCount: 3` = original + 2 copies. Default: 1. Must be >1 on at least one axis to produce copies.
+- `xDistance` / `yDistance` — spacing between neighboring items along each axis. Default: 0.
+
+## Return Value
+
+- geometry.length = xCount × yCount
+- dimensions = [xDimId | null, yDimId | null]
+- maxLevel 31 on success
+
+## Gotchas
+
+- Count includes the original (xCount: 3 = original + 2 copies)
+- Negative distance valid (copies go negative direction)
+- Zero distance valid (copies stack)
+- Count=0 / negative count = no copies (silent, not error)
+- Fractional counts floored
+- Single geometry ID works as rigidSetId (auto-wrapped)
+
+## Updating & Deleting
+
+- Dimension IDs updatable via sketch.updateDimension
+- Delete constraint via sketch.deleteObject — geometry survives
+
+## Working Example + Related APIs included
```
