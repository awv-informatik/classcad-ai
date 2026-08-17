# curve.polyline2d

Creates a polyline (sequence of lines and arcs) from an array of points with optional bulge values per segment.

## Prerequisites

- A part (`part.create`)
- An entity injection (`part.entityInjection`)
- A shape container (`curve.shape`)

## Key Parameters

- `id` — shape ID (from `curve.shape`)
- `points` — `Array<point>` defining the polyline vertices. **Minimum 2 points.** All points must be coplanar (same plane).
- `bulges` (optional) — `Array<real>`, one per point. Controls arc curvature per segment. **Must be exactly the same length as `points`** if provided. Omit or pass `[]` for all straight segments.
- `close` (optional, default `FALSE`) — connects last point back to first point

## Bulge Values

The bulge is `tan(a/4)` where `a` is the included arc angle between two consecutive points. The inverse formula: `angle = 4 * atan(bulge)`.

### Quick Reference Table

| Angle | Bulge value | Notes |
|-------|-------------|-------|
| 0° | `0` | Straight line segment |
| 10° | `0.04366` | Barely curved |
| 30° | `0.13165` | Gentle arc |
| 45° | `0.19891` | |
| 60° | `0.26795` | |
| **90°** | **`0.41421`** (`tan(π/8)`) | Most common — corner fillets, rounded rects |
| 120° | `0.57735` | |
| **180°** | **`1.0`** | Semicircle — sagitta equals half the chord |
| 270° | `2.41421` | Major arc (> half circle) |
| 360° | `∞` (`tan(90°)`) | **Cannot represent a full circle** — use `curve.circle` instead |

### Direction

- **Positive bulge** → arc directed **counterclockwise** when looking in opposite direction of the normal
- **Negative bulge** → **clockwise** arc. Same magnitude = same angle, just mirrored direction
- Each segment's bulge is independent — you can mix positive, negative, and zero bulges in one polyline

### Closing segment

- The bulge on the **last point** is ignored for open polylines (no next point to arc to)
- With `close: true`, the last bulge controls the arc from last point back to first point

### Geometry relationship

- Bulge is a pure **angle** parameter — independent of segment length
- Same bulge on a short or long segment produces the same arc angle; the radius scales with chord length
- Sagitta (arc height) = `bulge * chord_length / 2`
- For a 180° semicircle: sagitta = chord/2 (the arc radius equals half the chord)

### Extreme values

- Very small bulges (e.g. `0.001`) produce barely-visible curves — no error
- Very large bulges (e.g. `100`) produce nearly-full-circle arcs — no error or clamping
- Bulge on a zero-length segment (duplicate points) is silently accepted (degenerate geometry)

## Return Value

Returns `VOID` (null). No ID returned — the curves are added to the shape container.

## Gotchas

- **1 point** → internal error ("Uninitialized MemberPTR"). Always pass at least 2 points.
- **Bulge array length mismatch** → error: "there must be as many bulges as positions". No partial arrays.
- **Empty bulges `[]`** → valid, equivalent to omitting `bulges`. All segments become straight lines.
- **Non-planar points** → error code 1014: "polyline2d is not planar!". Strictly enforced.
- **Duplicate consecutive points** → silently accepted (creates zero-length segment). No warning.
- The docs example uses 5 points with first=last to close manually. Prefer `close: true` instead — it's cleaner and the last bulge controls the closing arc.

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId })).result

// L-shaped profile with one rounded inner corner
const b90 = Math.tan(Math.PI / 8) // ≈ 0.41421 → 90° arc
await api.v1.curve.polyline2d({
  id: shapeId,
  points: [
    [0, 0, 0],
    [60, 0, 0],
    [60, 20, 0],
    [20, 20, 0], // rounded inner corner
    [20, 50, 0],
    [0, 50, 0],
  ],
  bulges: [0, 0, 0, b90, 0, 0],
  close: true,
})
```

## Common Pattern: Rounded Rectangle

Offset each corner by the fillet radius, use 90° bulge at corners, close with `close: true`:

```js
const b90 = Math.tan(Math.PI / 8) // ≈ 0.41421
const w = 80, h = 40, r = 5       // width, height, corner radius
await api.v1.curve.polyline2d({
  id: shapeId,
  points: [
    [r, 0, 0],     [w - r, 0, 0],   // bottom edge
    [w, r, 0],     [w, h - r, 0],    // right edge
    [w - r, h, 0], [r, h, 0],        // top edge
    [0, h - r, 0], [0, r, 0],        // left edge
  ],
  bulges: [0, b90, 0, b90, 0, b90, 0, b90],
  close: true,
})
```

## Related

- `curve.shape` — create the shape container this operates on
- `curve.advancedPolyline` — more powerful PLD-based polyline with radius fillets, chamfers, relative coordinates
- `curve.deleteShape` — delete the shape containing the polyline
- `curve.line` — single line segment (simpler for just one segment)
- `curve.arcByCenter` / `curve.arcBy3Points` — standalone arcs (when you don't need a polyline)
