# curve.arcByCenter

Creates one or more arcs from center, start and end points plus a clockwise flag (in a `curve.shape`). Radius = |startPos − centerPos|; `isClockwise` selects which of the two arcs (major/minor) is drawn.

## Key Parameters

- `id` (required) — shape ID (not part or EI)
- `centerPos` (required) — `[x, y, z]` circle center
- `startPos` (required) — `[x, y, z]`, at the desired radius
- `endPos` (required) — `[x, y, z]`, **at the same radius as `startPos`**, else error (code=0, level=51, "Created end point differs from the input values" plus the offset distance)
- `isClockwise` (optional, default `true`) — sweep direction start → end; accepts `true`/`false` or `1`/`0`

All points `[x, y, z]` — `[x, y]` fails with `"If point is defined as array, it must have exactly 3 real values"`. Fully 3D: the points define the arc plane, no normal needed.

## ⚠️ Unreliable inside multi-curve profile chains

When a shape's curves are consumed as a closed region by `solid.extrusion`/`solid.revolve`, the kernel re-picks arc branches while assembling the loop — `isClockwise` is NOT reliably honored (a line+arc half-disc came out identical for cw=true and cw=false; an 8-entity tooth profile was degenerate or wrong-sized in every flag/winding combination). For profiles mixing lines and arcs use **`curve.polyline2d` with signed bulges** — one closed polyline encodes each arc unambiguously. `arcByCenter` remains fine for standalone arcs and full circles.

## How isClockwise Works

- `true` (default) — clockwise; for a 90° angle between start/end vectors → the **270° major arc**.
- `false` — counterclockwise; for 90° → the **90° minor arc**.

The two are complementary (together a full circle). For diametrically opposite points both give semicircles on opposite sides.

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

// 90° minor arc (counterclockwise)
await api.v1.curve.arcByCenter({ id: shapeId, centerPos: [0, 0, 0], startPos: [10, 0, 0], endPos: [0, 10, 0], isClockwise: false })

// 270° major arc (default clockwise), same angle
await api.v1.curve.arcByCenter({ id: shapeId, centerPos: [40, 0, 0], startPos: [55, 0, 0], endPos: [40, 15, 0] })

// Full circle (startPos == endPos)
await api.v1.curve.arcByCenter({ id: shapeId, centerPos: [50, 50, 0], startPos: [70, 50, 0], endPos: [70, 50, 0] })
```

## Related

`curve.polyline2d` · `curve.shape` · `curve.arcBy3Points` · `curve.arcByCenterRadAngle` · `curve.circle` · `curve.line` · `curve.deleteShape` / `curve.cleanShape`
