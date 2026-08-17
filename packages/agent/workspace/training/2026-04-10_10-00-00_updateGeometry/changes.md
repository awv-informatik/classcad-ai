# Changes — sketch.updateGeometry training

## New file: `references/sketch/updateGeometry.md`

```diff
+# sketch.updateGeometry
+
+Updates the positions/properties of existing sketch geometry in-place. This is a **raw position update** — it does NOT trigger the constraint solver.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch (`sketch.create`)
+- Existing geometry to update (created via `sketch.geometry`, `sketch.line`, `sketch.circle`, etc.)
+
+## Key Parameters
+
+- `id` — sketch ID (required, must be type "sketch"). Note: the server validates that this is a sketch type, but does NOT validate that the geometry actually belongs to this sketch. Any valid sketch ID works.
+- `points` — array of `{ id, pos: [x,y,z] }`
+- `lines` — array of `{ id, startPos, endPos }` — **both** startPos and endPos required
+- `circles` — array of `{ id, centerPos, radius }` — **both** centerPos and radius required
+- `arcsBy3Points` — array of `{ id, startPos, endPos, midPos }` — all 3 required
+- `arcsByCenter` — array of `{ id, startPos, endPos, centerPos, isClockwise? }` — isClockwise defaults to TRUE
+
+All geometry arrays are optional. You can pass any combination, including multiple types in one call.
+
+## Return Value
+
+Always returns `null` (VOID) on success. maxLevel=31 (info) on success, 51 (error) on failure.
+
+## Gotchas
+
+- **No partial property updates.** You must provide ALL properties for each geometry type.
+- **Constraints are NOT enforced.** Raw position setter — constraint solver not triggered.
+- **Shared points are separate.** Moving one coincident point does NOT move the other.
+- **Sketch ID ownership not validated.** Any valid sketch ID works, regardless of parent.
+- **`getPositions` returns null for circles.**
+
+## Common Errors
+
+| Code | Level | Message | Cause |
+|------|-------|---------|-------|
+| 1001 | ERROR | wrong id type | Top-level ID not a sketch, or geometry type mismatch in array |
+| 1004 | ERROR | parameter must be provided | Missing required property |
+| 1006 | ERROR | invalid id | Geometry ID doesn't exist |
+
+## Working Example, Usage Hints, Related APIs included.
```
