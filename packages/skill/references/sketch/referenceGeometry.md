# sketch.referenceGeometry

Creates "Use" geometry by projecting 3D brep elements (edges, vertices) onto the sketch plane, optionally keeping an associative link so it updates when the solid changes.

## Critical Requirement

**The sketch MUST have a plane reference.** Sketches created without `planeId` (default XY) fail with "CCObject can not be opened" (level 51). Fix: create the sketch with `planeId` (face or work plane), or call `sketch.setReferences({ id: skId, planeId })` first. `openFeature` is NOT required.

## Key Parameters

- **`id`** (required) — sketch ID
- **`brepIds`** (required) — brep IDs from `part.getGeometryIds`: `edge-line`, `vertex`, `edge-arc`, `edge-circle`. **Faces/planes → 1001.** `[]` returns `[]`, maxLevel 31.
- **`keepReference`** (optional, default TRUE) — `TRUE` (1): geometry follows solid changes (change the box length → projected line moves). `FALSE` (0): frozen snapshot.

## Return Value

`result: Array<id>` — one sketch geometry ID per brep element (**API docs say VOID; wrong**).

| Brep element | Projected as |
|---|---|
| edge-line parallel to sketch | line (most common) |
| edge-line perpendicular to sketch | point |
| edge-circle | circle (on- and off-plane) |
| edge-arc | arc (from error message, not directly tested) |
| vertex | point |
| face/plane | **rejected** (1001) |

## Gotchas

- **No deduplication** — projecting the same edge twice (separate calls or `[edgeId, edgeId]`) duplicates geometry.
- **Brep IDs can shift** after new features (sketches, work geometry) — re-fetch with `part.getGeometryIds` right before use.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'RefGeoDemo' })).result
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

const topFace = (await api.v1.part.getGeometryIds({ id: partId, planes: [{ positions: [[40, 30, 40]] }] })).result.planes[0]
const skId = (await api.v1.sketch.create({ id: partId, planeId: topFace })).result

// Re-fetch edge ID after sketch creation (IDs may shift)
const edgeId = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 0] }] })).result.lines[0]
const r = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [edgeId] }) // r.result → [105]
```

## Related

`sketch.changeReferenceGeometry` · `sketch.unlinkReferenceGeometry` · `sketch.setReferences` · `part.getGeometryIds`
