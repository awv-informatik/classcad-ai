# Training: common.setDatabaseSettings

**Date:** 2026-04-16

## Goal

Testing `v1.common.setDatabaseSettings` — the write counterpart to `getDatabaseSettings`.

**Methods to cover:**

- `setDatabaseSettings` — set each parameter individually and in combination
- Verify each parameter change via `getDatabaseSettings` readback

**Parameters to exercise:**

- `isGraphicEnabled` — boolean (0/1)
- `isCCGraphicEnabled` — boolean (0/1)
- `isInvisibleGraphicEnabled` — boolean (0/1)
- `isSketchGraphicEnabled` — boolean (0/1)
- `facetingParamsMode` — 0, 1, (2?)
- `chordHeightTol` — real (distance tolerance)
- `angleTol` — real (angle tolerance)
- `doCurveTessellation` — boolean (0/1)

**Questions:**

- Does partial update work? (pass one field, others unchanged)
- What does "sets current AND initial" mean? Does it persist differently from individual setFacetingParameters?
- Does setDatabaseSettings survive common.clear() and part.create()?
- Does facetingParamsMode survive save/load? (getDatabaseSettings doc says no)
- Do chordHeightTol/angleTol changes propagate to getFacetingParameters?
- What happens with invalid values? (negative chord, out-of-range mode, wrong types)
- JS true/false vs 0/1 for boolean fields — both accepted?
- Effect of chordHeightTol on mesh density (vertex count comparison)
- Effect of doCurveTessellation on edge data format

---

## 01 — Basic set and readback

Script: `scripts/01-basic-set-readback.mjs` — ✅ Partial update works. Setting `chordHeightTol: 0.5` changed only that field; all 7 others unchanged.

**Data:** result=null, maxLevel=31 (info). Readback confirmed: chordHeightTol 0.1→0.5, all other fields identical (see `files/01-basic-set-readback-basic-readback.json`).

**Learned:** `setDatabaseSettings` supports partial updates — omitted fields are untouched. Returns VOID with maxLevel=31 on success.

## 02 — Boolean fields: JS true/false vs 0/1

Script: `scripts/02-boolean-fields.mjs` — ✅ Both JS booleans and integers accepted. Readback always returns 0/1 integers.

**Data:** Set 5 boolean fields with JS `false`/`true` → all read back as 0/1 (type: number). Then set same fields with 0/1 → identical behavior. `typeof after1.isGraphicEnabled` = `"number"`, value=0 (see `files/02-boolean-fields-boolean-fields.json`).

**Learned:** JS `true`/`false` accepted for writes but readback normalizes to 0/1 integers. Both forms interchangeable.
**📌 LLM doc:** Boolean fields accept JS true/false but always read back as 0/1.

## 03 — facetingParamsMode effect on graphic data

Script: `scripts/03-facetingParamsMode.mjs` — ⚠️ Both mode=1 and mode=0 returned mesh data. Expected mode=1 to suppress meshes.

**Data:** mode=1: hasGraphic=true, hasMesh=true. mode=0: hasGraphic=true, hasMesh=true. Vertex count with mode=0: 4 (box has only 4 unique verts after dedup). Both modes returned identical graphic containers (see `files/03-facetingParamsMode-faceting-mode.json`).

**Learned:** Contradicts getDatabaseSettings LLM doc claim that mode=1 suppresses mesh data. Retested in script 14 with clean reset — same result.
**📌 LLM doc:** facetingParamsMode does NOT control graphic data presence in CLI context. Both modes return mesh data.

## 04 — chordHeightTol effect on mesh density

Script: `scripts/04-chordHeight-mesh-density.mjs` — ✅ Clear inverse relationship: lower tolerance = denser mesh.

**Data:** Sphere (r=20) vertex counts with mode=0:
| chordHeightTol | Vertices | Indices |
|---|---|---|
| 0.01 | 8385 | 48384 |
| 0.05 | 2017 | 11328 |
| 0.1 | 1697 | 9600 |
| 0.5 | 277 | 1392 |
| 1 | 153 | 672 |
| 5 | 85 | 288 |

All values verified via readback (see `files/04-chordHeight-mesh-density-chord-density.json`). 100x range in chord tolerance → ~100x range in vertex count.

**Learned:** chordHeightTol is the primary tessellation quality lever. 0.1 (default) is a good balance. 0.01 is high quality (8k verts for a sphere). 1+ is very coarse.
**📌 LLM doc:** Document chordHeightTol density effect with the vertex count table.

## 05 — angleTol effect on mesh density

Script: `scripts/05-angleTol-effect.mjs` — ⚠️ Non-linear behavior. Only angleTol=5 produced denser mesh; higher values had no effect.

**Data:** Sphere (r=20) with chordHeightTol=0.1, varying angleTol:
| angleTol | Vertices |
|---|---|
| 0 (disabled) | 1697 |
| 5 | 8385 |
| 15 | 1697 |
| 30 | 1697 |
| 45 | 1697 |
| 90 | 1697 |

All verified via readback (see `files/05-angleTol-effect-angle-density.json`). Only angleTol=5 increased density (to 8385 — same as chordHeightTol=0.01). 15+ produced identical counts to disabled.

**Learned:** angleTol has a threshold effect. Small values (5°) tighten tolerance beyond what chordHeightTol alone achieves. Above ~10°, chord tolerance dominates and angle tolerance has no additional effect. The value is in degrees.
**📌 LLM doc:** Document angleTol threshold behavior — only very small values (<10°) increase density.

## 06 — doCurveTessellation effect on edge data

Script: `scripts/06-doCurveTessellation.mjs` — ✅ Structural change in graphic payload confirmed.

**Data:** doCurveTessellation=1: container has `edges` array (3 edges), no `lines`/`arcs`. doCurveTessellation=0: container has `lines` (1) + `arcs` (2), no `edges`. Container keys shift from `[..., meshes, edges, vertices]` to `[..., meshes, lines, vertices, arcs]` (see `files/06-doCurveTessellation-curve-tessellation.json`).

**Learned:** This is a real structural change — not just data density. Agents parsing graphic data must handle both schemas depending on this setting.
**📌 LLM doc:** Document the edge schema change.

## 07 — Persistence across clear and part.create

Script: `scripts/07-persistence-clear-create.mjs` — ✅ All 8 fields survive both operations.

**Data:** Set non-default values (facetingParamsMode=0, chordHeightTol=0.5, angleTol=15, isGraphicEnabled=0, doCurveTessellation=0). After `common.clear()`: all 8 fields identical. After `part.create()`: all 8 fields identical (see `files/07-persistence-clear-create-persistence.json`).

**Learned:** Settings are worker-level state, not drawing-level. clear() and part.create() don't reset them.

## 08 — Persistence across save/load (initial test)

Script: `scripts/08-persistence-save-load.mjs` — ⚠️ All settings appeared to reset after load, but test was ambiguous.

**Data:** Set non-defaults → save → manually reset to defaults → load → all at defaults. Every field showed "RESET". But the manual reset before load makes it impossible to distinguish "load restored defaults" from "load did nothing" (see `files/08-persistence-save-load-save-load.json`).

**Learned:** Ambiguous result — script 09 redesigned to isolate the question.

## 09 — Save/load verification (isolated)

Script: `scripts/09-save-load-verify.mjs` — ✅ Definitively proved: load does NOT restore database settings from OFB.

**Data:** Pre-save: chord=0.77, angle=33. Set different non-defaults: chord=2.22, angle=66. After load: chord=2.22, angle=66 — values stayed at pre-load values, not saved values (see `files/09-save-load-verify-save-load-verify.json`).

**Learned:** OFB save/load does NOT save or restore ANY database settings — not chordHeightTol, not angleTol, not anything. The getDatabaseSettings LLM doc incorrectly claims "chordHeightTol and angleTol are saved to OFB files and restored on common.load()". This is wrong.
**📌 LLM doc:** Correct getDatabaseSettings.md — no settings are saved to OFB. Also document in setDatabaseSettings.md.

## 10 — setFacetingParameters crosstalk

Script: `scripts/10-setFacetingParams-crosstalk.mjs` — ✅ Shared backing store confirmed bidirectionally.

**Data:** setDatabaseSettings(chord=0.5, angle=25) → getFacetingParameters returns chord=0.5, angle=25. setFacetingParameters(chord=0.8, angle=40) → getDatabaseSettings returns chord=0.8, angle=40 (see `files/10-setFacetingParams-crosstalk-crosstalk.json`).

**Learned:** Both APIs read/write the same underlying store for chordHeightTol and angleTol. Changes via either API are reflected in both getters.

## 11 — Invalid values and edge cases

Script: `scripts/11-invalid-values.mjs` — ✅ Comprehensive edge case coverage.

**Data** (see `files/11-invalid-values-invalid-values.json`):
| Input | maxLevel | Effect |
|---|---|---|
| `{}` (empty) | 31 | No-op, accepted silently |
| `chordHeightTol: -0.5` | 31 | Silently ignored, stays at 0.1 |
| `chordHeightTol: 0` | 51 (error) | Rejected, stays at 0.1 |
| `facetingParamsMode: 3` | 31 | Accepted, mode becomes 3 |
| `facetingParamsMode: -1` | 31 | Accepted, mode becomes -1 |
| `isGraphicEnabled: 'yes'` | 51 (error) | Type error, code 1001 |
| `unknownParam: 42` | 31 | Silently ignored |

**Learned:** Negative chord is silently ignored (not applied), zero chord is an error. Invalid mode values (3, -1) are accepted without error. String for boolean triggers type error. Unknown params ignored.
**📌 LLM doc:** Document validation: zero chord = error, negative chord = silent ignore, invalid modes accepted, wrong types = error code 1001.

## 12 — Multi-field update (all 8 at once)

Script: `scripts/12-multi-field-update.mjs` — ✅ Setting all 8 fields in a single call works.

**Data:** Set all fields to non-defaults in one call (maxLevel=31). Readback confirmed all 8 changed (see `files/12-multi-field-update-multi-field.json`).

**Learned:** Atomic multi-field update supported. All-or-nothing — if the call succeeds, all fields update.

## 13 — "Initial" settings behavior

Script: `scripts/13-initial-settings.mjs` — ✅ Confirms "sets current AND initial" means settings become the new baseline.

**Data:** Set non-defaults → part.create() → unchanged → clear() → unchanged. All fields survived both operations (see `files/13-initial-settings-initial-settings.json`).

**Learned:** "Initial" means the values become the worker's baseline. Neither clear nor create resets them. Consistent with scripts 07.

## 14 — Mode 1 graphic (clean retest)

Script: `scripts/14-mode1-graphic-clean.mjs` — ⚠️ Confirms: mode=1 does NOT suppress mesh data, contradicting getDatabaseSettings doc.

**Data:** After hard reset to all defaults (mode=1), created cylinder: containers=1, meshes=3, edges=3, 66 vertices, 192 indices. Switched to mode=0, created second cylinder: containers=1, meshes=3, edges=3, 66 vertices, 192 indices. Identical (see `files/14-mode1-graphic-clean-mode1-graphic.json`).

**Learned:** In current server version, facetingParamsMode has no visible effect on whether graphic/mesh data is included in API responses. Both modes return identical mesh data.
**📌 LLM doc:** Correct getDatabaseSettings.md mode=1 description. Document in setDatabaseSettings.md.

## 15 — Graphic flags (isGraphicEnabled etc.)

Script: `scripts/15-graphic-flags-effect.mjs` — ✅ No effect on graphic data, as expected.

**Data:** All flags on: graphic size 2748 bytes, 4 vertices. All flags off: graphic size 2748 bytes, 4 vertices. Difference: 0 bytes (see `files/15-graphic-flags-effect-flag-effect.json`).

**Learned:** Graphic flags are client-side hints only. Zero effect on API response data. Consistent with getDatabaseSettings doc.

## 16 — Return envelope details

Script: `scripts/16-return-envelope.mjs` — ✅ Clean envelope documentation.

**Data** (see `files/16-return-envelope-return-envelope.json`):
- Success: result=null, maxLevel=31, messages=[] (empty, not absent)
- Error (zero chord): result=null, maxLevel=51, level=51, code=0, internal C++ error message
- Type error (string for bool): result=null, maxLevel=51, level=51, code=1001, "wrong type" message

**Learned:** Always returns null. maxLevel=31 on success (info-level). Error messages have descriptive text and code 1001 for type errors. On error, the setting is not applied.

---

## Coverage Checklist

- [x] API called successfully (scripts 01, 12)
- [x] All 8 parameters tested individually (scripts 01-06, 11)
- [x] All parameters tested in combination (script 12)
- [x] Boolean field type handling (script 02)
- [x] Persistence across clear/create (scripts 07, 13)
- [x] Persistence across save/load (scripts 08, 09)
- [x] Crosstalk with setFacetingParameters (script 10)
- [x] Invalid values and edge cases (script 11)
- [x] Return envelope (script 16)
- [x] facetingParamsMode mesh effect (scripts 03, 14)
- [x] chordHeightTol density effect (script 04)
- [x] angleTol density effect (script 05)
- [x] doCurveTessellation effect (script 06)
- [x] Graphic flags effect (script 15)
- [x] All findings backed by filewrite data
