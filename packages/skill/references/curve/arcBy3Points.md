# curve.arcBy3Points

Creates one or more arcs defined by three points: start, mid, and end. The three points uniquely determine a circular arc — the mid point controls which side of the chord the arc curves toward.

## Prerequisites

- A shape (`curve.shape`) inside an entity injection (`part.entityInjection`)

## Key Parameters

- `id` (required) — shape ID. Must be a shape, not part or EI.
- `startPos` (required) — `[x, y, z]` start point. Exactly 3 elements.
- `midPos` (required) — `[x, y, z]` a point on the desired arc. Controls arc direction.
- `endPos` (required) — `[x, y, z]` end point. Exactly 3 elements.

All four parameters are required. No optional parameters.

## How midPos Works

The `midPos` determines which of the two possible arcs (between start and end) is created:
- `midPos` above the start-end chord → arc curves upward
- `midPos` below the chord → arc curves downward
- Swapping `startPos` and `endPos` does NOT flip the arc — only `midPos` placement controls the direction

The three points define the arc's plane implicitly. No normal vector is needed.

## Batch Creation

Pass an array of objects to create multiple arcs in one call:

```js
await api.v1.curve.arcBy3Points([
  { id: shapeId, startPos: [0, 0, 0], midPos: [10, 15, 0], endPos: [20, 0, 0] },
  { id: shapeId, startPos: [30, 0, 0], midPos: [40, 15, 0], endPos: [50, 0, 0] },
])
```

- Returns a single VOID response (maxLevel 31 on success)
- Can mix different shape IDs in the same batch
- **Errors are per-item** — one invalid entry doesn't block valid ones. Valid arcs are still created. maxLevel reflects the worst error.

## Return Value

Returns VOID (null). maxLevel 31 on success. No ID is returned — arcs cannot be individually addressed after creation.

## 3D Support

Fully 3D — all three points can have arbitrary X, Y, Z coordinates. The arc plane is determined by the three points. Works in XY, XZ, YZ, or any arbitrary plane.

## Gotchas

- **CRITICAL: Collinear points produce an internal error.** If all three points are on the same line (e.g., `(0,0,0)`, `(25,0,0)`, `(50,0,0)`), the server returns an internal error: `"[Evaluation error in CurveAPI_v1.arcBy3Points::PROC:[Index 2 ausserhalb des Arraybereichs] not defined !]"`. This is a German-language internal array index error, not a clean validation message. maxLevel=51, code=0.
- **Coincident points produce the same internal error.** start==mid, start==end, or all three equal — all produce the same "Index 2 ausserhalb des Arraybereichs" error. The server does not validate point geometry before computing.
- **No individual arc IDs.** Like lines and circles, arcs are merged into the shape's geometry. No per-arc addressing, updating, or deletion — only whole-shape operations (`curve.deleteShape` / `curve.cleanShape`).
- **Points must be exactly `[x, y, z]`** — no 2D shorthand. Error: `"If point is defined as array, it must have exactly 3 real values"`.
- **No size limits.** Very tiny arcs (points ~0.002 apart) and nearly-full-circle arcs both work.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1001 | ERROR | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Passed part/EI ID instead of shape ID |
| 1004 | ERROR | `"The parameter \"midPos\" must be provided..."` | Missing midPos |
| 1004 | ERROR | `"The parameter \"startPos\" must be provided..."` | Missing startPos |
| 1004 | ERROR | `"The parameter \"endPos\" must be provided..."` | Missing endPos |
| 1004 | ERROR | `"The parameter \"id\" must be provided..."` | Missing id |
| 1006 | ERROR | `"An element of parameter \"id\" has an invalid id!"` | Non-existent or deleted shape ID |
| 0 | ERROR | `"...Index 2 ausserhalb des Arraybereichs..."` | Collinear or coincident points (degenerate arc) |
| 0 | ERROR | `"...must have exactly 3 real values"` | Point array not exactly 3 elements |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ArcPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

// Simple semicircle arc
await api.v1.curve.arcBy3Points({
  id: shapeId,
  startPos: [0, 0, 0],
  midPos: [25, 25, 0],
  endPos: [50, 0, 0],
})

// D-shaped profile: lines + arc
await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [0, 40, 0] })
await api.v1.curve.line({ id: shapeId, startPos: [0, 40, 0], endPos: [30, 40, 0] })
await api.v1.curve.arcBy3Points({
  id: shapeId,
  startPos: [30, 40, 0],
  midPos: [50, 20, 0],
  endPos: [30, 0, 0],
})
await api.v1.curve.line({ id: shapeId, startPos: [30, 0, 0], endPos: [0, 0, 0] })
```

## Related

- `curve.shape` — create the container this consumes
- `curve.arcByCenter` — arc defined by center, start, end, and clockwise flag
- `curve.arcByCenterRadAngle` — arc defined by center, radius, and start/end angles
- `curve.line`, `curve.circle` — other curve types in the same shape
- `curve.deleteShape` / `curve.cleanShape` — remove arcs (no per-arc delete)
