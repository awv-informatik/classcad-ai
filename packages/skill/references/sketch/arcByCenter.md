# sketch.arcByCenter

Creates one or multiple arcs defined by start, end, and center positions. The center defines the arc radius — both endpoints must lie on the circle of that radius.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create` or `part.sketch`)

## Key Parameters

- **`id`** (required) — sketch ID
- **`startPos`** (required) — `[x, y, z]`, Z must be 0
- **`endPos`** (required) — `[x, y, z]`, Z must be 0
- **`centerPos`** (required) — `[x, y, z]`, Z must be 0. Defines arc radius.
- **`isClockwise`** (optional, **default TRUE**) — sweep direction from start to end around the center, in SKETCH-LOCAL coordinates: TRUE = math-negative (decreasing angle), FALSE = math-positive / CCW (increasing angle). Purely local and identical on all three standard planes — world appearance follows the plane's local→world mapping (measured 2026-08-19, segment-extrusion volume + COG on Top/Front/Right). TRUE and FALSE with the same points produce complementary arcs. COMPUTE the flag from the start/end angles plus one must-pass angle — never intuit it (see recipes/constrained-sketching). Omitting the flag gives the math-negative sweep — a classic source of silently flipped profiles.
- **`genFixation`** (optional, default TRUE) — auto-generates `CC_2DFixationConstraint` ("Auto_Fix") **only when the center is at origin** (0,0,0). No effect for off-origin centers. Same behavior as point/circle.
- **`genIncidence`** (optional, default TRUE) — auto-generates `CC_2DCoincidentConstraint` ("Auto_Coinc") when any arc endpoint **exactly matches** an existing point. Works cross-geometry (standalone points, line endpoints, other arc endpoints, circle centers).
- **`isConstruction`** (optional, default FALSE) — marks the arc as construction/reference geometry (drawn dashed). It participates fully in the constraint solver (e.g. a real curve can be made tangent to it) but is excluded from the profile and from operations: passing construction-only curves to a region op (`part.extrusion`/`part.revolve`/`part.twist`) returns an error (`maxLevel 51`), not a solid. See [constrained-sketching](../../recipes/constrained-sketching.md) (§ Construction geometry).

## Radius Constraint

**`|startPos - centerPos|` must equal `|endPos - centerPos|`.** Both endpoints must be equidistant from the center. Unequal distances → warning 1014 "Start-, center- and end-pos do not fit together", result is null.

## Direction & bulge (measured 2026-08-19)

- The direction lives ONLY in the structure tree: `CC_CircularArc.members.bulge.value` = **tan(signedSweep/4)** with the sweep signed start→end in sketch-local coords — positive = CCW, negative = clockwise. Examples: CCW quarter +0.4142, CW 270° −2.4142, semicircle ±1.
- `getPositions` (start/end/center) and `getObjectInfo` (`geometry: {startId, endId, centerId, radius}`) expose **no direction at all** — an arc and its complement are indistinguishable through them. Read the tree bulge.
- **Direction is fixed at creation** — see Updating below. To flip an arc, delete and recreate it.
- Swapping start/end while keeping the flag yields the COMPLEMENTARY arc. A mirrored profile traversed in reverse keeps the SAME flag — the mirror flips the sweep, the reversal flips it back (COG measured exactly mirrored).
- Bulge stays exactly consistent through solver re-solves (radius re-dimensioned 10→15→6: R-from-bulge ≡ R-from-positions to 1e-15). Only known corruption path: the twin-dim unsolvable-intermediate bug (TODO #174).
- A flipped arc whose two variants enclose equal area (semicircle across its chord: 785.4 mm³ both ways at r=10×h=5) is INVISIBLE to volume checks — the COG side is the discriminating probe (±4.24 = 4R/3π).

## Batch Creation

Pass an array of param objects:

```js
const r = await api.v1.sketch.arcByCenter([
  { id: skId, startPos: [-30, 0, 0], centerPos: [0, 0, 0], endPos: [30, 0, 0] },
  { id: skId, startPos: [-20, -60, 0], centerPos: [0, -60, 0], endPos: [20, -60, 0], isClockwise: false },
])
// r.result → [58, 65] — array of IDs in matching order
```

## Return Value

```js
{ result: id | VOID | Array<id|VOID>, messages?: [...], maxLevel?: real }
```

- Success: numeric ID (e.g., 58), maxLevel=31 (info), no messages
- Batch: array of IDs matching input order
- Failure: result=null, maxLevel=41 or 51, messages with error details

## Structure

Each arc creates a `CC_CircularArc` node with three child points:

- End point at ID offset +1
- Start point at ID offset +2
- Center point at ID offset +3

ID consumption: ~4 base IDs (arc + 3 points) + 2-3 per auto-constraint. Gap between consecutive arcs is typically 5-7 IDs depending on constraints.

## Querying Arc Data

**`getPositions(arcId)`** — **WORKS directly on arc IDs** (unlike circles!). Returns:

```js
{ startPos: { x, y, z }, endPos: { x, y, z }, centerPos: { x, y, z } }
```

**`getPoints(arcId)`** — returns the three child point IDs:

```js
{ startId: id, endId: id, centerId: id }
```

**`getGeometry(sketchId)`** — arcs appear in the `arcs` array:

```js
{ arcs: [id, ...], circles: [...], lines: [...], points: [...] }
```

## Updating

Use `updateGeometry` with the `arcsByCenter` array:

```js
await api.v1.sketch.updateGeometry({
  id: skId,
  arcsByCenter: [
    {
      id: arcId,
      startPos: [-20, 20, 0],
      centerPos: [0, 20, 0],
      endPos: [20, 20, 0],
    },
  ],
})
```

Positions can be updated individually; keep start and end equidistant from the center.

**`isClockwise` CANNOT be changed via updateGeometry** — the flag is accepted and silently ignored (maxLevel 31, bulge and geometry unchanged; measured 2026-08-19 with both unchanged and new positions). Position updates preserve the creation-time sweep character (minor stays minor, CW stays CW). To flip direction: `deleteObject` + recreate.

## Deletion

```js
await api.v1.sketch.deleteObject({ ids: [arcId] })
```

Returns VOID on success. `getPoints`/`getPositions` on deleted arc returns null with maxLevel=51.

## Gotchas

- **Radius must match** — `|start-center|` must equal `|end-center|` within ~1e-9: a 1e-9 difference is accepted, 1e-6 is rejected (warning 1014, no arc).
- **getPositions works on arcs** — unlike circles, no two-step workaround needed.
- **updateGeometry requires all three positions** — cannot update just one endpoint.
- **isClockwise determines which arc** — same three points, different direction = complementary arcs; TRUE (the default!) = math-negative sweep in sketch-local coords.
- **No direction readback outside the tree** — getPositions/getObjectInfo can't tell an arc from its complement; use `members.bulge.value`.
- **start==end is invalid** — returns ERROR "Invalid arc parameters", not a full circle. Use `sketch.circle` for full circles.
- **Non-zero Z → error 1014** — same as all sketch geometry.
- **Minor float noise** — CCW arc centerPos may show tiny float artifacts (e.g., 2.84e-15 instead of 0).

## Common Errors

| Error                                                     | Code | Level        | Cause                               |
| --------------------------------------------------------- | ---- | ------------ | ----------------------------------- |
| "startPos which is a 2D point, must have a z-value of 0!" | 1014 | 51 (ERROR)   | Non-zero Z coordinate               |
| "Start-, center- and end-pos do not fit together."        | 1014 | 41 (WARNING) | Unequal radii or center==start      |
| "Invalid arc parameters"                                  | 0    | 51 (ERROR)   | start==end or all points identical  |
| "centerPos must be provided in the api call!"             | 1004 | 51 (ERROR)   | Missing centerPos in updateGeometry |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create a semicircular arc (CW, 180°)
const arcId = (
  await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })
).result

// Query positions directly
const pos = (await api.v1.sketch.getPositions({ id: arcId })).result
// pos → { startPos: {x:-40,y:0,z:0}, endPos: {x:40,y:0,z:0}, centerPos: {x:0,y:0,z:0} }

// Update position and flip direction
await api.v1.sketch.updateGeometry({
  id: skId,
  arcsByCenter: [
    {
      id: arcId,
      startPos: [-20, 20, 0],
      centerPos: [0, 20, 0],
      endPos: [20, 20, 0],
      isClockwise: false,
    },
  ],
})

// Use in a closed profile for extrusion
const lineId = (
  await api.v1.sketch.line({
    id: skId,
    startPos: [40, 0, 0],
    endPos: [-40, 0, 0],
  })
).result
const regionId = (
  await api.v1.sketch.sketchRegion({
    id: skId,
    geomIds: [arcId, lineId],
  })
).result
```

## Related

`sketch.arcBy3Points` · `sketch.circle` · `sketch.getPositions` · `sketch.getPoints` · `sketch.getGeometry` · `sketch.updateGeometry` · `sketch.deleteObject` · `sketch.sketchRegion`
