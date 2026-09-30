# curve.arcByCenter

Creates one or more arcs from center, start and end points (in a `curve.shape`). Radius = |startPos − centerPos|. `isClockwise` is the sweep direction from start to end about `normal` (default +Z) — real clockwise/counterclockwise, like sketch arcs.

## Key Parameters

- `id` (required) — shape ID (not part or EI)
- `centerPos` (required) — `[x, y, z]` circle center
- `startPos` (required) — `[x, y, z]`, at the desired radius
- `endPos` (required) — `[x, y, z]`, **at the same radius as `startPos`**, else error (code=0, level=51, "Created end point differs from the input values" plus the offset distance)
- `normal` (optional, default `[0,0,1]`) — `[x, y, z]` normal of the arc plane, any length; the reference of `isClockwise`. Start, end and center must lie in the plane perpendicular to it — **arcs outside a plane parallel to XY must pass their normal**, otherwise they are rejected. A zero normal is rejected.
- `isClockwise` (optional, default `true`) — `true` = clockwise, `false` = counterclockwise from start to end, seen from the tip of `normal` (looking against it). Accepts `true`/`false` or `1`/`0`

All points `[x, y, z]` — `[x, y]` fails with `"If point is defined as array, it must have exactly 3 real values"`.

## How isClockwise Works

Seen from the tip of `normal` — from +Z for the default, i.e. the usual top view — the arc sweeps clockwise (`true`) or counterclockwise (`false`) from start to end. Same points with `true` vs `false` give the two complementary arcs.

- Center 0, start `(10,0,0)`, end `(0,10,0)`: `true` → 270° through `(-7.07,-7.07)`, `false` → 90° through `(7.07,7.07)`.
- Start `(10,0,0)`, end `(0,-10,0)`: `true` → 90°, `false` → 270°.
- Semicircles are defined too: start `(10,0,0)`, end `(-10,0,0)`: `true` passes `(0,-10,0)`, `false` passes `(0,10,0)`.
- Other planes: pass the plane's normal. Start `(10,0,0)`, end `(-10,0,0)`, `normal: [0,1,0]`, `true` → through `(0,0,10)`. Mind which side you look from: seen from −Y (the front view), clockwise about `[0,-1,0]` is what looks clockwise on screen.

Compute the flag, don't picture it: take start and end angles about the center in the plane seen from the normal's tip, name one angle the arc must pass, and check which direction reaches it first.

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

// 90° arc, counterclockwise about +Z
await api.v1.curve.arcByCenter({ id: shapeId, centerPos: [0, 0, 0], startPos: [10, 0, 0], endPos: [0, 10, 0], isClockwise: false })

// 270° arc, clockwise about +Z (default), same points relative to the center
await api.v1.curve.arcByCenter({ id: shapeId, centerPos: [40, 0, 0], startPos: [55, 0, 0], endPos: [40, 15, 0] })

// Semicircle in the XZ plane through (80,0,10): clockwise about +Y
await api.v1.curve.arcByCenter({ id: shapeId, centerPos: [80, 0, 0], startPos: [90, 0, 0], endPos: [70, 0, 0], normal: [0, 1, 0], isClockwise: true })

// Full circle (startPos == endPos)
await api.v1.curve.arcByCenter({ id: shapeId, centerPos: [50, 50, 0], startPos: [70, 50, 0], endPos: [70, 50, 0] })
```

## Related

`curve.polyline2d` · `curve.shape` · `curve.arcBy3Points` · `curve.arcByCenterRadAngle` · `curve.circle` · `curve.line` · `curve.deleteShape` / `curve.cleanShape`
