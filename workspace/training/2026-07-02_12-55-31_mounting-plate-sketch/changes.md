# Skill changes — mounting-plate session (2026-07-02)

Diff of knowledge/classcad-skill/references/ (committed inside the submodule this session):

```diff
diff --git a/references/SKETCHING.md b/references/SKETCHING.md
index d6fa8d3..17bf343 100644
--- a/references/SKETCHING.md
+++ b/references/SKETCHING.md
@@ -150,7 +150,31 @@ await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r })
 
 **The sketch MUST be created with `planeId`** (`sketch.create({ id: partId, planeId })`). Without it the constraint solver is silently disabled — constraints and dimensions are accepted (maxLevel 31, IDs returned) but never enforced, which makes the whole of Step 4 dead weight. This is the #1 trap (see `sketch/create.md`).
 
-**Leave the `gen*` auto-constraint flags ON (the defaults).** Auto-incidence wires endpoint-matching geometry together (`Auto_Coinc`), auto-H/V locks axis-aligned lines. That wiring is what lets a later dimension edit move the whole connected profile instead of tearing it: a gen-ON rectangle survives a width change closed; a gen-OFF one stretches one line and leaves the rest behind (verified 2026-06-10). Disable a flag selectively only when it would fight the design intent — e.g. `genVertAndHoriz: false` for a line drawn axis-aligned that will be dimensioned to an angle, or `genTangency: false` when overlapping skeleton circles must stay independently placeable until trimming.
+**Leave the `gen*` auto-constraint flags ON (the defaults)** when you rely on autos to wire
+the profile. Auto-incidence wires endpoint-matching geometry together (`Auto_Coinc`),
+auto-H/V locks axis-aligned lines. That wiring is what lets a later dimension edit move the
+whole connected profile instead of tearing it: a gen-ON rectangle survives a width change
+closed; a gen-OFF one stretches one line and leaves the rest behind (verified 2026-06-10).
+Disable a flag selectively only when it would fight the design intent — e.g.
+`genVertAndHoriz: false` for a line drawn axis-aligned that will be dimensioned to an angle,
+or `genTangency: false` when overlapping skeleton circles must stay independently placeable
+until trimming.
+
+**Fully explicit scheme (the conditioned-reproduction workflow): prefer autos OFF, and know
+the failure mode.** With exactly-computed seeds + every tangency/coincidence created
+explicitly, autos are pure duplicates. Verified on a 19-curve build (mounting-plate,
+2026-07-02): duplication itself is harmless — autos ON and OFF both solve rough→exact at
+2.8e-14 **when the explicit wiring is consistent with the seeds**. The danger: autos wire
+junctions FROM THE SEED GEOMETRY; your explicit constraints wire them from your bookkeeping.
+If those disagree (classic bug: mirrored arcs whose start/end roles got swapped, wired by a
+side-uniform loop), the two constraint sets contradict — and `DoSolve` does not just flag a
+loser, it DIVERGES GLOBALLY: batches return 51 with `CalcBulges radius too small` /
+`SetSE NullMem`, small arcs collapse to radius 0, and every later dimension refuses its value
+(even for satisfied, unrelated subgraphs). With autos OFF the same bookkeeping bug is benign:
+the explicit set alone is solvable, the solver quietly slides the mis-wired arcs into the
+role-swapped layout, and the numeric readback catches the few-mm displacement. That's the
+argument for `genIncidence/genTangency/genVertAndHoriz: false` in fully explicit builds — one
+source of truth turns a catastrophic wreck into a visible, diagnosable offset.
 
 This gives you a "skeleton" of overlapping shapes. Snapshot and compare against the source — you should be able to trace the final profile through the outermost arcs. If the shapes don't overlap in the right places, fix the layout scheme (anchors, dimensions) before proceeding.
 
@@ -254,11 +278,24 @@ await api.v1.sketch.dimension({
 - `ANGLE` works with non-intersecting lines — the solver extends them to their virtual intersection.
 - `OFFSET` between two parallel lines measures perpendicular distance, even if the lines don't overlap in projection.
 - `value` at creation drives the solver (verified 2026-06-10 — an earlier version of this guide called it broken; that observation came from planeless sketches whose solver never ran). Anchor a datum first or the solver picks what to move.
-- `updateDimension` re-solves the system: `result: 1` = solved, `0` = unsolved. A 0 usually means a planeless sketch or a conflicting constraint.
+- `updateDimension` re-solves the system: `result: 1|2` = solved (2 = well-constrained), `0` = unsolved. A 0 usually means a planeless sketch or a conflicting constraint.
 - `dimPos` for ANGLE selects which of the 4 angle sectors to constrain.
 
 ### Solver facts (verified 2026-06-10, extended 2026-07-02)
 
+- **TANGENT (line ↔ circle/arc) uses the INFINITE line.** The tangency point may lie beyond
+  the segment's endpoints — e.g. an arm edge tangent to a width-gauge circle whose contact
+  point is past the fillet junction solves exactly (mounting-plate, 1.6e-14). No constraint
+  forces the contact into the segment.
+- **A tangent-chain junction can degenerate.** `TANGENT(line, arc)` + COINCIDENT shared
+  endpoint has a spurious solution family at arc radius → 0 (line through the arc center).
+  A consistent scheme never lands there — every observed collapse (R dim reading "R0",
+  `CalcBulges radius too small`, `SetSE NullMem`) traced back to explicit junction wiring
+  that CONTRADICTED the auto-constraints' seed-derived wiring (endpoint roles swapped on
+  mirrored arcs). If you see these symptoms, diff your junction bookkeeping against the seed
+  adjacency before blaming the solver — and re-run with autos off to expose the mis-wiring
+  as a plain displacement.
+
 - **TANGENT keeps the seeded branch.** Circle–circle/arc–circle tangency seeded EXTERNAL solves external (d = r1+r2); seeded INTERNAL stays internal (d = R−r) through creation and every re-solve — an R12 dome inside-tangent to Ø5.6 eye circles followed the internal branch exactly when the eyes were re-dimensioned to Ø7 (robot-head session).
 - **Encode "2×" annotations as ONE driving dimension + EQUAL_RADIUS/EQUAL_LENGTH**, not two dims. `updateDimension` has NO batch form (an array param is a silent null no-op), so twin dims must be updated sequentially — and for symmetric schemes the intermediate state is unsolvable (result 0), which can leave a **stale arc `bulge`** in the structure tree even after the pair completes and all positions solve exactly (server bug, TODO #174 — see `sketch/updateDimension.md`). With EQUAL_*, one update re-solves both sides in a single solvable step and the trap never triggers.
 - **Don't pass `dimPos` at dimension creation** (except for ANGLE sector selection) — it can poison the whole `dimension` batch (maxLevel 51, VOID dims, half-driven sketch). Create dims bare, then place text via `updateDimensionPosition` (see `sketch/dimension.md`).
diff --git a/references/sketch/circularPattern.md b/references/sketch/circularPattern.md
index c8296ea..daccdd0 100644
--- a/references/sketch/circularPattern.md
+++ b/references/sketch/circularPattern.md
@@ -41,6 +41,11 @@ Patterns a rigid set (or single geometry element) in a circular arrangement arou
 - **Zero angle causes solver error.** Same division by zero as count ≤ 1. Copies are created but stacked at the same position. Avoid `angle: 0`.
 - **Single geometry ID works as rigidSetId.** The API auto-wraps it. `geometry[0]` will be a new rigid set ID, not the original geometry ID.
 - **Any sketch point works as center.** Not limited to origin — off-center points, line endpoints (from `getPoints`), arc centers all work.
+- **Works on a fully constrained, dimension-driven original** (verified 2026-07-02,
+  mounting-plate bolt circle): a Ø6 hole whose center is COINCIDENT on a construction bolt
+  circle + on the vertical centerline, driven by DIAMETER dims, patterned 6× about the hub
+  circle's centerId AFTER the solve — all 6 centers landed on the Ø42 circle at 60° spacing
+  to 1.6e-14. Pattern after the layout is solved, so copies replicate final geometry.
 - **`sketch.point` uses `pos`, not `position`.** Common mistake: `sketch.point({ id, pos: [x, y, z] })`.
 
 ## Updating Pattern Angle
diff --git a/references/sketch/constraint.md b/references/sketch/constraint.md
index cca8ffc..dca1023 100644
--- a/references/sketch/constraint.md
+++ b/references/sketch/constraint.md
@@ -98,6 +98,22 @@ With an active solver (planeId set), `moveGeometry` is constraint-aware:
 ## Gotchas
 
 - **Without `planeId`, constraints do nothing.** The #1 mistake. Always create sketches with a plane.
+- **TANGENT (line ↔ circle/arc) uses the INFINITE line.** The tangency point may lie beyond
+  the segment's endpoints and the constraint still solves exactly (verified 2026-07-02:
+  arm edge tangent to a width-gauge circle whose contact point lies past the segment end,
+  1.6e-14). Nothing forces the contact into the segment.
+- **Explicit junction wiring that contradicts the auto-constraints diverges DoSolve
+  GLOBALLY.** Autos (`Auto_Coinc` etc.) wire junctions from seed positions; if your explicit
+  COINCIDENT points at the other endpoint of the same arc (classic: mirrored arcs with
+  swapped start/end roles), the solver doesn't mark a loser — every subsequent solve fails
+  (`CalcBulges radius too small`, `SetSE NullMem`, arcs collapse to r=0, dimensions refuse
+  values, satisfied unrelated subgraphs get wrecked too). Verified 2026-07-02
+  (mounting-plate). Consistent duplication is harmless. Diagnosis: re-run with the batch
+  gen* flags off — the mis-wiring then shows as a plain solvable displacement.
+- **EQUAL_RADIUS works across independent tangent chains** (e.g. tying all four R3 fillets
+  of two separate arms to one driving dim) — verified exact at 1e-14 once wiring is
+  consistent. An earlier "cross-side EQUAL_RADIUS breaks the solver" observation was this
+  same wiring-contradiction confounder.
 - **EQUAL_LENGTH/EQUAL_RADIUS may change either element.** The solver equalizes by adjusting whichever line/circle it finds easier to move — even a "FIXATION"-constrained one. FIXATION locks position/direction but not length. To protect a line's length, fix both its endpoints individually.
 - **The FIXATION-doesn't-lock-length caveat applies to COINCIDENT too** (verified 2026-06-10): COINCIDENT between a fixed line's endpoint and another point can be satisfied by STRETCHING the fixed line along its direction (end moved 50→55 to meet the other point). With both endpoints individually fixed, the other geometry snaps instead.
 - **MIDPOINT fails on free sketch.points.** Use line endpoints (`getPoints().startId` or `.endId`) instead.
diff --git a/references/sketch/geometry.md b/references/sketch/geometry.md
index b7860d4..0466b98 100644
--- a/references/sketch/geometry.md
+++ b/references/sketch/geometry.md
@@ -45,6 +45,21 @@ Always returns all 5 arrays, even for types not requested (those will be empty `
 - **No input validation for degenerate geometry.** Zero-radius circles, zero-length lines (start==end), and negative-radius circles are accepted silently (maxLevel=31, no error). They create objects in the sketch but may cause issues downstream (extrusion, constraint solving).
 - **Empty/missing arrays are fine.** Passing `{ id: skId }` with no geometry arrays returns all 5 empty arrays without error. Passing empty arrays `points: []` also works.
 - **gen flags affect ALL geometry in the call.** Setting `genFixation: false` suppresses fixation constraints for every item created in that call, not selectively.
+- **⚠️ Autos + contradictory explicit wiring = global solver divergence.** Auto-generated
+  constraints encode junction topology FROM THE SEED POSITIONS. If an explicit COINCIDENT
+  disagrees (e.g. mirrored arcs with swapped start/end roles wired by a side-uniform loop),
+  `DoSolve` doesn't flag a loser — it diverges from an already-satisfied state: batches 51,
+  `CalcBulges radius too small`, `SetSE NullMem`, small arcs collapse to r=0, every later
+  dimension value refused, geometry wrecked (verified 2026-07-02, mounting-plate, 19 curves).
+  Pure duplication (explicit set consistent with seeds) is harmless — autos ON and OFF both
+  solved rough→exact at 2.8e-14. For fully explicit builds, pass `genIncidence: false,
+  genTangency: false, genVertAndHoriz: false`: the same wiring bug then just solves to a
+  visibly displaced layout that a numeric readback catches.
+- **Individual creators auto-generate too** (verified 2026-07-02): `sketch.line`/`circle`/
+  `arcByCenter` produced `Auto_Fix`, `Auto_Coinc` (at exactly-shared endpoints), `Auto_H`,
+  `Auto_V` — but NO tangency autos for exactly-tangent circle/line pairs. Only this batch
+  call's `genTangency` generates tangency constraints, and only this call exposes flags to
+  suppress generation.
 - **Structure tree accumulation.** When reading `r.structure` after calling `geometry()`, the tree contains ALL objects in the drawing (all parts, all sketches), not just what was just created. To compare constraint effects, use isolated parts/scripts.
 
 ## Auto-Constraint Flags
```
