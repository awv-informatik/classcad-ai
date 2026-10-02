# curve.advancedPolyline

Creates a polyline from PLDs (PointLineDefinitions): absolute/relative coordinates, angle+length segments, radius fillets and chamfers.

## Key Parameters

- `id` — shape ID (`curve.shape`)
- `pld` — `Array<object>`. **Minimum 2 entries.** First entry **must** be absolute (`xa`, `ya`).
- `close` (optional, default `false`) — connects last point back to first; omit for open profiles

### PLD Entry Modes

Modes can be freely mixed within one polyline; each entry is independent.

| Mode | Fields | Description |
|---|---|---|
| Absolute | `xa`, `ya` | Absolute X/Y position |
| Relative | `xr`, `yr` | Offset from previous point |
| Mixed | `xa`+`yr` or `xr`+`ya` | Mix absolute and relative |
| Angle+Length (abs) | `l`, `a` | Length and absolute angle (radians, CCW from X-axis) |
| Angle+Length (rel) | `l`, `ar` | Length and relative angle (radians, CCW from previous segment direction) |
| Movement+Angle | `xa`+`a`, `xr`+`a`, `yr`+`a`, `ya`+`ar`, `yr`+`ar`, `xa`+`ar` | One coordinate + angle; length computed internally |

- **`ar` as first segment:** the implicit previous direction is east (0 rad), so `ar` ≡ `a` (`{ l: 40, ar: PI/2 }` goes north).
- **`ar` accumulates** correctly through consecutive turns — ideal for regular polygons (pentagon `ar: 2*PI/5`, hexagon `ar: PI/3`) or whenever you know turning angles, not absolute directions. `l`/`a` suits polar profiles (stars, polygons).
- **Movement+Angle** (e.g. `xa: 40, a: PI/4`) derives the length trigonometrically — handy to reach a coordinate at a given angle. An angle exactly parallel to the constrained axis (e.g. `ya: 50, a: 0`) errors (infinite length); geometrically contradictory non-parallel combos are accepted silently and produce negative-length segments internally.

### Vertex Modifiers (optional per entry, work with all modes)

- `b` — bulge of the segment from this entry to the next (`tan(sweep/4)`); with `close: true` the last entry's `b` bends the closing segment. Same convention as `curve.polyline2d`: positive = counterclockwise seen from +Z = arc right of the travel direction — outward on a counterclockwise outline, inward on a clockwise one.
- `r` — radius fillet: tangent arc at the vertex; **the defined point becomes virtual** (collinear with both segments, not on the polyline). Rounded rectangles: `r` on all 4 corners with `close: true`. Works next to `b` arcs too — except on the first entry next to an arc closing segment (see Gotchas).
- `c` — symmetric chamfer of length `c` measured along the edge.
- `r` and `c` can be mixed across vertices, never on the same vertex.

## Return Value

`VOID` (null); curves are added to the shape, no ID.

## Gotchas

- **⚠️ A single PLD entry crashes the ClassCAD worker** (connection lost, process exits) — always pass at least 2. Empty array `[]` → silent no-op.
- **⚠️ `b` on the last entry of a closed polyline crashes the worker when the first entry has no `b`** — give the first entry `b: 0` whenever the closing segment is an arc.
- **⚠️ `r` on the first entry next to an arc closing segment** crashes the worker — or, with `b: 0` on that entry, silently builds a wrong fillet. Start the outline at a different vertex so the fillet is not on the first entry.
- **`r: 0`** → sharp corner (same as omitting `r`), no error.
- **`r` negative → rejected**, code 1014, `"The parameter \"pld[i].r\" (fillet radius) must be >= 0 when provided."`.
- **`c: 0`** → silent no-op. **`c` negative** → silently accepted, behavior unclear — avoid.
- **`r` on the first point** works with `close: true` (fillet at last→first→second) — **except** when the path already returns exactly to the start: the zero-length closing segment fails with `"Can't create a fillet between parallel lines!"`.
- **Strictly 2D** — `z`/`za` fields are silently ignored.
- **`l: 0`** → degenerate zero-length segment, no error. **`l` negative** → reverses direction (`{ l: -30, a: 0 }` goes west) — useful for backtracking. **`xr: 0, yr: 0`** → degenerate zero-displacement point, no error.

## PLD Validation Errors

| Error | Cause | Fix |
|---|---|---|
| `"First point must be defined in absolute coordinates ('xa', 'ya')"` | First PLD uses `xr`/`yr` | Use `xa`/`ya` |
| `"Not enough data in PointLineDefinition!"` | `a`/`ar` without length or coordinates | Add `l` or a coordinate |
| `"'l' must not be used without either 'a' or 'ar'"` | Length without direction | Add `a` or `ar` |
| `"The object \"pld\" is empty!"` | `{}` entry | Provide a coordinate mode |
| `"Both 'xa' and 'xr' must not be specified"` | Absolute + relative X | One per entry |
| `"Both 'ya' and 'yr' must not be specified"` | Absolute + relative Y | One per entry |
| `"Both 'a' and 'ar' must not be specified"` | Absolute + relative angle | One per entry |
| `"'l' must be used without 'xa' / 'xr' / 'ya' / 'yr'"` | Length + coordinates (overspecified) | `l`+angle or coordinates |
| `"Angle must not be too close to 0 or PI if 'xa'/'xr' is undefined"` | Horizontal angle, only Y constrained | Non-parallel angle or specify X |
| `"Angle must not be too close to PI/2 or 3PI/2 if 'ya'/'yr' is undefined"` | Vertical angle, only X constrained | Non-parallel angle or specify Y |
| `"Can't create a fillet with offset larger than line length!"` | `r` exceeds adjacent edge length | Smaller radius / longer edge |
| `"Can't create a chamfer with offset larger than line length!"` | `c` exceeds adjacent edge length | Smaller chamfer / longer edge |
| `"Both 'r' and 'c' must not be specified for the same point"` | `r` and `c` on one entry | One per vertex |
| `"Can't create a fillet between parallel lines!"` | Zero-length closing segment with `r` on first point | No `r` on first point when path returns to start |
| Worker crash (connection lost) | Only 1 PLD entry | At least 2 entries |
| Worker crash (connection lost) | `close: true`, `b` on the last entry, none on the first | `b: 0` on the first entry |
| Worker crash, or a wrong fillet | `r` on the first entry, arc on the closing segment | Start the outline at another vertex |

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId })).result

// L-bracket with fillets, a chamfer and a relative step
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [
    { xa: 0, ya: 0 },
    { xa: 100, ya: 0, r: 5 },
    { xa: 100, ya: 15 },
    { xa: 30, ya: 15, r: 8 },   // inner corner
    { xa: 30, ya: 60, r: 5 },
    { xa: 15, ya: 60, c: 3 },   // chamfer
    { xr: 0, yr: -45 },         // relative: down
    { xa: 0, ya: 0 },
  ],
})

// Regular hexagon (l/ar): each side turns 60°
const hex = (await api.v1.curve.shape({ id: eifId })).result
const turn = (2 * Math.PI) / 6
await api.v1.curve.advancedPolyline({
  id: hex,
  pld: [{ xa: 200, ya: 0 }, { l: 25, a: 0 }, { l: 25, ar: turn }, { l: 25, ar: turn }, { l: 25, ar: turn }, { l: 25, ar: turn }],
  close: true,
})

// Movement+angle: reach x=40 at 45° → ends at (40, 40)
const open = (await api.v1.curve.shape({ id: eifId })).result
await api.v1.curve.advancedPolyline({
  id: open,
  pld: [{ xa: 0, ya: 100 }, { xa: 40, a: Math.PI / 4 }, { xa: 80, ya: 140 }],
})
```

## Related

`curve.polyline2d` · `curve.shape` · `curve.deleteShape` · `curve.line` / `curve.arcByCenter`
