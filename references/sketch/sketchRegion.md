# sketch.sketchRegion

Creates a sketch region from sketch geometry (curves/points). A region represents a closed profile area within a sketch. Region IDs are used for lookup and structural purposes but **NOT** for extrusion — pass curve IDs directly to `part.extrusion` instead.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create` or `part.sketch`)
- Sketch geometry (lines, arcs, circles) that ideally forms a closed contour

## Key Parameters

- `id` — sketch ID (required)
- `geomIds` — array of sketch geometry IDs (required). Accepts `sketch-curve` and `sketch-point` type IDs.
- `name` — optional name for the region. If omitted, auto-generated: `SketchRegion` (first), then `SketchRegion0`, `SketchRegion1`, etc.

## Return Value

`id` — the ID of the created sketch region. Class in structure tree: `CC_SketchRegion`.

## Gotchas

- **No closure validation.** `sketchRegion` does NOT check that `geomIds` form a closed contour. A single line, disconnected lines, or open geometry all create regions silently (maxLevel=31, no error). These may fail when used downstream.
- **Empty geomIds is allowed.** Passing `[]` creates an empty region with no geometry (no error).
- **Do NOT pass region IDs to `part.extrusion`.** Extrusion with a region ID as `references` fails with `"CCObject can not be opened"`. Always pass the raw curve IDs (line, arc, circle IDs) directly.
- **Default naming quirk.** First region is `SketchRegion` (no number). Second is `SketchRegion0`, third is `SketchRegion1`, etc. The numbering starts at 0 from the second region onward.

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| `geomIds has a wrong id type! Provide only following id types: ["sketch-curve","sketch-point"]` | 1001 | Passed a non-geometry ID (e.g., part ID, sketch ID) |
| `An element of parameter "geomIds" has an invalid id!` | 1006 | Passed a nonexistent/fake ID |

## Structure Tree

A region appears as `CC_SketchRegion` under `CC_GeometrySet`. Key members:

- `sketch` — ID of the parent sketch
- `curves` — array of curve IDs (same as the `geomIds` passed at creation)
- `selected` — array of curve IDs (mirrors `curves`)

## Related APIs

### sketch.updateSketchRegion

Updates one or more regions with new geometry. Takes a `regions` array where each entry has `id` (region ID) and `geomIds` (new curve IDs). Returns VOID. Supports batch updates (multiple regions in one call).

```js
await api.v1.sketch.updateSketchRegion({
  regions: [{ id: regionId, geomIds: newCurveIds }],
})
// result: null (VOID), maxLevel: 31
```

### sketch.getSketchRegion

Finds a region by name within a sketch. Returns the region ID or `null` if not found.

- Not found → `result: null`, `maxLevel: 51`, error code 1015

```js
const r = await api.v1.sketch.getSketchRegion({ id: sketchId, name: 'SketchRegion' })
// r.result = regionId or null
```

### part.getSketchRegion

Same as `sketch.getSketchRegion` but takes a **part ID** instead of a sketch ID. Searches across all sketches in the part. Returns the same region ID.

```js
const r = await api.v1.part.getSketchRegion({ id: partId, name: 'ProfileRegion' })
```

### sketch.getGeometry (on region ID)

`getGeometry` accepts a region ID and returns the geometry grouped by type:

```js
const geom = await api.v1.sketch.getGeometry({ id: regionId })
// geom.result = { arcs: [], circles: [], lines: [id1, id2, ...], points: [] }
```

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'RegionDemo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create closed geometry
const rect = await api.v1.sketch.rectangle({
  id: skId,
  startPos: [0, 0, 0],
  endPos: [80, 50, 0],
})

// Create a named region
const regionId = (await api.v1.sketch.sketchRegion({
  id: skId,
  geomIds: rect.result,
  name: 'Profile',
})).result

// Look it up by name
const found = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Profile' })
// found.result === regionId

// For extrusion, pass the curve IDs directly — NOT the region ID:
await api.v1.part.extrusion({ id: partId, references: rect.result, limit2: 30 })
```
