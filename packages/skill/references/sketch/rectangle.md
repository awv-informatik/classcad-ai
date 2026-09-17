# sketch.rectangle

Creates a rectangle as 4 lines; returns the 4 line IDs.

## Key Parameters

- `id` (required) — sketch ID
- `startPos` — `[x, y, z]` first corner (center if `isCentered`)
- `endPos` — opposite corner. Swapped corners (endPos < startPos) are fine.
- `isCentered` (default FALSE) — TRUE: startPos is the center, rect mirrors endPos through it; half-width `|endPos.x - startPos.x|`, half-height `|endPos.y - startPos.y|`
- `genFixation` (default TRUE) — fixation at origin
- `genIncidence` (default TRUE) — coincidence when corners land on existing points
- `genTangency` (default TRUE) — tangency with existing arcs
- `isConstruction` (default FALSE) — all 4 lines as construction geometry: skeleton driving the profile via constraints/dimensions, full solver participant (a real curve can be tangent to it), not extrudable — construction-only curves in `part.extrusion`/`part.revolve`/`part.twist` → error (maxLevel 51), no solid. See `recipes/constrained-sketching` (§ Construction geometry).

## Return Value

`Array<id>` — CCW from startPos; each line's endPos connects to the next line's startPos:

| Index | Edge | endPos corner |
|-------|------|---------------|
| 0 | bottom horizontal | not connected |
| 1 | right vertical | connected |
| 2 | top horizontal | connected |
| 3 | left vertical | not connected |

## Auto-Generated Constraints

8 constraints fully constrain the shape: 4× coincident (corners), 1× parallel (opposite sides), 2× perpendicular, 1× horizontal. Plus fixation with `genFixation` and a corner at origin.

## Gotchas

- **Corners are NOT shared point IDs** — each line has its own start/end points (`sketch.getPoints({ id: lineId })`); connectivity is via coincident constraints.
- **Degenerate input is silent** — zero-size, zero-width, zero-height all succeed (maxLevel 31) with zero-length/collinear lines.
- **getPositions syntax:** `sketch.getPositions({ id: lineId })`, not `{ id: skId, geometryId: lineId }`.
- **Extrusion:** pass the 4 line IDs as `references` (`part.extrusion({ id: partId, references: rect, limit2: 30 })`), or a region from `sketchRegion`. Both need a sketch with `planeId`.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Box' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result // 4 line IDs
const centered = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 25, 0], isCentered: 1 })).result // (-40,-25)–(40,25)
```

## Related

`sketch.line` · `sketch.geometry` · `sketch.sketchRegion` · `part.extrusion`
