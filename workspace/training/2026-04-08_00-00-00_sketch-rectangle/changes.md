# Changes — sketch.rectangle training

## New file: `references/sketch/rectangle.md`

```diff
+# sketch.rectangle
+
+Creates a rectangle as 4 lines in a sketch. Returns an array of 4 line IDs.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch (`sketch.create` or `part.sketch`)
+
+## Key Parameters
+
+- `id` — sketch ID (required)
+- `startPos` — `[x, y, z]` first corner (or center if `isCentered=TRUE`)
+- `endPos` — `[x, y, z]` opposite corner
+- `isCentered` — when `TRUE`, startPos is the center and the rect mirrors endPos through it. Half-width = `|endPos.x - startPos.x|`, half-height = `|endPos.y - startPos.y|`. Default: `FALSE`.
+- `genFixation` — auto-generate fixation constraint at origin. Default: `TRUE`.
+- `genIncidence` — auto-generate coincident constraints when corners land on existing points. Default: `TRUE`.
+- `genTangency` — auto-generate tangency constraints with existing arcs. Default: `TRUE`.
+
+## Return Value
+
+`Array<id>` — 4 line IDs in CCW winding order from startPos:
+
+| Index | Edge | Description |
+|-------|------|-------------|
+| 0 | bottom horizontal | not connected to endPos corner |
+| 1 | right vertical | connected to endPos corner |
+| 2 | top horizontal | connected to endPos corner |
+| 3 | left vertical | not connected to endPos corner |
+
+Each line's endPos connects to the next line's startPos, forming a closed loop. Corner connectivity is enforced by auto-generated coincident constraints (not shared point IDs).
+
+## Auto-Generated Constraints
+
+A single rectangle generates 8 constraints:
+- 4× coincident (corner connections between adjacent lines)
+- 1× parallel (opposite sides)
+- 2× perpendicular (adjacent sides)
+- 1× horizontal (locks one side horizontal)
+
+## Gotchas
+
+- **Degenerate input is silent.** Zero-size, zero-width, zero-height all succeed.
+- **Swapped corners work.** endPos < startPos is fine.
+- **Point IDs are NOT shared between lines.** Connectivity via coincident constraints.
+- **getPositions syntax:** `sketch.getPositions({ id: lineId })`, not `{ id: skId, geometryId: lineId }`.
+
+## Usage with Extrusion
+
+- Pass line IDs directly to `part.extrusion({ references: rect.result })` — works
+- Do NOT pass a sketchRegion ID — fails with "CCObject can not be opened"
```
