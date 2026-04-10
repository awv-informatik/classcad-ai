# sketch.getPositions

Returns the coordinate positions of a sketch point or curve. The return shape depends on the input geometry type.

## Prerequisites

- A sketch with at least one geometry item (point, line, arc, or circle)

## Key Parameters

- `id` — the sketch-point or sketch-curve ID. Accepted types: `["sketch-curve", "sketch-point"]`.

## Return Value

| Input type | Result |
|---|---|
| **Point** | `{ pos: { x, y, z } }` |
| **Line** | `{ startPos: { x, y, z }, endPos: { x, y, z } }` |
| **Arc** (both arcByCenter and arcBy3Points) | `{ startPos: { x, y, z }, endPos: { x, y, z }, centerPos: { x, y, z } }` |
| **Circle** | **FAILS** — returns null with error (see Gotchas) |

All positions are `{ x, y, z }` named objects, NOT `[x, y, z]` arrays. maxLevel=31 on success.

## Gotchas

- **Circles do NOT work.** Despite the docs claiming circle returns `{ centerPos }`, calling `getPositions` on a circle ID produces error: `[Evaluation error in SketchAPI_v1.getPositions::PROC:[CCVM::lcm: objId not found]]`. Use `getPoints(circleId)` → `getPositions(centerId)` as workaround.
- **Floating-point noise on arc centers.** Computed positions (especially arc `centerPos`) may have epsilon-level noise (e.g., `-4.44e-16` instead of `0`). This is standard kernel behavior.
- **No `midPos` for arcBy3Points.** Both arc creation methods produce the same output: `{ startPos, endPos, centerPos }`. The midpoint from `arcBy3Points` creation is not preserved.
- **Positions reflect `updateGeometry` immediately.** No recalc or additional call needed — query the position and it shows the updated value.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1001 | ERROR | `wrong id type! Provide only following id types: ["sketch-curve","sketch-point"]` | Passed a sketch ID, part ID, or other non-geometry ID |
| 1006 | ERROR | `invalid id` | ID does not exist (+ warning code 0 about `ToId()`) |
| 1004 | ERROR | `The parameter "id" must be provided` | Missing `id` parameter |

## Usage Hints

- **Two ways to get positions:** (1) `getPositions(curveId)` returns positions directly on the curve, or (2) `getPoints(curveId)` → `getPositions(pointId)` resolves point-by-point. Both produce identical coordinates.
- **For circles, you must use the indirect path:** `getPoints(circleId)` → `{ centerId }` → `getPositions(centerId)` → `{ pos: { x, y, z } }`.
- **Rectangle lines work individually.** Each of the 4 line IDs from `sketch.rectangle` returns `{ startPos, endPos }` normally.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 20, 0], endPos: [70, 60, 0] })).result

// Direct: get line positions
const linePos = (await api.v1.sketch.getPositions({ id: lineId })).result
// linePos → { startPos: { x: 10, y: 20, z: 0 }, endPos: { x: 70, y: 60, z: 0 } }

// Indirect: get point IDs first, then resolve
const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
const startPos = (await api.v1.sketch.getPositions({ id: pts.startId })).result
// startPos → { pos: { x: 10, y: 20, z: 0 } }

// Circle workaround
const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 50, 0], radius: 15 })).result
const circPts = (await api.v1.sketch.getPoints({ id: circId })).result
const center = (await api.v1.sketch.getPositions({ id: circPts.centerId })).result
// center → { pos: { x: 50, y: 50, z: 0 } }
```

## Related

- `sketch.getPoints` — get point IDs (startId, endId, centerId) of a curve; needed for circle workaround
- `sketch.getGeometry` — get all geometry IDs in a sketch grouped by type
- `sketch.updateGeometry` — update positions (getPositions reflects changes immediately)
- `sketch.moveGeometry` — alternative for moving geometry
