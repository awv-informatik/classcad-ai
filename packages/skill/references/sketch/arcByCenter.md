# sketch.arcByCenter

Creates one or more arcs from start, end, and center positions. The center defines the radius — both endpoints must lie on that circle.

## Key Parameters

- **`id`** (required) — sketch ID
- **`startPos`**, **`endPos`**, **`centerPos`** (required) — `[x, y, 0]`; non-zero Z → error 1014
- **`isClockwise`** (optional, **default TRUE**) — sweep start→end around the center in SKETCH-LOCAL coordinates: TRUE = math-negative (decreasing angle), FALSE = math-positive / CCW. Purely local, identical on all three standard planes — world appearance follows the plane's local→world mapping (measured via segment-extrusion volume + COG on Top/Front/Right). Same points with TRUE vs FALSE give complementary arcs. COMPUTE the flag from start/end angles plus one must-pass angle — never intuit it (see recipes/constrained-sketching). Omitting it gives the math-negative sweep — a classic source of silently flipped profiles.
- **`genFixation`** (optional, default TRUE) — "Auto_Fix" (`CC_2DFixationConstraint`) **only when the center is at origin**; same as point/circle.
- **`genIncidence`** (optional, default TRUE) — "Auto_Coinc" (`CC_2DCoincidentConstraint`) when an endpoint **exactly matches** an existing point (standalone points, line/arc endpoints, circle centers).
- **`isConstruction`** (optional, default FALSE) — construction geometry (dashed): fully in the solver (a real curve can be tangent to it) but excluded from profiles; construction-only curves in `part.extrusion`/`part.revolve`/`part.twist` → error (maxLevel 51), no solid. See [constrained-sketching](../../recipes/constrained-sketching.md) (§ Construction geometry).

## Radius Constraint

`|startPos - centerPos|` must equal `|endPos - centerPos|` within ~1e-9 (1e-9 difference accepted, 1e-6 rejected). Otherwise warning 1014 "Start-, center- and end-pos do not fit together", result null.

## Direction & bulge

- Direction lives ONLY in the tree: `CC_CircularArc.members.bulge.value` = **tan(signedSweep/4)**, sweep signed start→end in sketch-local coords, positive = CCW. CCW quarter +0.4142, CW 270° −2.4142, semicircle ±1.
- `getPositions` and `getObjectInfo` (`geometry: {startId, endId, centerId, radius}`) expose **no direction** — an arc and its complement are indistinguishable. Read the bulge.
- Swapping start/end with the same flag yields the COMPLEMENTARY arc. A mirrored profile traversed in reverse keeps the SAME flag (mirror flips the sweep, reversal flips it back; COG measured exactly mirrored).
- Bulge stays consistent through re-solves (radius 10→15→6: R-from-bulge ≡ R-from-positions to 1e-15). Only known corruption: the twin-dim unsolvable-intermediate bug.
- A flipped arc whose variants enclose equal area (semicircle across its chord: 785.4 mm³ both ways at r=10×h=5) is INVISIBLE to volume checks — check the COG side (±4.24 = 4R/3π).

## Return Value

`result: id | VOID | Array<id|VOID>`. Success: ID, maxLevel 31, no messages. Batch (array of param objects): IDs in input order. Failure: null, maxLevel 41 or 51.

## Structure & Queries

`CC_CircularArc` node with child points: end (ID +1), start (+2), center (+3). ~4 IDs + 2–3 per auto-constraint; consecutive arcs typically 5–7 apart.

- `getPositions({ id: arcId })` works directly (unlike circles): `{ startPos, endPos, centerPos }`
- `getPoints` → `{ startId, endId, centerId }`; `getGeometry(sketchId)` lists it in `arcs`
- After `deleteObject`, `getPoints`/`getPositions` return null, maxLevel 51.

## Updating

`updateGeometry` with `arcsByCenter: [{ id, startPos, centerPos, endPos }]` — all three positions required (missing `centerPos` → 1004); keep start/end equidistant.

**`isClockwise` CANNOT be changed via updateGeometry** — accepted and silently ignored (maxLevel 31, bulge and geometry unchanged, with or without new positions). Position updates preserve the creation-time sweep (minor stays minor, CW stays CW). To flip: `deleteObject` + recreate.

## Gotchas

- **start==end is invalid** — "Invalid arc parameters", not a full circle. Use `sketch.circle`.
- **Float noise** — CCW arc centerPos may show e.g. 2.84e-15 instead of 0.

## Common Errors

| Error | Code | Level | Cause |
|---|---|---|---|
| "startPos which is a 2D point, must have a z-value of 0!" | 1014 | 51 | Non-zero Z |
| "Start-, center- and end-pos do not fit together." | 1014 | 41 | Unequal radii or center==start |
| "Invalid arc parameters" | 0 | 51 | start==end or all points identical |
| "centerPos must be provided in the api call!" | 1004 | 51 | Missing centerPos in updateGeometry |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Batch: default CW semicircle + CCW semicircle
const [arcId] = (await api.v1.sketch.arcByCenter([
  { id: skId, startPos: [-40, 0, 0], centerPos: [0, 0, 0], endPos: [40, 0, 0] },
  { id: skId, startPos: [-20, -60, 0], centerPos: [0, -60, 0], endPos: [20, -60, 0], isClockwise: false },
])).result

const pos = (await api.v1.sketch.getPositions({ id: arcId })).result
// { startPos: {x:-40,y:0,z:0}, endPos: {x:40,y:0,z:0}, centerPos: {x:0,y:0,z:0} }

await api.v1.sketch.updateGeometry({
  id: skId,
  arcsByCenter: [{ id: arcId, startPos: [-20, 20, 0], centerPos: [0, 20, 0], endPos: [20, 20, 0] }],
})
```

## Related

`sketch.arcBy3Points` · `sketch.circle` · `sketch.getPositions` · `sketch.getPoints` · `sketch.getGeometry` · `sketch.updateGeometry` · `sketch.deleteObject` · `sketch.sketchRegion`
