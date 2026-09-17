# part.getBrepGeometryByIndex

Returns a brep element ID from a 0-based index within its type category. Inverse of `getBrepGeometryIndex`. Points, lines, arcs, NURBS curves, and faces each have their own independent index space starting at 0.

Works pre- and post-`recalc()`: same index, different ID values (preliminary vs final).

## Key Parameters

- `id` — **feature ID** (from `part.box`, `part.fillet`, …). **NOT a part ID** — fails with "Index 0 ausserhalb des Arraybereichs" (maxLevel 51); `getBrepGeometryIndex` gives "Not a brep!" for the same mistake.
- Exactly **one** index parameter (zero or several → "Only one geometry index parameter should be specified.", maxLevel 51):
  - `lineIndex` — straight edges
  - `arcIndex` — circular/arc edges (incl. fillet arcs)
  - `faceIndex` — faces
  - `pointIndex` — vertices
  - `nurbsCurveIndex` — NURBS curve edges
- `solidIndex` — optional, default 0; only relevant for multi-solid features

## Return Value

`{ result: id|null, messages?, maxLevel? }`

- Success: brep element ID, maxLevel=31
- Out of range / no element of that type: `null`, maxLevel=51 (e.g. "Line element indexed as 9999 does not exist.", "Arc/Circle element indexed as 0 does not exist." on a box)

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

Canonical way to discover all elements of a type without position lookups — iterate from 0 until null:

```js
const edges = []
for (let i = 0; ; i++) {
  const r = await api.v1.part.getBrepGeometryByIndex({ id: featureId, lineIndex: i })
  if (r.result === null) break
  edges.push({ index: i, id: r.result })
}
```

## Gotchas

- **Negative indices** trigger the C++ warning "conversion from 'size_t' to 'int', possible loss of data" (index is unsigned internally). Pass non-negative values.
- **NURBS curves are rare.** No tested geometry produced any: box, cylinder, sphere, cone, fillets, booleans (incl. sphere-box and cylinder-cylinder intersections) — the kernel represents analytic intersection curves as arcs. NURBS edges likely only come from spline/loft geometry.
- **Deterministic vs position lookup.** Index 0 always returns the same element; `getGeometryIds` can miss curved edges (arcs, circles) when the query position isn't precise. In one test, position-based arc lookup failed while `arcIndex: 0` worked.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| "Index N ausserhalb des Arraybereichs" | Part ID as `id`, or solidIndex out of range | Use feature ID, check solidIndex |
| "Line element indexed as N does not exist." | lineIndex out of range | Iterate from 0 until null |
| "Arc/Circle element indexed as N does not exist." | arcIndex out of range / no arcs | Check the feature has arc edges |
| "Only one geometry index parameter should be specified." | Zero or multiple index params | Pass exactly one |
| "conversion from 'size_t' to 'int'" | Negative index | Non-negative only |
| "CCVM::callsf: objId not found" | Nonexistent feature ID | Verify the feature ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
await api.v1.common.recalc({})

const edgeId = (await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: 4 })).result // e.g. 102
const faceId = (await api.v1.part.getBrepGeometryByIndex({ id: boxId, faceIndex: 0 })).result // e.g. 110

// Round-trip with getBrepGeometryIndex → 4
const idx = (await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeId })).result

// index → position (serializable) → re-identification
const p = (await api.v1.part.getGeometryPositions({ elems: [edgeId] })).result[0].positions[0]
const refound = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [p.x, p.y, p.z] }] })).result.lines[0]
// refound === edgeId

// Arc edges of a cylinder → fillet
await api.v1.common.clear() // one root part per drawing
const cylPart = (await api.v1.part.create({ name: 'Cyl' })).result
const cylId = (await api.v1.part.cylinder({ id: cylPart, diameter: 60, height: 80 })).result
await api.v1.common.recalc({})
const bottomArc = (await api.v1.part.getBrepGeometryByIndex({ id: cylId, arcIndex: 0 })).result
const topArc = (await api.v1.part.getBrepGeometryByIndex({ id: cylId, arcIndex: 1 })).result
await api.v1.part.fillet({ id: cylPart, references: [bottomArc], radius: 10 })
```

## Related

`part.getBrepGeometryIndex` · `part.getGeometryIds` · `part.getGeometryPositions` · `part.fillet` / `part.chamfer`
