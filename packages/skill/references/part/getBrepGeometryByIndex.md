# part.getBrepGeometryByIndex

Returns a brep element ID given a 0-based index within its type category. Inverse of `getBrepGeometryIndex`. Points, lines, arcs, NURBS curves, and faces are indexed separately — each type has its own independent index space starting at 0.

## Prerequisites

- A part with geometry (e.g., `part.box`, `part.cylinder`, `part.fillet`, etc.)
- Works both pre- and post-`recalc()` — pre-recalc returns preliminary IDs, post-recalc returns final IDs. Same index, different ID values.

## Key Parameters

- `id` — the **feature ID** (e.g., the ID returned from `part.box`, `part.fillet`, etc.). **NOT a part ID** — passing a part ID fails with "Index 0 ausserhalb des Arraybereichs".
- Exactly **one** index parameter must be specified:
  - `lineIndex` — straight edges
  - `arcIndex` — circular/arc edges (including fillet arcs)
  - `faceIndex` — faces (planar, cylindrical, etc.)
  - `pointIndex` — vertices
  - `nurbsCurveIndex` — NURBS curve edges (rare — not produced by standard primitives/booleans)
- `solidIndex` — (optional, default 0) which solid within the feature. Only relevant for multi-solid features.

## Return Value

```
{
  result: id|null   // brep element ID, or null on error
  messages?: [...]
  maxLevel?: real   // 31 on success, 51 on error
}
```

- **Success:** returns a valid brep element ID with maxLevel=31
- **Out-of-range:** returns null with maxLevel=51 and descriptive error (e.g., "Line element indexed as 9999 does not exist.")
- **No matching type:** returns null with maxLevel=51 (e.g., "Arc/Circle element indexed as 0 does not exist." on a box)

## Element Counts by Geometry

| Geometry | Lines | Arcs | Faces | Points | NURBS |
|---|---|---|---|---|---|
| Box | 12 | 0 | 6 | 8 | 0 |
| Cylinder | 1 (seam) | 2 | 3 | 0 | 0 |
| Sphere | 0 | 1 (seam) | 1 | 2 (poles) | 0 |
| Cone | 1 (seam) | 2 | 3 | 2 | 0 |
| Box + fillet (1 edge) | 13 | 2 | 7 | 10 | 0 |
| Cylinder + fillet (1 arc) | 1 | 4 | 4 | 3 | 0 |

## Enumeration Pattern

Iterate from index 0 until the API returns null to discover all elements of a type:

```js
const edges = []
for (let i = 0; ; i++) {
  const r = await api.v1.part.getBrepGeometryByIndex({ id: featureId, lineIndex: i })
  if (r.result === null) break
  edges.push({ index: i, id: r.result })
}
```

This is the canonical way to discover all brep elements without needing position-based lookups.

## Gotchas

### Feature ID required — not part ID

The `id` parameter must be a feature ID. Passing a part ID produces: "Index 0 ausserhalb des Arraybereichs" (maxLevel 51). This is a different error than `getBrepGeometryIndex` gives for the same mistake ("Not a brep!").

### Exactly one index param required

Passing zero or more than one index parameter produces: "Only one geometry index parameter should be specified." (maxLevel 51). You cannot query multiple types in one call.

### Negative indices produce C++ warnings

Negative values trigger: "conversion from 'size_t' to 'int', possible loss of data" — the index is an unsigned integer internally. Always pass non-negative values.

### NURBS curves are rare

`nurbsCurveIndex` is supported but no NURBS edges were produced by any tested geometry: box, cylinder, sphere, cone, fillets, or booleans (including sphere-box and cylinder-cylinder intersections). The kernel represents intersection curves as arcs for analytic surfaces. NURBS edges likely only appear with spline/loft geometry.

### Practical advantage over position-based lookup

`getBrepGeometryByIndex` is deterministic — index 0 always returns the same element. Position-based lookups via `getGeometryIds` can fail for curved geometry (arcs, circles) if the query position doesn't match precisely. In script 12, position-based arc lookup failed, but `getBrepGeometryByIndex({ arcIndex: 0 })` worked.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| "Index N ausserhalb des Arraybereichs" | Part ID passed as `id`, or solidIndex out of range | Use feature ID, check solidIndex |
| "Line element indexed as N does not exist." | lineIndex out of range | Iterate from 0 until null to find valid range |
| "Arc/Circle element indexed as N does not exist." | arcIndex out of range (or no arcs on this brep) | Check if feature has arc edges |
| "Only one geometry index parameter should be specified." | Zero or multiple index params | Pass exactly one index param |
| "conversion from 'size_t' to 'int'" | Negative index value | Use non-negative indices only |
| "CCVM::callsf: objId not found" | Invalid/nonexistent feature ID | Verify feature ID exists |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
await api.v1.common.recalc({})

// Get edge by index
const edgeId = (await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: 4 })).result
// edgeId = 102

// Get face by index
const faceId = (await api.v1.part.getBrepGeometryByIndex({ id: boxId, faceIndex: 0 })).result
// faceId = 110

// Round-trip with getBrepGeometryIndex
const idx = (await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeId })).result
// idx = 4 (matches original)
```

### Enumeration + fillet workflow

```js
// Get all arc edges from a cylinder (useful for filleting)
const cylId = (await api.v1.part.cylinder({ id: partId, diameter: 60, height: 80 })).result
await api.v1.common.recalc({})

const bottomArc = (await api.v1.part.getBrepGeometryByIndex({ id: cylId, arcIndex: 0 })).result
const topArc = (await api.v1.part.getBrepGeometryByIndex({ id: cylId, arcIndex: 1 })).result

// Fillet the bottom arc
await api.v1.part.fillet({ id: partId, references: [bottomArc], radius: 10 })
```

### Full pipeline: index → position → re-identification

```js
// Index-based access
const edgeId = (await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: 4 })).result

// Get position (for serialization)
const pos = (await api.v1.part.getGeometryPositions({ elems: [edgeId] })).result[0].positions[0]

// Re-find by position (after save/load cycle)
const refound = await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [pos.x, pos.y, pos.z] }],
})
// refound.result.lines[0] === edgeId
```

## Related

- `part.getBrepGeometryIndex` — inverse: brep element ID → index
- `part.getGeometryIds` — position-based brep element lookup
- `part.getGeometryPositions` — get positions for brep element IDs (use `elems` param)
- `part.fillet` / `part.chamfer` — primary consumers of brep element IDs
