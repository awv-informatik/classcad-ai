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
| Movement+Angle | `xa`+`a`, `xr`+`a`, `yr`+`a`, `ya`+`ar`, `yr`+`ar`, `xa`+`ar` | Constrain one coordinate and angle; length computed internally |

**All modes can be freely mixed within a single polyline.** Each PLD entry is independent — use whatever mode is most natural for that vertex.

### ar Default Direction

When `ar` is used as the first segment after the start point (no prior segment exists), the **implicit "previous direction" is east (0 radians)**. In this position, `ar` behaves identically to `a`. For example: `{ l: 40, ar: PI/2 }` as the first segment goes north, same as `{ l: 40, a: PI/2 }`.

### ar Direction Accumulation

`ar` tracks direction correctly through multiple consecutive turns. Each `ar` adds to the accumulated direction from the previous segment. This makes it ideal for regular polygons: a pentagon uses `ar: 2*PI/5`, a hexagon uses `ar: PI/3`, etc.

### Movement+Angle Computed Length

For movement+angle combos (e.g., `xa: 40, a: PI/4`), the system computes the segment length needed to satisfy both constraints. The math: given a target coordinate and angle, the length is derived from the trigonometric relationship.

**Impossible combos:** When the angle is exactly parallel to the constrained axis (e.g., `ya: 50, a: 0` — horizontal angle but need to reach y=50), the system returns an error because the required length would be infinite. But geometrically contradictory (non-parallel) combos are accepted silently — they produce negative-length segments internally.

### Vertex Modifiers (optional per PLD entry)

- `r` — radius fillet. Creates a tangent arc at the vertex connecting adjacent segments. **The defined point becomes virtual** (collinear with both segments but not on the actual polyline). Works with all PLD modes (coordinate, angle, movement+angle).
- `c` — chamfer. Creates a symmetric chamfer (cut corner) of length `c` measured along the edge. Works with all PLD modes.

## Return Value

Returns `VOID` (null). Curves are added to the shape container. No ID returned.

## Gotchas

- **First PLD must be absolute.** Starting with `xr`/`yr` gives: `"First point must be defined in absolute coordinates ('xa', 'ya')"`.
- **Minimum 2 PLDs.** 1 point → internal error (array index out of bounds). Empty array `[]` → silent no-op.
- **`r: 0` is accepted as a sharp corner** (equivalent to omitting `r`). No fillet is created. Verified empirically — the older "internal error in `CurveHelper.ComputeFillet`" claim was either stale or fixed silently.
- **`r: negative` is rejected** with error code 1014, message `"The parameter \"pld[i].r\" (fillet radius) must be >= 0 when provided."` Previously a negative `r` was silently accepted and produced **corrupted geometry** at the corner (visible malformed protrusion); fixed alongside `curve.circle` in branch `fix/curve-circle-zero-radius-hang`.
- **`c: 0` is a no-op.** Accepted silently, no chamfer applied. Safe but pointless.
- **`c: negative` is accepted.** Silently accepted; behavior unclear — avoid.
- **Oversized `r` or `c`** → clear error: `"Can't create a fillet/chamfer with offset larger than line length!"`.
- **`r` + `c` on same point** → error: `"Both 'r' and 'c' must not be specified for the same point"`. Use one or the other per vertex.
- **`r` on first point** works when `close: true` — creates fillet at the closing junction (last→first→second). **Exception:** if the path already returns exactly to the start point, the closing segment is zero-length and fillet fails with `"Can't create a fillet between parallel lines!"`.
- **Angles are in radians.** `a` is absolute (CCW from X-axis), `ar` is relative (CCW from previous segment direction).
- **Strictly 2D.** Extra fields like `z` or `za` are silently ignored — no error, no effect.
- **`l: 0` is accepted** but creates a degenerate zero-length segment (no visible geometry, no error).
- **`l: negative` is accepted** and reverses the segment direction. `{ l: -30, a: 0 }` goes west instead of east.
- **`xr: 0, yr: 0` is accepted** — creates a degenerate zero-displacement point.

## PLD Validation Errors

The system validates PLD entries and gives specific error messages for invalid combinations:

| Error | Cause | Fix |
|---|---|---|
| `"First point must be defined in absolute coordinates"` | First PLD uses `xr`/`yr` | Use `xa`/`ya` for first point |
| `"Not enough data in PointLineDefinition!"` | Angle (`a`/`ar`) specified without length or coordinates | Add `l` for length, or use a coordinate field |
| `"'l' must not be used without either 'a' or 'ar'"` | Length without direction | Add `a` or `ar` to specify direction |
| `"The object \"pld\" is empty!"` | Empty PLD object `{}` in array | Provide at least one coordinate mode |
| `"Both 'xa' and 'xr' must not be specified"` | Both absolute and relative X | Use only `xa` or `xr` per entry |
| `"Both 'ya' and 'yr' must not be specified"` | Both absolute and relative Y | Use only `ya` or `yr` per entry |
| `"Both 'a' and 'ar' must not be specified"` | Both absolute and relative angle | Use only `a` or `ar` per entry |
| `"'l' must be used without 'xa' / 'xr' / 'ya' / 'yr'"` | Length + coordinates (overspecified) | Use either `l`+angle or coordinates, not both |
| `"Angle must not be too close to 0 or PI if 'xa'/'xr' is undefined"` | Movement+angle where angle is horizontal but only Y constrained | Use a non-parallel angle or specify X instead |
| `"Angle must not be too close to PI/2 or 3PI/2 if 'ya'/'yr' is undefined"` | Movement+angle where angle is vertical but only X constrained | Use a non-parallel angle or specify Y instead |
| `"Can't create a fillet with offset larger than line length!"` | `r` value exceeds adjacent edge length | Reduce radius or increase edge length |
| `"Can't create a chamfer with offset larger than line length!"` | `c` value exceeds adjacent edge length | Reduce chamfer or increase edge length |
| `"Both 'r' and 'c' must not be specified"` | Both `r` and `c` on same PLD entry | Use only one per vertex |
| `"Can't create a fillet between parallel lines!"` | Zero-length closing segment with `r` on first point | Don't use `r` on first point when path already returns to origin |
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

### Regular Hexagon (l/ar mode)

```js
const angle = (2 * Math.PI) / 6 // 60° exterior angle
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [
    { xa: 0, ya: 0 },
    { l: 25, a: 0 },           // first side east
    { l: 25, ar: angle },      // each subsequent side turns 60°
    { l: 25, ar: angle },
    { l: 25, ar: angle },
    { l: 25, ar: angle },
  ],
  close: true,
})
```

### Movement+Angle Combo

```js
// Reach x=40 at 45° angle — system computes length and y automatically
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [
    { xa: 0, ya: 0 },
    { xa: 40, a: Math.PI / 4 },   // ends at (40, 40)
    { xa: 80, ya: 40 },           // horizontal continuation
  ],
})
```

## Usage Hints

- **Rounded rectangles** are the most common use case. Use `r` on all 4 corners with `close: true`.
- **Mix `r` and `c`** on different vertices freely — just not on the same vertex.
- **Relative coords** (`xr`/`yr`) are convenient for step-by-step profiles after the absolute start.
- **`l`/`a` mode** is natural for polar-coordinate profiles (e.g., star shapes, regular polygons).
- **`l`/`ar` mode** is ideal when you know turning angles but not absolute directions. Perfect for regular polygons — just repeat the same `ar` value for each side.
- **Movement+angle combos** (e.g., `ya: 10, a: PI/4`) are useful when you need to reach a specific coordinate at a specific angle — the system computes the length internally. Avoid angles exactly parallel to the constrained axis (0/PI for Y-only, PI/2 for X-only).
- **Negative `l`** reverses direction — useful for backtracking without computing the reverse angle.
- For open profiles, simply omit `close` (defaults to `false`).
- When using `close: true` with `l/ar` that returns exactly to start, don't add `r` on the first point (zero-length closing segment causes parallel-lines error).

## Related

- `curve.polyline2d` — simpler polyline with points+bulges (no PLD, no radius/chamfer)
- `curve.shape` — create the shape container
- `curve.deleteShape` — delete the shape
- `curve.line` / `curve.arcByCenter` — individual segments (simpler for single elements)
