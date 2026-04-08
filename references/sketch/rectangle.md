# sketch.rectangle

Creates a rectangle as 4 lines in a sketch. Returns an array of 4 line IDs.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create` or `part.sketch`)

## Key Parameters

- `id` — sketch ID (required)
- `startPos` — `[x, y, z]` first corner (or center if `isCentered=TRUE`)
- `endPos` — `[x, y, z]` opposite corner
- `isCentered` — when `TRUE`, startPos is the center and the rect mirrors endPos through it. Half-width = `|endPos.x - startPos.x|`, half-height = `|endPos.y - startPos.y|`. Default: `FALSE`.
- `genFixation` — auto-generate fixation constraint at origin. Default: `TRUE`.
- `genIncidence` — auto-generate coincident constraints when corners land on existing points. Default: `TRUE`.
- `genTangency` — auto-generate tangency constraints with existing arcs. Default: `TRUE`.

## Return Value

`Array<id>` — 4 line IDs in CCW winding order from startPos:

| Index | Edge | Description |
|-------|------|-------------|
| 0 | bottom horizontal | not connected to endPos corner |
| 1 | right vertical | connected to endPos corner |
| 2 | top horizontal | connected to endPos corner |
| 3 | left vertical | not connected to endPos corner |

Each line's endPos connects to the next line's startPos, forming a closed loop. Corner connectivity is enforced by auto-generated coincident constraints (not shared point IDs).

## Auto-Generated Constraints

A single rectangle generates 8 constraints:
- 4× coincident (corner connections between adjacent lines)
- 1× parallel (opposite sides)
- 2× perpendicular (adjacent sides)
- 1× horizontal (locks one side horizontal)

These fully constrain the rectangle shape. With `genFixation=TRUE` and a corner at the origin, a fixation constraint is also added.

## Gotchas

- **Degenerate input is silent.** Zero-size rect (startPos == endPos), zero-width, zero-height — all succeed with maxLevel=31, returning 4 zero-length or collinear lines. No error, no warning.
- **Swapped corners work.** endPos < startPos is fine — the API doesn't care which corner is "first".
- **Point IDs are NOT shared between lines.** Each line has its own start/end point IDs. Use `sketch.getPoints({ id: lineId })` to get them. Corner connectivity is via coincident constraints, not shared vertices.
- **getPositions syntax:** Use `sketch.getPositions({ id: lineId })`, not `{ id: skId, geometryId: lineId }`.

## Usage with Extrusion

Pass the 4 line IDs directly to `part.extrusion` as `references`:

```js
const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0,0,0], endPos: [60,40,0] })
const ext = await api.v1.part.extrusion({ id: partId, references: rect.result, limit2: 30 })
```

Do NOT create a sketchRegion and pass it — extrusion with a region ID fails with "CCObject can not be opened". Pass the line IDs directly.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Box' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Corner-to-corner rectangle
const rect = await api.v1.sketch.rectangle({
  id: skId,
  startPos: [0, 0, 0],
  endPos: [80, 50, 0],
})
// rect.result = [lineId0, lineId1, lineId2, lineId3]

// Centered rectangle (startPos = center)
const centered = await api.v1.sketch.rectangle({
  id: skId,
  startPos: [0, 0, 0],
  endPos: [40, 25, 0],
  isCentered: 1, // TRUE — rect spans (-40,-25) to (40,25)
})
```

## Related

- `sketch.line` — individual line creation
- `sketch.geometry` — generic multi-type geometry creation (can also create rectangles)
- `sketch.sketchRegion` — create a region from closed contours (pass line IDs as `geomIds`)
- `part.extrusion` — extrude rectangle into a solid (pass line IDs as `references`)
