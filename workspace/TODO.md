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
