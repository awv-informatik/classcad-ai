# common.getDatabaseSettings

Returns the global database settings for tessellation, graphic generation, and curve representation. No parameters.

## Key Fields

| Field | Default | Purpose |
|---|---|---|
| `facetingParamsMode` | 1 | 0 = global chord/angle for all entities. 1 = per-entity params from `setAppearance`. 2 = undocumented, accepted silently but unreliable — don't use. |
| `chordHeightTol` | 0.1 | Max distance (model units) between curved surface and tessellation triangle. Lower = finer. |
| `angleTol` | 0 | Max angle (degrees) between adjacent facet normals. 0 = disabled. Independent constraint — see `faceting-concepts.md`. |
| `isGraphicEnabled` | 1 | Client rendering hint. Does NOT suppress `r.graphic`. |
| `isCCGraphicEnabled` | 1 | ClassCAD internal graphic hint. Does NOT suppress graphic data. |
| `isInvisibleGraphicEnabled` | 0 | Whether invisible/hidden objects get tessellated. |
| `isSketchGraphicEnabled` | 1 | Client rendering hint for sketch geometry. No effect in CLI context. |
| `doCurveTessellation` | 1 | 1 = edges as tessellated polylines, 0 = analytic curves (see below). |

Booleans return as `0`/`1` (writes also accept JS `true`/`false`).

## facetingParamsMode

- **0** ("default parameters"): tessellates with the global `chordHeightTol`/`angleTol`.
- **1** ("entity-specific", default): per-entity tessellation params set via `setAppearance` (`chordHeightTol`/`angleTol` per feature).
- **Mode does NOT control graphic data presence.** Mode 0 and 1 return identical mesh data in `r.graphic` (vertices, indices, edges) — tested with cylinders and boxes: same vertex counts, same container structure. It may affect tessellation quality heuristics only.

## doCurveTessellation — edge data format

- **1 (default):** container has an `edges` array of `{ id, points, pointIds }` with discretized `points`.
- **0:** container has `lines` and `arcs` arrays of analytic curves instead of `edges`; the client must tessellate.

A structural change in the payload, not just size.

## Graphic flags

`isGraphicEnabled`, `isCCGraphicEnabled`, `isSketchGraphicEnabled` are client-side rendering hints, not tessellation controls — graphic data is returned regardless. Toggling changes ~80 bytes of visibility metadata, not mesh content. Rendering clients typically force them to `true` before requesting visualization.

## Persistence

- **Worker-level state.** Survives `common.clear()` and `part.create()`; unchanged by creating/modifying geometry.
- **NOT saved to OFB.** `common.load()` restores no settings (not chordHeightTol, angleTol, facetingParamsMode, nor any other) — values stay at whatever the worker had. Re-apply non-default settings after load.

## Relationship to getFacetingParameters

A **superset**: same backing store for `chordHeightTol`/`angleTol`. `setFacetingParameters` changes show here, `setDatabaseSettings` changes show in `getFacetingParameters`. Use this for all 8 fields, `getFacetingParameters` for just chord/angle.

## Working Example

```js
const settings = (await api.v1.common.getDatabaseSettings()).result
// { angleTol: 0, chordHeightTol: 0.1, doCurveTessellation: 1, facetingParamsMode: 1,
//   isCCGraphicEnabled: 1, isGraphicEnabled: 1, isInvisibleGraphicEnabled: 0, isSketchGraphicEnabled: 1 }

await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })
const s = (await api.v1.common.getDatabaseSettings()).result
// s.facetingParamsMode === 0

// Worker-global — restore
await api.v1.common.setDatabaseSettings({ facetingParamsMode: settings.facetingParamsMode })
```

## Related

`common.setDatabaseSettings` · `common.getFacetingParameters` / `common.setFacetingParameters` · `common.setAppearance`
