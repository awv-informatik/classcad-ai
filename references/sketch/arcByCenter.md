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
- **`isClockwise`** (optional, default TRUE) — direction from start to end around center. TRUE = clockwise, FALSE = counterclockwise. CW and CCW with the same points produce complementary arcs (together they'd form a full circle).
- **`genFixation`** (optional, default TRUE) — auto-generates `CC_2DFixationConstraint` ("Auto_Fix") **only when the center is at origin** (0,0,0). No effect for off-origin centers. Same behavior as point/circle.
- **`genIncidence`** (optional, default TRUE) — auto-generates `CC_2DCoincidentConstraint` ("Auto_Coinc") when any arc endpoint **exactly matches** an existing point. Works cross-geometry (standalone points, line endpoints, other arc endpoints, circle centers).
- **`isConstruction`** (optional, default FALSE) — marks the arc as construction/reference geometry (drawn dashed). It participates fully in the constraint solver (e.g. a real curve can be made tangent to it) but is excluded from the profile and from operations: passing construction-only curves to a region op (`part.extrusion`/`part.revolve`/`part.twist`) returns an error (`maxLevel 51`), not a solid. See [SKETCHING.md](../SKETCHING.md) (§ Construction geometry).

## Radius Constraint

**`|startPos - centerPos|` must equal `|endPos - centerPos|`.** Both endpoints must be equidistant from the center. Unequal distances → warning 1014 "Start-, center- and end-pos do not fit together", result is null.

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
  arcsByCenter: [{
    id: arcId,
    startPos: [-20, 20, 0],
    centerPos: [0, 20, 0],
    endPos: [20, 20, 0],
  }]
})
```

**All three positions (startPos, endPos, centerPos) are required.** Omitting any → error 1004. No partial updates.

**`isClockwise` can be changed** via updateGeometry — include it in the update object to flip arc direction.

## Deletion

```js
await api.v1.sketch.deleteObject({ ids: [arcId] })
```

Returns VOID on success. `getPoints`/`getPositions` on deleted arc returns null with maxLevel=51.

## Gotchas

- **Radius must match** — `|start-center|` must equal `|end-center|`. No tolerance.
- **getPositions works on arcs** — unlike circles, no two-step workaround needed.
- **updateGeometry requires all three positions** — cannot update just one endpoint.
- **isClockwise determines which arc** — same three points, different direction = complementary arcs.
- **start==end is invalid** — returns ERROR "Invalid arc parameters", not a full circle. Use `sketch.circle` for full circles.
- **Non-zero Z → error 1014** — same as all sketch geometry.
- **Minor float noise** — CCW arc centerPos may show tiny float artifacts (e.g., 2.84e-15 instead of 0).

## Common Errors

| Error | Code | Level | Cause |
|-------|------|-------|-------|
| "startPos which is a 2D point, must have a z-value of 0!" | 1014 | 51 (ERROR) | Non-zero Z coordinate |
| "Start-, center- and end-pos do not fit together." | 1014 | 41 (WARNING) | Unequal radii or center==start |
| "Invalid arc parameters" | 0 | 51 (ERROR) | start==end or all points identical |
| "centerPos must be provided in the api call!" | 1004 | 51 (ERROR) | Missing centerPos in updateGeometry |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create a semicircular arc (CW, 180°)
const arcId = (await api.v1.sketch.arcByCenter({
  id: skId,
  startPos: [-40, 0, 0],
  centerPos: [0, 0, 0],
  endPos: [40, 0, 0],
})).result

// Query positions directly
const pos = (await api.v1.sketch.getPositions({ id: arcId })).result
// pos → { startPos: {x:-40,y:0,z:0}, endPos: {x:40,y:0,z:0}, centerPos: {x:0,y:0,z:0} }

// Update position and flip direction
await api.v1.sketch.updateGeometry({
  id: skId,
  arcsByCenter: [{
    id: arcId,
    startPos: [-20, 20, 0],
    centerPos: [0, 20, 0],
    endPos: [20, 20, 0],
    isClockwise: false,
  }]
})

// Use in a closed profile for extrusion
const lineId = (await api.v1.sketch.line({
  id: skId, startPos: [40, 0, 0], endPos: [-40, 0, 0]
})).result
const regionId = (await api.v1.sketch.sketchRegion({
  id: skId, geomIds: [arcId, lineId]
})).result
```

## Related

- `sketch.arcBy3Points` — arc defined by start, mid, end (no center)
- `sketch.circle` — use for full circles (arcByCenter rejects start==end)
- `sketch.getPositions` — query arc positions directly (works on arcs, unlike circles)
- `sketch.getPoints` — get startId, endId, centerId
- `sketch.getGeometry` — list all arcs in a sketch
- `sketch.updateGeometry` — update arc via `arcsByCenter` array
- `sketch.deleteObject` — delete arcs
- `sketch.sketchRegion` — create regions from closed profiles including arcs
