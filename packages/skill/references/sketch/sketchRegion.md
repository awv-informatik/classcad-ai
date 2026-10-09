# sketch.sketchRegion

Creates a sketch region (`CC_SketchRegion`) — a profile area — from sketch geometry. Region IDs can be passed to `part.extrusion` / `part.revolve` as `references` (curve IDs work too).

## Key Parameters

- `id` (required) — sketch ID
- `geomIds` (required) — `sketch-curve` and `sketch-point` IDs
- `name` (optional) — default `SketchRegion`, then `SketchRegion0`, `SketchRegion1`, … (numbering starts at 0 from the second region)

## Return Value

The region ID. Tree: under `CC_GeometrySet`, members `sketch` (parent sketch ID), `curves` (the `geomIds` passed), `selected` (mirrors `curves`).

## Gotchas

- **No closure validation.** A single line, disconnected or open geometry all create regions silently (maxLevel 31) and may fail downstream. `geomIds: []` creates an empty region, no error. [`getTopologyInfo`](getTopologyInfo.md) catches crossings and near-miss endpoints before you extrude, but not open gaps.
- **Extrusion needs a planed sketch** — without `planeId`, extrusion fails with `"CCObject can not be opened"`.
- **Name collisions are auto-suffixed silently.** A `name` matching an existing drawing object (default planes "Top", "Front", "Right") gets "0" appended ("Right" → "Right0") — look up the stored name with `getSketchRegion`.

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| `geomIds has a wrong id type! Provide only following id types: ["sketch-curve","sketch-point"]` | 1001 | Non-geometry ID (part, sketch) |
| `An element of parameter "geomIds" has an invalid id!` | 1006 | Nonexistent/fake ID |

## Related APIs

- **`sketch.updateSketchRegion`** — replaces region geometry; only `sketch-curve` (no points), atomic batches, empty `geomIds` errors. See [updateSketchRegion.md](updateSketchRegion.md).
- **`sketch.getSketchRegion({ id: sketchId, name })`** — region ID; case-sensitive; not found → `null`, maxLevel 51, code 1015. See [getSketchRegion.md](getSketchRegion.md).
- **`part.getSketchRegion({ id: partId, name })`** — same, but searches all sketches of a part.
- **`sketch.getGeometry({ id: regionId })`** — `{ arcs, circles, lines, points }` of the region.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'RegionDemo' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect, name: 'Profile' })).result
const found = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Profile' }) // found.result === regionId

await api.v1.part.extrusion({ id: partId, references: rect, limit2: 30 }) // curve IDs directly
```
