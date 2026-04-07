# curve.advancedPolyline

Creates a polyline using the PLD (PointLineDefinition) system — a powerful way to define 2D profiles with absolute/relative coordinates, angle+length segments, radius fillets, and chamfers.

## Prerequisites

- A part (`part.create`)
- An entity injection (`part.entityInjection`)
- A shape container (`curve.shape`)

## Key Parameters

- `id` — shape ID (from `curve.shape`)
- `pld` — `Array<object>` of PointLineDefinitions. **Minimum 2 entries.** First entry **must** use absolute coordinates (`xa`, `ya`).
- `close` (optional, default `false`) — connects last point back to first

### PLD Entry Modes

Each PLD entry defines a point using one of these coordinate modes:

| Mode | Fields | Description |
|---|---|---|
| Absolute | `xa`, `ya` | Absolute X/Y position |
| Relative | `xr`, `yr` | Offset from previous point |
| Mixed | `xa`+`yr` or `xr`+`ya` | Mix absolute and relative |
| Angle+Length (abs) | `l`, `a` | Length and absolute angle (radians, CCW from X-axis) |
| Angle+Length (rel) | `l`, `ar` | Length and relative angle (radians, CCW from previous segment direction) |
| Movement+Angle | `xa`+`a`, `xr`+`a`, `yr`+`ar`, `ya`+`ar`, etc. | Constrain one coordinate and angle; length computed internally |

### Vertex Modifiers (optional per PLD entry)

- `r` — radius fillet. Creates a tangent arc at the vertex connecting adjacent segments. **The defined point becomes virtual** (collinear with both segments but not on the actual polyline).
- `c` — chamfer. Creates a symmetric chamfer (cut corner) of length `c` measured along the edge.

## Return Value

Returns `VOID` (null). Curves are added to the shape container. No ID returned.

## Gotchas

- **First PLD must be absolute.** Starting with `xr`/`yr` gives: `"First point must be defined in absolute coordinates ('xa', 'ya')"`.
- **Minimum 2 PLDs.** 1 point → internal error (array index out of bounds). Empty array `[]` → silent no-op.
- **`r: 0` crashes.** Zero radius triggers an internal error in `CurveHelper.ComputeFillet` (array index out of bounds). Use no `r` property instead of `r: 0`.
- **`r: negative` is accepted.** Produces an outward-bulging arc (fillet extends outward from the corner instead of inward). May be useful for decorative profiles, but undocumented.
- **`c: 0` is a no-op.** Accepted silently, no chamfer applied. Safe but pointless.
- **`c: negative` is accepted.** Silently accepted; behavior unclear — avoid.
- **Oversized `r` or `c`** → clear error: `"Can't create a fillet/chamfer with offset larger than line length!"`.
- **`r` + `c` on same point** → error: `"Both 'r' and 'c' must not be specified for the same point"`. Use one or the other per vertex.
- **`r` on first point** works when `close: true` — creates fillet at the closing junction (last→first→second).
- **Angles are in radians.** `a` is absolute (CCW from X-axis), `ar` is relative (CCW from previous segment direction).

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"First point must be defined in absolute coordinates"` | First PLD uses `xr`/`yr` | Use `xa`/`ya` for first point |
| `"Can't create a fillet with offset larger than line length!"` | `r` value exceeds adjacent edge length | Reduce radius or increase edge length |
| `"Can't create a chamfer with offset larger than line length!"` | `c` value exceeds adjacent edge length | Reduce chamfer or increase edge length |
| `"Both 'r' and 'c' must not be specified"` | Both `r` and `c` on same PLD entry | Use only one per vertex |
| Array index out of bounds in `ComputeFillet` | `r: 0` | Omit `r` instead of setting to 0 |
| Array index out of bounds in `advancedPolyline::PROC` | Only 1 PLD entry | Provide at least 2 PLD entries |

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId })).result

// L-bracket profile with fillets and chamfer
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [
    { xa: 0, ya: 0 },
    { xa: 100, ya: 0, r: 5 },      // bottom-right with small fillet
    { xa: 100, ya: 15 },            // up
    { xa: 30, ya: 15, r: 8 },       // inner corner with larger fillet
    { xa: 30, ya: 60, r: 5 },       // up
    { xa: 15, ya: 60, c: 3 },       // top corner with chamfer
    { xr: 0, yr: -45 },             // relative: down
    { xa: 0, ya: 0 },               // back to origin
  ],
})
```

## Usage Hints

- **Rounded rectangles** are the most common use case. Use `r` on all 4 corners with `close: true`.
- **Mix `r` and `c`** on different vertices freely — just not on the same vertex.
- **Relative coords** (`xr`/`yr`) are convenient for step-by-step profiles after the absolute start.
- **`l`/`a` mode** is natural for polar-coordinate profiles (e.g., star shapes, regular polygons).
- **`l`/`ar` mode** is ideal when you know turning angles but not absolute directions.
- **Movement+angle combos** (e.g., `ya: 10, a: PI/4`) are useful when you need to reach a specific coordinate at a specific angle — the system computes the length internally.
- For open profiles, simply omit `close` (defaults to `false`).

## Related

- `curve.polyline2d` — simpler polyline with points+bulges (no PLD, no radius/chamfer)
- `curve.shape` — create the shape container
- `curve.deleteShape` — delete the shape
- `curve.line` / `curve.arcByCenter` — individual segments (simpler for single elements)
