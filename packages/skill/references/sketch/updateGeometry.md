# sketch.updateGeometry

Updates the positions/properties of existing sketch geometry in-place. This is a **raw position update** — it does NOT trigger the constraint solver.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create`)
- Existing geometry to update (created via `sketch.geometry`, `sketch.line`, `sketch.circle`, etc.)

## Key Parameters

- `id` — sketch ID (required, must be type "sketch"). Note: the server validates that this is a sketch type, but does NOT validate that the geometry actually belongs to this sketch. Any valid sketch ID works.
- `points` — array of `{ id, pos: [x,y,z] }`
- `lines` — array of `{ id, startPos, endPos }` — **both** startPos and endPos required
- `circles` — array of `{ id, centerPos, radius }` — **both** centerPos and radius required
- `arcsBy3Points` — array of `{ id, startPos, endPos, midPos }` — all 3 required
- `arcsByCenter` — array of `{ id, startPos, endPos, centerPos, isClockwise? }` — isClockwise defaults to TRUE

All geometry arrays are optional. You can pass any combination, including multiple types in one call.

### Toggling `isConstruction`

`updateGeometry` can toggle the `isConstruction` flag on existing lines, circles, and arcs, in both directions:

```js
await api.v1.sketch.updateGeometry({
  id: skId,
  lines: [{ id: lineId, isConstruction: true }],   // mark as construction
})
await api.v1.sketch.updateGeometry({
  id: skId,
  lines: [{ id: lineId, isConstruction: false }],  // back to a normal profile curve
})
```

`isConstruction` (boolean, default FALSE) marks a curve as construction / reference geometry — a skeleton (axes, bolt circles, symmetry/centerlines) that drives the real profile through constraints and dimensions but is not part of the profile itself. It is a curve property only (line/circle/arc); points cannot be construction. See `SKETCHING.md` (§ Construction geometry).

## Return Value

Always returns `null` (VOID) on success. maxLevel=31 (info) on success, 51 (error) on failure.

## Gotchas

- **No partial property updates.** You must provide ALL properties for each geometry type. Omitting `radius` from a circle or `endPos` from a line triggers error code 1004: `The parameter "X" must be provided in the api call!`
- **Constraints are NOT enforced.** This is a raw position setter. Moving one endpoint of a constrained rectangle does NOT drag the connected lines. The constraint solver is not triggered. If you need to resize/move constrained geometry, you must update ALL affected items yourself in one batch call with consistent positions.
- **Shared points are separate.** Auto-coincidence constraints create separate point IDs (not shared IDs). Moving one coincident point via `updateGeometry` does NOT move the other — they just become non-coincident until the solver runs.
- **Sketch ID ownership not validated.** The `id` parameter must be a "sketch" type (passing a part ID gives error 1001), but the server does not check whether the geometry items actually belong to that sketch. Geometry is updated by its own ID regardless.
- **`getPositions` returns null for circles.** Use the known center/radius instead, or track values yourself.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1001 | ERROR | `The parameter "id" has a wrong id type! Provide only following id types: ["sketch"]` | Top-level `id` is not a sketch (e.g., passed a part ID) |
| 1001 | ERROR | `The parameter "id" has a wrong id type! Provide only following id types: ["sketch-circle"]` | Wrong geometry type in array (e.g., line ID in circles array) |
| 1004 | ERROR | `The parameter "X" must be provided in the api call!` | Missing required property (e.g., radius for circle, endPos for line) |
| 1006 | ERROR | `An element of parameter "id" has an invalid id!` | Geometry ID doesn't exist |

## Usage Hints

- **Batch updates are the correct pattern.** When modifying connected geometry (rectangles, profiles), update all lines/arcs in a single call with consistent endpoint positions.
- **Empty calls are safe.** Passing empty arrays or no geometry arrays is a no-op (maxLevel=31, no error).
- **Multiple items per type work.** You can update 3 circles, 2 lines, and 5 points all in one call.
- **To "resize" a rectangle:** Update all 4 lines in one call with new corner positions. Do NOT rely on constraints to propagate changes.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create geometry
const geo = await api.v1.sketch.geometry({
  id: skId,
  lines: [
    { startPos: [0, 0, 0], endPos: [60, 0, 0] },
    { startPos: [60, 0, 0], endPos: [60, 40, 0] },
  ],
  circles: [{ centerPos: [30, 20, 0], radius: 10 }],
  genFixation: false,
})
const [line1, line2] = geo.result.lines
const [circ] = geo.result.circles

// Update all in one call — must provide ALL properties per item
const r = await api.v1.sketch.updateGeometry({
  id: skId,
  lines: [
    { id: line1, startPos: [0, 0, 0], endPos: [80, 0, 0] },
    { id: line2, startPos: [80, 0, 0], endPos: [80, 60, 0] },
  ],
  circles: [{ id: circ, centerPos: [40, 30, 0], radius: 15 }],
})
// r.result === null, r.maxLevel === 31
```

## Related

- `sketch.geometry` — batch-create geometry (the creation counterpart)
- `sketch.getPositions` — read current positions of points/lines/arcs (not circles)
- `sketch.getPoints` — get point IDs (startId, endId, centerId) of a geometry item
- `sketch.moveGeometry` — translate geometry by a delta vector (simpler for moves)
