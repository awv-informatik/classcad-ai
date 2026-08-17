# sketch.getPoints

Returns the defining point IDs of a sketch curve (line, arc, or circle). Use these IDs with `getPositions` to resolve coordinates, or as constraint targets.

## Prerequisites

- A sketch with at least one curve (line, arc, or circle)

## Key Parameters

- `id` — the **sketch-curve** ID (line, arc, or circle). Must be a curve ID, not a sketch ID, part ID, or standalone point ID.

## Return Value

The result shape depends on the input geometry type:

| Input type | Result |
|---|---|
| **Line** | `{ startId, endId }` |
| **Arc** (arcByCenter or arcBy3Points) | `{ startId, endId, centerId }` |
| **Circle** | `{ centerId }` |

All returned IDs are sketch-point IDs. They work with `getPositions({ id: pointId })` which returns `{ pos: { x, y, z } }`.

## Gotchas

- **Points are NOT curves.** Passing a standalone point ID (from `sketch.point`) returns error 1001: `wrong id type! Provide only following id types: ["sketch-curve"]`.
- **Lines don't share point IDs.** Two lines meeting at the same coordinate have different point IDs at that junction. Topological connection requires coincident constraints — shared coordinates alone don't imply shared IDs.
- **Rectangle lines work normally.** Each of the 4 line IDs from `sketch.rectangle` returns `{ startId, endId }` like any other line.
- **Minor floating-point noise** on positions resolved from arc centerIds (e.g., 39.999999999999 instead of 40). Normal kernel behavior.

## Common Errors

- **Code 1001** (`wrong id type`): You passed an ID that exists but isn't a sketch-curve. Check that you're passing the line/arc/circle ID, not the sketch or part ID.
- **Code 1006** (`invalid id`): The ID doesn't exist at all. Usually a bogus or stale ID. Also produces a warning (code 0) about `ToId()`.

## Usage Hints

- Use `getPoints` + `getPositions` together to resolve curve endpoints to coordinates. `getPoints` gives you the point IDs, `getPositions` gives you the positions.
- Alternatively, call `getPositions` directly on the curve ID to get positions without the intermediate point IDs (returns `{ startPos, endPos }` for lines, `{ startPos, endPos, centerPos }` for arcs, `{ centerPos }` for circles).
- Both arc creation methods (`arcByCenter` and `arcBy3Points`) produce identical `getPoints` output with all three point IDs.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 20, 0], endPos: [70, 60, 0] })).result

// Get point IDs
const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
// pts → { startId: 59, endId: 60 }

// Resolve to coordinates
const startPos = (await api.v1.sketch.getPositions({ id: pts.startId })).result
// startPos → { pos: { x: 10, y: 20, z: 0 } }
```

## Related

- `sketch.getPositions` — resolve point/curve IDs to coordinates
- `sketch.getGeometry` — get all geometry IDs in a sketch grouped by type
- `sketch.line`, `sketch.arcByCenter`, `sketch.arcBy3Points`, `sketch.circle` — curve creation APIs
