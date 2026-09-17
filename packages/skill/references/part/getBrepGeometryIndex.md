# part.getBrepGeometryIndex

Returns the 0-based index of a brep element within its type category in a brep container. Points, lines, arcs, NURBS curves, and faces each have their own independent index space starting at 0.

## Key Parameters

- `id` — **feature ID** (from `part.box`, `part.fillet`, …). **NOT a part ID** — fails with "Not a brep!" (maxLevel 51), contradicting the docs ("id of a solid or a feature containing a solid").
- `geomId` — brep element ID (edge, face, or vertex) from `getGeometryIds`, `getBrepGeometryByIndex`, etc.
- `solidIndex` — optional, default 0. Only relevant for features holding several solids (e.g. an unmerged pattern or an entity injection). Out of range → "Index N ausserhalb des Arraybereichs" ("index N outside array range"); single-solid features accept only 0.

## Return Value

`{ result: number|null, messages?, maxLevel? }`

| Case | result | maxLevel |
|---|---|---|
| Found | index ≥ 0 | 31 |
| Valid brep element, but in a different feature's brep | **-1** (not an error — usable as membership test) | 31 |
| Invalid geomId, wrong ID type, invalid solidIndex | `null` | 51 |

## Index Spaces

| Geometry | Type | Count | Index range |
|---|---|---|---|
| Box 80×60×40 | Lines | 12 | 0–11 |
| | Faces (planes) | 6 | 0–5 |
| | Points | 8 | 0–7 |
| Cylinder | Arcs (circular edges) | 2 | 0–1 |
| | Faces (planes + cylindrical) | 3 | 0–2 |

Fillet arcs are in the arc index space, not the line space.

## Gotchas

- **Indices are stable across recalc; IDs are not.** Index 4 pre-recalc is still index 4 post-recalc, but stale pre-recalc IDs become invalid after recalc (maxLevel 51).

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| "Not a brep!" | Part ID as `id`, or invalid geomId | Use feature ID; verify geomId is a brep element |
| "Brep geometry N does not currently exist" | geomId is a non-brep object | Get IDs via `getGeometryIds` |
| "Index N ausserhalb des Arraybereichs" | solidIndex out of range | solidIndex=0 for single-solid features |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
const cylId = (await api.v1.part.cylinder({ id: partId, diameter: 20, height: 10 })).result
await api.v1.common.recalc({})

const edgeIds = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [0, 0, 20] }, { pos: [40, 0, 0] }],
})).result.lines

for (const edgeId of edgeIds) {
  const r = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeId })
  console.log(r.result) // 0-based index, e.g. 4, 0
}

// Round-trip: index → ID
const idx = (await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeIds[0] })).result
const recovered = (await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: idx })).result
// recovered === edgeIds[0]

// Membership test: box edge is not in the cylinder's brep → -1
const other = (await api.v1.part.getBrepGeometryIndex({ id: cylId, geomId: edgeIds[0] })).result
```

## Related

`part.getBrepGeometryByIndex` · `part.getGeometryIds` · `part.getGeometryPositions` · `part.fillet` / `part.chamfer`
