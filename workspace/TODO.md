# 📋 Training TODO — Known Issues & Anomalies

Collected from all training journals. Ordered by severity.

---

## 💀 CRITICAL — Server Hangs (require kill -9)

### 1. 💀 `curve.circle` — radius <= 0 hangs server

- **Session:** `2026-03-31_00-00-00_curve-circle` (journal line ~108)
- **Error:** ❌ No error returned. WebSocket call never resolves. 100% CPU infinite loop.
- **Trigger:** `radius: 0` or negative radius.
- **Recovery:** `kill -9` only.

### 2. 💀 `curve.interpolationCurve` — duplicate points hang server

- **Session:** `2026-04-07_00-00-00_interpolationCurve` (journal line ~121)
- **Error:** ❌ 100% CPU hang. Even 2 consecutive duplicate points among 4 total triggers it.
- **Note:** Stricter than bezierCurve which tolerates duplicates. Empty array `[]` also expected to hang.

### 3. 💀 2D booleans — same ID as target and tool hangs server

- **Session:** `2026-04-07_22-00-00_2d-booleans` (journal line ~139)
- **Error:** ❌ Infinite loop. Same pattern as solid boolean self-reference.
- **Recovery:** `kill -9`.

### 4. 💀 `solid.union` — same solid as target and tool hangs server

- **Session:** `2026-04-14_10-00-00_solidUnion` (documented in LLM doc `references/solid/union.md`)
- **Error:** ❌ 100% CPU, no response, infinite loop. No timeout or error.
- **Applies to:** All solid booleans (union, subtraction, intersection).

### 5. 💀 `solid.subtraction` — operating on consumed solid IDs hangs server

- **Session:** Documented in LLM doc `references/solid/subtraction.md`
- **Error:** ❌ Referencing a consumed (keepTools=false) tool solid ID in any subsequent solid operation hangs the server.

### 45. 💀 `solid.merge` — same solid as target and tool hangs server

- **Session:** `2026-04-14_21-30-00_solid-merge` (journal script 10)
- **Error:** ❌ 100% CPU, no response, infinite loop. Same behavior as self-union.
- **Trigger:** `merge({ id, target: X, tools: [X] })`
- **Recovery:** `kill -9` required.

---

## 🔥 CRITICAL — Recalc Invalidation Bug (affects multiple shape-transform APIs)

### 6. 🔥 `recalc` invalidates shape IDs for transform operations

- **Sessions:**
  - `2026-04-07_14-00-00_translateShape` (journal lines ~32, 38, 58, 101, 105, 111, 113, 125)
  - `2026-04-07_20-00-00_scaleShape` (journal lines ~39, 52, 76, 80, 120)
  - `2026-04-07_18-00-00_transformShape` (journal line ~180)
  - `2026-04-07_22-00-00_2d-booleans` (journal line ~227)
- **Error:** ❌ After `recalc` (including via `snapshot`), shape IDs become invalid → error 1006 on translateShape/scaleShape/transformShape/2D booleans.
- **Workaround:** 🩹 Do NOT call `snapshot` or `recalc` between shape creation and shape transforms. Adding a new curve after recalc "refreshes" state.
- **Impact:** ⚠️ Cannot interleave snapshots between transform calls.

---

## 🕳️ CRITICAL — Silent No-Op Traps (wrong params accepted without error)

### 7. 🕳️ `part.updateExpression` — direct params silently ignored

- **Sessions:**
  - `2026-03-24_19-00-00_part-expression-advanced` (journal line ~73)
  - `2026-03-25_12-00-00_updateExpression` (journal line ~50)
- **Error:** 🤫 `updateExpression({ id, name, value })` returns result=1, no error, but value DOES NOT CHANGE. Must use `{ id, toUpdate: [{ name, value }] }`.

### 8. 🕳️ `part.deleteExpression` — direct name param silently ignored

- **Session:** `2026-03-25_12-30-00_deleteExpression` (journal line ~67)
- **Error:** 🤫 `deleteExpression({ id, name })` = silent no-op. Must use `{ id, toDelete: [name] }`.

### 9. 🕳️ `part.renameExpression` — direct params silently ignored

- **Session:** `2026-03-25_13-00-00_renameExpression` (journal line ~50)
- **Error:** 🤫 `renameExpression({ id, name, newName })` = silent no-op. Must use `{ id, toRename: [{ name, newName }] }`.

---

## 🚨 CRITICAL — Wrong Prior Findings (constraint sessions invalidated)

### 10. 🚨 All 2026-04-08 constraint sessions created sketches without `planeId`

- **Session:** `2026-04-14_10-00-00_constraintRetrain` (journal line ~7)
- **Impact:** ⚠️ Missing `planeId` silently disables the constraint solver. ALL solver-related findings from 2026-04-08 constraint/dimension sessions are WRONG.
- **Corrected findings:**
  - ✅ Constraints ARE enforced when `planeId` is set (`2026-04-08_10-00-00_constraintTypes` lines ~162, 243, 265)
  - ❌ "Constraints are declarative only" was an artifact of missing `planeId`

---

## 💥 CRITICAL — Broken API Parameters

### 11. 💥 `sketch.dimension` — `value` parameter always fails

- **Session:** `2026-04-08_12-00-00_dimension` (journal line ~172)
- **Error:** ❌ Passing `value` at creation time ALWAYS fails regardless of dimension type. Must create dimension first, then use `updateDimension`.

### 12. 💥 `sketch.generateAutoConstraints` — rejects sketch IDs despite docs

- **Session:** `2026-04-08_10-00-00_generateAutoConstraints` (journal line ~32)
- **Error:** ❌ Docs say `geomId` can be "the sketch id itself" but API rejects it. Only sketch-curve and sketch-point IDs accepted.

---

## 🐛 HIGH — Server Bugs / Internal Errors

### 13. 🐛 `curve.cleanShape` — internal error on empty shape

- **Session:** `2026-03-31_00-00-00_curve-shape` (journal line ~129)
- **Error:** ❌ maxLevel=51 internal database error. Server-side bug.

### 14. 🐛 `curve.arcBy3Points` — collinear points produce German internal error

- **Session:** `2026-03-31_12-00-00_arcBy3Points` (journal line ~60)
- **Error:** 💣 `"Index 2 ausserhalb des Arraybereichs"` — crash-style message instead of clean validation.

### 15. 🐛 `curve.advancedPolyline` — `r: 0` fillet crashes

- **Session:** `2026-04-07_00-00-00_advancedPolyline` (journal line ~94)
- **Error:** 💣 Same German array index crash. `r: negative` silently accepted (creates outward-bulging arc).

### 16. 🐛 `curve.polyline2d` — single point causes internal error

- **Session:** `2026-04-07_00-00-00_polyline2d` (journal line ~68)
- **Error:** 💣 `"Uninitialized MemberPTR"` — internal crash. Minimum 2 points required.

### 17. 🐛 `part.updateCylinder` on box ID — German internal error

- **Session:** `2026-03-25_16-00-00_openFeature-closeFeature` (journal line ~129)
- **Error:** 💣 `"Index 3 ausserhalb des Arraybereichs"` — wrong update API on wrong feature type.

---

## 📖 HIGH — Doc Discrepancies / Undocumented Behavior

### 18. 📖 `part.create` — second call is no-op (docs say "clears drawing")

- **Session:** `2026-03-23_03-00-00_part-create` (journal line ~45)
- **Error:** ❌ Docs claim `part.create` "clears the drawing and creates a new part" but a second call returns null. Only works once per session.

### 19. 📖 Protocol envelope — `levelStr` field undocumented

- **Session:** `2026-03-22_17-25-41_protocol-envelope` (journal lines ~85, 87)
- **Detail:** 🔍 Messages include `levelStr` (e.g. "ERROR", "WARNING") not mentioned in docs. Also: `silent: true` suppresses messages but result is still null.

### 20. 📖 Protocol envelope — `undefined` in batch breaks envelope

- **Session:** `2026-03-22_17-25-41_protocol-envelope` (journal line ~215)
- **Error:** ❌ Passing `undefined` to batch produces broken envelope (`result: null`, `maxLevel: undefined`).

### 21. 📖 `sketch.isSolved` does not exist

- **Session:** `2026-03-22_18-30-00_result-types` (journal lines ~77, 212)
- **Error:** ❌ code 1201 "Unknown command". Doc discrepancy — API listed in docs but not implemented.

### 22. 📖 `part.expression` — invalid refs still registered

- **Session:** `2026-03-24_18-10-00_part-expression` (journal line ~96)
- **Detail:** ⚠️ Expressions with invalid runtime references ARE created (result=0, default value=1). Name is taken — can't re-create, must delete and recreate.

### 23. 📖 FIXATION constraint — does NOT lock length

- **Session:** `2026-04-14_10-00-00_constraintRetrain` (journal line ~109)
- **Detail:** ⚠️ FIXATION on a line locks position and direction but NOT length. Solver can shrink/extend a "fixed" line to satisfy other constraints.

### 24. 📖 No conflict detection for constraints

- **Session:** `2026-04-14_10-00-00_constraintRetrain` (journal line ~267)
- **Detail:** 🤫 Conflicting constraints (e.g. HORIZONTAL + VERTICAL on same line) accepted silently. Solver satisfies first constraint and ignores the rest.

### 25. 📖 Inconsistent constraint error behavior

- **Session:** `2026-04-14_10-00-00_constraintRetrain` (journal line ~301)
- **Detail:** ⚠️ Some invalid constraints return null (proper rejection), others get created with an ID but produce solver errors (maxLevel=51).

---

## ⚠️ MEDIUM — Specific API Failures

### 26. ⚠️ Invalid ID types (float, negative, zero) all fail

- **Session:** `2026-03-22_18-30-00_result-types` (journal lines ~166-168)
- **Detail:** ❌ Float ID (4.5), negative ID (-4), zero ID (0) all rejected.

### 27. ⚠️ `part.updateExpression` — array form does not work

- **Session:** `2026-03-25_12-00-00_updateExpression` (journal line ~88)
- **Error:** ❌ error 1001 "Set the parameter 'id' = VOID is not allowed."

### 28. ⚠️ `part.deleteExpression` — array form does not work

- **Session:** `2026-03-25_12-30-00_deleteExpression` (journal line ~91)
- **Error:** ❌ Same VOID error as updateExpression array form.

### 29. ⚠️ `part.renameExpression` — cannot swap names, cannot chain in batch

- **Session:** `2026-03-25_13-00-00_renameExpression` (journal lines ~60, 66, 76, 80)
- **Details:** ❌ Name collision with existing expression. Batch renames all validate against pre-batch state. Array param form fails. Renaming to same name is an error.

### 30. ⚠️ `part.workAxis` — multiple param forms fail

- **Session:** `2026-03-30_12-00-00_workAxis` (journal lines ~62, 87, 90, 105, 121, 220)
- **Details:** ❌ `@expr` refs in position arrays fail. Work axis as curve ref for CURVE type rejected. Same point twice for 2POINTS fails. Parallel planes for 2PLANES fails. Revolve with workAxis fails (topology errors).

### 31. ⚠️ `curve.polyline2d` — bulge array length must match points

- **Session:** `2026-04-07_00-00-00_polyline2d` (journal lines ~74, 104)
- **Error:** ❌ Bulge array must be exactly same length as points array. Non-planar points produce error 1014.

### 32. ⚠️ `sketch.rectangle` — extrusion with `references: [regionId]` fails

- **Session:** `2026-04-08_00-00-00_sketch-rectangle` (journal line ~148)
- **Error:** ❌ `"CCObject can not be opened"` — must pass line IDs directly.

### 33. ⚠️ `sketch.dimension` — `dimPos` only works for ANGLE type

- **Session:** `2026-04-08_12-00-00_dimension` (journal line ~134)
- **Error:** ❌ `dimPos` causes error for OFFSET and HORIZONTAL_DISTANCE dimension types.

### 34. ⚠️ MIDPOINT constraint — fails for free sketch points

- **Session:** `2026-04-14_10-00-00_constraintRetrain` (journal lines ~174, 191)
- **Error:** ❌ Works for line endpoints but solver doesn't converge for free `sketch.point` IDs (Y reaches 27.7 instead of target 0).

### 35. ⚠️ `sketch.moveGeometry` — conflicts with active solver

- **Session:** `2026-04-14_10-00-00_constraintRetrain` (journal line ~280)
- **Error:** ❌ Returns null, maxLevel=51 when move conflicts with constraints.

### 36. ⚠️ `solid.copy` on intersection results fails

- **Session:** `2026-04-14_12-00-00_solidIntersection` (journal entry 03f)
- **Error:** ❌ `solid.copy` on a modified target after intersection returns null (maxLevel=51). Does not hang.

### 68. ⚠️ `common.setDatabaseSettings` — undocumented facetingParamsMode=2

- **Session:** `2026-04-16_09-00-00_getDatabaseSettings` (journal entries 05, 21-23)
- **Error:** Docs only document mode 0 and 1 for facetingParamsMode. Mode 2 is silently accepted (no error, maxLevel=31) but behaves unreliably — produces graphic data only at factory-default chord=0.1, angle=0.
- **Trigger:** `setDatabaseSettings({ facetingParamsMode: 2 })`
- **Workaround:** Use only mode 0 (for mesh data) or mode 1 (for per-entity tessellation).

### 69. ⚠️ `common.getDatabaseSettings` — default mode=1 returns no graphic data

- **Session:** `2026-04-16_09-00-00_getDatabaseSettings` (journal entries 17-22)
- **Error:** The factory default facetingParamsMode=1 means API responses contain no mesh/graphic data. This is not documented as a side effect — the docs only say "specific parameters of each entity will be used" without mentioning that graphic data is suppressed.
- **Trigger:** Creating geometry with default settings and checking `r.graphic`.
- **Workaround:** Set `facetingParamsMode: 0` before creating geometry if you need graphic data.

---

## 🟡 LOW — Degenerate State Warnings

### 37. 🟡 `part.workPlane` — wrong ref types create broken features

- **Session:** `2026-03-27_16-30-00_workPlane` (journal line ~153)
- **Error:** ⚠️ Internal NullMem error. Feature exists but is broken.

### 38. 🟡 `part.updateWorkPlane` — missing refs create broken features

- **Session:** `2026-03-27_17-00-00_updateWorkPlane` (journal line ~49)
- **Error:** ⚠️ Changing type without providing required refs leaves feature broken but existing.

### 39. 🟡 `sketch.deleteSketch` — no cascade delete for dependents

- **Session:** `2026-04-08_16-00-00_deleteSketch` (journal line ~110)
- **Detail:** ⚠️ Dependent features become broken. Solid geometry persists as stale mesh.

### 40. 🟡 `sketch.setWorkPlane` — coordinate origin accumulates

- **Session:** `2026-04-08_14-00-00_setWorkPlane` (journal line ~122)
- **Detail:** 🔍 Origin accumulates across reassignments (unexpected behavior).

### 41. 🟡 `part.updateExpression` — undefined variable refs stored with old value

- **Session:** `2026-03-25_12-00-00_updateExpression` (journal line ~78)
- **Detail:** ⚠️ Formula with undefined variable ref IS stored while old value is kept. Half-applied state.

### 42. 🟡 `part.workAxis` — zero direction vector creates degenerate feature

- **Session:** `2026-03-30_12-00-00_workAxis` (journal line ~56)
- **Detail:** 🤫 Silent success, no error. Feature exists but is degenerate.

### 43. 🟡 `curve.scaleShape` — factor=0 creates degenerate geometry

- **Session:** `2026-04-07_20-00-00_scaleShape` (journal line ~48)
- **Detail:** 🤫 Silent success. Geometry collapsed to a point.

### 44. 🟡 Protocol envelope — missing param produces cascading errors

- **Session:** `2026-03-22_17-25-41_protocol-envelope` (journal line ~175)
- **Detail:** 💣 Missing `expression` param produces 2 error messages including `code: 0` internal error. `api` field missing from both messages.

### 45. 🟡 Destroyed target — inconsistent behavior across operations

- **Session:** `2026-04-14_21-45-00_target-tools-pattern` (journal entry 08)
- **Error:** After intersection destroys target (code 1014), subsequent ops on that ID behave differently: `solid.translation` is a silent no-op (maxLevel=31, no error), `solid.union` returns null/error, `solid.merge` returns the dead target ID with error (misleading — looks like success if you only check result, not maxLevel).
- **Trigger:** Any operation that destroys target (intersection of non-overlapping bodies, subtraction where tool envelops target), followed by further ops on the same ID.
- **Workaround:** Always check `maxLevel` after boolean operations, not just the return value.

### 46. 🟡 `solid.scale` — factor=0 is a silent no-op

- **Session:** `2026-04-15_12-00-00_solid-scale` (journal entries 04, 16, 17)
- **Error:** `scale({ ..., factor: 0 })` returns success (maxLevel=31, result=solidId) but the body is **completely unchanged** — bounding box, vertices, normals all stay the same. Subsequent operations work normally. Not documented anywhere. Very small non-zero factors (0.0001) do actually scale and produce degenerate geometry.
- **Trigger:** `factor: 0` exactly.
- **Workaround:** Avoid factor=0. If you need to check for zero before calling, do it yourself.

### 47. 🟡 `solid.scale` — negative factor flips normals (inside-out solid)

- **Session:** `2026-04-15_12-00-00_solid-scale` (journal entries 05, 16)
- **Error:** Negative scale factors (e.g., -1) succeed but flip all face normals, producing an inside-out solid. Normals reverse direction (e.g., [0,0,-1] → [0,0,1]). Double negation (-1 then -1) restores. Not documented.
- **Trigger:** Any negative `factor` value.
- **Workaround:** Use `solid.mirror` for proper mirroring instead.

### 48. 💀 `solid.offset` — complex boolean topology hangs server

- **Session:** `2026-04-15_09-00-00_solid-offset` (journal entry 13)
- **Error:** ❌ 100% CPU hang. No error, no timeout, no response. Server completely unresponsive.
- **Trigger:** Offsetting a box with 3 cylinder holes (subtraction). The complex topology from multiple booleans causes the offset algorithm to enter an infinite loop.
- **Workaround:** Only use offset on simple-topology solids (primitives, single boolean cut). Always wrap in a timeout.

### 49. 🟡 `solid.offset` — negative distance with extend: FALSE produces degenerate geometry

- **Session:** `2026-04-15_09-00-00_solid-offset` (journal entry 02)
- **Error:** Self-intersecting geometry. Faces protrude beyond corners. No error returned (maxLevel: 31).
- **Trigger:** `distance: -5` with `extend: FALSE` (default) on a box.
- **Workaround:** Always use `extend: TRUE` for negative (inward) offset.

### 50. 🟡 `solid.offset` — excessive negative distance collapses geometry silently

- **Session:** `2026-04-15_09-00-00_solid-offset` (journal entry 08)
- **Error:** Box (60×40×30) with `distance: -20` collapsed into a degenerate flat sheet. No error (maxLevel: 31).
- **Trigger:** `|distance|` exceeds half the smallest dimension.
- **Workaround:** Caller must validate distance against solid dimensions before calling.

### 51. 💀 `solid.slice` — `keepBoth: true` (the default) hangs server

- **Session:** `2026-04-15_09-00-00_solid-slice` (journal entries 01, 03)
- **Error:** ❌ 100% CPU, no response, infinite loop. Tested twice on simple box — both times hung.
- **Trigger:** `slice({ ..., keepBoth: true })` or omitting `keepBoth` (defaults to `true`).
- **Recovery:** `kill -9` required.
- **Workaround:** Always pass `keepBoth: false` explicitly.

### 52. 📖 `solid.slice` — docs say "negative side removed" but positive side is removed

- **Session:** `2026-04-15_09-00-00_solid-slice` (journal entries 07, 08)
- **Error:** Docs state "The part on the negative side of normal vector is removed." Actual behavior: the POSITIVE side (where the normal points) is removed.
- **Trigger:** Any `slice` call. Verified with normals [0,0,1], [0,0,-1], [1,0,1], [0,1,0].
- **Workaround:** Ignore docs — the normal points toward the material to discard.

### 53. 🟡 `solid.slice` — zero normal is a silent no-op

- **Session:** `2026-04-15_09-00-00_solid-slice` (journal entry 19)
- **Error:** `normal: [0,0,0]` accepted without error, does nothing. maxLevel: 31.
- **Trigger:** `slice({ ..., normal: [0,0,0] })`.
- **Workaround:** Validate normal is non-zero before calling.

### 54. 🔥 `solid.deleteSolid` on section entity — deletes the ORIGINAL solid

- **Session:** `2026-04-15_14-06-15_solid-section` (journal entry 18)
- **Error:** `deleteSolid(target: sectionId)` removes the source solid's geometry container, not the section curves. Part's solids array goes from `[59, 62]` to `[62]` — box (59) deleted, section curves (62) survive. The box becomes unusable (subsequent operations return maxLevel: 51).
- **Trigger:** `solid.deleteSolid({ id: eifId, target: sectionId })` where `sectionId` is the CC_CurveEntity ID returned by `solid.section`.
- **Workaround:** Do not use `deleteSolid` on section entities. No known safe way to remove section curves programmatically.

### 55. 🟡 `solid.section` — non-intersecting plane and zero normal produce empty entities silently

- **Session:** `2026-04-15_14-06-15_solid-section` (journal entries 05, 06)
- **Error:** Section call succeeds (returns ID, maxLevel: 31) when the plane doesn't intersect the solid or normal is `[0,0,0]`. The created CC_CurveEntity contains no edges — an orphan entity with no geometry.
- **Trigger:** `section({ ..., originPos: [0,0,50], normal: [0,0,1] })` on a box spanning z=-20 to z=20, or `normal: [0,0,0]`.
- **Workaround:** Validate that the section plane intersects the solid before calling. Check graphic container edges after the call.

### 56. 📖 `solid.fillet` — misleading error messages for multiple failure modes

- **Session:** `2026-04-15_15-06-49_solid-fillet` (journal entries 06, 12, 19)
- **Error:** Negative radius, nonexistent IDs, and radius-too-large all produce the same error: "Set the parameter \"id\" = VOID is not allowed in this situation!" — misleading since the issue is not about the `id` param.
- **Trigger:** `fillet({ ..., radius: -5, ... })` or `fillet({ ..., geomIds: [999999] })` or radius exceeding geometry limits.
- **Workaround:** Validate radius > 0 before calling. Test radius incrementally for geometry-dependent limits.

### 57. ⚠️ `part.getBrepGeometryByIndex` — returns no line edges for extrusion solids

- **Session:** `2026-04-15_15-06-49_solid-fillet` (journal entry 18)
- **Error:** `getBrepGeometryByIndex({ id: eifId, lineIndex: 0 })` returns null/error for an L-shaped extrusion solid despite having visible straight edges. `getGeometryIds` with position-based lookup works.
- **Trigger:** Extrusion solid created via `solid.extrusion` with an advancedPolyline profile.
- **Workaround:** Use `part.getGeometryIds` (position-based) instead of `getBrepGeometryByIndex` for non-primitive solids.

### 58. 🐛 `solid.useSolid` — part ID or solid ID in `from` causes internal server error

- **Session:** `2026-04-15_18-00-00_solid-useSolid` (journal entry 15)
- **Error:** `[Evaluation error in SolidAPI_v1.useSolid::PROC:[Die Funktion OBJ_ErrorMessage hat zwischen 2 und 4 Parameter.]]` — German error message, code 0. Not a clean error.
- **Trigger:** `from: [partId]` or `from: [solidId]` — passing a part ID or raw solid ID instead of a feature ID (entity injection or part-level feature).
- **Workaround:** Only pass feature IDs (entity injection IDs or part-level feature IDs like box, extrusion, etc.) in the `from` array.

### 59. ⚠️ `common.save` — DXF format broken in classcad-cli

- **Session:** `2026-04-15_19-00-00_common-save` (journal entry 07)
- **Error:** `[Evaluation error in GeometryExportManager.StoreGeometryToStream:[CCVM::lcm: Function CADH_GetDxfTemplateFile not found]]` — maxLevel=51, success=0.
- **Trigger:** Any `save({ format: 'DXF' })` call, regardless of geometry type (3D or 2D).
- **Workaround:** None — DXF export is unavailable in CLI worker. May work in full application.

### 60. ⚠️ `common.save` — `stp.header` options ignored in data-string mode

- **Session:** `2026-04-15_19-00-00_common-save` (journal entry 16)
- **Error:** Custom `stp.header.filename.name` and `stp.header.filename.organization` values do not appear in the STEP header. FILE_NAME always uses the part name.
- **Trigger:** `save({ format: 'STP', stp: { header: { filename: { name: 'custom', organization: 'Org' } } } })` with data-string output (no `file` param).
- **Workaround:** None known. May only work with file-based saves.

### 61. ⚠️ `common.save` — `stp.analytic` produces error-level messages despite success

- **Session:** `2026-04-15_19-00-00_common-save` (journal entry 13)
- **Error:** `maxLevel=51` (ERROR) but `success=1` with valid content. Misleading — suggests failure when the operation actually succeeded.
- **Trigger:** `save({ format: 'STP', stp: { analytic: 1 } })`.
- **Workaround:** Check `result.success`, not `maxLevel`, for STP saves with analytic conversion.

### 62. ⚠️ `common.load` — SCG format not loadable despite being saveable

- **Session:** `2026-04-15_20-00-00_common-load` (journal entry 17)
- **Error:** `code=1013`, `"The provided value for parameter \"format\" is not valid. Possible values are: [\"OFB\",\"STP\",\"IWP\"]"`. Load only accepts 3 formats, while save supports 6.
- **Trigger:** `load({ data: scgContent, format: 'SCG' })`.
- **Workaround:** None — SCG is export-only. Use OFB for roundtrip workflows.

### 63. ⚠️ `common.load` — `stp.asPart` produces error-level messages on load

- **Session:** `2026-04-15_20-00-00_common-load` (journal entry 05)
- **Error:** `maxLevel=51`, `"CreateNamedPoint not found"`. Geometry loads fine despite the error.
- **Trigger:** `load({ data: stpContent, format: 'STP', stp: { asPart: 1 } })`.
- **Workaround:** Check `result.id` existence instead of maxLevel to detect real failures.

### 64. 💀 `common.clear` with `keepIds` — STEP/OFB export hangs on partially-cleared state

- **Session:** `2026-04-15_21-00-00_common-clear` (journal entries 04, 11)
- **Error:** ❌ After `clear({ keepIds: [partId] })`, exporting to STEP/OFB (via `common.save` or snapshot's internal save) hangs the server (100% CPU). PNG rendering and `recalc` work fine.
- **Trigger:** `clear({ keepIds: [...] })` followed by any STEP/OFB export before new valid geometry is added.
- **Recovery:** `kill -9` required. After restart, creating new geometry in the kept containers before exporting avoids the hang.
- **Workaround:** Create new valid geometry in kept containers before any STEP/OFB export.

### 65. ⚠️ `common.load` — IWP roundtrip produces no renderable solid

- **Session:** `2026-04-15_23-00-00_format-comparison` (journal entry 05)
- **Error:** IWP load succeeds (maxLevel=31, returns valid id), but loaded model has no renderable solid geometry. Snapshot after load produces no solid PNG.
- **Trigger:** Save as IWP binary + base64, clear, load back with same encoding.
- **Workaround:** Use STP instead of IWP for geometry interchange.

### 66. ⚠️ `part.updateExpression` — expression update may not propagate after OFB roundtrip

- **Session:** `2026-04-15_23-00-00_format-comparison` (journal entry 09)
- **Error:** After OFB save/load roundtrip of a parametric part (box with `@expr.L`), updating expression L from 100 to 120 + recalc() did not change the expression's reported value. `getExpression` still returned 100.
- **Trigger:** `part.box` with `@expr.` bindings → save OFB → load OFB → `updateExpression` → `recalc` → `getExpression`.
- **Workaround:** Not yet determined. May require openFeature/closeFeature or other recalc trigger.

### 67. 💀 `common.requestVisualisation` — negative ID hangs server

- **Session:** `2026-04-16_10-00-00_common-requestVisualisation` (journal entry 05)
- **Error:** ❌ 100% CPU, no response, infinite loop. Same pattern as other negative-ID / self-reference hangs.
- **Trigger:** `requestVisualisation({ ids: [-1] })` — any negative ID value.
- **Recovery:** `kill -9` required.
- **Workaround:** Validate all IDs are positive before calling.

### 68. ⚠️ `common.setDatabaseSettings` — facetingParamsMode has no effect on graphic data

- **Session:** `2026-04-16_09-00-00_setDatabaseSettings` (journal entries 03, 14)
- **Error:** API docs say mode=0 uses "default parameters" and mode=1 uses "entity-specific parameters" for tessellation. In practice, both modes return identical mesh data (same vertex counts, same container structure). Mode does not control graphic data presence.
- **Trigger:** Create solid with mode=1 vs mode=0, compare r.graphic — identical.
- **Workaround:** None needed — graphic data is always available regardless of mode.

### 69. ⚠️ `common.setDatabaseSettings` — invalid facetingParamsMode values accepted silently

- **Session:** `2026-04-16_09-00-00_setDatabaseSettings` (journal entry 11)
- **Error:** Mode values 3 and -1 are accepted without error (maxLevel=31) and stored. Only modes 0 and 1 are documented.
- **Trigger:** `setDatabaseSettings({ facetingParamsMode: 3 })` or `{ facetingParamsMode: -1 }`.
- **Workaround:** Only use mode 0 or 1.

### 70. ⚠️ `common.setDatabaseSettings` — zero chordHeightTol leaks internal C++ path

- **Session:** `2026-04-16_09-00-00_setDatabaseSettings` (journal entry 16)
- **Error:** Setting `chordHeightTol: 0` returns maxLevel=51 with error message containing internal C++ file path (`/Users/daniel/awv/classcad/runtime/Source/BaseSystemSTL/c/CADH_Service.cpp, Line: 2762`).
- **Trigger:** `setDatabaseSettings({ chordHeightTol: 0 })`.
- **Workaround:** Don't set zero chord. Use small positive values (0.01+).

### 71. ⚠️ `common.setFacetingParameters` — docs say params are optional, but both are mandatory

- **Session:** `2026-04-16_11-00-00_getFacetingParameters` (journal entries 03, 14)
- **Error:** Omitting either `angleTol` or `chordHeightTol` triggers internal NullMem error (maxLevel=51). Error message: "A variable of the type NullMem (nicht initialisiertes Member) has been defined as type Gleitkommazahl addressed." with internal C++ path.
- **Trigger:** `setFacetingParameters({ angleTol: 25 })` or `setFacetingParameters({ chordHeightTol: 0.1 })` (only one param).
- **Workaround:** Always pass both params. Read current values with `getFacetingParameters` first if you only want to change one.

### 72. ⚠️ `common.setFacetingParameters` vs `setDatabaseSettings` — inconsistent zero chordHeightTol validation

- **Session:** `2026-04-16_11-00-00_getFacetingParameters` (journal entry 15)
- **Error:** `setFacetingParameters({ angleTol: 10, chordHeightTol: 0 })` succeeds (maxLevel=31), but `setDatabaseSettings({ chordHeightTol: 0 })` fails (maxLevel=51). Same backing store, different validation.
- **Trigger:** Setting chordHeightTol to 0 via the two different APIs.
- **Workaround:** Avoid setting chordHeightTol to 0 for consistency.

### 73. ⚠️ `common.setFacetingParameters` — angleTol values in (0, 1) rejected without clear error

- **Session:** `2026-04-16_11-00-00_getFacetingParameters` (journal entry 18)
- **Error:** angleTol values like 0.1, 0.5, 0.9 are rejected (maxLevel=51) but the error message is generic, not explaining the minimum threshold.
- **Trigger:** `setFacetingParameters({ angleTol: 0.5, chordHeightTol: 0.1 })`.
- **Workaround:** Use angleTol=0 (disabled) or angleTol >= 1.0.

### 74. ⚠️ `common.transformObjectWithMatrix` — shear matrices silently auto-corrected

- **Session:** `2026-04-17_12-46-30_transformObjectWithMatrix` (journal entry 08)
- **Error:** Non-orthogonal (shear) matrix reports ERROR level 51: "Transformationmatrix of this object has been set to be uniformed scaled and orthogonal" — but geometry DOES change to the corrected (orthogonalized) matrix.
- **Trigger:** Any matrix with non-perpendicular columns (e.g., `[[1,0.5,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]`).
- **Workaround:** Only use orthogonal matrices. Check `maxLevel` after call.

### 75. ⚠️ `common.transformObjectWithMatrix` — `isGlobal: FALSE` has no effect on standalone objects

- **Session:** `2026-04-17_12-46-30_transformObjectWithMatrix` (journal entries 06, 15, 16)
- **Error:** `isGlobal: FALSE` produces identical results to `isGlobal: TRUE` on solid bodies, EIFs, and features — even after explicitly setting OCS via `setObjectCoordSystem`.
- **Trigger:** Using `isGlobal: false` on any non-assembly object.
- **Workaround:** Ignore `isGlobal` for standalone objects. May only work in assembly context.

### 76. 💀 `common.setUserData` — negative ID hangs server

- **Session:** `2026-04-17_12-00-00_setUserData` (journal entry 07)
- **Error:** ❌ 100% CPU hang, no response. `kill -9` required.
- **Trigger:** `setUserData({ id: -1, key: 'test', value: 'val' })`
- **Recovery:** `kill -9` and restart worker.

### 77. ⚠️ `common.setUserData` — overwrite is a silent no-op

- **Session:** `2026-04-17_12-00-00_setUserData` (journal entries 02, 05)
- **Error:** Calling `setUserData` on a key that already exists does nothing — returns `maxLevel: 31` (success) but value is unchanged. No error or warning.
- **Trigger:** `setUserData` with a key that was already set.
- **Workaround:** `removeUserData` first, then `setUserData`.

### 78. ⚠️ `common.setUserData` — user data not persisted in OFB save/load

- **Session:** `2026-04-17_12-00-00_setUserData` (journal entry 08)
- **Error:** All user data is lost after save → clear → load cycle. Not documented.
- **Trigger:** Any save/load cycle.
- **Workaround:** Re-set user data after loading.

### 79. ⚠️ `part.box` — zero/negative dimensions create degenerate feature

- **Session:** `2026-04-17_09-00-00_partBox` (journal entry 10)
- **Error:** `part.box` with length=0, height=-30, or all-zero dimensions returns a feature ID (not null) with maxLevel 51 (ERROR), code 1122. The feature exists in the tree but has no valid geometry — a degenerate/broken feature node.
- **Trigger:** Any dimension <= 0.
- **Workaround:** Always validate dimensions > 0 before calling.

### 80. ⚠️ `part.updateBox` on wrong feature type — silent success

- **Session:** `2026-04-17_00-00-00_updateBox` (journal entry 13, 15)
- **Error:** Calling `updateBox` on a cylinder feature does NOT error. Returns feature ID with maxLevel 31 (success). Shared param names (`height`, `name`, `references`) actually apply to the cylinder. Box-specific params (`length`, `width`) are silently ignored. The cylinder's height was visually confirmed to change.
- **Trigger:** `updateBox({ id: cylinderFeatureId, height: 200 })` on a cylinder feature.
- **Workaround:** Always use the matching update method (`updateCylinder` for cylinders, etc.).

### 81. ⚠️ `part.extrusion` — `capEnds` rejects string booleans

- **Session:** `2026-04-17_14-00-00_partExtrusion` (journal entry 05)
- **Error:** `capEnds: 'TRUE'` or `capEnds: 'FALSE'` returns maxLevel=51: "The parameter 'capEnds' has the wrong type! It should be of type (boolean)". Other APIs may have the same issue with string-encoded booleans.
- **Trigger:** Passing string `'TRUE'`/`'FALSE'` instead of integer `1`/`0`.
- **Workaround:** Always use integer booleans (1 or 0) for ClassCAD boolean parameters.

### 82. ⚠️ `part.extrusion` — missing `planeId` on sketch produces internal error

- **Session:** `2026-04-17_14-00-00_partExtrusion` (journal entry 01)
- **Error:** Extrusion from a sketch created without `planeId` returns maxLevel=51 with internal error: `Sketch.GetNormal:CCObject can not be opened` (leaks internal C++ path). Geometry IS still created despite the error.
- **Trigger:** `sketch.create({ id: partId })` (no planeId) → `part.extrusion({ references: [regionId] })`.
- **Workaround:** Always pass `planeId` to `sketch.create`.

### 83. 🕳️ `part.extrusion` — empty `references: []` creates broken feature silently

- **Session:** `2026-04-17_14-00-00_partExtrusion` (journal entry 12)
- **Error:** Returns a feature ID (not null) with maxLevel=51: "Nothing was selected". A degenerate feature node exists in the tree but has no geometry.
- **Trigger:** `extrusion({ id: partId, references: [], limit2: 40 })`.
- **Workaround:** Validate references array is non-empty before calling.

### 84. ⚠️ `part.revolve` — cross-part revolve fails with misleading error

- **Session:** `2026-04-17_08-00-00_revolve` (journal entries 16-17)
- **Error:** Creating revolve features in two different parts within the same drawing session fails. Second `part.revolve` returns null, maxLevel=51, error 1004: `"id" must be provided to create CC_Revolve"`. The id IS provided — error message is misleading.
- **Trigger:** Create part A → revolve in A → create part B → revolve in B.
- **Workaround:** Multiple revolves in the same part work fine. For cross-part revolves, clear the drawing between parts.

### 85. ⚠️ `part.revolve` — `inverted` rejects JS boolean and string boolean

- **Session:** `2026-04-17_08-00-00_revolve` (journal entries 05-06)
- **Error:** `inverted: true` (JS boolean) and `inverted: 'TRUE'` (string) both fail with error 1004: `"id" must be provided to create CC_Revolve"`. Same misleading error as cross-part bug.
- **Trigger:** Using anything other than integer 1/0 for `inverted` parameter.
- **Workaround:** Use `inverted: 1` or `inverted: 0`.

### 86. ⚠️ `part.revolve` — profile crossing axis creates degenerate feature

- **Session:** `2026-04-17_08-00-00_revolve` (journal entry 14)
- **Error:** Profile extending across the revolve axis returns a feature ID (94) but maxLevel=51: "The brep elements of at least one face are not well defined. Brep reference attribute is missing."
- **Trigger:** Rectangle from [-10,0,0] to [40,30,0] revolved around YAxis (axis at x=0).
- **Workaround:** Keep the profile entirely on one side of the revolve axis.

### 87. 📖 `part.updateRevolve` — @expr. binding does not create live link

- **Session:** `2026-04-18_08-00-00_updateRevolve` (journal entries 14-15)
- **Error:** Using `@expr.ANG` in `updateRevolve({ endAngle: '@expr.ANG' })` bakes the current value at update time. Subsequent `updateExpression` changes the expression value but does NOT recalc the revolve geometry. In contrast, using `@expr.ANG` at creation time in `revolve({ endAngle: '@expr.ANG' })` DOES create a live link that auto-recalcs.
- **Trigger:** Set @expr. binding via updateRevolve (not at creation time), then change expression value.
- **Workaround:** Use `linkWithExpression` for live binding after creation, or set @expr. at creation time.

### 88. 📖 `part.updateBoolean` — misleading error when new tool created after boolean

- **Session:** `2026-04-18_00-00-00_updateBoolean` (journal entry 15)
- **Error:** Swapping tools to a feature created AFTER the boolean returns error code 1014: "Entity \"Slot\" is not available. It has already been consumed/used in another operation." The real issue is `openFeature` rolls back the design tree, so the feature doesn't exist yet — not "consumed."
- **Trigger:** Create feature B after boolean A, then `openFeature(A)` → `updateBoolean({ tools: [B] })`.
- **Workaround:** Create replacement tools/targets BEFORE the boolean in the design tree.

### 89. 📖 `part.slice` — `reference` parameter marked optional but is required

- **Session:** `2026-04-18_00-00-00_partSlice` (journal entry 11)
- **Error:** Omitting the `reference` parameter returns error code 1004: "The parameter \"reference\" must be provided in the api call!" despite the API docs marking it as optional with `(default=xy)`.
- **Trigger:** Call `part.slice` without `reference`.
- **Workaround:** Always provide a work plane ID for `reference`.

### 90. ⚠️ `part.sliceBySheet` — Top (XY) plane sheet produces CC_Sheet instead of CC_Solid

- **Session:** `2026-04-20_00-00-00_sliceBySheet` (journal entries 02–08)
- **Error:** When the sheet tool is created by extruding from the Top (XY) plane, sliceBySheet produces a CC_Sheet body instead of a CC_Solid. The solid target is consumed but the result is an unusable sheet. Boolean operations on the result fail: "The body used for Union (CC_Union) is a Sheet, please select a solid."
- **Trigger:** Create sheet via `part.extrusion` with `capEnds: 0` on the Top (XY) plane, then use it in `sliceBySheet`.
- **Workaround:** Create the sheet from the Front (XZ) or Right (YZ) plane instead.

### 91. ⚠️ `part.sliceBySheet` — `inverted` rejects JS boolean and string boolean

- **Session:** `2026-04-20_00-00-00_sliceBySheet` (journal entries 09–11)
- **Error:** Passing `inverted: true` or `inverted: 'TRUE'` fails with misleading error: `"\"id\" must be provided to create CC_SliceBySheet"` (code 1004). Only integer 0/1 works.
- **Trigger:** `sliceBySheet({ ..., inverted: true })` or `inverted: 'TRUE'`.
- **Workaround:** Use `inverted: 0` or `inverted: 1`.

### 92. 📖 `part.entityDeletion` — renderer shows stale geometry after deletion

- **Session:** `2026-04-20_00-00-00_entityDeletion` (journal entries 04, 06)
- **Error:** PNG snapshots taken after entityDeletion (targeting a pattern with plain ID or `{ id }`) still show the deleted bodies. STEP export correctly shows 0 bodies.
- **Trigger:** `entityDeletion({ targets: [patternId] })` or `{ id: patternId }` without indices, followed by `snapshot()`.
- **Workaround:** Use STEP body count (`MANIFOLD_SOLID_BREP` count) as ground truth instead of PNG snapshots.

### 93. ⚠️ `part.chamfer` — pre-recalc edge IDs fail for TWO_DISTANCES and DISTANCE_ANGLE

- **Session:** `2026-04-20_10-06-51_chamfer` (journal entries 03–08)
- **Error:** Edge IDs returned by `getGeometryIds` before `recalc()` (e.g., ID 75) work for EQUAL_DISTANCE chamfer but fail for TWO_DISTANCES and DISTANCE_ANGLE with: `"An element of parameter 'references' has an invalid id!"` (code 1006, maxLevel=51). After `recalc()`, the same position returns a different ID (e.g., 106) that works for all types.
- **Trigger:** Create `part.box`, call `getGeometryIds` without `recalc()` first, then use those edge IDs for a non-default chamfer type.
- **Workaround:** Always call `recalc()` before `getGeometryIds` when chamfering.

### 94. ⚠️ `part.chamfer` — oversized distance creates degenerate feature

- **Session:** `2026-04-20_10-06-51_chamfer` (journal entry 12)
- **Error:** When `distance1` exceeds what adjacent faces can accommodate, the chamfer feature is still created (non-null result) but with maxLevel=51 and error `"Chamfer could not be applied to all edges."` The feature is in a broken state.
- **Trigger:** `chamfer({ ..., distance1: 50 })` on an 80x60x40 box (distance exceeds 40mm face height).
- **Workaround:** Check `maxLevel >= 51` after chamfer creation to detect degenerate features.

### 95. ⚠️ `part.mirror` — docs say "planes or faces" but brep faces are rejected

- **Session:** `2026-04-20_15-00-00_mirror` (journal entry 04)
- **Error:** Passing a brep face ID (from `getGeometryIds`) as a mirror reference fails with code 1006: "An element of parameter 'references' has an invalid id!" preceded by warning "ToId()/TOID() didn't get an existing or valid id."
- **Trigger:** `mirror({ ..., references: [brepFaceId] })` where `brepFaceId` comes from `getGeometryIds.planes`.
- **Workaround:** Use work plane IDs only (`getWorkGeometry` or `workPlane`).

### 96. ⚠️ `part.mirror` — empty references creates degenerate feature

- **Session:** `2026-04-20_15-00-00_mirror` (journal entry 11)
- **Error:** Passing `references: []` returns a non-null feature ID (97) but with maxLevel=51 and error 1111: "There is no reference found for Mirror (CC_Mirror)." The feature exists in the tree but has no geometry.
- **Trigger:** `mirror({ id: partId, targets: [boxId], references: [] })`
- **Workaround:** Always provide at least one valid work plane ID in references.

### 97. ⚠️ `part.linearPattern` — count=0 produces misleading error

- **Session:** `2026-04-20_17-00-00_linearPattern` (journal entry 02)
- **Error:** Passing `count: 0` in dir1 fails with code 1004: "id must be provided to create CC_LinearPattern" — the `id` param IS provided; the real issue is count=0 being invalid.
- **Trigger:** `linearPattern({ id: partId, targets: [boxId], dir1: { references: [waId], distance: 40, count: 0 } })`
- **Workaround:** Use count ≥ 1.

### 101. ⚠️ `part.circularPattern` — `merged: 1` always fails with boolean error 1001

- **Session:** `2026-04-20_18-00-00_circularPattern` (journal entry 04)
- **Error:** "Boolean operation failed with error 1001" — MergeBodies step fails. Feature is created (returns ID) but bodies remain separate.
- **Trigger:** `circularPattern({ ..., merged: 1 })` — fails with both overlapping and non-overlapping geometries.
- **Workaround:** Use `merged: 0` and then `part.boolean` with `type: 'UNION'` on the resulting bodies.

### 102. 📖 `part.transformationByCSys` — empty targets gives confusing error

- **Session:** `2026-04-20_24-00-00_transformationByCSys` (journal entry 13)
- **Error:** Code 1004: "The type '0' is not supported in PrepareAPIParams!" — unclear message for an empty targets array.
- **Trigger:** `transformationByCSys({ ..., targets: [] })` — empty array.
- **Workaround:** Always pass at least one target.

### 103. ⚠️ `part.importFeature` — invalid data/format silently creates empty import

- **Session:** `2026-04-20_25-00-00_importFeature` (journal entries 08, 09)
- **Error:** No error. maxLevel=31, valid feature ID returned. But CC_Import has no children and no solids.
- **Trigger:** `importFeature({ ..., data: 'garbage', format: 'STP' })` or `importFeature({ ..., data: 'test', format: 'INVALID' })`.
- **Workaround:** Always verify `part.solids` in the structure tree after import to confirm geometry was created.

### 104. 🕳️ `part.updateImportFeature` — garbage data silently destroys existing geometry

- **Session:** `2026-04-20_26-00-00_updateImportFeature` (journal entry 11)
- **Error:** 🤫 Passing invalid STP data returns success (maxLevel=31, valid feature ID) but replaces existing geometry with nothing — 0 child solids. More destructive than `importFeature` because valid geometry is lost.
- **Trigger:** `updateImportFeature({ id: importId, data: 'garbage', format: 'STP' })` with `openFeature`/`closeFeature`.
- **Workaround:** Always validate STP data before calling `updateImportFeature`. Check solid count in structure tree after update.

### 105. 📖 `part.updateImportFeature` — data source mandatory despite docs saying optional

- **Session:** `2026-04-20_26-00-00_updateImportFeature` (journal entry 02)
- **Error:** Docs say "If optional parameters are not set, the feature will keep the existing values." but omitting all data sources (`data`, `file`, `url`) errors with code 1004. Cannot rename without also providing data.
- **Trigger:** `updateImportFeature({ id: importId, name: 'NewName' })` (name only, no data source).
- **Workaround:** Always provide a data source. To rename, pass the same data back alongside the new name.

### 106. 🟡 `part.updateImportFeature` — name-only update is partial-success bug

- **Session:** `2026-04-20_26-00-00_updateImportFeature` (journal entry 10)
- **Error:** Name-only update (no data source) returns null, maxLevel=51 (error), but the name change IS applied. Geometry survives unchanged. Partial success with error return is misleading.
- **Trigger:** `updateImportFeature({ id: importId, name: 'OnlyName' })` with `openFeature` but no data source.
- **Workaround:** Don't rely on this behavior — always provide data alongside name changes.

### 107. 📖 `part.getFeature` — does not find sketches or work geometry

- **Session:** `2026-04-21_02-00-00_getFeature` (journal entries 08, 09)
- **Error:** Despite the generic name "getFeature", this API only searches the OperationSequence. Sketches, work geometry (planes/axes/points), and built-in origin features are all invisible to it.
- **Trigger:** `getFeature({ id: partId, name: 'Sketch' })` or any work geometry name.
- **Workaround:** Use `part.getSketch` for sketches, `part.getWorkGeometry` for work geometry.

### 108. 📖 `part.updateBox` — name parameter does not update feature lookup name

- **Session:** `2026-04-21_02-00-00_getFeature` (journal entries 12, 13)
- **Error:** `updateBox({ id: boxId, name: 'NewName' })` returns maxLevel 51 (error). The feature's lookup name does not change. Only `common.setObjectName` can rename a feature for `getFeature` lookup.
- **Trigger:** `updateBox({ id, name: 'X' })`.
- **Workaround:** Use `common.setObjectName({ id, name: 'X' })` instead.

### 109. ⚠️ `part.deleteFeature` — deleting rolled-back features produces errors but still deletes

- **Session:** `2026-04-21_03-00-00_deleteFeature` (journal entries 08, 11)
- **Error:** Deleting a feature that is behind the rollback bar returns maxLevel=51 with internal errors ("Index N ausserhalb des Arraybereichs", "objId not found"), BUT the feature is permanently removed from the tree. Errors are misleading — they suggest failure but deletion takes effect.
- **Trigger:** `operationMoveBefore` to roll back, then `deleteFeature` on the rolled-back feature ID.
- **Workaround:** Always `operationMoveToEnd` before calling `deleteFeature`.

### 110. ⚠️ `part.deleteFeature` — deleting during openFeature corrupts editing context

- **Session:** `2026-04-21_03-00-00_deleteFeature` (journal entries 10, 12)
- **Error:** Calling `deleteFeature` while inside an `openFeature`/`closeFeature` editing session (even on an unrelated feature) corrupts the editing context. `closeFeature` subsequently fails with error 1001 ("wrong id type").
- **Trigger:** `openFeature(boxId)` → `deleteFeature({ ids: [cylId] })` → `closeFeature(partId)` fails.
- **Workaround:** Never call `deleteFeature` while inside an editing session. Close first, then delete.

### 111. 🟡 `part.deleteFeature` — built-in origin geometry is deletable

- **Session:** `2026-04-21_03-00-00_deleteFeature` (journal entry 14)
- **Error:** Built-in origin work geometry (Top, Front, Right planes; X/Y/Z axes) can be deleted with maxLevel=31 (clean success). No protection or warning. This could break any features referencing origin planes.
- **Trigger:** `getWorkGeometry({ id: partId, name: 'Top' })` → `deleteFeature({ ids: [topPlaneId] })`.
- **Workaround:** Never pass built-in origin IDs to deleteFeature. Filter them out before batch deletes.

### 112. 📖 `part.createUncommitedObject` — CC_Boolean is not a valid class name

- **Session:** `2026-04-21_00-00-00_createUncommitedObject` (journal entry 06)
- **Error:** `CC_Boolean` fails with "non-existent class." The docs use `part.boolean` for the API, but the internal class names are `CC_Union`, `CC_Subtraction`, `CC_Intersection` (per boolean type), or `CC_BooleanOperation` (generic).
- **Trigger:** `createUncommitedObject({ type: 'CC_Boolean' })`.
- **Workaround:** Use type-specific class names: CC_Union, CC_Subtraction, CC_Intersection.

### 113. 📖 `part.createUncommitedObject` — CC_ImportFeature is not a valid class name

- **Session:** `2026-04-21_00-00-00_createUncommitedObject` (journal entry 05)
- **Error:** `CC_ImportFeature` fails with "non-existent class." The API is `part.importFeature` but the internal class is `CC_Import`.
- **Trigger:** `createUncommitedObject({ type: 'CC_ImportFeature' })`.
- **Workaround:** Use `CC_Import` as the type string.

### 114. ⚠️ `part.calculateMassProperties` — NullMem crash on empty part

- **Session:** `2026-04-21_15-00-00_part-calculateMassProperties` (journal entry 07)
- **Error:** Internal NullMem error: `"Type error: A variable of the type NullMem..."`. No graceful zero-volume return.
- **Trigger:** `calculateMassProperties({ id: partId })` on a part with no solid geometry.
- **Workaround:** Ensure part contains at least one solid before calling.

### 115. ⚠️ `part.calculateMassProperties` — NullMem crash on degenerate cone (tDiameter=0)

- **Session:** `2026-04-21_15-00-00_part-calculateMassProperties` (journal entries 04, 05)
- **Error:** Same NullMem internal error. Also triggers with very small tDiameter (0.001).
- **Trigger:** `part.cone({ ..., tDiameter: 0 })` followed by `calculateMassProperties`.
- **Workaround:** Use `tDiameter >= 1` for cones that will be measured.

### 116. 📖 `part.getGeometryIds` — `circles` lookup fails at seam vertex

- **Session:** `2026-04-21_16-00-00_part-getGeometryIds` (journal entries 04, 06, 13)
- **Error:** Querying `circles: [{pos: [+radius, 0, Z]}]` returns `{circles: [[]]}` maxLevel 51. The position is the brep seam vertex, not a point on the arc.
- **Trigger:** Any cylinder, cone, or sphere — their seam line is always in the +X direction, seam vertex at [+radius, 0, Z].
- **Workaround:** Use center of circle, or any other rim point (e.g., [-radius, 0, Z], [0, radius, Z]).

### 117. 📖 `part.getGeometryIds` — `arcs` param cannot find circular edges on cylinders/cones

- **Session:** `2026-04-21_16-00-00_part-getGeometryIds` (journal entries 11, 13)
- **Error:** `arcs: [{pos: [-20,0,0]}]` fails despite the edge being classified as an arc in the brep (via `getBrepGeometryByIndex`). Must use `circles` param instead.
- **Trigger:** Any circular edge on cylinder, cone, or sphere.
- **Workaround:** Use `circles` param for circular/near-360° edges. Use `arcs` only for non-circular arcs (fillet arcs, partial arcs).

### 119. 🕳️ `assembly.deleteTemplate` — assembly root ID is a silent no-op

- **Session:** `2026-04-22_18-07-00_assembly-deleteTemplate` (journal entry 04)
- **Error:** 🤫 Passing the assembly root ID returns maxLevel 31 (success), no messages, but nothing is deleted. The ID is type-valid (CC_AssemblyRoot) but it's not a template in any container.
- **Trigger:** `deleteTemplate({ ids: [asmId] })`
- **Workaround:** Only pass IDs from `getPartTemplate` / `getAssemblyTemplate`.

### 120. ⚠️ `assembly.deleteTemplate` — stale currentProduct after deleting active template

- **Session:** `2026-04-22_18-07-00_assembly-deleteTemplate` (journal entry 06)
- **Error:** Deleting the template that is `currentProduct` succeeds (maxLevel 31) but leaves `structure.currentProduct` pointing to the now-deleted ID. Subsequent operations in template context may behave unpredictably.
- **Trigger:** `deleteTemplate({ ids: [tplId] })` while `currentProduct === tplId`
- **Workaround:** Always call `setCurrentProduct({ id: asmId })` before or immediately after deleting a template.

### 118. 📖 `part.getBrepGeometryIndex` — docs say part ID accepted but it fails

- **Session:** `2026-04-21_19-00-00_part-getBrepGeometryIndex` (journal entry 04)
- **Error:** Docs say `id` is "id of a solid or a feature containing a solid" but passing a part ID returns "Not a brep!" (maxLevel 51). Only feature IDs work.
- **Trigger:** `getBrepGeometryIndex({ id: partId, geomId: edgeId })`
- **Workaround:** Always pass a feature ID (e.g., from `part.box`), not a part ID.
