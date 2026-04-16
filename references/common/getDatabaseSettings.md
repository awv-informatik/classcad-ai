# common.getDatabaseSettings

Returns the global database settings controlling tessellation, graphic generation, and curve representation. No parameters required.

## Key Fields

| Field | Default | Purpose |
|---|---|---|
| `facetingParamsMode` | 1 | **Critical.** 0 = use global chord/angle for tessellation (mesh data in responses). 1 = defer to per-entity params (no mesh in responses). |
| `chordHeightTol` | 0.1 | Max distance between geometry and tessellated arc. Lower = finer mesh. |
| `angleTol` | 0 | Max angle between adjacent tessellation surfaces. 0 = disabled (chord-only). |
| `isGraphicEnabled` | 1 | Client rendering hint. Does NOT suppress `r.graphic` in API responses. |
| `isCCGraphicEnabled` | 1 | ClassCAD internal graphic hint. Same as above — does NOT suppress graphic data. |
| `isInvisibleGraphicEnabled` | 0 | Whether invisible/hidden objects get tessellated. |
| `isSketchGraphicEnabled` | 1 | Client rendering hint for sketch geometry. No effect in CLI context. |
| `doCurveTessellation` | 1 | 1 = edges are tessellated polylines (`points` arrays). 0 = analytic curves (`lines`, `arcs`). |

All booleans are stored/returned as `0`/`1` integers, not JS true/false.

## facetingParamsMode — the mesh data switch

This is the most important setting for agents working with graphic data:

- **mode=0** ("default parameters"): The server tessellates using the global `chordHeightTol` and `angleTol`. API responses include full mesh data in `r.graphic` (vertices, indices, edges). **Use this mode if you need mesh/graphic data.**
- **mode=1** ("entity-specific", the default): The server expects per-entity tessellation parameters (set via `setAppearance` with `chordHeightTol`/`angleTol` per feature). API responses return **no mesh data** unless per-entity params are set.
- **mode=2**: Undocumented. Accepted silently but unreliable — produces graphic only under narrow conditions (factory-default chord=0.1, angle=0). Do not use.

**The default mode is 1**, which means API responses do NOT include mesh data out of the box. To get graphic data:

```js
await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })
// Now all subsequent API responses include r.graphic with mesh data
```

## Persistence

- **Worker-level state.** Settings persist across `common.clear()` and `part.create()`. Neither resets them.
- **Partial save/load.** `chordHeightTol` and `angleTol` are saved to OFB files and restored on `common.load()`. `facetingParamsMode` is NOT saved — it resets to default (1) on load.
- Settings do not change when geometry is created or modified. They are independent of drawing contents.

## Relationship to getFacetingParameters / setFacetingParameters

`getDatabaseSettings` is a **superset** of `getFacetingParameters`. Both share the same backing store for `chordHeightTol` and `angleTol`:

- `setFacetingParameters({ chordHeightTol: 0.5 })` → reflected in `getDatabaseSettings`
- `setDatabaseSettings({ chordHeightTol: 0.5 })` → reflected in `getFacetingParameters`

Use `getDatabaseSettings` when you need all 8 fields. Use `getFacetingParameters` for just chord/angle.

## doCurveTessellation — edge data format

Controls how curved edges are represented in `r.graphic`:

- **true (default):** Edges are pre-tessellated into polylines. Container has `edges` array with `{ id, points, pointIds }` — the `points` field has discretized coordinates.
- **false:** Server sends analytic curve definitions. Container has `lines` and `arcs` arrays instead of `edges`. Client must tessellate.

This is a real structural change in the graphic payload, not just a size difference.

## Graphic flags (isGraphicEnabled, isCCGraphicEnabled, isSketchGraphicEnabled)

These are **client-side rendering hints**, not tessellation controls. Toggling them has no meaningful effect on `r.graphic` data in API responses — graphic data is still returned regardless. The ~80 byte size difference when toggling is visibility metadata, not mesh content.

The harness `snapshot()` helper forcefully overrides these flags to `true` before rendering, so snapshots always work regardless of script settings.

## Gotchas

- The default `facetingParamsMode=1` means you get **no graphic data** in API responses by default. Set to 0 first.
- `facetingParamsMode` is NOT saved to OFB files. After `common.load()`, it resets to 1 (no graphic). You must re-set it to 0.
- Boolean fields accept JS `true`/`false` for writes but always return `0`/`1`.
- Mode=2 is undocumented and unreliable. Stick to 0 or 1.

## Working Example

```js
// Read current settings
const settings = (await api.v1.common.getDatabaseSettings()).result
// settings = { angleTol: 0, chordHeightTol: 0.1, doCurveTessellation: 1,
//              facetingParamsMode: 1, isCCGraphicEnabled: 1, isGraphicEnabled: 1,
//              isInvisibleGraphicEnabled: 0, isSketchGraphicEnabled: 1 }

// Enable mesh data in API responses
await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })

// Now solid creation returns graphic data
const boxR = await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })
// boxR.graphic.containers[0].meshes → array of mesh objects with vertices, indices, normals
```

## Related

- `common.setDatabaseSettings` — write counterpart (sets current AND initial values)
- `common.getFacetingParameters` / `common.setFacetingParameters` — convenience accessor for chord/angle only
- `common.setAppearance` — per-entity tessellation overrides (relevant when mode=1)
