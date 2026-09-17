# sketch.line

Creates one or more lines in a sketch.

## Key Parameters

- **`id`** (required) — sketch ID (part ID → 1001)
- **`startPos`**, **`endPos`** (required) — `[x, y, 0]` sketch-local; non-zero Z → 1014
- **`genFixation`** (default TRUE) — "Auto_Fix" (`CC_2DFixationConstraint`) only when an endpoint is at the origin
- **`genIncidence`** (default TRUE) — "Auto_Coinc" (`CC_2DCoincidentConstraint`) when an endpoint exactly matches an existing point — no tolerance
- **`genVertAndHoriz`** (default TRUE) — "Auto_H"/"Auto_V" (`CC_2DHorizontalConstraint`/`CC_2DVerticalConstraint`) only when perfectly axis-aligned: (0,0)→(50,0) triggers, (0,0)→(50,1) doesn't
- **`genTangency`** (default TRUE) — "Auto_Tan" (`CC_2DTangentSketchConstraint`) when an endpoint coincides with an arc endpoint AND the direction is tangent there (not mere proximity)
- **`isConstruction`** (default FALSE) — reference-only: dashed, excluded from extrude, still usable as constraint/dimension reference (recipes/constrained-sketching § Construction geometry)

Flags are independent (disabling genIncidence doesn't suppress genVertAndHoriz, etc.).

## Return Value

`result: id | VOID | Array<id|VOID>`. Success: ID, maxLevel 31, no messages. Batch (array of param objects): IDs in input order; auto-constraints are generated between batch members (e.g. coincidence at shared endpoints). Failure: null, maxLevel 51.

## Structure

`CC_Line` ("Line", "Line0", …; members `direction` (line vector), `alignment` (default 1), `rigidSetId` (default 0)) with `CC_Point` children "startPoint", "endPoint". Consumes 4 IDs (line + 2 points + 1 internal), +2 per auto-constraint.

Queries: `getPoints({ id: lineId })` → `{ startId, endId }`; `getPositions({ id: pointId })` → `{ pos: { x, y, z } }` (world coordinates).

## Gotchas

- **Degenerate lines silently accepted** — startPos == endPos creates a normal zero-length line with both points, no warning.
- **Updating:** `updateGeometry({ id: skId, lines: [{ id, startPos, endPos }] })`; partial updates (only `startPos` or only `endPos`) work.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "parameter 'id' / 'startPos' must be provided" | 1004 | Missing param |
| "parameter 'endPos' must be provided" | 1004 | Missing `endPos` (updateGeometry accepts partial updates) |
| "wrong id type! Provide only following id types: ['sketch']" | 1001 | Part ID instead of sketch ID |
| "endPos which is a 2D point, must have a z-value of 0!" | 1014 | Non-zero Z |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Batch: closed triangle, IDs in input order
const [lineId] = (await api.v1.sketch.line([
  { id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] },
  { id: skId, startPos: [50, 0, 0], endPos: [50, 40, 0] },
  { id: skId, startPos: [50, 40, 0], endPos: [0, 0, 0] },
])).result

// No auto-constraints
await api.v1.sketch.line({
  id: skId, startPos: [10, 50, 0], endPos: [60, 50, 0],
  genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false,
})

const pts = (await api.v1.sketch.getPoints({ id: lineId })).result // { startId, endId }
await api.v1.sketch.updateGeometry({ id: skId, lines: [{ id: lineId, startPos: [5, 5, 0], endPos: [55, 5, 0] }] })
```

## Related

`sketch.getPoints` · `sketch.getPositions` · `sketch.updateGeometry` · `sketch.deleteObject` · `sketch.point` · `sketch.constraint` · `sketch.rectangle`
