# common.setDatabaseSettings

Sets global database settings for tessellation, graphic generation, and curve representation. All parameters optional — omitted fields are untouched (partial update). Works in any drawing state, even empty.

## Key Parameters

| Param | Type | Default | Purpose |
|---|---|---|---|
| `chordHeightTol` | real | 0.1 | Max distance between geometry and tessellated arc. Lower = finer. **Primary quality lever.** |
| `angleTol` | real | 0 | Max angle (degrees) between adjacent tessellation surfaces. 0 = disabled. Only very small values (<10°) increase density. |
| `facetingParamsMode` | real | 1 | 0 = global params, 1 = per-entity params. Does NOT control graphic data presence. |
| `doCurveTessellation` | boolean | 1 | 1 = edges as polylines (`edges`, `{ id, points, pointIds }`). 0 = analytic curves (`lines` + `arcs`, no `edges` key). Agents must handle both schemas. |
| `isGraphicEnabled` | boolean | 1 | Client rendering hint. No effect on API response data. |
| `isCCGraphicEnabled` | boolean | 1 | Client rendering hint. No effect on API response data. |
| `isInvisibleGraphicEnabled` | boolean | 0 | Whether invisible objects get tessellated. |
| `isSketchGraphicEnabled` | boolean | 1 | Client rendering hint. No effect in CLI context. |

Booleans accept JS `true`/`false` or `0`/`1`; readback is always `0`/`1`.

## Return Value

`null` (VOID). maxLevel 31 on success, 51 on error — on error the setting is not applied.

## Validation & Edge Cases

| Input | Behavior |
|---|---|
| `{}` | Accepted (31), no-op |
| `chordHeightTol: -0.5` | Silently ignored, value unchanged |
| `chordHeightTol: 0` | Error (51), unchanged — not "infinitely fine" |
| `facetingParamsMode: 3` or `-1` | Accepted and stored without error; may give unpredictable tessellation |
| `isGraphicEnabled: 'yes'` (string) | Error 1001 ("wrong type"), unchanged |
| Unknown param names | Silently ignored |

## chordHeightTol — Mesh Density

Sphere r=20, facetingParamsMode=0:

| chordHeightTol | Vertices | Indices |
|---|---|---|
| 0.01 | 8131 | 48384 |
| 0.05 | 1923 | 11328 |
| 0.1 (default) | 1635 | 9600 |
| 0.5 | 247 | 1392 |
| 1 | 123 | 672 |
| 5 | 55 | 288 |

100× tighter tolerance → ~50–70× more vertices. 0.1 is a good balance, 0.01 high quality, 1+ fast/coarse.

## angleTol — Independent Constraint

Max angle between adjacent facet normals; when both are set, whichever demands more triangles wins (MAX). Measurement confound: with tight chord (0.1) the chord dominates at angleTol ≥ 15° and angleTol seems to do nothing. With cht=100, angleTol scales smoothly from 131K vertices (1°) to 0 (180°):

| angleTol | Vertices (cht=100) | Vertices (cht=0.1) |
|---|---|---|
| 0 (disabled) | n/a | 1,635 |
| 5 | 8,131 | 8,131 (angle wins) |
| 15 | 499 | 1,635 |
| 30 | 120 | 1,635 (chord wins) |

Full model: `faceting-concepts.md`.

## Persistence

- **Worker-level.** "Sets current AND initial" — the values become the worker baseline; all 8 fields survive `common.clear()` and `part.create()`.
- **NOT saved to OFB.** `common.load()` restores no settings; values stay at whatever the worker had. Re-apply non-default settings after load.

## Gotchas

- **facetingParamsMode does NOT control graphic data presence** — mode 0 and 1 return identical mesh data; the mode may only affect tessellation quality heuristics.
- Shares the `chordHeightTol`/`angleTol` store with `setFacetingParameters`; changes via either show in both getters.

## Working Example

```js
const orig = (await api.v1.common.getDatabaseSettings()).result
const fine = { chordHeightTol: 0.05, angleTol: 5, facetingParamsMode: 0 }
await api.v1.common.setDatabaseSettings(fine)
const s = (await api.v1.common.getDatabaseSettings()).result
// s.chordHeightTol === 0.05, s.angleTol === 5, s.facetingParamsMode === 0

// OFB round trip — encoding/compression on load must match the save
const partId = (await api.v1.part.create({ name: 'P' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10 })
const saved = (await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })).result
await api.v1.common.load({ data: saved.content, format: 'OFB', encoding: 'base64', compression: 'deflate', doClear: 1 })
await api.v1.common.setDatabaseSettings(fine) // load doesn't restore settings — re-apply

// Worker-global — restore
await api.v1.common.setDatabaseSettings({
  chordHeightTol: orig.chordHeightTol, angleTol: orig.angleTol, facetingParamsMode: orig.facetingParamsMode,
})
```

## Related

`common.getDatabaseSettings` · `common.getFacetingParameters` / `common.setFacetingParameters` · `common.setAppearance`
