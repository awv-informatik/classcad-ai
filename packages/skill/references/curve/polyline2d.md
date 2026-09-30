# curve.polyline2d

Creates a polyline of lines and arcs from points with optional per-segment bulges, in a `curve.shape`.

## Key Parameters

- `id` — shape ID (`curve.shape`)
- `points` — `Array<point>` vertices. **Minimum 2** (1 point → internal error "Uninitialized MemberPTR"). **All at the same z (a plane parallel to XY)** — a planar outline in XZ or YZ is rejected too: code 1014 "polyline2d is not planar!". For other planes draw in XY, then `curve.rotateShape`/`transformShape` the shape (the bulges follow the transform).
- `bulges` (optional) — `Array<real>`, **exactly one per point** (mismatch → "there must be as many bulges as positions"; no partial arrays). Omit or `[]` for all straight segments.
- `close` (optional, default `FALSE`) — connects last point to first. Prefer it over repeating the first point at the end (as the docs example does) — the last bulge then controls the closing arc.

## Bulge Values

bulge = `tan(a/4)`, `a` = included arc angle of the segment; inverse `a = 4 * atan(bulge)`.

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
| 360° | `∞` (`tan(90°)`) | **Cannot represent a full circle** — use `curve.circle` |

- **Sign = side, always relative to +Z:** positive → the arc sweeps **counterclockwise seen from +Z**, i.e. it bulges to the **right of the travel direction** (point `i` → `i+1`); negative → left. The normal is fixed at +Z, never derived from the points, so the sign does NOT follow the winding: on a **counterclockwise outline positive rounds outward** (convex), on a **clockwise outline the same positive bulge cuts inward**. Know the outline's winding before choosing the sign. Positive, negative and zero bulges mix freely.
- **Check:** from `(0,0)` to `(10,0)` with bulge `1` the semicircle passes `(5,-5)`.
- **Bulge `i` applies to the segment from point `i` to `i+1`.** The last point's bulge is ignored for open polylines; with `close: true` it controls the closing arc.
- **Pure angle parameter**, independent of segment length: the radius scales with the chord. Sagitta (arc height) = `bulge * chord_length / 2`.
- **Extremes, no error or clamping:** `0.001` → barely visible curve; `100` → nearly full circle; bulge on a zero-length segment (duplicate points) → silently degenerate.

## Return Value

`VOID` (null); curves are added to the shape, no ID.

## Gotchas

- **Duplicate consecutive points** are silently accepted (zero-length segment), no warning.
- **Verify the side, not just the size:** on an outline a flipped bulge changes the area (outward ↔ inward), but an arc closed only by its own chord has the same area for both signs — check the COG side.

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const b90 = Math.tan(Math.PI / 8) // ≈ 0.41421 → 90° arc

// L-shape with one rounded inner corner
const shapeId = (await api.v1.curve.shape({ id: eifId })).result
await api.v1.curve.polyline2d({
  id: shapeId,
  points: [[0, 0, 0], [60, 0, 0], [60, 20, 0], [20, 20, 0], [20, 50, 0], [0, 50, 0]],
  bulges: [0, 0, 0, b90, 0, 0],
  close: true,
})

// Rounded rectangle: points offset by the corner radius, 90° bulge on each corner segment
const rect = (await api.v1.curve.shape({ id: eifId })).result
const w = 80, h = 40, r = 5
await api.v1.curve.polyline2d({
  id: rect,
  points: [
    [r, 100, 0], [w - r, 100, 0],        // bottom
    [w, 100 + r, 0], [w, 100 + h - r, 0], // right
    [w - r, 100 + h, 0], [r, 100 + h, 0], // top
    [0, 100 + h - r, 0], [0, 100 + r, 0], // left
  ],
  bulges: [0, b90, 0, b90, 0, b90, 0, b90],
  close: true,
})
```

## Related

`curve.shape` · `curve.advancedPolyline` · `curve.deleteShape` · `curve.line` · `curve.arcByCenter` / `curve.arcBy3Points`
