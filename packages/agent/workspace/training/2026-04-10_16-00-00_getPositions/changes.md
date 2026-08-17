# Changes — sketch.getPositions training

## New file: `references/sketch/getPositions.md`

```diff
+# sketch.getPositions
+
+Returns the coordinate positions of a sketch point or curve. The return shape depends on the input geometry type.
+
+## Prerequisites
+
+- A sketch with at least one geometry item (point, line, arc, or circle)
+
+## Key Parameters
+
+- `id` — the sketch-point or sketch-curve ID. Accepted types: `["sketch-curve", "sketch-point"]`.
+
+## Return Value
+
+| Input type | Result |
+|---|---|
+| **Point** | `{ pos: { x, y, z } }` |
+| **Line** | `{ startPos: { x, y, z }, endPos: { x, y, z } }` |
+| **Arc** (both arcByCenter and arcBy3Points) | `{ startPos: { x, y, z }, endPos: { x, y, z }, centerPos: { x, y, z } }` |
+| **Circle** | **FAILS** — returns null with error (see Gotchas) |
+
+All positions are `{ x, y, z }` named objects, NOT `[x, y, z]` arrays. maxLevel=31 on success.
+
+## Gotchas
+
+- **Circles do NOT work.** Despite the docs claiming circle returns `{ centerPos }`, calling `getPositions` on a circle ID produces error. Use `getPoints(circleId)` → `getPositions(centerId)` as workaround.
+- **Floating-point noise on arc centers.** Computed positions may have epsilon-level noise.
+- **No `midPos` for arcBy3Points.** Both arc creation methods produce the same output.
+- **Positions reflect `updateGeometry` immediately.**
+
+## Common Errors
+
+- 1001: wrong id type (sketch/part ID passed instead of geometry)
+- 1006: invalid id
+- 1004: missing id parameter
+
+## Working Example + Circle Workaround included.
```
