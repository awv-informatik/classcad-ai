# Training: common.getDatabaseSettings

**Date:** 2026-04-16

## Goal

Testing `v1.common.getDatabaseSettings` — the read-only query for global database/faceting/graphic settings.

**Methods to cover:**

- `getDatabaseSettings` — no parameters, returns settings object
- Understand each returned field: `isGraphicEnabled`, `isCCGraphicEnabled`, `isInvisibleGraphicEnabled`, `isSketchGraphicEnabled`, `facetingParamsMode`, `chordHeightTol`, `angleTol`, `doCurveTessellation`
- Relationship to `setDatabaseSettings` (write counterpart)
- Relationship to `getFacetingParameters` / `setFacetingParameters` (subset overlap?)

**Questions:**

- What are the default values for each setting on a fresh connection?
- Do settings persist after `common.clear`?
- Does `facetingParamsMode` affect which chordHeightTol/angleTol values are actually used?
- Are `chordHeightTol`/`angleTol` in getDatabaseSettings the same values as from `getFacetingParameters`?
- Do settings change after creating geometry vs on an empty drawing?
- What is the effect of toggling graphic flags on `r.graphic` data returned by API calls?
- Does `doCurveTessellation` affect curve data returned in `r.graphic`?

---

## 01 — defaults on fresh connection

Script: `scripts/01-defaults.mjs` — ✅ API works, no parameters needed.

**Data:** maxLevel=31 (info). Result object has 8 fields (see `files/01-defaults-defaults.json`):

| Field | Default | Type |
|---|---|---|
| isGraphicEnabled | 1 | boolean (0/1) |
| isCCGraphicEnabled | 1 | boolean (0/1) |
| isInvisibleGraphicEnabled | 0 | boolean (0/1) |
| isSketchGraphicEnabled | 1 | boolean (0/1) |
| facetingParamsMode | 1 | real |
| chordHeightTol | 0.1 | real |
| angleTol | 0 | real |
| doCurveTessellation | 1 | boolean (0/1) |

Messages: empty array. No parameters required — just `getDatabaseSettings()` with no args.

**📌 LLM doc:** Default values table. Booleans stored as 0/1 integers, not true/false.

---

## 02 — compare with getFacetingParameters

Script: `scripts/02-compare-faceting.mjs` — ✅ values match.

**Data:** DB chordHeightTol=0.1, FP chordHeightTol=0.1. DB angleTol=0, FP angleTol=0. Both match exactly. FP only has 2 keys (`angleTol`, `chordHeightTol`). DB has 8 keys — superset.

**Learned:** `getDatabaseSettings` and `getFacetingParameters` share the same backing store for chordHeightTol and angleTol. DB is the superset with 6 additional fields. FP is a convenience accessor for just the tessellation tolerances.

**📌 LLM doc:** chordHeightTol/angleTol are shared between getDatabaseSettings and getFacetingParameters.

---

## 03 — persist after clear

Script: `scripts/03-persist-after-clear.mjs` — ✅ settings survive clear.

**Data:** Set chord=0.5, angle=15. After `common.clear({})`: chord=0.5, angle=15. Settings survived.

**Learned:** Database settings are worker-level state, not tied to drawing contents. `common.clear()` does not reset them.

**📌 LLM doc:** Settings persist across clear — worker-level state.

---

## 04 — settings unchanged by geometry creation

Script: `scripts/04-with-geometry.mjs` — ✅ settings unchanged.

**Data:** Settings identical before and after creating part + entityInjection + solid.box. `Settings changed: false`.

**Learned:** Geometry creation has no effect on database settings.

---

## 05 — facetingParamsMode values

Script: `scripts/05-facetingParamsMode.mjs` — ✅ modes 0, 1, and 2 all accepted.

**Data:** mode=0 → readback 0, mode=1 → readback 1, mode=2 → accepted (maxLevel=31, no error messages), readback 2. Docs only document modes 0 and 1. Mode 2 is undocumented but silently accepted.

**Learned:** The server accepts at least modes 0, 1, 2 without error. Mode 2 is not documented. Docs say: mode=0 "default parameters will be used", mode=1 "specific parameters of each entity will be used".

**📌 LLM doc:** facetingParamsMode values and behavior (especially mode=0 for reliable mesh data).

---

## 06 — isGraphicEnabled effect on API responses

Script: `scripts/06-graphic-flags-effect.mjs` — Unexpected: graphic still returned when disabled.

**Data:** With isGraphicEnabled=1: graphic size 2770. With isGraphicEnabled=0: graphic size 2689. Both non-zero. The flag does NOT suppress graphic data in API responses. Size difference is ~80 bytes (likely visibility metadata).

**Learned:** `isGraphicEnabled` is a client-side rendering hint, not a server-side tessellation control. It doesn't suppress `r.graphic` in API responses.

**📌 LLM doc:** isGraphicEnabled does NOT suppress graphic data in API responses.

---

## 07 — roundtrip for all fields

Script: `scripts/07-setdb-reflects-in-get.mjs` — ✅ all fields roundtrip correctly.

**Data:** All 8 fields tested via set → get cycle. All reflected correctly. Booleans: JS `false` → stored as `0`, JS `true` → stored as `1`. Numerics: exact match.

**Learned:** Complete bidirectional consistency between setDatabaseSettings and getDatabaseSettings. Booleans accept JS true/false but are stored/returned as 0/1.

---

## 08 — cross-API consistency (setFacetingParameters vs setDatabaseSettings)

Script: `scripts/08-setfaceting-vs-setdb.mjs` — ✅ bidirectional sync.

**Data:** 
- setFacetingParameters(chord=0.7, angle=25) → getDatabaseSettings shows chord=0.7, angle=25
- setDatabaseSettings(chord=0.9, angle=30) → getFacetingParameters shows chord=0.9, angle=30

**Learned:** Single backing store. Either API can read/write the same chordHeightTol and angleTol values. They are fully interchangeable for these two fields.

**📌 LLM doc:** setFacetingParameters and setDatabaseSettings share the same backing store for chord/angle.

---

## 09 — isSketchGraphicEnabled

Script: `scripts/09-sketch-graphic-flag.mjs` — Sketch APIs return no graphic data in CLI context regardless.

**Data:** Both ON and OFF: `hasGraphic: false`. Sketch line returns no graphic data either way.

**Learned:** In CLI/headless context, sketch operations don't return graphic data. The flag likely controls rendering in a GUI client.

---

## 10 — isInvisibleGraphicEnabled

Script: `scripts/10-invisible-graphic-flag.mjs` — ✅ toggle works.

**Data:** Default 0, set to 1 → readback 1. No observable effect on solid API responses in this test (would need invisible objects to see the difference).

---

## 11 — isCCGraphicEnabled

Script: `scripts/11-ccgraphic-flag.mjs` — Similar to isGraphicEnabled.

**Data:** ON: graphic size 2769. OFF: graphic size 2688. Small difference (~80 bytes), graphic still present.

**Learned:** Like isGraphicEnabled, this is a rendering hint, not a tessellation control. Does not suppress graphic data.

---

## 12 — doCurveTessellation effect on graphic structure

Script: `scripts/12-doCurveTessellation-flag.mjs` — ✅ changes edge data format.

**Data:** With doCurveTessellation=true (cylinder): 42005 bytes graphic. With false: 34647 bytes. Both have keys `containers, properties`. Size difference: ~7KB.

**Learned:** The flag changes HOW edge/curve data is returned, not WHETHER it's returned.

**📌 LLM doc:** doCurveTessellation changes edge data format.

---

## 13 — graphic data structure comparison (isGraphicEnabled on/off)

Script: `scripts/13-graphic-detail-compare.mjs` — ✅ identical structure.

**Data:** Both ON and OFF: same container count (1), same mesh count (6), same edge count (12). Same keys: `id, owner, type, properties, meshes, edges, vertices`. Full graphic data dumps saved to JSON files (11059 vs 11038 bytes — 21 byte difference).

**Learned:** isGraphicEnabled has zero effect on graphic structure or mesh content. The tiny size difference is metadata.

---

## 14 — doCurveTessellation edge data structure

Script: `scripts/14-curvetess-edge-diff.mjs` — Key structural finding.

**Data:**
- ON: edges have keys `id, points, pointIds` — tessellated polylines
- OFF: container has `lines, arcs` instead of `edges` — analytic curve definitions

**Learned:** `doCurveTessellation=true` → server tessellates curves into polyline points. `false` → server sends analytic definitions (lines, arcs). The client must tessellate. This is a real structural change, not just a size difference.

**📌 LLM doc:** doCurveTessellation=true sends tessellated polylines, false sends analytic curves.

---

## 15 — chordHeightTol/angleTol effect on mesh quality

Script: `scripts/15-chord-angle-on-mesh.mjs` — Only first iteration produced mesh data.

**Data:** chord=0.1, angle=0: 1697 verts, 9600 indices. All other combinations (chord=0.5/1.0/0.01, angle=10/30): 0 verts, 0 indices. This was a state contamination issue from facetingParamsMode — see scripts 17-23 for proper investigation.

---

## 16 — settings in save/load cycle

Script: `scripts/16-settings-save-load.mjs` — Partial persistence.

**Data:** Set chord=0.77, angle=22, mode=0. Save to OFB. Reset to defaults. Load from OFB. After load: chord=0.77, angle=22 (restored), but mode=1 (NOT restored — reverted to default).

**Learned:** chordHeightTol and angleTol are stored in the OFB file and restored on load. facetingParamsMode is NOT stored in the file — resets to default (1) on load.

**📌 LLM doc:** chord/angle saved to OFB. facetingParamsMode is NOT saved — resets on load.

---

## 17-18 — facetingParamsMode controls graphic data generation

Script: `scripts/17-mesh-quality-isolated.mjs` + `scripts/18-facetingmode-mesh-effect.mjs` — Key finding.

**Data (script 18):**
- mode=0: 1697 verts, 134610 bytes graphic → full mesh data
- mode=1: 0 verts, 0 bytes → no graphic at all

**Learned:** `facetingParamsMode` is the master switch for mesh/graphic data in API responses. Mode=0 ("default parameters") uses the global chord/angle values to tessellate and returns full mesh data. Mode=1 ("entity-specific") defers tessellation to per-entity settings and returns no mesh data unless per-entity params are set (via `setAppearance` chord/angle per feature).

**📌 LLM doc:** CRITICAL — facetingParamsMode=0 required for graphic data in API responses.

---

## 19 — part.create does not reset settings

Script: `scripts/19-partcreate-resets-settings.mjs` — ✅ no reset.

**Data:** Set non-default values (chord=0.77, angle=22, mode=0, isGraphicEnabled=false, isInvisibleGraphicEnabled=true). After `part.create`: all values unchanged. "Changed fields: NONE".

**Learned:** `part.create` does not reset database settings. They are truly worker-level persistent state.

---

## 20 — clean test of mode vs graphic

Script: `scripts/20-mode-graphic-clean.mjs` — Confirms script 18 finding.

**Data:**
- mode=0 → gfxSize=134610 (sphere, full mesh)
- mode=1 before part.create → gfxSize=0
- mode=1 set after part.create → gfxSize=0

**Learned:** Ordering of mode set vs part.create doesn't matter. Mode=1 = no graphic, period.

---

## 21-22 — mode=2 and shape type

Script: `scripts/21-mode2-behavior.mjs` + `scripts/22-mode-box-vs-sphere.mjs` — mode=2 behaves like mode=1.

**Data (script 22):**
- mode=0: box=2769, sphere=134823, cylinder=12294 → all shapes get graphic
- mode=1: box=0, sphere=0, cylinder=0 → no graphic
- mode=2: box=0, sphere=0, cylinder=0 → no graphic

**Learned:** mode=2 (undocumented) behaves identically to mode=1 in clean tests — no graphic data.

---

## 23 — mode=2 edge case

Script: `scripts/23-mode2-with-different-tols.mjs` — mode=2 produces graphic only at factory defaults.

**Data:** mode=2 with chord=0.1, angle=0 → gfxSize=2769 (box). All other chord/angle combinations → 0. The 0→2 sequence also produced 0.

**Learned:** mode=2 has a narrow edge case where it produces graphic data only at factory default values (chord=0.1, angle=0). This is unreliable and undocumented — not for production use.

---

## Summary

### Answers to initial questions:

1. **Default values:** See script 01 table. Factory defaults: chord=0.1, angle=0, mode=1, all graphic flags=1 except isInvisibleGraphicEnabled=0.
2. **Persist after clear:** Yes. Settings are worker-level, not drawing-level.
3. **facetingParamsMode:** The MOST important setting. mode=0 = reliable mesh data in API responses. mode=1 (default!) = no mesh data. mode=2 = undocumented, unreliable.
4. **chord/angle overlap with getFacetingParameters:** Identical. Same backing store. Both APIs read/write the same values.
5. **Settings change with geometry:** No. Settings are independent of drawing contents.
6. **Graphic flags effect:** isGraphicEnabled, isCCGraphicEnabled, isSketchGraphicEnabled are client-side rendering hints, NOT tessellation controls. They do not suppress `r.graphic` in API responses.
7. **doCurveTessellation:** Changes edge data format: true=tessellated polylines, false=analytic curves (lines, arcs).

### Harness note

The `snapshot()` helper in `scripts/run.mjs` (line 103) forcefully sets `isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true` before rendering. This is why snapshots work regardless of script settings — the harness overrides graphic flags. It does NOT override `facetingParamsMode`.
