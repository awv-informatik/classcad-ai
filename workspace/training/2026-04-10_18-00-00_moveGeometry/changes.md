# Changes — sketch.moveGeometry training

## New file: `references/sketch/moveGeometry.md`

```diff
+# sketch.moveGeometry
+
+Moves sketch geometry by a translation vector. This is a **raw translation** — it does NOT trigger the constraint solver. Only the specified items move; connected/constrained geometry stays in place.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch (`sketch.create`)
+- Existing geometry to move (points, lines, circles, arcs)
+
+## Key Parameters
+
+- `id` — sketch ID (required, type "sketch")
+- `geomIds` — array of sketch geometry IDs to move. Accepted types: `["sketch-curve", "sketch-point"]`. All specified items receive the same translation.
+- `translation` — `[x, y, z]` vector. **Z must be 0** — the server validates this as a 2D point and rejects non-zero Z with error 1014.
+
+## Return Value
+
+Returns a number (0 or 1) representing the ClassCAD boolean for "sketch is still solved":
+- `1` — constraints are satisfied after the move
+- `0` — constraints are broken (e.g., fixation constraints no longer match positions)
+
+In practice the return value is unreliable as a logic signal — it depends on internal solver state. Use it as a hint that constraints may need attention, not as a definitive check.
+
+maxLevel=31 on success, 51 on error.
+
+## Gotchas
+
+- **No constraint solving.** Moving one side of a rectangle does NOT drag the other sides.
+- **Z must be exactly 0.** Non-zero Z triggers error 1014.
+- **Empty geomIds is a no-op.** Returns result=0, no error.
+- **All geometry types work.** Points, lines, circles, arcs all move correctly.
+
+## Common Errors
+
+| Code | Level | Message | Cause |
+|------|-------|---------|-------|
+| 1001 | ERROR | wrong id type, expects ["sketch"] | id is not a sketch |
+| 1001 | ERROR | wrong id type, expects ["sketch-curve","sketch-point"] | Non-geometry ID in geomIds |
+| 1006 | ERROR | invalid id | Geometry ID doesn't exist |
+| 1014 | ERROR | translation must have z-value of 0 | Non-zero Z in translation |
+
+## Usage Hints, Working Examples, Related APIs included.
```
