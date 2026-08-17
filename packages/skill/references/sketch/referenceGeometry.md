# sketch.referenceGeometry

Creates "Use" geometry in a sketch by projecting 3D brep elements (edges, vertices) onto the sketch plane. The projected geometry can maintain an associative link to the brep element so it updates when the solid changes.

## Prerequisites

- A part with at least one solid feature (box, cylinder, etc.) — you need brep elements to project
- A sketch with a **plane reference** — either via `planeId` in `sketch.create`, or via `sketch.setReferences`
- Brep element IDs obtained via `part.getGeometryIds`

## Critical Requirement

**The sketch MUST have a plane reference.** Sketches created without `planeId` (on the default XY plane) will fail with "CCObject can not be opened" (level 51). Fix by either:
1. Creating the sketch with `planeId` set to a face or work plane
2. Calling `sketch.setReferences({ id: skId, planeId: ... })` before `referenceGeometry`

## Key Parameters

- **`id`** (required) — sketch ID
- **`brepIds`** (required) — array of brep element IDs. Accepted types: `edge-line`, `vertex`, `edge-arc`, `edge-circle`. **NOT faces/planes** — faces return error code 1001.
- **`keepReference`** (optional, default TRUE) — controls associativity:
  - `TRUE` (1): projected geometry updates when the referenced solid changes
  - `FALSE` (0): creates a static copy that never updates

## Return Value

```js
{ result: Array<id>, messages?: [...], maxLevel?: real }
```

Returns an **array of sketch geometry IDs** — one per brep element. **The docs say VOID but this is wrong.** Each ID corresponds to the created sketch geometry (line, point, or circle depending on the brep element type).

## Projection Rules

| Brep element | Projected as | Notes |
|---|---|---|
| edge-line (parallel to sketch) | sketch line | Most common case |
| edge-line (perpendicular to sketch) | sketch point | Projects to a single point |
| edge-circle | sketch circle | Works for both on-plane and off-plane circles |
| edge-arc | sketch arc | (from error message, not directly tested) |
| vertex | sketch point | |
| face/plane | **REJECTED** | Error code 1001 |

## Gotchas

- **No deduplication.** Projecting the same edge twice (in separate calls or same call with `[edgeId, edgeId]`) creates duplicate geometry every time.
- **Brep IDs can shift** after creating new features (sketches, work geometry). Always re-fetch IDs with `part.getGeometryIds` right before using them.
- **`openFeature` is NOT required.** `referenceGeometry` works without opening the sketch feature.
- **Empty `brepIds: []`** returns `[]` with maxLevel=31 (no error, no geometry created).

## Associative Behavior (keepReference)

When `keepReference: TRUE` (default), the projected geometry **automatically updates** when the underlying solid changes. Example: projecting a box edge and then changing the box length — the projected line moves to match.

When `keepReference: FALSE`, the geometry is a frozen snapshot. Changing the solid has no effect on it.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'RefGeoDemo' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

// Get top face for sketch placement + bottom edge to project
const geo = await api.v1.part.getGeometryIds({
  id: partId,
  planes: [{ positions: [[40, 30, 40]] }],
  lines: [{ pos: [40, 0, 0] }]
})
const topFace = geo.result.planes[0]

// Create sketch ON a face (required for referenceGeometry)
const skId = (await api.v1.sketch.create({ id: partId, planeId: topFace })).result

// Re-fetch edge ID after sketch creation (IDs may shift)
const geo2 = await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [40, 0, 0] }]
})
const edgeId = geo2.result.lines[0]

// Project the edge
const r = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [edgeId] })
// r.result → [105] (array of sketch geometry IDs)
```

## Related

- `sketch.changeReferenceGeometry` — relink projected geometry to a different brep element
- `sketch.unlinkReferenceGeometry` — disconnect the associative link (geometry stays, frozen)
- `sketch.setReferences` — set/change the sketch's plane, axis, and origin references
- `part.getGeometryIds` — obtain brep element IDs by position
