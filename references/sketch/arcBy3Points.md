# sketch.arcBy3Points

Creates one or multiple arcs defined by start, mid, and end positions in a sketch. The three points define a unique circle — the arc is the portion of that circle passing through midPos between startPos and endPos.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create` or `part.sketch`)

## Key Parameters

- **`id`** (required) — sketch ID
- **`startPos`** (required) — `[x, y, z]`, Z must be 0
- **`endPos`** (required) — `[x, y, z]`, Z must be 0
- **`midPos`** (required) — `[x, y, z]`, Z must be 0. Must lie exactly on the desired arc. Defines which circle and which arc (major/minor) is created.
- **`genFixation`** (optional, default TRUE) — auto-generates `CC_2DFixationConstraint` ("Auto_Fix") **only when a point is at origin** (0,0,0). No effect for off-origin geometry.
- **`genIncidence`** (optional, default TRUE) — auto-generates `CC_2DCoincidentConstraint` ("Auto_Coinc") when any arc endpoint **exactly matches** an existing point.
- **`genTangency`** (optional, default FALSE) — auto-generates `CC_2DTangentSketchConstraint` when adjacent to **another arc or circle**. Does NOT generate tangency for line-to-arc adjacency.
- **`isConstruction`** (optional, default FALSE) — marks the arc as construction/reference geometry (drawn dashed). It participates fully in the constraint solver as reference geometry but is excluded from operations; do not pass construction curves to `part.extrusion` (it hangs). See `SKETCHING.md` (§ Construction geometry).

## midPos Behavior

midPos does double duty:
1. **Selects the circle** — three non-collinear points define exactly one circle. Different midPos values with the same start/end produce different circles with different radii and centers.
2. **Selects the arc** — midPos determines which of the two arcs between start and end is used (minor vs major arc).

midPos must lie on the desired arc. It does not merely indicate "curvature direction."

## Internal Representation

arcBy3Points creates the same `CC_CircularArc` node as `arcByCenter`. The server computes the center from the 3 input points. After creation, the arc is indistinguishable from one created via `arcByCenter`:
- Same structure: arc + 3 child points (end, start, center)
- Same query methods (`getPositions`, `getPoints`, `getGeometry`)
- Same update method (`updateGeometry` with `arcsByCenter` key)
- Same deletion method (`deleteObject`)

## Return Value

```js
{ result: id | VOID | Array<id|VOID>, messages?: [...], maxLevel?: real }
```

- Success: numeric ID (e.g., 58), maxLevel=31 (info), no messages
- Batch: array of IDs matching input order; invalid entries return null
- Failure: result=null, maxLevel=51

## Batch Creation

Pass an array of param objects:

```js
const r = await api.v1.sketch.arcBy3Points([
  { id: skId, startPos: [0, 0, 0], midPos: [20, 20, 0], endPos: [40, 0, 0] },
  { id: skId, startPos: [0, -40, 0], midPos: [20, -20, 0], endPos: [40, -40, 0] },
])
// r.result → [58, 65] — array of IDs
```

**Error isolation:** In batch mode, invalid entries return null but valid entries still succeed. Example: `[58, null, 70]` — the collinear middle entry failed, the other two were created.

## Querying Arc Data

**`getPositions(arcId)`** — works directly on arc IDs. Returns computed center:
```js
{ startPos: { x, y, z }, endPos: { x, y, z }, centerPos: { x, y, z } }
```

**`getPoints(arcId)`** — returns child point IDs:
```js
{ startId: id, endId: id, centerId: id }
```

**`getGeometry(sketchId)`** — arcs appear in the `arcs` array:
```js
{ arcs: [id, ...], circles: [...], lines: [...], points: [...] }
```

## Updating

Use `updateGeometry` with the **`arcsByCenter`** array (same key as arcByCenter arcs):

```js
await api.v1.sketch.updateGeometry({
  id: skId,
  arcsByCenter: [{
    id: arcId,
    startPos: [-20, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [20, 0, 0],
  }]
})
```

**All three positions (startPos, endPos, centerPos) are required.** No partial updates. Note: update uses center-based parameterization, not 3-point.

## Deletion

```js
await api.v1.sketch.deleteObject({ ids: [arcId] })
```

Returns null on success (maxLevel=31). `getPositions`/`getPoints` on deleted arc returns null with maxLevel=51.

## Gotchas

- **genTangency only works with curves** — generates `CC_2DTangentSketchConstraint` for arc-to-arc adjacency but NOT for line-to-arc, even when geometrically tangent.
- **Collinear/coincident points → ERROR** — "Invalid arc parameters" (code=0, level=51). All degenerate point configurations (collinear, start==mid, start==end, all identical) produce the same error.
- **Non-zero Z → error 1014** — `"startPos which is a 2D point, must have a z-value of 0!"`. Same as all sketch geometry.
- **Update uses arcsByCenter key** — even though created via arcBy3Points, the update API uses center-based parameterization.
- **midPos must be on the arc** — it's not just a curvature hint. Wrong midPos = wrong circle = wrong arc.

## Common Errors

| Error | Code | Level | Cause |
|-------|------|-------|-------|
| "startPos which is a 2D point, must have a z-value of 0!" | 1014 | 51 (ERROR) | Non-zero Z coordinate |
| "Invalid arc parameters" | 0 | 51 (ERROR) | Collinear, coincident, or degenerate points |
| "The parameter \"id\" has a wrong id type! Provide only following id types: [\"sketch\"]" | 1001 | 51 (ERROR) | Passed part ID instead of sketch ID |
| "The parameter \"midPos\" must be provided in the api call!" | 1004 | 51 (ERROR) | Missing required parameter |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create an arc from (0,0,0) through (20,20,0) to (40,0,0)
const arcId = (await api.v1.sketch.arcBy3Points({
  id: skId,
  startPos: [0, 0, 0],
  midPos: [20, 20, 0],
  endPos: [40, 0, 0],
})).result

// Query — returns computed center
const pos = (await api.v1.sketch.getPositions({ id: arcId })).result
// pos → { startPos: {x:0,y:0,z:0}, endPos: {x:40,y:0,z:0}, centerPos: {x:20,y:0,z:0} }

// Update (uses arcsByCenter key)
await api.v1.sketch.updateGeometry({
  id: skId,
  arcsByCenter: [{
    id: arcId,
    startPos: [-20, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [20, 0, 0],
  }]
})

// Use in closed profile
const lineId = (await api.v1.sketch.line({
  id: skId, startPos: [40, 0, 0], endPos: [0, 0, 0]
})).result
const regionId = (await api.v1.sketch.sketchRegion({
  id: skId, geomIds: [arcId, lineId]
})).result
```

## Related

- `sketch.arcByCenter` — arc defined by start, end, center (same internal representation)
- `sketch.circle` — full circles
- `sketch.getPositions` — query arc positions (works directly on arc IDs)
- `sketch.getPoints` — get startId, endId, centerId
- `sketch.getGeometry` — list all arcs in a sketch
- `sketch.updateGeometry` — update arc via `arcsByCenter` array
- `sketch.deleteObject` — delete arcs
- `sketch.sketchRegion` — create regions from closed profiles including arcs
