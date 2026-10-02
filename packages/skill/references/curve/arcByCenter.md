# curve.arcByCenter

Creates one or more arcs from center, start and end points (in a `curve.shape`). Radius = |startPos − centerPos|; `isClockwise` selects which of the two arcs between start and end is drawn — the **major** or the **minor** one.

## Key Parameters

- `id` (required) — shape ID (not part or EI)
- `centerPos` (required) — `[x, y, z]` circle center
- `startPos` (required) — `[x, y, z]`, at the desired radius
- `endPos` (required) — `[x, y, z]`, **at the same radius as `startPos`**, else error (code=0, level=51, "Created end point differs from the input values" plus the offset distance)
- `isClockwise` (optional, default `true`) — `true` = major arc (> 180°), `false` = minor arc (< 180°); accepts `true`/`false` or `1`/`0`

All points `[x, y, z]` — `[x, y]` fails with `"If point is defined as array, it must have exactly 3 real values"`. Fully 3D: the points define the arc plane, no normal needed. There is no `normal` parameter — one passed anyway is ignored silently.

## How isClockwise Works

**It does not mean clockwise in world coordinates.** The plane normal is derived from the points (`(start − center) × (end − center)`), which always makes start → end the short way counterclockwise; the flag is "clockwise" only relative to that derived normal:

- `true` (default) — the **major arc**, whichever way start and end are ordered. Center 0, start `(10,0)`, end `(0,10)` → 270° through `(-7.07,-7.07)`; end `(0,-10)` instead → 270° through `(-7.07,7.07)` (counterclockwise seen from +Z).
- `false` — the **minor arc** (90° in both examples).

Choose the flag from the sweep you want (> or < 180°), never from a clockwise/counterclockwise picture. Chains of lines and `arcByCenter` arcs close exactly into extrusion/revolve profiles once the flag is chosen this way.

**Semicircles (start, center, end collinear):** the points define no plane. The arc falls back to the XY plane and **ignores `isClockwise`**: it always sweeps clockwise seen from +Z (start `(10,0)`, end `(-10,0)` passes `(0,-10)` for both flags). A semicircle on the other side, or in XZ/YZ, needs `curve.arcBy3Points` (the `midPos` picks the side) or two quarter arcs.

**`startPos == endPos` creates a full circle** (valid; alternative to `curve.circle`).

## Return Value

VOID (null), maxLevel 31. No ID — arcs merge into the shape's geometry; no per-arc addressing, updating or deletion.

Batch: pass an array of parameter objects (may mix centers, radii, `isClockwise`); single VOID response.

## Gotchas

- **center == start or center == end is rejected** ("Created end point differs from the input values" — zero radius vs. the other endpoint). Validate centerPos differs from both.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1001 | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Part/EI ID instead of shape ID |
| 1004 | `"The parameter \"<centerPos\|startPos\|endPos\|id>\" must be provided..."` | Missing parameter |
| 0 | `"Created end point differs from the input values..."` | start/end at different radii, or centerPos == startPos/endPos |
| 0 | `"...must have exactly 3 real values"` | Point not exactly 3 elements |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ArcPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

// 90° minor arc
await api.v1.curve.arcByCenter({ id: shapeId, centerPos: [0, 0, 0], startPos: [10, 0, 0], endPos: [0, 10, 0], isClockwise: false })

// 270° major arc (default), same points relative to the center
await api.v1.curve.arcByCenter({ id: shapeId, centerPos: [40, 0, 0], startPos: [55, 0, 0], endPos: [40, 15, 0] })

// Full circle (startPos == endPos)
await api.v1.curve.arcByCenter({ id: shapeId, centerPos: [50, 50, 0], startPos: [70, 50, 0], endPos: [70, 50, 0] })
```

## Related

`curve.polyline2d` · `curve.shape` · `curve.arcBy3Points` · `curve.arcByCenterRadAngle` · `curve.circle` · `curve.line` · `curve.deleteShape` / `curve.cleanShape`
