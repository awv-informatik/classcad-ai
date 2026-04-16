# common.setDatabaseSettings

Sets global database settings controlling tessellation, graphic generation, and curve representation. All parameters are optional — omitted fields are untouched (partial update).

## Prerequisites

None — works on any drawing state, even empty.

## Key Parameters

| Param | Type | Default | Purpose |
|---|---|---|---|
| `chordHeightTol` | real | 0.1 | Max distance between geometry and tessellated arc. Lower = finer mesh. **Primary tessellation quality lever.** |
| `angleTol` | real | 0 | Max angle (degrees) between adjacent tessellation surfaces. 0 = disabled. Only very small values (<10°) increase density. |
| `facetingParamsMode` | real | 1 | 0 = global tessellation params, 1 = per-entity params. Does NOT control graphic data presence (see Gotchas). |
| `doCurveTessellation` | boolean | 1 | 1 = edges as polylines (`edges` array). 0 = analytic curves (`lines` + `arcs` arrays). Structural change in graphic payload. |
| `isGraphicEnabled` | boolean | 1 | Client rendering hint. No effect on API response data. |
| `isCCGraphicEnabled` | boolean | 1 | Client rendering hint. No effect on API response data. |
| `isInvisibleGraphicEnabled` | boolean | 0 | Whether invisible objects get tessellated. |
| `isSketchGraphicEnabled` | boolean | 1 | Client rendering hint. No effect in CLI context. |

## Return Value

Always returns `null` (VOID). maxLevel=31 on success, maxLevel=51 on error. On error, the setting is not applied.

## Boolean Type Handling

Boolean fields accept both JS `true`/`false` and integer `0`/`1`. Readback always normalizes to `0`/`1` integers. Passing a string (e.g., `'yes'`) triggers error code 1001 ("wrong type").

## chordHeightTol — Mesh Density

Tested on a sphere (r=20) with facetingParamsMode=0:

| chordHeightTol | Vertices | Indices |
|---|---|---|
| 0.01 | 8385 | 48384 |
| 0.05 | 2017 | 11328 |
| 0.1 (default) | 1697 | 9600 |
| 0.5 | 277 | 1392 |
| 1 | 153 | 672 |
| 5 | 85 | 288 |

100x range in tolerance → ~100x range in vertex count. 0.1 is a good balance. 0.01 for high quality. 1+ for fast/coarse.

## angleTol — Threshold Behavior

Tested on a sphere (r=20) with chordHeightTol=0.1:

| angleTol | Vertices |
|---|---|
| 0 (disabled) | 1697 |
| 5 | 8385 |
| 15+ | 1697 |

Only very small values (<10°) tighten tessellation beyond what chord tolerance achieves. At 15° and above, chord tolerance dominates. The value is in degrees.

## doCurveTessellation — Edge Schema Change

- **1 (default):** Container has `edges` array with pre-tessellated polylines (`{ id, points, pointIds }`).
- **0:** Container has `lines` + `arcs` arrays with analytic curve definitions. No `edges` key.

This changes the graphic payload structure, not just data density. Agents must handle both schemas.

## Persistence

- **Survives `common.clear()` and `part.create()`** — all 8 fields preserved. Settings are worker-level state, not drawing-level.
- **NOT saved to OFB files.** `common.load()` does not restore any database settings. Values remain at whatever the worker had before the load.

## Crosstalk with setFacetingParameters

`setDatabaseSettings` and `setFacetingParameters` share the same backing store for `chordHeightTol` and `angleTol`. Changes via either API are reflected in both `getDatabaseSettings` and `getFacetingParameters`.

## Validation & Edge Cases

| Input | Behavior |
|---|---|
| `{}` (empty) | Accepted (maxLevel=31), no-op |
| `chordHeightTol: -0.5` | Silently ignored, value unchanged |
| `chordHeightTol: 0` | Error (maxLevel=51), value unchanged |
| `facetingParamsMode: 3` or `-1` | Accepted without error, value stored |
| `isGraphicEnabled: 'yes'` | Error code 1001 ("wrong type"), value unchanged |
| Unknown param names | Silently ignored |

## Gotchas

- **Zero chordHeightTol is an error**, not "infinitely fine". Negative values are silently ignored.
- **facetingParamsMode does NOT control graphic data presence** in the current server version. Both mode=0 and mode=1 return identical mesh data in API responses. The mode may affect tessellation quality heuristics, but it does not suppress `r.graphic`.
- **Invalid mode values (3, -1) are accepted** without error and stored. They may produce unpredictable tessellation behavior.
- **No settings are saved to OFB.** After `common.load()`, you must re-apply any non-default settings.
- **"Sets current AND initial"** means the values become the worker's baseline. Neither `clear()` nor `part.create()` resets them.

## Working Example

```js
// Set tessellation quality for fine meshes
await api.v1.common.setDatabaseSettings({
  chordHeightTol: 0.05,
  angleTol: 5,
  facetingParamsMode: 0,
})

// Verify
const s = (await api.v1.common.getDatabaseSettings()).result
// s.chordHeightTol === 0.05, s.angleTol === 5, s.facetingParamsMode === 0

// After common.load(), settings are NOT restored — re-apply:
await api.v1.common.load({ data: savedContent, format: 'OFB', encoding: 'base64' })
await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.05, angleTol: 5, facetingParamsMode: 0 })
```

## Related

- `common.getDatabaseSettings` — read counterpart
- `common.getFacetingParameters` / `common.setFacetingParameters` — convenience accessor for chord/angle only
- `common.setAppearance` — per-entity tessellation overrides (relevant when facetingParamsMode=1)
