# part.getBrepGeometryIndex

Returns the 0-based index of a brep element within its type category in a brep container. Points, lines, arcs, NURBS curves, and faces are indexed separately — each type has its own independent index space starting at 0.

## Prerequisites

- A part with geometry (e.g., `part.box`, `part.cylinder`, etc.)
- Valid brep element IDs (from `getGeometryIds`, `getBrepGeometryByIndex`, or similar)
- Works both pre- and post-`recalc()` — indices are stable across recalc (only IDs change)

## Key Parameters

- `id` — the **feature ID** (e.g., the ID returned from `part.box`, `part.fillet`, etc.). **NOT a part ID** — passing a part ID fails with "Not a brep!" error.
- `geomId` — the brep element ID to index. Must be a valid brep element (edge, face, or vertex).
- `solidIndex` — (optional, default 0) which solid within the feature. Only relevant for multi-solid features (e.g., boolean with `keepTools: true`). Out-of-range values produce error.

## Return Value

```
{
  result: real   // 0-based index, or -1 if geomId not in this brep, or null on error
  messages?: [...]
  maxLevel?: real  // 31 on success, 51 on error
}
```

- **Success:** returns the index (≥ 0) with maxLevel=31
- **Cross-body (-1):** geomId exists but is not in the specified feature's brep → returns **-1** with maxLevel=31 (not an error). Useful as a membership test.
- **Error (null):** invalid geomId, wrong ID type, or invalid solidIndex → returns null with maxLevel=51

## Index Spaces

Each geometry type has its own independent index range. For a box (80×60×40):

| Type | Count | Index range |
|---|---|---|
| Lines (straight edges) | 12 | 0–11 |
| Faces (planes) | 6 | 0–5 |
| Points (vertices) | 8 | 0–7 |

For a cylinder:

| Type | Count | Index range |
|---|---|---|
| Arcs (circular edges) | 2 | 0–1 |
| Faces (planes + cylindrical) | 3 | 0–2 |

Fillet arcs are indexed in the arc index space (not the line space).

## Gotchas

### Feature ID required — not part ID

The `id` parameter must be a feature ID. Passing a part ID produces: "Not a brep!" (maxLevel 51). This contradicts the docs which say "id of a solid or a feature containing a solid" — part IDs do not work.

### -1 means "not in this brep" — not an error

When `geomId` is a valid brep element but belongs to a different feature, the API returns -1 with maxLevel=31. This is informational, not an error. Use it to test whether an element belongs to a specific feature's brep.

### Indices are stable across recalc

Pre-recalc and post-recalc produce different IDs for the same edge, but the **index stays the same**. Index 4 pre-recalc is still index 4 post-recalc. However, stale pre-recalc IDs become invalid after recalc (maxLevel 51).

### solidIndex out-of-range errors are in German

Invalid solidIndex produces: "Index N ausserhalb des Arraybereichs" ("index N outside array range"). For single-solid features, only solidIndex=0 is valid.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| "Not a brep!" | Passed part ID as `id`, or invalid geomId | Use feature ID, verify geomId is a valid brep element |
| "Brep geometry N does not currently exist" | geomId references a non-brep object | Use `getGeometryIds` to get valid brep element IDs |
| "Index N ausserhalb des Arraybereichs" | solidIndex out of range | Use solidIndex=0 for single-solid features |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
await api.v1.common.recalc({})

// Get edge IDs
const geoR = await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [0, 0, 20] }, { pos: [40, 0, 0] }],
})

// Get index for each edge
for (const edgeId of geoR.result.lines) {
  const r = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeId })
  // r.result = 0-based index (e.g., 4, 0)
}

// Round-trip: index → ID
const idx = (await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeId })).result
const recovered = (await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: idx })).result
// recovered === edgeId  ✓
```

### Membership test

```js
const belongs = (await api.v1.part.getBrepGeometryIndex({ id: featureId, geomId: edgeId })).result
if (belongs === -1) {
  // Edge is not in this feature's brep
} else if (belongs >= 0) {
  // Edge is in this feature at this index
}
```

## Related

- `part.getBrepGeometryByIndex` — inverse: index → brep element ID
- `part.getGeometryIds` — find brep element IDs by position (primary source of geomId values)
- `part.getGeometryPositions` — get positions for brep element IDs
- `part.fillet` / `part.chamfer` — primary consumers of brep element IDs
