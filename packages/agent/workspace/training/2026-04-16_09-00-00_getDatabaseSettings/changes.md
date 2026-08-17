# Changes — getDatabaseSettings training session

## New file: `references/common/getDatabaseSettings.md`

```diff
+# common.getDatabaseSettings
+
+Returns the global database settings controlling tessellation, graphic generation, and curve representation. No parameters required.
+
+## Key Fields
+
+| Field | Default | Purpose |
+|---|---|---|
+| `facetingParamsMode` | 1 | **Critical.** 0 = use global chord/angle for tessellation (mesh data in responses). 1 = defer to per-entity params (no mesh in responses). |
+| `chordHeightTol` | 0.1 | Max distance between geometry and tessellated arc. Lower = finer mesh. |
+| `angleTol` | 0 | Max angle between adjacent tessellation surfaces. 0 = disabled (chord-only). |
+| `isGraphicEnabled` | 1 | Client rendering hint. Does NOT suppress `r.graphic` in API responses. |
+| `isCCGraphicEnabled` | 1 | ClassCAD internal graphic hint. Same as above — does NOT suppress graphic data. |
+| `isInvisibleGraphicEnabled` | 0 | Whether invisible/hidden objects get tessellated. |
+| `isSketchGraphicEnabled` | 1 | Client rendering hint for sketch geometry. No effect in CLI context. |
+| `doCurveTessellation` | 1 | 1 = edges are tessellated polylines (`points` arrays). 0 = analytic curves (`lines`, `arcs`). |
+
+All booleans are stored/returned as `0`/`1` integers, not JS true/false.
+
+## facetingParamsMode — the mesh data switch
+
+- **mode=0**: server tessellates using global chord/angle → full mesh in r.graphic
+- **mode=1** (default): defers to per-entity params → no mesh unless per-entity set
+- **mode=2**: undocumented, unreliable
+
+## Persistence
+
+- Worker-level: survives clear() and part.create()
+- chord/angle saved to OFB, facetingParamsMode NOT saved
+
+## Cross-API
+
+- getDatabaseSettings is superset of getFacetingParameters (shared backing store)
+- doCurveTessellation: true=polylines, false=analytic curves
+- Graphic flags are client hints, not tessellation controls
+
+## Gotchas
+
+- Default mode=1 → no graphic data. Set mode=0 first.
+- facetingParamsMode resets on load(). Must re-set after loading.
+- Booleans accept true/false but return 0/1.
```
