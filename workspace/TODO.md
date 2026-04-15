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
