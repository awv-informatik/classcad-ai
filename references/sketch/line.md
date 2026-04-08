# sketch.line

Creates one or multiple lines in a sketch. Returns the line ID(s).

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create` or `part.sketch`)

## Key Parameters

- **`id`** (required) — sketch ID (not part ID).
- **`startPos`** (required) — `[x, y, z]` in sketch-local coordinates. Z must be 0.
- **`endPos`** (required) — `[x, y, z]` in sketch-local coordinates. Z must be 0.
- **`genFixation`** (optional, default TRUE) — auto-generates `CC_2DFixationConstraint` ("Auto_Fix") when an endpoint is at the origin. No effect for off-origin endpoints.
- **`genIncidence`** (optional, default TRUE) — auto-generates `CC_2DCoincidentConstraint` ("Auto_Coinc") when an endpoint exactly matches an existing point's position. Exact match only — no tolerance.
- **`genVertAndHoriz`** (optional, default TRUE) — auto-generates `CC_2DHorizontalConstraint` ("Auto_H") or `CC_2DVerticalConstraint` ("Auto_V") when the line is perfectly axis-aligned. Diagonal lines never trigger this.
- **`genTangency`** (optional, default TRUE) — auto-generates `CC_2DTangentSketchConstraint` ("Auto_Tan") when the line's endpoint coincides with an arc endpoint and the line direction is tangent to the arc at that point.

## Batch Creation

Pass an array of param objects to create multiple lines in one call:

```js
const r = await api.v1.sketch.line([
  { id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] },
  { id: skId, startPos: [50, 0, 0], endPos: [50, 40, 0] },
  { id: skId, startPos: [50, 40, 0], endPos: [0, 0, 0] },
])
// r.result → [58, 66, 74] — array of IDs in matching order
```

Auto-constraints are generated between batch members (e.g., coincidence at shared endpoints).

## Return Value

```js
{ result: id | VOID | Array<id|VOID>, messages?: [...], maxLevel?: real }
```

- Success: numeric ID (e.g., 58), maxLevel=31 (info), no messages
- Batch: array of IDs matching input order
- Failure: result=null, maxLevel=51, messages with error details

## Structure

Each line creates a `CC_Line` node in the structure tree with two `CC_Point` children:
- Line: `class: "CC_Line"`, `name: "Line"` (then "Line0", "Line1", ...)
  - Members: `direction` (point — the line vector), `alignment` (real, default 1), `rigidSetId` (id, default 0)
- Child 1: `class: "CC_Point"`, `name: "startPoint"`
- Child 2: `class: "CC_Point"`, `name: "endPoint"`

**ID consumption:** Each line consumes 4 IDs (line + 2 points + 1 internal). Auto-constraints consume 2 additional IDs each.

## Updating Lines

Use `sketch.updateGeometry` with the `lines` array:

```js
await api.v1.sketch.updateGeometry({
  id: skId,
  lines: [{ id: lineId, startPos: [10, 10, 0], endPos: [80, 60, 0] }],
})
```

**Both `startPos` and `endPos` are required** in the update call. Omitting either → error 1004. Partial updates are not supported.

## Querying Lines

- `sketch.getPoints({ id: lineId })` → `{ startId, endId }` — the IDs of the line's child CC_Point nodes
- `sketch.getPositions({ id: pointId })` → `{ pos: { x, y, z } }` — world coordinates of a point

## Gotchas

- **Z must be 0** — non-zero Z in startPos or endPos → error 1014.
- **Degenerate lines are silently accepted** — startPos == endPos creates a zero-length line with no error and no warning. The line and its two child points are created normally.
- **updateGeometry requires both endpoints** — you cannot update just startPos or just endPos; both must be provided or you get error 1004.
- **genFixation only matters at origin** — same behavior as `sketch.point`.
- **genIncidence is exact-match only** — no tolerance, same as `sketch.point`.
- **genVertAndHoriz only for axis-aligned lines** — a line from (0,0,0) to (50,0,0) triggers Auto_H; a line from (0,0,0) to (50,1,0) does not.
- **genTangency requires coincident arc endpoint AND tangent direction** — not just proximity.
- **Auto-constraint flags are independent** — disabling genIncidence does not suppress genVertAndHoriz or vice versa.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "parameter 'id' must be provided" | 1004 | Missing `id` |
| "parameter 'startPos' must be provided" | 1004 | Missing `startPos` |
| "parameter 'endPos' must be provided" | 1004 | Missing `endPos` (also for updateGeometry) |
| "wrong id type! Provide only following id types: ['sketch']" | 1001 | Passed part ID instead of sketch ID |
| "endPos which is a 2D point, must have a z-value of 0!" | 1014 | Non-zero Z coordinate |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Single line
const lineId = (await api.v1.sketch.line({
  id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0]
})).result

// Get endpoint IDs
const pts = await api.v1.sketch.getPoints({ id: lineId })
// pts.result → { startId: 59, endId: 60 }

// Line with no auto-constraints
const lineId2 = (await api.v1.sketch.line({
  id: skId, startPos: [10, 50, 0], endPos: [60, 50, 0],
  genFixation: false, genIncidence: false,
  genVertAndHoriz: false, genTangency: false
})).result

// Update line position
await api.v1.sketch.updateGeometry({
  id: skId,
  lines: [{ id: lineId, startPos: [5, 5, 0], endPos: [55, 35, 0] }]
})

// Delete a line
await api.v1.sketch.deleteObject({ ids: [lineId2] })
```

## Related

- `sketch.getPoints` — get startId/endId of a line
- `sketch.getPositions` — get world coordinates of a point
- `sketch.updateGeometry` — move line endpoints (requires both startPos and endPos)
- `sketch.deleteObject` — delete lines and other sketch geometry
- `sketch.point` — standalone points; lines create implicit CC_Point children
- `sketch.constraint` — manually add constraints between geometry
- `sketch.rectangle` — creates 4 lines forming a rectangle
