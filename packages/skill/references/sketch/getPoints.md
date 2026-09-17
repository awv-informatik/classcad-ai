# sketch.getPoints

Returns the defining point IDs of a sketch curve — for `getPositions` or as constraint targets.

## Key Parameters

- `id` — **sketch-curve** ID (line, arc, circle). Not a sketch, part, or standalone point ID.

## Return Value

| Input | Result |
|---|---|
| Line (incl. each `rectangle` line) | `{ startId, endId }` |
| Arc (`arcByCenter` or `arcBy3Points`, identical output) | `{ startId, endId, centerId }` |
| Circle | `{ centerId }` |

IDs are sketch-points; `getPositions({ id: pointId })` returns `{ pos: { x, y, z } }`. To skip the point IDs, call `getPositions` on the curve directly (`{ startPos, endPos }` / `{ startPos, endPos, centerPos }` / `{ centerPos }`).

## Gotchas

- **Lines don't share point IDs.** Two lines meeting at one coordinate have different point IDs; topological connection requires coincident constraints.
- **Floating-point noise** on arc center positions (e.g. 39.999999999999 instead of 40) — normal.

## Common Errors

- **1001** `wrong id type! Provide only following id types: ["sketch-curve"]` — ID exists but isn't a curve (e.g. a `sketch.point`, sketch, or part ID).
- **1006** `invalid id` — bogus/stale ID; also a code-0 `ToId()` warning.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 20, 0], endPos: [70, 60, 0] })).result

const pts = (await api.v1.sketch.getPoints({ id: lineId })).result // { startId: 59, endId: 60 }
const start = (await api.v1.sketch.getPositions({ id: pts.startId })).result // { pos: { x: 10, y: 20, z: 0 } }
```

## Related

`sketch.getPositions` · `sketch.getGeometry` · `sketch.line`
