# 📋 Training TODO — Known Issues & Anomalies

Collected from all training journals. Ordered by severity. Each entry has a `[ ]` checkbox.

**Before touching any entry, read [TODO-HOW-TO.md](TODO-HOW-TO.md).** That file is the runbook — reproduction, fix workflow, test invocation, commit conventions, anti-patterns. One TODO per session. Don't batch. Don't push.

When done, mark the entry `[✅]` and append a sub-bullet with the classcad/cclasses branch + short SHA.

---

## 💀 CRITICAL — Server Hangs (require kill -9)

### 1. [✅] 💀 `curve.circle` — radius <= 0 hangs server

- **Session:** `2026-03-31_00-00-00_curve-circle` (journal line ~108)
- **Error:** ❌ No error returned. WebSocket call never resolves. 100% CPU infinite loop.
- **Trigger:** `radius: 0` or negative radius.
- **Recovery:** `kill -9` only.
- **Fixed:** branch `fix/curve-circle-zero-radius-hang` in three repos.
  - classcad/runtime `3c5db6448` — root cause: `CurveBuilder::CreateEllipse` discarded `IwStatus` from SMLib and propagated an uninitialised pointer downstream. Closes the hang at the source for every entry point into that function (`SolidHelper` ellipse paths, `DxfService` import of degenerate ellipses).
  - classcad/cclasses `2b5dd88c` — user-facing error for `v1.curve.circle({ radius <= 0 })`.
  - classcad/cclasses `d2f21984` — same guard swept to the sibling APIs that route through `CADH_CreateEllipticArc`: `v1.curve.arcByCenterRadAngle`, `v1.curve.ellipticArc`, `v1.curve.ellipse`. Without the cclass sweep these returned silent no-ops on the runtime fix; with it they return the same code-1014 error as `circle`.
  - classcad/cclasses `b3257fdb` — separate but related: `v1.curve.advancedPolyline({ pld: [..., { r: -5 }, ...] })` was silently producing corrupted geometry. Added a `pld[i].r < 0` guard returning code 1014; `r = 0` still works (sharp corner).
  - cc/knowledge/classcad-skill `6d6f54b` + `b21482a` — refreshed the five affected API docs: removed stale "hangs the server" / "r=0 crashes" claims for the cases this branch fixed, added the new code-1014 error rows. Kept warnings for unrelated unfixed hangs (negative angles, parallel xAxis/normal).
  - See `workspace/training/2026-05-13_11-30-00_fix-curve-circle-zero-radius/`.

### 2. [✅] 💀 `curve.interpolationCurve` — duplicate points hang server

- **Session:** `2026-04-07_00-00-00_interpolationCurve` (journal line ~121)
- **Error:** ❌ 100% CPU hang. Even 2 consecutive duplicate points among 4 total triggers it.
- **Note:** Stricter than bezierCurve which tolerates duplicates. Empty array `[]` also expected to hang.
- **Fixed:** branch `fix/curve-interpolationCurve-duplicate-points-hang` in three repos.
  - classcad/runtime `a2e63b342` — root cause: `CurveBuilder::CreateInterpolationCurve` discarded `IwStatus` from SMLib and handed unvalidated points to the `IW_IT_CHORDLENGTH` parameterization (zero chord → division by zero → NLIB infinite loop). Added `n >= 2` check, consecutive-distance check (`IW_EFF_ZERO`), and `IwStatus`/null guard before `pCurve->ReparametrizeWithArcLength()`.
  - classcad/cclasses `1bf02126` — user-facing errors (code 1014): `"...must contain at least 2 points."` and `"...must not contain consecutive duplicate points."` + `testInterpolationCurveInvalidPoints` regression test.
  - cc/knowledge/classcad-skill `6f6e3ba` — refreshed `interpolationCurve.md` (stale hang warnings → error rows). Empty-array case (previously speculative) is now confirmed and documented.
  - See `workspace/training/2026-05-27_09-08-00_fix-interpolationCurve-duplicates/`. TODO-HOW-TO.md also gained cclass-language gotchas (= vs ==, no high-byte chars, FORALL flag pattern) discovered while writing the guard.

### 3. [ ] 💀 2D booleans — same ID as target and tool hangs server

- **Session:** `2026-04-07_22-00-00_2d-booleans` (journal line ~139)
- **Error:** ❌ Infinite loop. Same pattern as solid boolean self-reference.
- **Recovery:** `kill -9`.

### 4. [ ] 💀 `solid.union` — same solid as target and tool hangs server

- **Session:** `2026-04-14_10-00-00_solidUnion` (documented in LLM doc `references/solid/union.md`)
- **Error:** ❌ 100% CPU, no response, infinite loop. No timeout or error.
- **Applies to:** All solid booleans (union, subtraction, intersection).

### 5. [ ] 💀 `solid.subtraction` — operating on consumed solid IDs hangs server

- **Session:** Documented in LLM doc `references/solid/subtraction.md`
- **Error:** ❌ Referencing a consumed (keepTools=false) tool solid ID in any subsequent solid operation hangs the server.

### 45. [ ] 💀 `solid.merge` — same solid as target and tool hangs server

- **Session:** `2026-04-14_21-30-00_solid-merge` (journal script 10)
- **Error:** ❌ 100% CPU, no response, infinite loop. Same behavior as self-union.
- **Trigger:** `merge({ id, target: X, tools: [X] })`
- **Recovery:** `kill -9` required.

### 48. [ ] 💀 `solid.offset` — complex boolean topology hangs server

- **Session:** `2026-04-15_09-00-00_solid-offset` (journal entry 13)
- **Error:** ❌ 100% CPU hang. No error, no timeout, no response. Server completely unresponsive.
- **Trigger:** Offsetting a box with 3 cylinder holes (subtraction). The complex topology from multiple booleans causes the offset algorithm to enter an infinite loop.
- **Workaround:** Only use offset on simple-topology solids (primitives, single boolean cut). Always wrap in a timeout.

### 51. [ ] 💀 `solid.slice` — `keepBoth: true` (the default) hangs server

- **Session:** `2026-04-15_09-00-00_solid-slice` (journal entries 01, 03)
- **Error:** ❌ 100% CPU, no response, infinite loop. Tested twice on simple box — both times hung.
- **Trigger:** `slice({ ..., keepBoth: true })` or omitting `keepBoth` (defaults to `true`).
- **Recovery:** `kill -9` required.
- **Workaround:** Always pass `keepBoth: false` explicitly.

### 64. [ ] 💀 `common.clear` with `keepIds` — STEP/OFB export hangs on partially-cleared state

- **Session:** `2026-04-15_21-00-00_common-clear` (journal entries 04, 11)
- **Error:** ❌ After `clear({ keepIds: [partId] })`, exporting to STEP/OFB (via `common.save` or snapshot's internal save) hangs the server (100% CPU). PNG rendering and `recalc` work fine.
- **Trigger:** `clear({ keepIds: [...] })` followed by any STEP/OFB export before new valid geometry is added.
- **Recovery:** `kill -9` required. After restart, creating new geometry in the kept containers before exporting avoids the hang.
- **Workaround:** Create new valid geometry in kept containers before any STEP/OFB export.

### 67. [ ] 💀 `common.requestVisualisation` — negative ID hangs server

- **Session:** `2026-04-16_10-00-00_common-requestVisualisation` (journal entry 05)
- **Error:** ❌ 100% CPU, no response, infinite loop. Same pattern as other negative-ID / self-reference hangs.
- **Trigger:** `requestVisualisation({ ids: [-1] })` — any negative ID value.
- **Recovery:** `kill -9` required.
- **Workaround:** Validate all IDs are positive before calling.

### 76. [ ] 💀 `common.setUserData` — negative ID hangs server

- **Session:** `2026-04-17_12-00-00_setUserData` (journal entry 07)
- **Error:** ❌ 100% CPU hang, no response. `kill -9` required.
- **Trigger:** `setUserData({ id: -1, key: 'test', value: 'val' })`
- **Recovery:** `kill -9` and restart worker.

### 6. [ ] 💀 `assembly.from` — ECXML `<assembly>` element hangs server

- **Session:** `2026-05-09_10-00-00_assembly-from` (journal entry 08)
- **Error:** ❌ 100% CPU, no response. Worker required `kill -9`.
- **Trigger:** `assembly.from({ data: '<assembly name="X">...</assembly>', format: 'ECXML' })`
- **Workaround:** Do not use ECXML format with `assembly.from`. Use `assembly.create()` instead.

### 143. [ ] 💀 `assembly.moveUnderConstraints` — calling without prior `startMovingUnderConstraints` hangs server

- **Session:** `2026-05-09_04-00-00_assembly-moveUnderConstraints` (journal entry 05)
- **Error:** ❌ 100% CPU hang. Worker requires kill -9. No error returned — the call never resolves.
- **Trigger:** `moveUnderConstraints({ id: asmId, offset: [10,0,0] })` without a prior `startMovingUnderConstraints` call.
- **Workaround:** Always use the full start → move → finish sequence.

### 144. [ ] 💀 `assembly.moveUnderConstraints` — invalid assembly ID hangs server

- **Session:** `2026-05-09_04-00-00_assembly-moveUnderConstraints` (journal entry 05, script 05 original run)
- **Error:** ❌ 100% CPU hang after passing `id: 99999`. The call returns error code 1006 but then the worker enters an infinite loop on subsequent calls.
- **Trigger:** `moveUnderConstraints({ id: 99999, offset: [...] })` with a non-existent ID.
- **Workaround:** Validate assembly ID before calling.

### 145. [ ] 💀 `assembly.finishMovingUnderConstraints` — calling without prior `startMovingUnderConstraints` hangs server

- **Session:** `2026-05-09_05-00-00_assembly-finishMovingUnderConstraints` (journal entry 04)
- **Error:** ❌ 100% CPU hang. Worker requires kill -9. Prior session (2026-05-09_03-00-00 script 05) reported "succeeds silently" but that test had different context — isolated test confirms hang.
- **Trigger:** `finishMovingUnderConstraints({ id: asmId })` without any prior `startMovingUnderConstraints` call.
- **Workaround:** Always use the full start → move → finish sequence.

### 173. [✅] 💀 region-based ops (`part.extrusion`/`part.revolve`/`part.twist`) — all-construction selection hangs server

- **Session:** `2026-07-01_14-30-00_construction-geometry` (journal + `scripts/03c-extrude-construction.mjs`)
- **Error:** ❌ No error returned; the API call never resolves and the worker wedges (unresponsive to all subsequent calls; needs kill/restart).
- **Trigger:** passing only construction geometry as `references` to a region-based op, e.g. `part.extrusion({ id, references: rectangle({..., isConstruction: true}) })`. Same expected for `part.revolve` / `part.twist` (they share `OperationsHelper.UpdateRegion`).
- **Root cause (CONFIRMED via worker `sample`):** NOT the solid kernel. `UpdateRegion` filters construction curves out, leaving an empty region; the feature regen's PreCheckVisitor (`PreCheckVisitor.cclass:1414`) calls `CADH_CurvesFindSelfIntersections` on the empty curve set, and `CurveBuilder::CurvesFindSelfIntersections` (`runtime/Source/SMLibService/c/CurveBuilder.cpp:1439`) has an **unsigned underflow**: `for (ULONG i=0; i<curves->GetSize()-1; i++)` with `GetSize()==0` → `0-1` = ULONG_MAX → ~infinite pairwise scan. Cross-platform defect (symptom hang-vs-crash varies by ABI); latent for `kernel.getSelfIntersections`/`CurveAnalyzer` too.
- **Fixed & LANDED — two layers kept (per review):**
  - **Runtime root cause** — classcad/runtime `aa9886a6e` (branch `fix/construction-region-op-hang`, pushed): `CurveBuilder.cpp:1439` loop bound → underflow-safe `i+1<curves->GetSize()`, so an empty curve array does zero iterations and returns empty. Fixes the hang for EVERY caller (region prechecks, `kernel.getSelfIntersections`, `CurveAnalyzer`), not just the region ops. Rebuilt libSMLibService; verified clean.
  - **cclass guard (kept, defense-in-depth)** — classcad/cclasses `4a0726aa` (same branch, pushed): `OperationsHelper.UpdateRegion` bails with `maxLevel 51` ("No usable (non-construction) geometry was selected for this operation.") when filtering leaves nothing — so region ops fail FAST with a clear message. Boss reviewed and chose to keep it alongside the runtime fix. Includes the regression test `PartAPITest_v1.testConstructionRegionOpsRejected`. (I'd earlier removed the guard per the runbook's "skip the symptom patch"; that removal was never pushed and is discarded.)
  - BMTestSuite 397/0/0; CADTestSuite = ClassCadKeyApp crypto baseline. Docs: classcad-skill `7a5184d` (hangs→error) pushed to `master`. Session: `workspace/training/2026-07-01_15-54-10_fix-construction-region-op-hang/`.

---

## 💥 CRITICAL — Crashes & Internal Errors (return errors but don't hang)

### 11. [ ] 💥 `sketch.dimension` — `value` parameter always fails

- **Session:** `2026-04-08_12-00-00_dimension` (journal line ~172)
- **Error:** ❌ Passing `value` at creation time ALWAYS fails regardless of dimension type. Must create dimension first, then use `updateDimension`.

### 12. [ ] 💥 `sketch.generateAutoConstraints` — rejects sketch IDs despite docs

- **Session:** `2026-04-08_10-00-00_generateAutoConstraints` (journal line ~32)
- **Error:** ❌ Docs say `geomId` can be "the sketch id itself" but API rejects it. Only sketch-curve and sketch-point IDs accepted.

### 13. [ ] 🐛 `curve.cleanShape` — internal error on empty shape

- **Session:** `2026-03-31_00-00-00_curve-shape` (journal line ~129)
- **Error:** ❌ maxLevel=51 internal database error. Server-side bug.

### 14. [ ] 🐛 `curve.arcBy3Points` — collinear points produce German internal error

- **Session:** `2026-03-31_12-00-00_arcBy3Points` (journal line ~60)
- **Error:** 💣 `"Index 2 ausserhalb des Arraybereichs"` — crash-style message instead of clean validation.

### 15. [ ] 🐛 `curve.advancedPolyline` — `r: 0` fillet crashes

- **Session:** `2026-04-07_00-00-00_advancedPolyline` (journal line ~94)
- **Error:** 💣 Same German array index crash. `r: negative` silently accepted (creates outward-bulging arc).

### 16. [ ] 🐛 `curve.polyline2d` — single point causes internal error

- **Session:** `2026-04-07_00-00-00_polyline2d` (journal line ~68)
- **Error:** 💣 `"Uninitialized MemberPTR"` — internal crash. Minimum 2 points required.

### 17. [ ] 🐛 `part.updateCylinder` on box ID — German internal error

- **Session:** `2026-03-25_16-00-00_openFeature-closeFeature` (journal line ~129)
- **Error:** 💣 `"Index 3 ausserhalb des Arraybereichs"` — wrong update API on wrong feature type.

### 58. [ ] 🐛 `solid.useSolid` — part ID or solid ID in `from` causes internal server error

- **Session:** `2026-04-15_18-00-00_solid-useSolid` (journal entry 15)
- **Error:** `[Evaluation error in SolidAPI_v1.useSolid::PROC:[Die Funktion OBJ_ErrorMessage hat zwischen 2 und 4 Parameter.]]` — German error message, code 0. Not a clean error.
- **Trigger:** `from: [partId]` or `from: [solidId]` — passing a part ID or raw solid ID instead of a feature ID (entity injection or part-level feature).
- **Workaround:** Only pass feature IDs (entity injection IDs or part-level feature IDs like box, extrusion, etc.) in the `from` array.

### 146. [ ] 💥 `assembly.setIdent` — batch/array form broken

- **Session:** `2026-05-09_09-00-00_assembly-setIdent` (journal entry 07)
- **Error:** "objId not found" when passing `Array<object>` despite docs showing param accepts array.
- **Trigger:** `setIdent([{ id: inst2, ident: 'part_b' }, { id: inst3, ident: 'part_c' }])`
- **Workaround:** Use individual calls instead of batch form.

---

## 🔥 HIGH — Recalc Invalidation Bug (affects multiple shape-transform APIs)

### 6. [ ] 🔥 `recalc` invalidates shape IDs for transform operations

- **Sessions:**
  - `2026-04-07_14-00-00_translateShape` (journal lines ~32, 38, 58, 101, 105, 111, 113, 125)
  - `2026-04-07_20-00-00_scaleShape` (journal lines ~39, 52, 76, 80, 120)
  - `2026-04-07_18-00-00_transformShape` (journal line ~180)
  - `2026-04-07_22-00-00_2d-booleans` (journal line ~227)
- **Error:** ❌ After `recalc` (including via `snapshot`), shape IDs become invalid → error 1006 on translateShape/scaleShape/transformShape/2D booleans.
- **Workaround:** 🩹 Do NOT call `snapshot` or `recalc` between shape creation and shape transforms. Adding a new curve after recalc "refreshes" state.
- **Impact:** ⚠️ Cannot interleave snapshots between transform calls.

---

## 🕳️ HIGH — Silent No-Op Traps (wrong params accepted without error)

### 7. [ ] 🕳️ `part.updateExpression` — direct params silently ignored

- **Sessions:**
  - `2026-03-24_19-00-00_part-expression-advanced` (journal line ~73)
  - `2026-03-25_12-00-00_updateExpression` (journal line ~50)
- **Error:** 🤫 `updateExpression({ id, name, value })` returns result=1, no error, but value DOES NOT CHANGE. Must use `{ id, toUpdate: [{ name, value }] }`.

### 8. [ ] 🕳️ `part.deleteExpression` — direct name param silently ignored

- **Session:** `2026-03-25_12-30-00_deleteExpression` (journal line ~67)
- **Error:** 🤫 `deleteExpression({ id, name })` = silent no-op. Must use `{ id, toDelete: [name] }`.

### 9. [ ] 🕳️ `part.renameExpression` — direct params silently ignored

- **Session:** `2026-03-25_13-00-00_renameExpression` (journal line ~50)
- **Error:** 🤫 `renameExpression({ id, name, newName })` = silent no-op. Must use `{ id, toRename: [{ name, newName }] }`.

---

## 🚨 MEDIUM — Wrong Prior Findings (historical, do not trust)

### 10. [ ] 🚨 All 2026-04-08 constraint sessions created sketches without `planeId`

- **Session:** `2026-04-14_10-00-00_constraintRetrain` (journal line ~7)
- **Impact:** ⚠️ Missing `planeId` silently disables the constraint solver. ALL solver-related findings from 2026-04-08 constraint/dimension sessions are WRONG.
- **Corrected findings:**
  - ✅ Constraints ARE enforced when `planeId` is set (`2026-04-08_10-00-00_constraintTypes` lines ~162, 243, 265)
  - ❌ "Constraints are declarative only" was an artifact of missing `planeId`

---

## 📖 HIGH — Doc Discrepancies / Undocumented Behavior

### 18. [ ] 📖 `part.create` — second call is no-op (docs say "clears drawing")

- **Session:** `2026-03-23_03-00-00_part-create` (journal line ~45)
- **Error:** ❌ Docs claim `part.create` "clears the drawing and creates a new part" but a second call returns null. Only works once per session.

### 19. [ ] 📖 Protocol envelope — `levelStr` field undocumented

- **Session:** `2026-03-22_17-25-41_protocol-envelope` (journal lines ~85, 87)
- **Detail:** 🔍 Messages include `levelStr` (e.g. "ERROR", "WARNING") not mentioned in docs. Also: `silent: true` suppresses messages but result is still null.

### 20. [ ] 📖 Protocol envelope — `undefined` in batch breaks envelope

- **Session:** `2026-03-22_17-25-41_protocol-envelope` (journal line ~215)
- **Error:** ❌ Passing `undefined` to batch produces broken envelope (`result: null`, `maxLevel: undefined`).

### 21. [ ] 📖 `sketch.isSolved` does not exist

- **Session:** `2026-03-22_18-30-00_result-types` (journal lines ~77, 212)
- **Error:** ❌ code 1201 "Unknown command". Doc discrepancy — API listed in docs but not implemented.

### 22. [ ] 📖 `part.expression` — invalid refs still registered

- **Session:** `2026-03-24_18-10-00_part-expression` (journal line ~96)
- **Detail:** ⚠️ Expressions with invalid runtime references ARE created (result=0, default value=1). Name is taken — can't re-create, must delete and recreate.

### 23. [ ] 📖 FIXATION constraint — does NOT lock length

- **Session:** `2026-04-14_10-00-00_constraintRetrain` (journal line ~109)
- **Detail:** ⚠️ FIXATION on a line locks position and direction but NOT length. Solver can shrink/extend a "fixed" line to satisfy other constraints.

### 24. [ ] 📖 No conflict detection for constraints

- **Session:** `2026-04-14_10-00-00_constraintRetrain` (journal line ~267)
- **Detail:** 🤫 Conflicting constraints (e.g. HORIZONTAL + VERTICAL on same line) accepted silently. Solver satisfies first constraint and ignores the rest.

### 25. [ ] 📖 Inconsistent constraint error behavior

- **Session:** `2026-04-14_10-00-00_constraintRetrain` (journal line ~301)
- **Detail:** ⚠️ Some invalid constraints return null (proper rejection), others get created with an ID but produce solver errors (maxLevel=51).

### 134. [ ] 📖 `assembly.getRevolute` — `id` param only accepts assembly root, not instance/product

- **Session:** `2026-05-08_03-00-00_assembly-getRevolute` (journal line ~77)
- **Error:** ⚠️ Docs say `id` is "id of the product or instance to look for constraint" but only the assembly root ID works. Instance IDs and template IDs return null/maxLevel=51.
- **Workaround:** Always pass the assembly root ID.

### 148. [ ] 📖 `assembly.from` — JSON schema documented but upstream doc is incomplete

- **Session:** `2026-05-13_09-00-00_assembly-from-retrain` (supersedes 2026-05-09 finding)
- **Status:** The 2026-05-09 conclusion "effectively non-functional" was WRONG — the format works. Authoritative source: `cclasses/Source/BaseModeling/JsonAssemblyBuilder.cclass{,_v1}`. Upstream user-facing doc: `buerli/sites/packages/classcad.ch/docs/api-usage/assembly_building.md`.
- **Real issue:** The upstream doc's example shows v1 schema (bare `FastenedConstraint`, etc.) but omits the `"version": 1` flag that selects v1. Without the flag the default v0 parser rejects bare names with "Unknown constraint type!". Either add the flag or prefix every constraint/geometry type with `CC_`.
- **Fix landed:** `references/assembly/from.md` rewritten with both schema versions, working example, and the field-name traps (`nameIfRoot` not `ident`; `transform` not `transformation` and STRING-typed; URL-only `reference.location`; etc.).

### 149. [ ] ⚠️ `assembly.from` — `CC_LinearPatternConstraint` failed in JSON despite being in the parser

- **Session:** `2026-05-13_09-00-00_assembly-from-retrain` (script 16)
- **Error:** `instances: ['B']` reports "Instance not found: B" even though the SAME instance is reachable via `mate1.path: ['B']` in the previous constraint of the same payload. Source's `ConvertInstance` doesn't have the path-prefix fallback that `ConvertMate` has — that may explain it, but root-scope idents should resolve directly.
- **Workaround:** Build patterns with `assembly.linearPattern` after `from()`. Avoid JSON-encoded linear pattern constraints.

---

### 174. [ ] 📖 `sketch.updateDimension` — stale arc `bulge` after failed(0)→solved(2) update sequence

- **Session:** `2026-07-02_10-57-47_robot-head-sketch` (scripts 04/05, journal § 04/05)
- **Error:** ❌ Driving a symmetric dim pair one-at-a-time (first call result 0 — unsolvable intermediate — second call result 2) left the re-solved arc's `members.bulge.value` stale: 1.2988643 (209.6° sweep) instead of 0.7022581 (140.3°), while start/end/center/radius were exact to 1e-15. Renderer/consumers of bulge see a corrupted arc; position readbacks all pass. Reproduced 3/3.
- **Trigger:** `updateDimension` A→(result 0), then B→(result 2) on a boss-Ø pair tangent to a dome with fixed symmetry.
- **Workaround:** No heal found — `common.recalc` doesn't refresh it, same-value re-set is a solver no-op. Avoid the failed intermediate entirely: ONE driving dim + EQUAL_RADIUS (verified clean). A later value-changing successful solve that moves the arc usually rewrites bulge.

## ⚠️ MEDIUM — Specific API Failures

### 26. [ ] ⚠️ Invalid ID types (float, negative, zero) all fail

- **Session:** `2026-03-22_18-30-00_result-types` (journal lines ~166-168)
- **Detail:** ❌ Float ID (4.5), negative ID (-4), zero ID (0) all rejected.

### 27. [ ] ⚠️ `part.updateExpression` — array form does not work

- **Session:** `2026-03-25_12-00-00_updateExpression` (journal line ~88)
- **Error:** ❌ error 1001 "Set the parameter 'id' = VOID is not allowed."

### 28. [ ] ⚠️ `part.deleteExpression` — array form does not work

- **Session:** `2026-03-25_12-30-00_deleteExpression` (journal line ~91)
- **Error:** ❌ Same VOID error as updateExpression array form.

### 29. [ ] ⚠️ `part.renameExpression` — cannot swap names, cannot chain in batch

- **Session:** `2026-03-25_13-00-00_renameExpression` (journal lines ~60, 66, 76, 80)
- **Details:** ❌ Name collision with existing expression. Batch renames all validate against pre-batch state. Array param form fails. Renaming to same name is an error.

### 30. [ ] ⚠️ `part.workAxis` — multiple param forms fail

- **Session:** `2026-03-30_12-00-00_workAxis` (journal lines ~62, 87, 90, 105, 121, 220)
- **Details:** ❌ `@expr` refs in position arrays fail. Work axis as curve ref for CURVE type rejected. Same point twice for 2POINTS fails. Parallel planes for 2PLANES fails. Revolve with workAxis fails (topology errors).

### 31. [ ] ⚠️ `curve.polyline2d` — bulge array length must match points

- **Session:** `2026-04-07_00-00-00_polyline2d` (journal lines ~74, 104)
- **Error:** ❌ Bulge array must be exactly same length as points array. Non-planar points produce error 1014.

### 32. [ ] ⚠️ `sketch.rectangle` — extrusion with `references: [regionId]` fails

- **Session:** `2026-04-08_00-00-00_sketch-rectangle` (journal line ~148)
- **Error:** ❌ `"CCObject can not be opened"` — must pass line IDs directly.

### 33. [ ] ⚠️ `sketch.dimension` — `dimPos` only works for ANGLE type

- **Session:** `2026-04-08_12-00-00_dimension` (journal line ~134)
- **Error:** ❌ `dimPos` causes error for OFFSET and HORIZONTAL_DISTANCE dimension types.

### 34. [ ] ⚠️ MIDPOINT constraint — fails for free sketch points

- **Session:** `2026-04-14_10-00-00_constraintRetrain` (journal lines ~174, 191)
- **Error:** ❌ Works for line endpoints but solver doesn't converge for free `sketch.point` IDs (Y reaches 27.7 instead of target 0).

### 35. [ ] ⚠️ `sketch.moveGeometry` — conflicts with active solver

- **Session:** `2026-04-14_10-00-00_constraintRetrain` (journal line ~280)
- **Error:** ❌ Returns null, maxLevel=51 when move conflicts with constraints.

### 36. [ ] ⚠️ `solid.copy` on intersection results fails

- **Session:** `2026-04-14_12-00-00_solidIntersection` (journal entry 03f)
- **Error:** ❌ `solid.copy` on a modified target after intersection returns null (maxLevel=51). Does not hang.

### 68. [ ] ⚠️ `common.setDatabaseSettings` — undocumented facetingParamsMode=2

- **Session:** `2026-04-16_09-00-00_getDatabaseSettings` (journal entries 05, 21-23)
- **Error:** Docs only document mode 0 and 1 for facetingParamsMode. Mode 2 is silently accepted (no error, maxLevel=31) but behaves unreliably — produces graphic data only at factory-default chord=0.1, angle=0.
- **Trigger:** `setDatabaseSettings({ facetingParamsMode: 2 })`
- **Workaround:** Use only mode 0 (for mesh data) or mode 1 (for per-entity tessellation).

### 69. [ ] ⚠️ `common.getDatabaseSettings` — default mode=1 returns no graphic data

- **Session:** `2026-04-16_09-00-00_getDatabaseSettings` (journal entries 17-22)
- **Error:** The factory default facetingParamsMode=1 means API responses contain no mesh/graphic data. This is not documented as a side effect — the docs only say "specific parameters of each entity will be used" without mentioning that graphic data is suppressed.
- **Trigger:** Creating geometry with default settings and checking `r.graphic`.
- **Workaround:** Set `facetingParamsMode: 0` before creating geometry if you need graphic data.

---

### 175. [ ] ⚠️ `sketch.updateDimension` — array/batch form is a silent null no-op

- **Session:** `2026-07-02_10-57-47_robot-head-sketch` (journal § 02)
- **Error:** ❌ Passing an array of `{id, value}` (like `dimension`/`constraint` accept) returns `result: null`, no messages, nothing updates.
- **Trigger:** `api.v1.sketch.updateDimension([{id, value}, ...])`
- **Workaround:** Loop single calls.

### 176. [ ] ⚠️ `sketch.dimension` — `dimPos` at creation poisons the batch

- **Session:** `2026-07-02_10-57-47_robot-head-sketch` (journal § 03)
- **Error:** ❌ Adding `dimPos` to HORIZONTAL/VERTICAL_DISTANCE point-pair dims in a 21-dim batch → batch maxLevel 51, several dims created as VOID, solver left the sketch half-driven (38/55 readback rows wrong). Not isolated to a single dim type.
- **Trigger:** `dimension([... {type:'HORIZONTAL_DISTANCE', geomIds:[p1,p2], value, dimPos:[x,y,0]} ...])`
- **Workaround:** Create dims without `dimPos`, then `updateDimensionPosition` (works on all types).

### 177. [ ] ⚠️ sketch solver — contradictory junction wiring diverges DoSolve GLOBALLY instead of flagging a loser

- **Session:** `2026-07-02_12-55-31_mounting-plate-sketch` (journal §§ 01–10, esp. the matrix in § 10)
- **Error:** ❌ When an explicit COINCIDENT wires the WRONG endpoint of an arc (start/end roles swapped on mirrored arcs) while auto-constraints wire the junction from the seed positions, every subsequent `DoSolve` fails and wrecks the sketch: `SketchSolverInterface.DoSolve: The specified radius for CalcBulges is too small`, `<DIM>.SetSE: NullMem {x,y,0} ist nicht definiert`, `Line length on angular dimension became zero!`; small arcs collapse to radius 0; EVERY later dimension refuses its value (`Couldn't set the value for dimension $N`) — including dims on satisfied, fully decoupled subgraphs (a plain Ø22 bore). Normal conflicting constraints are handled silently via `lgsState 0` — this class instead diverges from an already-satisfied state and destroys geometry.
- **Trigger:** exactly-seeded batch geometry (gen* ON) + explicit chain constraints whose endpoint bookkeeping contradicts the seed adjacency; then any constraint/dimension creation that triggers a solve.
- **Workaround:** with `genIncidence/genTangency/genVertAndHoriz: false` the same wiring bug is benign — the explicit set alone is solvable and the mis-wiring shows as a small role-swap displacement caught by numeric readback. Ideally the solver would report the contradictory pair instead of diverging.

### 178. [ ] ⚠️ sketch renderer — `arcByCenter` arcs misdrawn in the 2D sketch plot

- **Session:** `2026-08-10_13-03-40_sprocket-martin35` (journal § 02)
- **Error:** the sketch-view PNG of a validated tooth-space chain (8 arcs/lines, extrudes cleanly, area matches analytic to 0.004%) renders as a tiny lens-shaped blob; before the cw-flag fix the same view drew short arcs as near-full circles. The SOLID render and all numeric data are correct — only the 2D sketch plot path is wrong for arcByCenter entities.
- **Trigger:** `snapshot()` on a sketch containing `arcsByCenter` (batch geometry, autos off).
- **Workaround:** trust solid snapshots + numbers; treat 2D sketch plots of arc-heavy sketches as unreliable. Likely the renderer's bulge/sweep derivation for arcByCenter (cf. the 2026-07-01 arc-rendering fix, which covered structure-tree bulges).

### 179. [ ] 📖 `part.boolean` — 1014 "consumed" error names the WRONG entity with pattern tools

- **Session:** `2026-08-10_13-03-40_sprocket-martin35` (journal § 01c)
- **Error:** `tools: [toolId, patternOf(toolId)]` fails (correctly — the pattern consumed its target) but the 1014 message blames an arbitrary other entity ("SetScrew2" in the full build, "Pat" in the minimal repro), never the actually-consumed `toolId`.
- **Trigger:** any boolean whose tools include both a pattern and that pattern's target.
- **Workaround:** pass the pattern only; when a many-tool boolean throws 1014, audit pattern/target overlaps first, don't trust the named entity.

### 180. [ ] 📖 `part.getGeometryIds` — no-match = nested empty arrays; revolve rim circles unfindable via `arcs`/`circles`

- **Session:** `2026-08-10_13-03-40_sprocket-martin35` (journal § 03)
- **Error:** (a) no-match entries return `[]` inside the per-type arrays (`{arcs:[6513], circles:[[]], lines:[[]]}`) — truthy values that silently break `getGeometryPositions` when passed through; (b) hub-OD rim circles on a revolved+booleaned solid were not found by `arcs` or `circles` at exact on-edge positions, while `lines` returned a far-away edge that looks like a hit.
- **Trigger:** multi-type queries; revolve band rim edges.
- **Workaround:** flatten + keep numeric ids only; verify every found id via `getGeometryPositions`; for cylindrical bands use the `cylinders` FACE lookup (2 positions) and read the rim midpoints off the face. Documented in `part/getGeometryIds.md`.

## 🟡 LOW — Degenerate State Warnings

### 37. [ ] 🟡 `part.workPlane` — wrong ref types create broken features

- **Session:** `2026-03-27_16-30-00_workPlane` (journal line ~153)
- **Error:** ⚠️ Internal NullMem error. Feature exists but is broken.

### 38. [ ] 🟡 `part.updateWorkPlane` — missing refs create broken features

- **Session:** `2026-03-27_17-00-00_updateWorkPlane` (journal line ~49)
- **Error:** ⚠️ Changing type without providing required refs leaves feature broken but existing.

### 39. [ ] 🟡 `sketch.deleteSketch` — no cascade delete for dependents

- **Session:** `2026-04-08_16-00-00_deleteSketch` (journal line ~110)
- **Detail:** ⚠️ Dependent features become broken. Solid geometry persists as stale mesh.

### 40. [ ] 🟡 `sketch.setWorkPlane` — coordinate origin accumulates

- **Session:** `2026-04-08_14-00-00_setWorkPlane` (journal line ~122)
- **Detail:** 🔍 Origin accumulates across reassignments (unexpected behavior).

### 41. [ ] 🟡 `part.updateExpression` — undefined variable refs stored with old value

- **Session:** `2026-03-25_12-00-00_updateExpression` (journal line ~78)
- **Detail:** ⚠️ Formula with undefined variable ref IS stored while old value is kept. Half-applied state.

### 42. [ ] 🟡 `part.workAxis` — zero direction vector creates degenerate feature

- **Session:** `2026-03-30_12-00-00_workAxis` (journal line ~56)
- **Detail:** 🤫 Silent success, no error. Feature exists but is degenerate.

### 43. [ ] 🟡 `curve.scaleShape` — factor=0 creates degenerate geometry

- **Session:** `2026-04-07_20-00-00_scaleShape` (journal line ~48)
- **Detail:** 🤫 Silent success. Geometry collapsed to a point.

### 44. [ ] 🟡 Protocol envelope — missing param produces cascading errors

- **Session:** `2026-03-22_17-25-41_protocol-envelope` (journal line ~175)
- **Detail:** 💣 Missing `expression` param produces 2 error messages including `code: 0` internal error. `api` field missing from both messages.

### 45. [ ] 🟡 Destroyed target — inconsistent behavior across operations

- **Session:** `2026-04-14_21-45-00_target-tools-pattern` (journal entry 08)
- **Error:** After intersection destroys target (code 1014), subsequent ops on that ID behave differently: `solid.translation` is a silent no-op (maxLevel=31, no error), `solid.union` returns null/error, `solid.merge` returns the dead target ID with error (misleading — looks like success if you only check result, not maxLevel).
- **Trigger:** Any operation that destroys target (intersection of non-overlapping bodies, subtraction where tool envelops target), followed by further ops on the same ID.
- **Workaround:** Always check `maxLevel` after boolean operations, not just the return value.

### 46. [ ] 🟡 `solid.scale` — factor=0 is a silent no-op

- **Session:** `2026-04-15_12-00-00_solid-scale` (journal entries 04, 16, 17)
- **Error:** `scale({ ..., factor: 0 })` returns success (maxLevel=31, result=solidId) but the body is **completely unchanged** — bounding box, vertices, normals all stay the same. Subsequent operations work normally. Not documented anywhere. Very small non-zero factors (0.0001) do actually scale and produce degenerate geometry.
- **Trigger:** `factor: 0` exactly.
- **Workaround:** Avoid factor=0. If you need to check for zero before calling, do it yourself.

### 47. [ ] 🟡 `solid.scale` — negative factor flips normals (inside-out solid)

- **Session:** `2026-04-15_12-00-00_solid-scale` (journal entries 05, 16)
- **Error:** Negative scale factors (e.g., -1) succeed but flip all face normals, producing an inside-out solid. Normals reverse direction (e.g., [0,0,-1] → [0,0,1]). Double negation (-1 then -1) restores. Not documented.
- **Trigger:** Any negative `factor` value.
- **Workaround:** Use `solid.mirror` for proper mirroring instead.

### 49. [ ] 🟡 `solid.offset` — negative distance with extend: FALSE produces degenerate geometry

- **Session:** `2026-04-15_09-00-00_solid-offset` (journal entry 02)
- **Error:** Self-intersecting geometry. Faces protrude beyond corners. No error returned (maxLevel: 31).
- **Trigger:** `distance: -5` with `extend: FALSE` (default) on a box.
- **Workaround:** Always use `extend: TRUE` for negative (inward) offset.

### 50. [ ] 🟡 `solid.offset` — excessive negative distance collapses geometry silently

- **Session:** `2026-04-15_09-00-00_solid-offset` (journal entry 08)
- **Error:** Box (60×40×30) with `distance: -20` collapsed into a degenerate flat sheet. No error (maxLevel: 31).
- **Trigger:** `|distance|` exceeds half the smallest dimension.
- **Workaround:** Caller must validate distance against solid dimensions before calling.

### 52. [ ] 📖 `solid.slice` — docs say "negative side removed" but positive side is removed

- **Session:** `2026-04-15_09-00-00_solid-slice` (journal entries 07, 08)
- **Error:** Docs state "The part on the negative side of normal vector is removed." Actual behavior: the POSITIVE side (where the normal points) is removed.
- **Trigger:** Any `slice` call. Verified with normals [0,0,1], [0,0,-1], [1,0,1], [0,1,0].
- **Workaround:** Ignore docs — the normal points toward the material to discard.

### 53. [ ] 🟡 `solid.slice` — zero normal is a silent no-op

- **Session:** `2026-04-15_09-00-00_solid-slice` (journal entry 19)
- **Error:** `normal: [0,0,0]` accepted without error, does nothing. maxLevel: 31.
- **Trigger:** `slice({ ..., normal: [0,0,0] })`.
- **Workaround:** Validate normal is non-zero before calling.

### 54. [ ] 🔥 `solid.deleteSolid` on section entity — deletes the ORIGINAL solid

- **Session:** `2026-04-15_14-06-15_solid-section` (journal entry 18)
- **Error:** `deleteSolid(target: sectionId)` removes the source solid's geometry container, not the section curves. Part's solids array goes from `[59, 62]` to `[62]` — box (59) deleted, section curves (62) survive. The box becomes unusable (subsequent operations return maxLevel: 51).
- **Trigger:** `solid.deleteSolid({ id: eifId, target: sectionId })` where `sectionId` is the CC_CurveEntity ID returned by `solid.section`.
- **Workaround:** Do not use `deleteSolid` on section entities. No known safe way to remove section curves programmatically.

### 55. [ ] 🟡 `solid.section` — non-intersecting plane and zero normal produce empty entities silently

- **Session:** `2026-04-15_14-06-15_solid-section` (journal entries 05, 06)
- **Error:** Section call succeeds (returns ID, maxLevel: 31) when the plane doesn't intersect the solid or normal is `[0,0,0]`. The created CC_CurveEntity contains no edges — an orphan entity with no geometry.
- **Trigger:** `section({ ..., originPos: [0,0,50], normal: [0,0,1] })` on a box spanning z=-20 to z=20, or `normal: [0,0,0]`.
- **Workaround:** Validate that the section plane intersects the solid before calling. Check graphic container edges after the call.

### 56. [ ] 📖 `solid.fillet` — misleading error messages for multiple failure modes

- **Session:** `2026-04-15_15-06-49_solid-fillet` (journal entries 06, 12, 19)
- **Error:** Negative radius, nonexistent IDs, and radius-too-large all produce the same error: "Set the parameter \"id\" = VOID is not allowed in this situation!" — misleading since the issue is not about the `id` param.
- **Trigger:** `fillet({ ..., radius: -5, ... })` or `fillet({ ..., geomIds: [999999] })` or radius exceeding geometry limits.
- **Workaround:** Validate radius > 0 before calling. Test radius incrementally for geometry-dependent limits.

### 57. [ ] ⚠️ `part.getBrepGeometryByIndex` — returns no line edges for extrusion solids

- **Session:** `2026-04-15_15-06-49_solid-fillet` (journal entry 18)
- **Error:** `getBrepGeometryByIndex({ id: eifId, lineIndex: 0 })` returns null/error for an L-shaped extrusion solid despite having visible straight edges. `getGeometryIds` with position-based lookup works.
- **Trigger:** Extrusion solid created via `solid.extrusion` with an advancedPolyline profile.
- **Workaround:** Use `part.getGeometryIds` (position-based) instead of `getBrepGeometryByIndex` for non-primitive solids.

### 59. [ ] ⚠️ `common.save` — DXF format broken in classcad-cli

- **Session:** `2026-04-15_19-00-00_common-save` (journal entry 07)
- **Error:** `[Evaluation error in GeometryExportManager.StoreGeometryToStream:[CCVM::lcm: Function CADH_GetDxfTemplateFile not found]]` — maxLevel=51, success=0.
- **Trigger:** Any `save({ format: 'DXF' })` call, regardless of geometry type (3D or 2D).
- **Workaround:** None — DXF export is unavailable in CLI worker. May work in full application.

### 60. [ ] ⚠️ `common.save` — `stp.header` options ignored in data-string mode

- **Session:** `2026-04-15_19-00-00_common-save` (journal entry 16)
- **Error:** Custom `stp.header.filename.name` and `stp.header.filename.organization` values do not appear in the STEP header. FILE_NAME always uses the part name.
- **Trigger:** `save({ format: 'STP', stp: { header: { filename: { name: 'custom', organization: 'Org' } } } })` with data-string output (no `file` param).
- **Workaround:** None known. May only work with file-based saves.

### 61. [ ] ⚠️ `common.save` — `stp.analytic` produces error-level messages despite success

- **Session:** `2026-04-15_19-00-00_common-save` (journal entry 13)
- **Error:** `maxLevel=51` (ERROR) but `success=1` with valid content. Misleading — suggests failure when the operation actually succeeded.
- **Trigger:** `save({ format: 'STP', stp: { analytic: 1 } })`.
- **Workaround:** Check `result.success`, not `maxLevel`, for STP saves with analytic conversion.

### 62. [ ] ⚠️ `common.load` — SCG format not loadable despite being saveable

- **Session:** `2026-04-15_20-00-00_common-load` (journal entry 17)
- **Error:** `code=1013`, `"The provided value for parameter \"format\" is not valid. Possible values are: [\"OFB\",\"STP\",\"IWP\"]"`. Load only accepts 3 formats, while save supports 6.
- **Trigger:** `load({ data: scgContent, format: 'SCG' })`.
- **Workaround:** None — SCG is export-only. Use OFB for roundtrip workflows.

### 63. [ ] ⚠️ `common.load` — `stp.asPart` produces error-level messages on load

- **Session:** `2026-04-15_20-00-00_common-load` (journal entry 05)
- **Error:** `maxLevel=51`, `"CreateNamedPoint not found"`. Geometry loads fine despite the error.
- **Trigger:** `load({ data: stpContent, format: 'STP', stp: { asPart: 1 } })`.
- **Workaround:** Check `result.id` existence instead of maxLevel to detect real failures.

### 65. [ ] ⚠️ `common.load` — IWP roundtrip produces no renderable solid

- **Session:** `2026-04-15_23-00-00_format-comparison` (journal entry 05)
- **Error:** IWP load succeeds (maxLevel=31, returns valid id), but loaded model has no renderable solid geometry. Snapshot after load produces no solid PNG.
- **Trigger:** Save as IWP binary + base64, clear, load back with same encoding.
- **Workaround:** Use STP instead of IWP for geometry interchange.

### 66. [ ] ⚠️ `part.updateExpression` — expression update may not propagate after OFB roundtrip

- **Session:** `2026-04-15_23-00-00_format-comparison` (journal entry 09)
- **Error:** After OFB save/load roundtrip of a parametric part (box with `@expr.L`), updating expression L from 100 to 120 + recalc() did not change the expression's reported value. `getExpression` still returned 100.
- **Trigger:** `part.box` with `@expr.` bindings → save OFB → load OFB → `updateExpression` → `recalc` → `getExpression`.
- **Workaround:** Not yet determined. May require openFeature/closeFeature or other recalc trigger.

### 68. [ ] ⚠️ `common.setDatabaseSettings` — facetingParamsMode has no effect on graphic data

- **Session:** `2026-04-16_09-00-00_setDatabaseSettings` (journal entries 03, 14)
- **Error:** API docs say mode=0 uses "default parameters" and mode=1 uses "entity-specific parameters" for tessellation. In practice, both modes return identical mesh data (same vertex counts, same container structure). Mode does not control graphic data presence.
- **Trigger:** Create solid with mode=1 vs mode=0, compare r.graphic — identical.
- **Workaround:** None needed — graphic data is always available regardless of mode.

### 69. [ ] ⚠️ `common.setDatabaseSettings` — invalid facetingParamsMode values accepted silently

- **Session:** `2026-04-16_09-00-00_setDatabaseSettings` (journal entry 11)
- **Error:** Mode values 3 and -1 are accepted without error (maxLevel=31) and stored. Only modes 0 and 1 are documented.
- **Trigger:** `setDatabaseSettings({ facetingParamsMode: 3 })` or `{ facetingParamsMode: -1 }`.
- **Workaround:** Only use mode 0 or 1.

### 70. [ ] ⚠️ `common.setDatabaseSettings` — zero chordHeightTol leaks internal C++ path

- **Session:** `2026-04-16_09-00-00_setDatabaseSettings` (journal entry 16)
- **Error:** Setting `chordHeightTol: 0` returns maxLevel=51 with error message containing internal C++ file path (`/Users/daniel/awv/classcad/runtime/Source/BaseSystemSTL/c/CADH_Service.cpp, Line: 2762`).
- **Trigger:** `setDatabaseSettings({ chordHeightTol: 0 })`.
- **Workaround:** Don't set zero chord. Use small positive values (0.01+).

### 71. [ ] ⚠️ `common.setFacetingParameters` — docs say params are optional, but both are mandatory

- **Session:** `2026-04-16_11-00-00_getFacetingParameters` (journal entries 03, 14)
- **Error:** Omitting either `angleTol` or `chordHeightTol` triggers internal NullMem error (maxLevel=51). Error message: "A variable of the type NullMem (nicht initialisiertes Member) has been defined as type Gleitkommazahl addressed." with internal C++ path.
- **Trigger:** `setFacetingParameters({ angleTol: 25 })` or `setFacetingParameters({ chordHeightTol: 0.1 })` (only one param).
- **Workaround:** Always pass both params. Read current values with `getFacetingParameters` first if you only want to change one.

### 72. [ ] ⚠️ `common.setFacetingParameters` vs `setDatabaseSettings` — inconsistent zero chordHeightTol validation

- **Session:** `2026-04-16_11-00-00_getFacetingParameters` (journal entry 15)
- **Error:** `setFacetingParameters({ angleTol: 10, chordHeightTol: 0 })` succeeds (maxLevel=31), but `setDatabaseSettings({ chordHeightTol: 0 })` fails (maxLevel=51). Same backing store, different validation.
- **Trigger:** Setting chordHeightTol to 0 via the two different APIs.
- **Workaround:** Avoid setting chordHeightTol to 0 for consistency.

### 73. [ ] ⚠️ `common.setFacetingParameters` — angleTol values in (0, 1) rejected without clear error

- **Session:** `2026-04-16_11-00-00_getFacetingParameters` (journal entry 18)
- **Error:** angleTol values like 0.1, 0.5, 0.9 are rejected (maxLevel=51) but the error message is generic, not explaining the minimum threshold.
- **Trigger:** `setFacetingParameters({ angleTol: 0.5, chordHeightTol: 0.1 })`.
- **Workaround:** Use angleTol=0 (disabled) or angleTol >= 1.0.

### 74. [ ] ⚠️ `common.transformObjectWithMatrix` — shear matrices silently auto-corrected

- **Session:** `2026-04-17_12-46-30_transformObjectWithMatrix` (journal entry 08)
- **Error:** Non-orthogonal (shear) matrix reports ERROR level 51: "Transformationmatrix of this object has been set to be uniformed scaled and orthogonal" — but geometry DOES change to the corrected (orthogonalized) matrix.
- **Trigger:** Any matrix with non-perpendicular columns (e.g., `[[1,0.5,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]`).
- **Workaround:** Only use orthogonal matrices. Check `maxLevel` after call.

### 75. [ ] ⚠️ `common.transformObjectWithMatrix` — `isGlobal: FALSE` has no effect on standalone objects

- **Session:** `2026-04-17_12-46-30_transformObjectWithMatrix` (journal entries 06, 15, 16)
- **Error:** `isGlobal: FALSE` produces identical results to `isGlobal: TRUE` on solid bodies, EIFs, and features — even after explicitly setting OCS via `setObjectCoordSystem`.
- **Trigger:** Using `isGlobal: false` on any non-assembly object.
- **Workaround:** Ignore `isGlobal` for standalone objects. May only work in assembly context.

### 77. [ ] ⚠️ `common.setUserData` — overwrite is a silent no-op

- **Session:** `2026-04-17_12-00-00_setUserData` (journal entries 02, 05)
- **Error:** Calling `setUserData` on a key that already exists does nothing — returns `maxLevel: 31` (success) but value is unchanged. No error or warning.
- **Trigger:** `setUserData` with a key that was already set.
- **Workaround:** `removeUserData` first, then `setUserData`.

### 78. [ ] ⚠️ `common.setUserData` — user data not persisted in OFB save/load

- **Session:** `2026-04-17_12-00-00_setUserData` (journal entry 08)
- **Error:** All user data is lost after save → clear → load cycle. Not documented.
- **Trigger:** Any save/load cycle.
- **Workaround:** Re-set user data after loading.

### 79. [ ] ⚠️ `part.box` — zero/negative dimensions create degenerate feature

- **Session:** `2026-04-17_09-00-00_partBox` (journal entry 10)
- **Error:** `part.box` with length=0, height=-30, or all-zero dimensions returns a feature ID (not null) with maxLevel 51 (ERROR), code 1122. The feature exists in the tree but has no valid geometry — a degenerate/broken feature node.
- **Trigger:** Any dimension <= 0.
- **Workaround:** Always validate dimensions > 0 before calling.

### 80. [ ] ⚠️ `part.updateBox` on wrong feature type — silent success

- **Session:** `2026-04-17_00-00-00_updateBox` (journal entry 13, 15)
- **Error:** Calling `updateBox` on a cylinder feature does NOT error. Returns feature ID with maxLevel 31 (success). Shared param names (`height`, `name`, `references`) actually apply to the cylinder. Box-specific params (`length`, `width`) are silently ignored. The cylinder's height was visually confirmed to change.
- **Trigger:** `updateBox({ id: cylinderFeatureId, height: 200 })` on a cylinder feature.
- **Workaround:** Always use the matching update method (`updateCylinder` for cylinders, etc.).

### 81. [ ] ⚠️ `part.extrusion` — `capEnds` rejects string booleans

- **Session:** `2026-04-17_14-00-00_partExtrusion` (journal entry 05)
- **Error:** `capEnds: 'TRUE'` or `capEnds: 'FALSE'` returns maxLevel=51: "The parameter 'capEnds' has the wrong type! It should be of type (boolean)". Other APIs may have the same issue with string-encoded booleans.
- **Trigger:** Passing string `'TRUE'`/`'FALSE'` instead of integer `1`/`0`.
- **Workaround:** Always use integer booleans (1 or 0) for ClassCAD boolean parameters.

### 82. [ ] ⚠️ `part.extrusion` — missing `planeId` on sketch produces internal error

- **Session:** `2026-04-17_14-00-00_partExtrusion` (journal entry 01)
- **Error:** Extrusion from a sketch created without `planeId` returns maxLevel=51 with internal error: `Sketch.GetNormal:CCObject can not be opened` (leaks internal C++ path). Geometry IS still created despite the error.
- **Trigger:** `sketch.create({ id: partId })` (no planeId) → `part.extrusion({ references: [regionId] })`.
- **Workaround:** Always pass `planeId` to `sketch.create`.

### 83. [ ] 🕳️ `part.extrusion` — empty `references: []` creates broken feature silently

- **Session:** `2026-04-17_14-00-00_partExtrusion` (journal entry 12)
- **Error:** Returns a feature ID (not null) with maxLevel=51: "Nothing was selected". A degenerate feature node exists in the tree but has no geometry.
- **Trigger:** `extrusion({ id: partId, references: [], limit2: 40 })`.
- **Workaround:** Validate references array is non-empty before calling.

### 84. [ ] ⚠️ `part.revolve` — cross-part revolve fails with misleading error

- **Session:** `2026-04-17_08-00-00_revolve` (journal entries 16-17)
- **Error:** Creating revolve features in two different parts within the same drawing session fails. Second `part.revolve` returns null, maxLevel=51, error 1004: `"id" must be provided to create CC_Revolve"`. The id IS provided — error message is misleading.
- **Trigger:** Create part A → revolve in A → create part B → revolve in B.
- **Workaround:** Multiple revolves in the same part work fine. For cross-part revolves, clear the drawing between parts.

### 85. [ ] ⚠️ `part.revolve` — `inverted` rejects JS boolean and string boolean

- **Session:** `2026-04-17_08-00-00_revolve` (journal entries 05-06)
- **Error:** `inverted: true` (JS boolean) and `inverted: 'TRUE'` (string) both fail with error 1004: `"id" must be provided to create CC_Revolve"`. Same misleading error as cross-part bug.
- **Trigger:** Using anything other than integer 1/0 for `inverted` parameter.
- **Workaround:** Use `inverted: 1` or `inverted: 0`.

### 86. [ ] ⚠️ `part.revolve` — profile crossing axis creates degenerate feature

- **Session:** `2026-04-17_08-00-00_revolve` (journal entry 14)
- **Error:** Profile extending across the revolve axis returns a feature ID (94) but maxLevel=51: "The brep elements of at least one face are not well defined. Brep reference attribute is missing."
- **Trigger:** Rectangle from [-10,0,0] to [40,30,0] revolved around YAxis (axis at x=0).
- **Workaround:** Keep the profile entirely on one side of the revolve axis.

### 87. [ ] 📖 `part.updateRevolve` — @expr. binding does not create live link

- **Session:** `2026-04-18_08-00-00_updateRevolve` (journal entries 14-15)
- **Error:** Using `@expr.ANG` in `updateRevolve({ endAngle: '@expr.ANG' })` bakes the current value at update time. Subsequent `updateExpression` changes the expression value but does NOT recalc the revolve geometry. In contrast, using `@expr.ANG` at creation time in `revolve({ endAngle: '@expr.ANG' })` DOES create a live link that auto-recalcs.
- **Trigger:** Set @expr. binding via updateRevolve (not at creation time), then change expression value.
- **Workaround:** Use `linkWithExpression` for live binding after creation, or set @expr. at creation time.

### 88. [ ] 📖 `part.updateBoolean` — misleading error when new tool created after boolean

- **Session:** `2026-04-18_00-00-00_updateBoolean` (journal entry 15)
- **Error:** Swapping tools to a feature created AFTER the boolean returns error code 1014: "Entity \"Slot\" is not available. It has already been consumed/used in another operation." The real issue is `openFeature` rolls back the design tree, so the feature doesn't exist yet — not "consumed."
- **Trigger:** Create feature B after boolean A, then `openFeature(A)` → `updateBoolean({ tools: [B] })`.
- **Workaround:** Create replacement tools/targets BEFORE the boolean in the design tree.

### 89. [ ] 📖 `part.slice` — `reference` parameter marked optional but is required

- **Session:** `2026-04-18_00-00-00_partSlice` (journal entry 11)
- **Error:** Omitting the `reference` parameter returns error code 1004: "The parameter \"reference\" must be provided in the api call!" despite the API docs marking it as optional with `(default=xy)`.
- **Trigger:** Call `part.slice` without `reference`.
- **Workaround:** Always provide a work plane ID for `reference`.

### 90. [ ] ⚠️ `part.sliceBySheet` — Top (XY) plane sheet produces CC_Sheet instead of CC_Solid

- **Session:** `2026-04-20_00-00-00_sliceBySheet` (journal entries 02–08)
- **Error:** When the sheet tool is created by extruding from the Top (XY) plane, sliceBySheet produces a CC_Sheet body instead of a CC_Solid. The solid target is consumed but the result is an unusable sheet. Boolean operations on the result fail: "The body used for Union (CC_Union) is a Sheet, please select a solid."
- **Trigger:** Create sheet via `part.extrusion` with `capEnds: 0` on the Top (XY) plane, then use it in `sliceBySheet`.
- **Workaround:** Create the sheet from the Front (XZ) or Right (YZ) plane instead.

### 91. [ ] ⚠️ `part.sliceBySheet` — `inverted` rejects JS boolean and string boolean

- **Session:** `2026-04-20_00-00-00_sliceBySheet` (journal entries 09–11)
- **Error:** Passing `inverted: true` or `inverted: 'TRUE'` fails with misleading error: `"\"id\" must be provided to create CC_SliceBySheet"` (code 1004). Only integer 0/1 works.
- **Trigger:** `sliceBySheet({ ..., inverted: true })` or `inverted: 'TRUE'`.
- **Workaround:** Use `inverted: 0` or `inverted: 1`.

### 92. [ ] 📖 `part.entityDeletion` — renderer shows stale geometry after deletion

- **Session:** `2026-04-20_00-00-00_entityDeletion` (journal entries 04, 06)
- **Error:** PNG snapshots taken after entityDeletion (targeting a pattern with plain ID or `{ id }`) still show the deleted bodies. STEP export correctly shows 0 bodies.
- **Trigger:** `entityDeletion({ targets: [patternId] })` or `{ id: patternId }` without indices, followed by `snapshot()`.
- **Workaround:** Use STEP body count (`MANIFOLD_SOLID_BREP` count) as ground truth instead of PNG snapshots.

### 93. [ ] ⚠️ `part.chamfer` — pre-recalc edge IDs fail for TWO_DISTANCES and DISTANCE_ANGLE

- **Session:** `2026-04-20_10-06-51_chamfer` (journal entries 03–08)
- **Error:** Edge IDs returned by `getGeometryIds` before `recalc()` (e.g., ID 75) work for EQUAL_DISTANCE chamfer but fail for TWO_DISTANCES and DISTANCE_ANGLE with: `"An element of parameter 'references' has an invalid id!"` (code 1006, maxLevel=51). After `recalc()`, the same position returns a different ID (e.g., 106) that works for all types.
- **Trigger:** Create `part.box`, call `getGeometryIds` without `recalc()` first, then use those edge IDs for a non-default chamfer type.
- **Workaround:** Always call `recalc()` before `getGeometryIds` when chamfering.

### 94. [ ] ⚠️ `part.chamfer` — oversized distance creates degenerate feature

- **Session:** `2026-04-20_10-06-51_chamfer` (journal entry 12)
- **Error:** When `distance1` exceeds what adjacent faces can accommodate, the chamfer feature is still created (non-null result) but with maxLevel=51 and error `"Chamfer could not be applied to all edges."` The feature is in a broken state.
- **Trigger:** `chamfer({ ..., distance1: 50 })` on an 80x60x40 box (distance exceeds 40mm face height).
- **Workaround:** Check `maxLevel >= 51` after chamfer creation to detect degenerate features.

### 95. [ ] ⚠️ `part.mirror` — docs say "planes or faces" but brep faces are rejected

- **Session:** `2026-04-20_15-00-00_mirror` (journal entry 04)
- **Error:** Passing a brep face ID (from `getGeometryIds`) as a mirror reference fails with code 1006: "An element of parameter 'references' has an invalid id!" preceded by warning "ToId()/TOID() didn't get an existing or valid id."
- **Trigger:** `mirror({ ..., references: [brepFaceId] })` where `brepFaceId` comes from `getGeometryIds.planes`.
- **Workaround:** Use work plane IDs only (`getWorkGeometry` or `workPlane`).

### 96. [ ] ⚠️ `part.mirror` — empty references creates degenerate feature

- **Session:** `2026-04-20_15-00-00_mirror` (journal entry 11)
- **Error:** Passing `references: []` returns a non-null feature ID (97) but with maxLevel=51 and error 1111: "There is no reference found for Mirror (CC_Mirror)." The feature exists in the tree but has no geometry.
- **Trigger:** `mirror({ id: partId, targets: [boxId], references: [] })`
- **Workaround:** Always provide at least one valid work plane ID in references.

### 97. [ ] ⚠️ `part.linearPattern` — count=0 produces misleading error

- **Session:** `2026-04-20_17-00-00_linearPattern` (journal entry 02)
- **Error:** Passing `count: 0` in dir1 fails with code 1004: "id must be provided to create CC_LinearPattern" — the `id` param IS provided; the real issue is count=0 being invalid.
- **Trigger:** `linearPattern({ id: partId, targets: [boxId], dir1: { references: [waId], distance: 40, count: 0 } })`
- **Workaround:** Use count ≥ 1.

### 101. [ ] ⚠️ `part.circularPattern` — `merged: 1` always fails with boolean error 1001

- **Session:** `2026-04-20_18-00-00_circularPattern` (journal entry 04)
- **Error:** "Boolean operation failed with error 1001" — MergeBodies step fails. Feature is created (returns ID) but bodies remain separate.
- **Trigger:** `circularPattern({ ..., merged: 1 })` — fails with both overlapping and non-overlapping geometries.
- **Workaround:** Use `merged: 0` and then `part.boolean` with `type: 'UNION'` on the resulting bodies.

### 102. [ ] 📖 `part.transformationByCSys` — empty targets gives confusing error

- **Session:** `2026-04-20_24-00-00_transformationByCSys` (journal entry 13)
- **Error:** Code 1004: "The type '0' is not supported in PrepareAPIParams!" — unclear message for an empty targets array.
- **Trigger:** `transformationByCSys({ ..., targets: [] })` — empty array.
- **Workaround:** Always pass at least one target.

### 103. [ ] ⚠️ `part.importFeature` — invalid data/format silently creates empty import

- **Session:** `2026-04-20_25-00-00_importFeature` (journal entries 08, 09)
- **Error:** No error. maxLevel=31, valid feature ID returned. But CC_Import has no children and no solids.
- **Trigger:** `importFeature({ ..., data: 'garbage', format: 'STP' })` or `importFeature({ ..., data: 'test', format: 'INVALID' })`.
- **Workaround:** Always verify `part.solids` in the structure tree after import to confirm geometry was created.

### 104. [ ] 🕳️ `part.updateImportFeature` — garbage data silently destroys existing geometry

- **Session:** `2026-04-20_26-00-00_updateImportFeature` (journal entry 11)
- **Error:** 🤫 Passing invalid STP data returns success (maxLevel=31, valid feature ID) but replaces existing geometry with nothing — 0 child solids. More destructive than `importFeature` because valid geometry is lost.
- **Trigger:** `updateImportFeature({ id: importId, data: 'garbage', format: 'STP' })` with `openFeature`/`closeFeature`.
- **Workaround:** Always validate STP data before calling `updateImportFeature`. Check solid count in structure tree after update.

### 105. [ ] 📖 `part.updateImportFeature` — data source mandatory despite docs saying optional

- **Session:** `2026-04-20_26-00-00_updateImportFeature` (journal entry 02)
- **Error:** Docs say "If optional parameters are not set, the feature will keep the existing values." but omitting all data sources (`data`, `file`, `url`) errors with code 1004. Cannot rename without also providing data.
- **Trigger:** `updateImportFeature({ id: importId, name: 'NewName' })` (name only, no data source).
- **Workaround:** Always provide a data source. To rename, pass the same data back alongside the new name.

### 106. [ ] 🟡 `part.updateImportFeature` — name-only update is partial-success bug

- **Session:** `2026-04-20_26-00-00_updateImportFeature` (journal entry 10)
- **Error:** Name-only update (no data source) returns null, maxLevel=51 (error), but the name change IS applied. Geometry survives unchanged. Partial success with error return is misleading.
- **Trigger:** `updateImportFeature({ id: importId, name: 'OnlyName' })` with `openFeature` but no data source.
- **Workaround:** Don't rely on this behavior — always provide data alongside name changes.

### 107. [ ] 📖 `part.getFeature` — does not find sketches or work geometry

- **Session:** `2026-04-21_02-00-00_getFeature` (journal entries 08, 09)
- **Error:** Despite the generic name "getFeature", this API only searches the OperationSequence. Sketches, work geometry (planes/axes/points), and built-in origin features are all invisible to it.
- **Trigger:** `getFeature({ id: partId, name: 'Sketch' })` or any work geometry name.
- **Workaround:** Use `part.getSketch` for sketches, `part.getWorkGeometry` for work geometry.

### 108. [ ] 📖 `part.updateBox` — name parameter does not update feature lookup name

- **Session:** `2026-04-21_02-00-00_getFeature` (journal entries 12, 13)
- **Error:** `updateBox({ id: boxId, name: 'NewName' })` returns maxLevel 51 (error). The feature's lookup name does not change. Only `common.setObjectName` can rename a feature for `getFeature` lookup.
- **Trigger:** `updateBox({ id, name: 'X' })`.
- **Workaround:** Use `common.setObjectName({ id, name: 'X' })` instead.

### 109. [ ] ⚠️ `part.deleteFeature` — deleting rolled-back features produces errors but still deletes

- **Session:** `2026-04-21_03-00-00_deleteFeature` (journal entries 08, 11)
- **Error:** Deleting a feature that is behind the rollback bar returns maxLevel=51 with internal errors ("Index N ausserhalb des Arraybereichs", "objId not found"), BUT the feature is permanently removed from the tree. Errors are misleading — they suggest failure but deletion takes effect.
- **Trigger:** `operationMoveBefore` to roll back, then `deleteFeature` on the rolled-back feature ID.
- **Workaround:** Always `operationMoveToEnd` before calling `deleteFeature`.

### 110. [ ] ⚠️ `part.deleteFeature` — deleting during openFeature corrupts editing context

- **Session:** `2026-04-21_03-00-00_deleteFeature` (journal entries 10, 12)
- **Error:** Calling `deleteFeature` while inside an `openFeature`/`closeFeature` editing session (even on an unrelated feature) corrupts the editing context. `closeFeature` subsequently fails with error 1001 ("wrong id type").
- **Trigger:** `openFeature(boxId)` → `deleteFeature({ ids: [cylId] })` → `closeFeature(partId)` fails.
- **Workaround:** Never call `deleteFeature` while inside an editing session. Close first, then delete.

### 111. [ ] 🟡 `part.deleteFeature` — built-in origin geometry is deletable

- **Session:** `2026-04-21_03-00-00_deleteFeature` (journal entry 14)
- **Error:** Built-in origin work geometry (Top, Front, Right planes; X/Y/Z axes) can be deleted with maxLevel=31 (clean success). No protection or warning. This could break any features referencing origin planes.
- **Trigger:** `getWorkGeometry({ id: partId, name: 'Top' })` → `deleteFeature({ ids: [topPlaneId] })`.
- **Workaround:** Never pass built-in origin IDs to deleteFeature. Filter them out before batch deletes.

### 112. [ ] 📖 `part.createUncommitedObject` — CC_Boolean is not a valid class name

- **Session:** `2026-04-21_00-00-00_createUncommitedObject` (journal entry 06)
- **Error:** `CC_Boolean` fails with "non-existent class." The docs use `part.boolean` for the API, but the internal class names are `CC_Union`, `CC_Subtraction`, `CC_Intersection` (per boolean type), or `CC_BooleanOperation` (generic).
- **Trigger:** `createUncommitedObject({ type: 'CC_Boolean' })`.
- **Workaround:** Use type-specific class names: CC_Union, CC_Subtraction, CC_Intersection.

### 113. [ ] 📖 `part.createUncommitedObject` — CC_ImportFeature is not a valid class name

- **Session:** `2026-04-21_00-00-00_createUncommitedObject` (journal entry 05)
- **Error:** `CC_ImportFeature` fails with "non-existent class." The API is `part.importFeature` but the internal class is `CC_Import`.
- **Trigger:** `createUncommitedObject({ type: 'CC_ImportFeature' })`.
- **Workaround:** Use `CC_Import` as the type string.

### 114. [ ] ⚠️ `part.calculateMassProperties` — NullMem crash on empty part

- **Session:** `2026-04-21_15-00-00_part-calculateMassProperties` (journal entry 07)
- **Error:** Internal NullMem error: `"Type error: A variable of the type NullMem..."`. No graceful zero-volume return.
- **Trigger:** `calculateMassProperties({ id: partId })` on a part with no solid geometry.
- **Workaround:** Ensure part contains at least one solid before calling.

### 115. [ ] ⚠️ `part.calculateMassProperties` — NullMem crash on degenerate cone (tDiameter=0)

- **Session:** `2026-04-21_15-00-00_part-calculateMassProperties` (journal entries 04, 05)
- **Error:** Same NullMem internal error. Also triggers with very small tDiameter (0.001).
- **Trigger:** `part.cone({ ..., tDiameter: 0 })` followed by `calculateMassProperties`.
- **Workaround:** Use `tDiameter >= 1` for cones that will be measured.

### 116. [ ] 📖 `part.getGeometryIds` — `circles` lookup fails at seam vertex

- **Session:** `2026-04-21_16-00-00_part-getGeometryIds` (journal entries 04, 06, 13)
- **Error:** Querying `circles: [{pos: [+radius, 0, Z]}]` returns `{circles: [[]]}` maxLevel 51. The position is the brep seam vertex, not a point on the arc.
- **Trigger:** Any cylinder, cone, or sphere — their seam line is always in the +X direction, seam vertex at [+radius, 0, Z].
- **Workaround:** Use center of circle, or any other rim point (e.g., [-radius, 0, Z], [0, radius, Z]).

### 117. [ ] 📖 `part.getGeometryIds` — `arcs` param cannot find circular edges on cylinders/cones

- **Session:** `2026-04-21_16-00-00_part-getGeometryIds` (journal entries 11, 13)
- **Error:** `arcs: [{pos: [-20,0,0]}]` fails despite the edge being classified as an arc in the brep (via `getBrepGeometryByIndex`). Must use `circles` param instead.
- **Trigger:** Any circular edge on cylinder, cone, or sphere.
- **Workaround:** Use `circles` param for circular/near-360° edges. Use `arcs` only for non-circular arcs (fillet arcs, partial arcs).

### 119. [ ] 🕳️ `assembly.deleteTemplate` — assembly root ID is a silent no-op

- **Session:** `2026-04-22_18-07-00_assembly-deleteTemplate` (journal entry 04)
- **Error:** 🤫 Passing the assembly root ID returns maxLevel 31 (success), no messages, but nothing is deleted. The ID is type-valid (CC_AssemblyRoot) but it's not a template in any container.
- **Trigger:** `deleteTemplate({ ids: [asmId] })`
- **Workaround:** Only pass IDs from `getPartTemplate` / `getAssemblyTemplate`.

### 120. [ ] ⚠️ `assembly.deleteTemplate` — stale currentProduct after deleting active template

- **Session:** `2026-04-22_18-07-00_assembly-deleteTemplate` (journal entry 06)
- **Error:** Deleting the template that is `currentProduct` succeeds (maxLevel 31) but leaves `structure.currentProduct` pointing to the now-deleted ID. Subsequent operations in template context may behave unpredictably.
- **Trigger:** `deleteTemplate({ ids: [tplId] })` while `currentProduct === tplId`
- **Workaround:** Always call `setCurrentProduct({ id: asmId })` before or immediately after deleting a template.

### 121. [ ] 🟡 `assembly.spherical` — negative yRotationLimits.max silently accepted

- **Session:** `2026-04-29_19-00-00_assembly-spherical` (journal entry 05)
- **Error:** `yRotationLimits: { max: -1 }` creates successfully (maxLevel 31). Semantically invalid but no validation.
- **Trigger:** `spherical({ ..., yRotationLimits: { max: -1 } })`
- **Workaround:** Validate max >= 0 before calling the API.

### 118. [ ] 📖 `part.getBrepGeometryIndex` — docs say part ID accepted but it fails

- **Session:** `2026-04-21_19-00-00_part-getBrepGeometryIndex` (journal entry 04)
- **Error:** Docs say `id` is "id of a solid or a feature containing a solid" but passing a part ID returns "Not a brep!" (maxLevel 51). Only feature IDs work.
- **Trigger:** `getBrepGeometryIndex({ id: partId, geomId: edgeId })`
- **Workaround:** Always pass a feature ID (e.g., from `part.box`), not a part ID.

### 119. [ ] 📖 `assembly.group` — empty instanceIds creates group with FATAL level

- **Session:** `2026-05-01_00-00-00_assembly-group` (journal entry 04)
- **Error:** `group({ id: asmId, instanceIds: [] })` returns a valid group ID but with maxLevel 61 (FATAL): "No instances were provided for the Group constraint". The group is created but empty — an inconsistent state.
- **Trigger:** Empty array `[]` for instanceIds
- **Workaround:** Always provide at least one instance ID.

### 120. [ ] ⚠️ `assembly.group` — stale instanceIds after instance deletion

- **Session:** `2026-05-01_00-00-00_assembly-group` (journal entry 05)
- **Error:** Deleting an instance that belongs to a group does NOT delete the group or update its instanceIds. `getGroup` still returns the deleted instance IDs — they are stale references to nonexistent objects.
- **Trigger:** `deleteInstance({ id: inst })` when inst is in a group
- **Workaround:** Manually delete or update the group after deleting grouped instances.

### 121. [ ] 📖 `solid.box` and `solid.cylinder` — old LLM docs invented wrong alignment claims

- **Session:** Discovered 2026-05-01 during ad-hoc MCP-tool work, root-caused to `2026-04-13_22-00-00_solid-box` and `2026-04-13_24-00-00_solid-cylinder` training sessions.
- **Error:** LLM docs claimed `solid.box` was "corner-aligned at (0,0,0)→(+L,+W,+H)" and `solid.cylinder` extended "z=0..h". Both wrong. All four `solid.*` primitives are fully centered at origin. Wrong claims propagated via cross-references to `solid/cylinder.md`, `solid/cone.md`, `solid/sphere.md`, `solid/copy.md`, `solid/generic.md`, `solid/box.md`.
- **Root cause:** The training journals listed alignment as a question to answer but never wrote a script that measured a vertex coordinate or COG. Filled the LLM doc from generic-CAD muscle memory.
- **Workaround:** Fixed in commit XYZ on 2026-05-01. Regression test at `scripts/verify-primitive-alignment.mjs` should be run any time the kernel version bumps.

### 122. [ ] 📖 `part.*` vs `solid.*` — DIFFERENT alignment conventions, never previously documented

- **Session:** Discovered 2026-05-01 while writing the regression test for entry 121.
- **Finding:** `solid.*` family is all centered at origin. `part.*` family is mostly NOT — `part.box` is corner-aligned (+X+Y+Z), `part.cylinder` and `part.cone` are base-anchored (z=0..H), only `part.sphere` matches its solid sibling. Verified via vertex 0 + COG measurements.
- **Practical impact:** mixing the two families in one part requires offsetting one. Through-cuts via `part.cylinder` need a workCSys at z=`-H/2`.
- **Workaround:** Now documented in `references/part/feature-vs-direct.md` (Alignment Conventions Differ section) and per-primitive Alignment sections in `part/box.md`, `part/cylinder.md`, `part/cone.md`, `part/sphere.md`.

### 123. [ ] 📖 Audit suspicion — other unverified spatial claims may exist

- **Session:** 2026-05-01 sweep
- **Finding:** The same training failure mode (claim invented from CAD-world muscle memory, never measured) likely affects other LLM docs that make spatial claims. Highest-risk neighbors: `solid/extrusion.md` (where does the extruded body sit by default?), `solid/revolve.md`, `solid/scale.md` (pivot point), `solid/mirror.md` (default plane), `solid/translation.md` and `solid/rotation.md` (default origin reference). None confirmed wrong, but none verified either.
- **Workaround:** Future training sessions should re-read each of these LLM docs and run a vertex/COG measurement to confirm any default-position claim before trusting it. Per the new SOUL.md rule, spatial claims now require numeric proof.

### 124. [ ] 🕳️ `assembly.deleteTemplate` — passing assembly root ID silently corrupts state

- **Session:** `2026-05-05_12-07-00_assembly-deleteTemplate` (journal scripts 06, 08)
- **Error:** `deleteTemplate({ ids: [asmRootId] })` returns maxLevel=31 (no error) but corrupts the assembly tree. After this call, `getInstance` fails (returns null, maxLevel=51) and new instances cannot be created.
- **Trigger:** Passing the assembly root ID (from `assembly.create`) instead of a template ID.
- **Workaround:** Only pass IDs returned by `partTemplate` or `assemblyTemplate`. The API does not validate that IDs are actual templates. Instance IDs are correctly rejected (error 1006), but assembly root IDs are silently accepted and cause corruption.

### 125. [ ] `assembly.convertToTemplate` — fails after `part.create` in same session

- **Session:** `2026-05-05_13-07-00_assembly-convertToTemplate` (journal script 04)
- **Error:** `convertToTemplate` returns maxLevel=51 ("Assembly building is not initialized!") when called on an assembly created after a prior `part.create` in the same harness run — even though `assembly.create` succeeded.
- **Trigger:** `part.create(...)` → `assembly.create(...)` → `convertToTemplate(...)` in sequence without drawing clear between part.create and assembly.create.
- **Workaround:** Always start fresh with `assembly.create` — do not call `part.create` first in the same session. If you must, call `common.clear({})` between them.

### 127. [ ] 📖 `assembly.getFastened` — docs claim instance ID accepted but only assembly root works

- **Session:** `2026-05-05_18-00-00_assembly-getFastened` (journal script 05)
- **Error:** API docs say `param.id` is "id of the assembly or instance to look for constraint", but passing any instance or template ID returns error: "The provided product or product reference id is not a Assembly." (maxLevel=51).
- **Trigger:** `getFastened({ id: instanceId, name: 'X' })` — any non-assembly-root ID.
- **Workaround:** Always pass the assembly root ID from `assembly.create`.

### 126. [ ] 📖 `calculateMassProperties(instanceId)` — silently materializes/locks instance geometry

- **Session:** `2026-05-05_14-00-00_assembly-templateVsInstance` (journal scripts 09-14)
- **Error:** Not an error per se, but undocumented behavior: calling `calculateMassProperties` on an individual instance ID causes ALL instances of the same template to become independent copies. Subsequent template modifications no longer propagate to those instances. No warning, no error — silent side effect.
- **Trigger:** `api.v1.assembly.calculateMassProperties({ id: instanceId })` — only when `id` is a specific instance, not the root assembly or template.
- **Workaround:** To avoid materialization, use `calculateMassProperties(rootAssemblyId)` to get combined mass properties, or `calculateMassProperties(templateId)` for template-local properties. After materialization, delete and recreate instances to get fresh template geometry.

### 128. [ ] 🕳️ `assembly.fastenedOrigin` — duplicate constraints on same instance silently accepted

- **Session:** `2026-05-05_19-00-00_assembly-fastenedOrigin` (journal entry 10)
- **Error:** 🤫 Creating two `fastenedOrigin` constraints on the same instance succeeds without error (maxLevel 31 for both). The first constraint wins for positioning; the second has no spatial effect but is stored and returned by `getFastenedOrigin`.
- **Trigger:** `fastenedOrigin({ id: asmId, mate1: { path: [inst], csys: wcs }, xOffset: 50 })` then `fastenedOrigin({ id: asmId, mate1: { path: [inst], csys: wcs }, xOffset: 100 })` — instance stays at xOffset=50.
- **Workaround:** Avoid creating multiple fastenedOrigin constraints on the same instance. Use `updateFastenedOrigin` to modify an existing constraint instead.

### 129. [ ] 🕳️ `assembly.revolute` — duplicate constraint names silently accepted

- **Session:** `2026-05-08_01-00-00_assembly-revolute` (journal entry 10)
- **Error:** Creating two revolute constraints with the same name succeeds without error (maxLevel 31). `getRevolute` may return either one unpredictably.
- **Trigger:** `revolute({ id: asmId, name: 'DupTest', mate1: ..., mate2: ... })` called twice with the same name.
- **Workaround:** Use unique constraint names. Check with `getRevolute` before creating.

### 130. [ ] 📖 `assembly.revolute` — missing required params give cryptic errors

- **Session:** `2026-05-08_01-00-00_assembly-revolute` (journal entry 10)
- **Error:** Omitting `mate2` or `mate2.csys` produces "Evaluation error in AbstractAPI.PrepareAPIParams:[CCVM::not: unexpected type]" (maxLevel=51). No hint about which parameter is missing.
- **Trigger:** `revolute({ id: asmId, name: 'Rev', mate1: { path: [inst1], csys: wcsA } })` (no mate2).
- **Workaround:** Ensure both mate1 and mate2 are complete objects with `path` and `csys`.

### 131. [ ] 📖 `assembly.gear` — docs say "constraint" but only revolute accepted

- **Session:** `2026-05-08_10-00-00_assembly-gear` (journal entry 08, 09)
- **Error:** The API docs describe `constr1Id` and `constr2Id` as generic "constraint" IDs, but the server only accepts revolute constraints. Cylindrical, fastened, fastenedOrigin, planar, slider, and spherical all fail with: "wrong id type! Provide only following id types: [\"revoluteconstraint\"]" (code 1001).
- **Trigger:** `gear({ id: asmId, constr1Id: cylindricalId, constr2Id: cylindricalId2, ratio: 1 })`
- **Workaround:** Only use revolute constraint IDs with gear.

### 132. [ ] 🕳️ `assembly.gear` — self-linking silently accepted

- **Session:** `2026-05-08_10-00-00_assembly-gear` (journal entry 08)
- **Error:** 🤫 Passing the same revolute constraint ID for both `constr1Id` and `constr2Id` succeeds without error (maxLevel 31, returns a gear relation ID). Likely a no-op but not validated.
- **Trigger:** `gear({ id: asmId, constr1Id: revId, constr2Id: revId, ratio: 2 })`
- **Workaround:** Use two different revolute constraints.

### 133. [ ] 🕳️ `assembly.group` — empty instanceIds creates degenerate group at FATAL level

- **Session:** `2026-05-08_11-00-00_assembly-group` (journal entry 05)
- **Error:** `group({ id: asmId, name: 'Empty', instanceIds: [] })` returns an ID (182) AND a FATAL message (level 61): "No instances were provided for the Group constraint". The group is created despite the FATAL error.
- **Trigger:** Empty array for instanceIds.
- **Workaround:** Always pass at least one valid instance ID.

### 134. [ ] 🕳️ `assembly.group` — duplicate instance IDs not deduplicated

- **Session:** `2026-05-08_11-00-00_assembly-group` (journal entry 05)
- **Error:** 🤫 `group({ id: asmId, instanceIds: [A, A, B] })` stores duplicates without error. getGroup returns `instanceIds: [A, A, B]`.
- **Trigger:** Repeated instance ID in the instanceIds array.
- **Workaround:** Deduplicate instanceIds client-side before calling group.

### 135. [ ] 🕳️ `assembly.update3DConstraintValue` — silent no-op on rigid constraints and non-DOF names

- **Session:** `2026-05-08_13-00-00_assembly-update3DConstraintValue` (journal entries 01, 02, 03, 05, 06, 11)
- **Error:** 🤫 Calling with a fastened/fastenedOrigin ID or with a non-DOF name on a kinematic constraint returns maxLevel=31 (success) but does nothing. No error, no warning. The value is unchanged.
- **Trigger:** `update3DConstraintValue({ id: fastenedId, name: 'X_OFFSET', value: 100 })` or `update3DConstraintValue({ id: revoluteId, name: 'Z_OFFSET', value: 50 })` (revolute only has Z rotation DOF).
- **Workaround:** Only use DOF-matching names per constraint type (see LLM doc for mapping table).

### 136. [ ] 📖 `assembly.update3DConstraintValue` — spherical joints cannot be driven (X/Y_ROTATION not valid)

- **Session:** `2026-05-08_13-00-00_assembly-update3DConstraintValue` (journal entries 07, 11)
- **Error:** Spherical constraint DOFs are X and Y rotation. But X_ROTATION and Y_ROTATION are not accepted (error 1013). Z_ROTATION has no effect on spherical. The API only accepts 4 names: X_OFFSET, Y_OFFSET, Z_OFFSET, Z_ROTATION.
- **Trigger:** `update3DConstraintValue({ id: sphericalId, name: 'Z_ROTATION', value: 1.0 })` — silent no-op.
- **Workaround:** None — spherical joints cannot be driven programmatically via this API.

### 137. [ ] 📖 `assembly.update3DConstraintValue` — no readback API for current DOF value

- **Session:** `2026-05-08_13-00-00_assembly-update3DConstraintValue` (journal entry 10)
- **Error:** After setting DOF values via update3DConstraintValue, the get\* APIs (getRevolute, getCylindrical, etc.) do NOT return the current DOF position. State objects are identical before and after the update.
- **Trigger:** `update3DConstraintValue({ id: revId, name: 'Z_ROTATION', value: '45deg' })` then `getRevolute({ id: asmId, name: 'Rev' })` — no Z_ROTATION field in result.
- **Workaround:** Use `calculateMassProperties(instanceId)` to measure the instance position and infer the DOF value.

### 138. [ ] 📖 `assembly.transformInstance` — docs claim "scaling is ignored" but scale matrices silently change position

- **Session:** `2026-05-09_01-00-00_assembly-transformInstance` (journal entry 07)
- **Error:** A 2x scale matrix `[[2,0,0,0],[0,2,0,0],[0,0,2,0],[0,0,0,1]]` is accepted (maxLevel=31). The rotation part is normalized, but the translation column absorbs the scaling from matrix composition. Instance at [20,30,0] moves to [40,60,0].
- **Trigger:** Any non-orthogonal matrix with uniform or non-uniform scaling.
- **Workaround:** Only use orthogonal rotation matrices. Do not rely on the "scaling is ignored" claim — the position will shift.

### 147. [ ] 📖 `assembly.setIdent` — inconsistent ident resolution across assembly APIs

- **Session:** `2026-05-09_09-00-00_assembly-setIdent` (journal entries 02-09)
- **Error:** Some assembly APIs resolve ident strings in `id` params, others only do stol (numeric string) conversion and reject custom idents with "couldn't be converted to an id."
- **Trigger:** Passing ident string to `setCurrentProduct`, `setCurrentInstance`, `calculateMassProperties`, `deleteConstraint`, or any constraint `path` array.
- **Workaround:** Only use ident strings with `instance`, `transformInstance`, `transformInstanceTo`, `deleteInstance`. Use numeric IDs everywhere else.

### 148. [ ] 📖 `drawing2d.getBoundaryBoxFromView` — empty types returns empty, contradicts docs

- **Session:** `2026-05-11_00-00-00_drawing2d-view` (journal entry 08)
- **Error:** Docs say "if empty all views will be returned" but passing `types: []` returns `[]` (empty array) instead of bboxes for all existing views.
- **Trigger:** `getBoundaryBoxFromView({ id: partId, types: [] })` after views created.
- **Workaround:** Always pass explicit type list.

### 149. [ ] 🟡 `drawing2d.view` — out-of-range color silently accepted

- **Session:** `2026-05-11_00-00-00_drawing2d-view` (journal entry 04)
- **Error:** Docs say color range is [0,256] but passing `color: 999` is silently accepted (no error, no warning).
- **Trigger:** `view({ id: partId, types: ['TOP'], color: 999 })`
- **Workaround:** None needed, but no validation is performed.

### trimCurves — worker hang on heavily-constrained sketch with many segments

- **Session:** `2026-06-10_08-59-01_build-lever-bracket` (journal entry 02)
- **Error:** `trimCurves` with 39 segment IDs never returns; worker pegged ~99% CPU; reproduced twice (also with `--debug`, 5-min cap). `kill -9` required.
- **Trigger:** sketch with ~20 constraints + 20 dimensions, `splitAllCurves` → 66 segments, then a 39-ID trim. The verified trim workflow (2026-06-10 trim-vs-constraints session) used ≤13 segments on ≤8 constraints — scale-dependent.
- **Workaround:** derive the profile from solved data into a second, unconstrained sketch (exact arc chain — no trim), or trim small batches on lightly-constrained sketches. Severity: HIGH (silent hang, kills the worker).

### 150. [ ] 🕳️ `sketch.splitCurve` — out-of-range values silently extrapolate geometry

- **Session:** `2026-06-30_10-19-00_sketch-splitCurve` (journal entry 12)
- **Error:** Values outside `[0,1]` are NOT validated or clamped (maxLevel 31, no warning). `[1.5]` on a 0..100 line cuts at x=150 and the far segment reaches x=200; `[-0.2]` produces vertices left of the start. Geometry silently grows beyond the source curve.
- **Trigger:** `splitCurve({ id, splits: [{ geomId: line, values: [1.5] }] })`
- **Workaround:** Caller must clamp values to `[0,1]` before calling.

### 151. [ ] 🕳️ `sketch.splitCurve` — UNSORTED values silently corrupt geometry (HIGH)

- **Session:** `2026-06-30_10-19-00_sketch-splitCurve` (journal entry 11)
- **Error:** Values are applied SEQUENTIALLY without sorting. Unsorted input (e.g. `[0.75,0.25]`) re-parameterizes the remainder each cut and extrapolates — a 100-long line came out 200 long (segment endpoints `0→75→125→200`), intervals returned non-monotonic `[[0,0.75],[0.75,0.25],[0.25,1]]`. maxLevel 31 (silent).
- **Trigger:** `splitCurve({ id, splits: [{ geomId: line, values: [0.75, 0.25] }] })`
- **Workaround:** ALWAYS pre-sort `values` ascending. Severity: HIGH (silent geometry corruption, no error).

### 152. [ ] 🕳️ `sketch.splitCurve` — boundary/duplicate values create silent zero-length segments

- **Session:** `2026-06-30_10-19-00_sketch-splitCurve` (journal entries 09, 10)
- **Error:** maxLevel 31, no warning. `[0]`→ degenerate `interval [0,0]`; `[1]`→ `[1,1]`; `[0,1]`→ two zero-length segments; `[0.5,0.5]`→ zero-length sliver `[0.5,0.5]` (start==end). No dedup, no endpoint guard.
- **Trigger:** `splitCurve` with a value of 0 or 1, or duplicate values.
- **Workaround:** Caller must drop boundary values and de-duplicate before calling.

### 153. [ ] 📖 `sketch.splitCurve` — guide's "Reversible / Undoable" claim is unbacked

- **Session:** `2026-06-30_10-19-00_sketch-splitCurve` (journal entry 22)
- **Error:** Source guide (`sketch-split-trim-guide.md`) says splitCurve is "Reversible? Yes" / "Undoable via the standard undo mechanism." No `common.undo`/`sketch.undo` endpoint exists (batch probe → null; wrapper has only `undoFillet`), and neither `postTrim` nor `splitCurvesMergeBack` restores a splitCurve result. A split is permanent.
- **Trigger:** N/A — documentation discrepancy.
- **Workaround:** Treat splitCurve as irreversible; do not document undo for it.

### 154. [ ] 📖 `sketch.splitCurve` — `geomId` resolved globally, not scoped to the `id` sketch

- **Session:** `2026-06-30_10-19-00_sketch-splitCurve` (journal entry 14)
- **Error:** Passing a curve id that belongs to a DIFFERENT sketch (on the same part) succeeds (maxLevel 31) and splits that foreign curve, even though `id` names an unrelated sketch. The `id`/`geomId` relationship is not validated.
- **Trigger:** `splitCurve({ id: sketchA, splits: [{ geomId: curveInSketchB, values: [0.5] }] })`
- **Workaround:** Pass the correct sketch as `id`; don't rely on `id` to scope/guard which curve is split.

### 155. [ ] 🕳️ `sketch.trim` — silent no-op when passed an original/source curve id

- **Session:** `2026-06-30_12-44-12_sketch-preTrim` (journal entry 10)
- **Error:** `trim({ id, curveIds: [originalLineId] })` (an original sketch-curve id, not a staged `preTrim` segment id) returns maxLevel 31 with NO error and removes nothing. A bogus id correctly atomic-fails (1006), but a valid-but-wrong (original) id is a silent no-op — easy to think a trim worked when it did nothing.
- **Trigger:** passing `preTrim.result[].sourceId` (or any pre-split curve id) to `trim` instead of `splittedCurves[].id`.
- **Workaround:** only ever pass `splittedCurves[].id` values from the `preTrim` result to `trim`.

### 156. [ ] 🕳️ `sketch.preTrim` — overlapping/identical curves silently mishandled

- **Session:** `2026-06-30_12-44-12_sketch-preTrim` (journal entry 13)
- **Error:** Two identical fully-overlapping lines → both returned `[0,1]` (intersection UNDETECTED, maxLevel 31, no flag). A partial collinear overlap → each line splits at the other's interior endpoint and the overlap region is DUPLICATED as a segment in both curves. All silent.
- **Trigger:** coincident or partially-overlapping collinear curves in a preTrim.
- **Workaround:** de-duplicate / avoid overlapping geometry before preTrim; don't assume overlaps are detected.

### 157. [ ] 📖 `sketch.preTrim` — `curveIds: []` (empty array) is treated as ALL curves

- **Session:** `2026-06-30_12-44-12_sketch-preTrim` (journal entries 06, 16)
- **Error:** Passing an empty `curveIds` array does NOT mean "split nothing" — it behaves identically to omitting `curveIds` (splits ALL curves). A caller that builds `curveIds` dynamically and ends up with `[]` will unexpectedly split the whole sketch.
- **Trigger:** `preTrim({ id, curveIds: [] })`.
- **Workaround:** guard against an empty `curveIds` array; skip the preTrim call if the intended subset is empty.

### 158. [ ] 📖 `sketch.preTrim` — construction lines & rigidSet members silently pass through (no diagnostic)

- **Session:** `2026-06-30_12-44-12_sketch-preTrim` (journal entry 14)
- **Error:** A construction line (`isConstruction:true`) and rigidSet members appear in the result as uncut `[0,1]` parts (id reused) with maxLevel 31 and NO message — yet they still cut the normal curves they cross. The only signal that a curve was "not trimmable" is `id === sourceId`. (Contrast: `splitCurve` returns mL51 "Curve shouldn't be a part of rigidset!" — preTrim is silent.)
- **Trigger:** preTrim over a mix including construction/rigidSet geometry.
- **Workaround:** detect non-trimmable participants by `id === sourceId` in the result; there is no warning.

### 159. [ ] 🕳️ `sketch.preTrim` — stale empty `NoneSplitted0` container leaks; re-preTrim kills prior segment ids

- **Session:** `2026-06-30_12-44-12_sketch-preTrim` (journal entry 15)
- **Error:** Calling `preTrim` twice without `postTrim` silently overwrites the staging (maxLevel 31): the first batch's segment ids go DEAD (`getPositions` mL51). After `postTrim`, a stale empty `NoneSplitted0` `CC_Container` remains in the tree (postTrim does not clean it). Cosmetic — geometry and original ids are fine.
- **Trigger:** a second `preTrim` before `postTrim`; observe `NoneSplitted0` after finalizing.
- **Workaround:** never cache `preTrim` segment ids across a re-preTrim; ignore the leftover `NoneSplitted0` node.

### 160. [ ] 🕳️ `sketch.trim` — `curveIds` resolved globally (not scoped to the `id` sketch)

- **Session:** `2026-06-30_13-59-28_sketch-trim` (journal entry 07)
- **Error:** `trim({ id: sk1, curveIds: [segmentStagedInSk2] })` returns maxLevel 31 and actually trims the segment in **sk2** (the foreign sketch), leaving sk1's own staging untouched. trim resolves segment ids globally rather than verifying they belong to the named sketch. Same class of footgun as `splitCurve` global geomId resolution (#154).
- **Trigger:** passing a `preTrim` segment id from a different sketch than the one named in `id`.
- **Workaround:** only pass segment ids from the sketch you're trimming; never assume `id` scopes `curveIds`.

### 161. [ ] 📖 `sketch.trim` — id-handling differs from preTrim: duplicate errors, dead id 1006, source id silent skip

- **Session:** `2026-06-30_13-59-28_sketch-trim` (journal entries 04, 06)
- **Error/behavior:** (a) a **duplicate segment id** `[s,s]` makes trim **error (mL51)** — NOT idempotent — whereas `preTrim` accepts duplicate `curveIds` (splits twice). (b) A **dead** segment id (already trimmed, or killed by a re-`preTrim`) → atomic **mL51 1006**. (c) A real-but-**unstaged** curve id (an original `sourceId`) → **silent per-element no-op (mL31)** while valid segments in the same call are still trimmed. (d) `trim([])` is a safe no-op, unlike `preTrim([])` which means ALL.
- **Trigger:** the respective curveIds shapes above.
- **Workaround:** pass de-duplicated, currently-staged segment ids only; expect 1006 on any dead id and a silent skip on a source id.

### 162. [ ] 🕳️ `sketch.postTrim` — trimming a dimension's anchor point silently DROPS the dimension

- **Session:** `2026-07-01_08-27-51_sketch-postTrim` (journal entry 04)
- **Error:** A dimension survives postTrim only if BOTH its anchor points survive. If a `trim` removes a segment that carries one of a dimension's anchor points, postTrim **drops the dimension entirely** (dimensionCount 1→0) — it is NOT re-anchored to the surviving segment. maxLevel 31, no warning. Verified: HORIZONTAL_DISTANCE on H endpoints (0,50)/(100,50); trimming the (100,50)-bearing segment → dimension gone after postTrim.
- **Trigger:** trimming away a segment whose endpoint is a dimension's anchor.
- **Workaround:** don't trim segments carrying dimension anchors, or re-create the dimension after postTrim; check dimensionCount before/after if dimensions matter.

### 163. [ ] 📖 `sketch.postTrim` — NoneSplitted0 leak also from trim-then-re-preTrim; a 2nd postTrim does NOT sweep it (refines #159)

- **Session:** `2026-07-01_08-27-51_sketch-postTrim` (journal entry 08)
- **Error:** The stale empty `NoneSplitted0` `CC_Container` leak (originally attributed to preTrim-twice, #159) also occurs on the **`trim`-then-re-`preTrim`** path — i.e. any re-`preTrim` without an intervening `postTrim`. A subsequent `postTrim` does **not** sweep the orphan; empties persist and accumulate. Purely cosmetic — geometry, original ids, and fresh cycles are unaffected.
- **Trigger:** any second `preTrim` (with or without an intervening `trim`) before a `postTrim`.
- **Workaround:** always `postTrim` before re-`preTrim`; ignore the leftover empty `NoneSplitted0` node.

### 164. [ ] 📖 `sketch.postTrim` — constraint/dimension handle ids churn even on a NO-TRIM postTrim

- **Session:** `2026-07-01_08-27-51_sketch-postTrim` (journal entry 05)
- **Error/behavior:** Geometry ids are stable across a no-trim postTrim (originals restored, byte-exact coords), BUT constraint and dimension **handles are recreated with new ids anyway** (verified: dimension `HD_A` id 72→104 with nothing trimmed). Caching a constraint/dimension id across any postTrim yields a stale/invalid id.
- **Trigger:** any postTrim, including no-trim; re-using a cached handle id afterward.
- **Workaround:** always re-fetch constraint/dimension handles by NAME after postTrim.

### 165. [ ] 🟡 `sketch` trim workflow — trimming a circle down to arcs leaves the circle's CENTER as an isolated point

- **Session:** `2026-07-01_08-57-10_trim-recognition-advanced` (case 07)
- **Error:** After `preTrim → trim → postTrim` reduces a full circle to one or more surviving arcs, the circle's center point can remain in the sketch as an isolated `getGeometry().points[]` entry (visible as a stray dot in snapshots). Cosmetic; does not affect the profile curves.
- **Trigger:** any trim that removes all of a circle's arcs but keeps others / reduces a circle to arcs.
- **Workaround:** delete leftover center points with `sketch.deleteObject` if the profile must be point-clean.

### 166. [✅] 🐛 `render-direct.mjs` — arcs drawn as minor sweep (FIXED 2026-07-01)

- **Session:** `2026-07-01_08-57-10_trim-recognition-advanced` (cases 01/02)
- **Error:** The sketch renderer drew every arc as its minor (<180°) sweep, ignoring the stored `bulge`, so major arcs (e.g. a union-of-circles outer boundary) rendered as their minor complement — a union blob looked like an intersection lens. Root cause: `tessellateArc` forced `a1-a0 <= π` and the sketch path never passed the `bulge`.
- **Fix:** `fetchSketchData` reads `members.bulge.value`; `tessellateArc(start,end,center,n,mid,bulge)` derives center+sweep from the signed bulge when provided (backward-compatible; solids/curves unaffected). Verified: union→blob, intersection→lens, minor arcs unbroken.

### 167. [✅] ⚠️ `sketch.copyGeometry` — `doCopyConstraints` return-null bug (ROOT-CAUSE FIXED 2026-07-01)

- **Session:** `2026-07-01_12-19-23_copyGeometry` (Category 4.10 #5)
- **Was:** `true`/default → `result: null` even though the copy succeeds; `false` → `result: id[]`. Had to pass `doCopyConstraints:false` or diff `getGeometry` to get the ids.
- **FIXED in classcad source:** `SketcherHelper.CopyObjects` returned `copies` only on the `false` branch and fell through to a bare `RETURN;` otherwise. Changed to `RETURN copies;` — now every path returns the ids (`true` returns geometry + copied constraints, so longer than input; `false` = one per input). Recompiled worker + verified. cclasses branch `fix/copyobjects-missing-return` (a9d49c3b), user will merge. `copyGeometry.md` rewritten for fixed behavior (with a Version note for pre-fix builds).
- **Still true:** `translation` required (omit → 1004); empty `geomIds` silent no-op; invalid id → 1006; null → 1001.

### 168. [ ] 📖 `sketch.copyGeometry` — what actually travels with a copy

- **Session:** `2026-07-01_12-19-23_copyGeometry`
- **Finding:** child points are copied AND translated (circle center `[5,5]`+`[80,0,0]` → `[85,5,0]`). With `true`, geometric constraints duplicate (2 perpendicular joined lines → +7 constraint nodes) and a dimension's underlying constraint duplicates (`CC_2DRadiusConstraint` 1→2) but its driving annotation does NOT (`CC_RadialFeatureDimension` stays 1) → copies are size-locked, not re-annotated. With `false`, bare geometry only (no constraints, not even auto H/V). Doc updated with a "What gets copied" section.

### 169. [ ] 📖 `sketch.copyFrom` — cross-sketch MERGE (adds, never replaces); copies FULL dimensions

- **Session:** `2026-07-01_12-19-23_copyGeometry` (Category 4.10 #6)
- **Finding:** `copyFrom({id:DEST, toCopyId:SRC})` returns VOID (null, maxLevel 31) and MERGES — dst keeps its own geometry and gains src's (dst 1 line → 5 lines + circle). Copies ALL constraints (no flag; fixation/coincident/parallel/perpendicular/horizontal/radius all doubled) at the SAME positions (no offset — copied circle at exactly src's `[60,15,0]`). Self-copy (id==toCopyId) duplicates on top; empty source is a no-op.
- **Distinction from copyGeometry:** copyFrom copies the FULL driving dimension — `CC_2DRadiusConstraint` 1→2 AND `CC_RadialFeatureDimension` 1→2 (+ new per-sketch `CC_SketchDimensionSet`), whereas copyGeometry(true) copies only the constraint part. copyFrom = true sketch merge; copyGeometry = element duplication w/ translation + returned ids (when false).
- **Errors:** non-sketch id (part id) → 1001 `["sketch"]`; invalid toCopyId → 1006.

### 170. [ ] 📖 `sketch.loadFrom` — VERIFIED (doc was UNVERIFIED); `name` selection ≠ creation order

- **Session:** `2026-07-01_12-19-23_copyGeometry` (Category 4.10 #7)
- **Finding:** `loadFrom({id, partId, data|file|url, encoding?, format='OFB', name?})` loads ONE sketch from an OFB blob into `id`. First live verification (server was down at original training). Round-trip via `common.save({format:'OFB',encoding:'base64'})→result.content` ({content,success}). Returns VOID. Both `data`+base64 and `file` (absolute local path, worker is local) verified; `url` untested. **MERGES** (dest 1 line → 5 after loading a 4-line rect). `name` selects the sketch (`'B'`→4 lines, `'S'`→circle).
- **Gotcha:** WITHOUT `name`, the "first found in file stream" sketch loads — NOT creation order (OFB saved 'S' then 'B' → no-name loaded 'B'). Pass `name` for determinism. `partId` required (omit→1004); no source→1004; bad name→level-51 "couldn't be found in the of1 file stream"; garbage data→SketcherHelper.LoadSketch parse error.

### 171. [ ] ⚠️ `sketch.deleteObject` — multi-delete is ALL-OR-NOTHING (doc was wrong)

- **Session:** `2026-07-01_12-19-23_copyGeometry` (Category 4.10 #8 — closes the category)
- **Correction:** the doc claimed valid ids "may still be processed" when one id is invalid. FALSE — verified `deleteObject([validE, 999999, validF])` left BOTH E and F intact and returned 1006. It's atomic: one bad id rejects the whole batch → always `.filter(Boolean)` first. Doc fixed.
- **Verified cascade:** deleting geometry removes the element + its child points + EVERY referencing constraint/dimension (incl. `CC_LinearFeatureDimension`); no orphans. Deleting a constraint/dimension keeps geometry. (Orphan points are a TRIM artifact, not delete — see #165.) empty→no-op(31), invalid/double→1006, null→1001. `constraint([...])` returns an array of created ids.

### 172. [✅] ✨ construction geometry (`isConstruction`) — studied, renderer support added, docs written

- **Session:** `2026-07-01_14-30-00_construction-geometry` (recently-merged feature)
- **Surface:** `isConstruction` (bool, default FALSE) on `line`/`circle`/`arcByCenter`/`arcBy3Points`, on `rectangle` (all 4 lines), and per-item in batch `geometry`. Toggle on existing geom via `updateGeometry({id, lines:[{id, isConstruction:true|false}]})` (both ways). Query: `getGeometry` INCLUDES construction in lines/circles/arcs (indistinguishable there); `getObjectInfo.isConstruction` (0|1), `getObjectsLists.constructionGeometry` (id[]), `getGlobalState.constructionCount`. Tree member `members.isConstruction.value` (real 1|0).
- **Implications:** full constraint-solver participant (TANGENT to a construction axis enforced — its purpose: reference/skeleton). NOT actionable — normal square extrudes fine; construction-only `part.extrusion` HANGS the worker (had to restart).
- **⚠️→✅ HANG ROOT-CAUSED & FIXED:** `OperationsHelper.UpdateRegion` soft-filters construction curves (warning "Selection of construction geometry is not allowed") but kept going; a construction-ONLY selection left sketchCurves+regions empty, then it created an empty region and PreviewFeature hung building a solid from it. Fix: bail with a clear error the moment filtering leaves nothing usable, before the empty region is created. cclasses branch `fix/construction-extrude-hang` (874c3598, unpushed). Verified: construction-only extrude now returns fast at maxLevel 51 ("Cannot extrude: no usable (non-construction) geometry was selected" + "no sketch region"); normal extrude still builds; worker stays responsive.
- **Renderer:** `scripts/render-direct.mjs` reads `isConstruction` per curve and draws it dashed violet (`#a64dff`, dasharray 6,4, width 1.5). Verified across all creation paths.
- **Docs:** added `isConstruction` to line/circle/arcByCenter/arcBy3Points/rectangle/geometry/updateGeometry/getGeometry .md + a "Construction geometry" section in SKETCHING.md.
