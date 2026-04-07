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

The bulge is `tan(a/4)` where `a` is the included arc angle between two consecutive points.

| Bulge value | Meaning |
|---|---|
| `0` | Straight line segment |
| `0.41421` (`tan(π/8)`) | 90° arc |
| `1` | 180° semicircle |
| `> 1` (e.g. `2`) | Arc > 180° (major arc) |
| negative | Clockwise arc (same magnitude = same angle, opposite direction) |

- Positive bulge → arc directed **counterclockwise** when looking in opposite direction of the normal
- The bulge on the **last point** is ignored for open polylines (no next point to arc to)
- With `close: true`, the last bulge controls the arc from last point back to first point

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

## Related

- `curve.shape` — create the shape container this operates on
- `curve.advancedPolyline` — more powerful PLD-based polyline with radius fillets, chamfers, relative coordinates
- `curve.deleteShape` — delete the shape containing the polyline
- `curve.line` — single line segment (simpler for just one segment)
- `curve.arcByCenter` / `curve.arcBy3Points` — standalone arcs (when you don't need a polyline)
