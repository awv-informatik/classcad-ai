# curve.arcByCenter

Creates one or more arcs defined by center point, start point, end point, and a clockwise flag. The radius is determined by the distance from center to start. The `isClockwise` flag selects which of the two possible arcs (major or minor) is drawn.

## Prerequisites

- A shape (`curve.shape`) inside an entity injection (`part.entityInjection`)

## Key Parameters

- `id` (required) — shape ID. Must be a shape, not part or EI.
- `centerPos` (required) — `[x, y, z]` center of the arc's circle.
- `startPos` (required) — `[x, y, z]` start point. Must be at the desired radius from `centerPos`.
- `endPos` (required) — `[x, y, z]` end point. **Must be at the same radius from `centerPos` as `startPos`.** If not equidistant, the server returns an error (code=0, level=51).
- `isClockwise` (optional, default `true`) — direction of arc sweep from start to end.

All points must be `[x, y, z]` — no 2D shorthand.

## ⚠️ Unreliable inside multi-curve profile chains

When a shape's curves are consumed as a closed region by `solid.extrusion`/`solid.revolve`, the
kernel re-picks arc branches while assembling the loop — `isClockwise` is NOT reliably honored
(probed 2026-08-10: a line+arc half-disc came out identical for cw=true and cw=false; an
8-entity tooth profile was degenerate or wrong-sized in every flag/winding combination). For
profiles mixing lines and arcs, use **`curve.polyline2d` with signed bulges** instead — one
closed polyline encodes each arc unambiguously. `arcByCenter` remains fine for standalone arcs
and full circles.

## How isClockwise Works

The flag selects **which arc** between start and end is created:

- `isClockwise: true` (default) — sweeps clockwise from start to end. For a 90° angle between start/end vectors, this produces the **270° major arc**.
- `isClockwise: false` — sweeps counterclockwise from start to end. For a 90° angle, this produces the **90° minor arc**.

The two arcs are complementary — together they form a full circle. For a 180° angle (diametrically opposite points), both produce semicircles on opposite sides.

Accepts JS booleans (`true`/`false`) and numeric values (`1`/`0`) interchangeably.

## Full Circle

**`startPos == endPos` creates a full circle.** This is valid, not an error. The radius is the distance from `centerPos` to `startPos`. This provides an alternative to `curve.circle` for creating circles inside shapes.

## Batch Creation

Pass an array of objects to create multiple arcs in one call:

```js
await api.v1.curve.arcByCenter([
  { id: shapeId, centerPos: [0, 0, 0], startPos: [15, 0, 0], endPos: [0, 15, 0], isClockwise: false },
  { id: shapeId, centerPos: [40, 0, 0], startPos: [55, 0, 0], endPos: [40, 15, 0], isClockwise: true },
])
```

- Returns a single VOID response (maxLevel 31 on success)
- Can mix different centers, radii, and `isClockwise` values in one batch

## Return Value

Returns VOID (null). maxLevel 31 on success. No ID is returned — arcs cannot be individually addressed after creation.

## 3D Support

Fully 3D — all three points can have arbitrary X, Y, Z coordinates. The arc plane is determined by the three points. No normal vector is needed.

## Gotchas

- **CRITICAL: center == start or center == end HANGS THE SERVER.** Zero-radius arcs cause the ClassCAD worker to spin at 100% CPU indefinitely. No error is returned. You must `kill -9` the worker and restart it. **Always validate that centerPos differs from startPos and endPos before calling.**
- **startPos and endPos must be equidistant from centerPos.** The server uses `|startPos - centerPos|` as the radius. If `|endPos - centerPos|` differs, you get error code=0, level=51 with message about "Created end point differs from the input values" and the offset distance.
- **No individual arc IDs.** Like lines and circles, arcs merge into the shape's geometry. No per-arc addressing, updating, or deletion.
- **Points must be `[x, y, z]`** — `[x, y]` fails with: `"If point is defined as array, it must have exactly 3 real values"`.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1001 | ERROR | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Passed part/EI ID instead of shape ID |
| 1004 | ERROR | `"The parameter \"centerPos\" must be provided..."` | Missing centerPos |
| 1004 | ERROR | `"The parameter \"startPos\" must be provided..."` | Missing startPos |
| 1004 | ERROR | `"The parameter \"endPos\" must be provided..."` | Missing endPos |
| 1004 | ERROR | `"The parameter \"id\" must be provided..."` | Missing id |
| 0 | ERROR | `"Created end point differs from the input values..."` | startPos and endPos at different radii from center |
| 0 | ERROR | `"...must have exactly 3 real values"` | Point array not exactly 3 elements |
| — | HANG | (no response) | centerPos == startPos or centerPos == endPos (zero radius) |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ArcPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

// 90° minor arc (counterclockwise)
await api.v1.curve.arcByCenter({
  id: shapeId,
  centerPos: [0, 0, 0],
  startPos: [10, 0, 0],
  endPos: [0, 10, 0],
  isClockwise: false,
})

// Rounded rectangle corner (practical usage)
const w = 80, h = 40, r = 10
await api.v1.curve.line({ id: shapeId, startPos: [r, 0, 0], endPos: [w - r, 0, 0] })
await api.v1.curve.arcByCenter({
  id: shapeId,
  centerPos: [w - r, r, 0],
  startPos: [w - r, 0, 0],
  endPos: [w, r, 0],
  isClockwise: false,
})
// ... continue for remaining edges and corners

// Full circle (startPos == endPos)
await api.v1.curve.arcByCenter({
  id: shapeId,
  centerPos: [50, 50, 0],
  startPos: [70, 50, 0],
  endPos: [70, 50, 0],
})
```

## Related

- `curve.shape` — create the container this consumes
- `curve.arcBy3Points` — arc defined by start, mid, end (no center needed)
- `curve.arcByCenterRadAngle` — arc defined by center, radius, and start/end angles
- `curve.circle` — simpler way to create full circles (but arcByCenter with start==end also works)
- `curve.line` — commonly paired for closed profiles (e.g., rounded rectangles)
- `curve.deleteShape` / `curve.cleanShape` — remove arcs (no per-arc delete)
