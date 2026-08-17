# Changes — sketch.fillet training session

## New file: `references/sketch/fillet.md`

```diff
+# sketch.fillet
+
+Creates a fillet arc at the intersection of two connected sketch lines, replacing the sharp corner with a smooth arc. Also covers `sketch.undoFillet` which reverses the operation.
+
+## Prerequisites
+
+- A sketch (`sketch.create`)
+- Two `sketch-line` elements that share an incident point (connected at a corner)
+
+## Key Parameters
+
+- `id` — sketch ID
+- `lineIds` — array of exactly 2 line IDs. Must be `sketch-line` type — arcs, circles, and other sketch elements are rejected (error code 1001).
+- `offset` — distance from the incidence point to the arc start/end. Takes precedence over `radius` if both are set. Must be > 0 and smaller than both line lengths.
+- `radius` — radius of the fillet arc. Ignored if `offset` is also set.
+- If neither `offset` nor `radius` is set, defaults to `offset = 1/4 * shortest_line_length`.
+
+## Return Value
+
+Returns an array of 4 IDs: `[arcId, controlPointId, startPointId, endPointId]`
+
+## Gotchas
+
+- `offset` silently overrides `radius`
+- Zero offset/radius is an error
+- Offset must not exceed line length
+- Lines must share an incident point
+- Cannot fillet same pair twice (arc separates them)
+- Only `sketch-line` IDs accepted
+- Negative offset creates an exterior fillet
+
+## undoFillet
+
+- Returns VOID, pass arcId from fillet result tuple
+- After undo, re-filleting produces new IDs
+
+## Common Errors table, Working Example, Related APIs
```
