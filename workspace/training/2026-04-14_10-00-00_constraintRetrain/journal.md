# Training: sketch.constraint — RETRAIN with planeId

**Date:** 2026-04-14

## Goal

Retraining `v1.sketch.constraint` with proper `planeId` on all sketches. The prior sessions (2026-04-08) created sketches without `planeId`, which silently disables the constraint solver. All solver-related findings from those sessions are **wrong** and must be re-verified.

**Methods to cover:**

- `constraint` — all 14 types: COINCIDENT, COLINEAR, CONCENTRIC, EQUAL_LENGTH, EQUAL_RADIUS, FIXATION, HORIZONTAL, MIDPOINT, PARALLEL, PERPENDICULAR, SPLINE_FIT_POINT, SYMMETRY, TANGENT, VERTICAL
- `constraint` params: id, type, geomIds, name
- Batch creation (array of constraint params)

**Key questions to re-answer with working solver:**

- Does each constraint type actually reposition geometry when solver is active?
- Does moveGeometry respect constraints when solver is on?
- Is there conflict/redundancy detection when solver is active?
- What does the solver do with over-constrained sketches?
- How does TANGENT behave (arc-line, arc-arc, circle-line)?
- What geomIds does each constraint type require?

---

## 01 — HORIZONTAL on a diagonal line

Script: `scripts/01-horizontal-moves.mjs` — ✅ Solver repositions geometry! Line end moved from (60,30) to (67.08, ~0).

| ![before](files/01-horizontal-moves-before-sketch-Sketch.png) | ![after](files/01-horizontal-moves-after-sketch-Sketch.png) |
|---|---|

**Data:** Line (0,0)→(60,30), length=67.08. After HORIZONTAL: (0,0)→(67.08, ~0). Solver preserved length (√(60²+30²)≈67.08) and made the line horizontal. See `files/01-horizontal-moves-horizontal-data.json`.

**Learned:** With `planeId`, the solver IS active. HORIZONTAL repositions geometry immediately at creation time. Length is preserved — the solver rotates the line to horizontal.

📌 LLM doc: HORIZONTAL on a line preserves length and rotates to horizontal. Solver runs immediately on constraint creation.

---

## 02 — VERTICAL on a diagonal line

Script: `scripts/02-vertical-moves.mjs` — ✅ Line end moved from (40,50) to (~10, 58.31).

| ![before](files/02-vertical-moves-before-sketch-Sketch.png) | ![after](files/02-vertical-moves-after-sketch-Sketch.png) |
|---|---|

**Data:** Line (10,0)→(40,50), length=58.31. After VERTICAL: (10,0)→(~10, 58.31). Solver preserved length and made line vertical. See `files/02-vertical-moves-vertical-data.json`.

---

## 03 — COINCIDENT point-point

Script: `scripts/03-coincident-point-point.mjs` — ✅ l2.start snapped to l1.end position.

| ![before](files/03-coincident-point-point-before-sketch-Sketch.png) | ![after](files/03-coincident-point-point-after-sketch-Sketch.png) |
|---|---|

**Data:** l1.end at (40,0), l2.start at (50,10). After COINCIDENT: l2.start moved to (40,0). The unconstrained point moved to match the position of the other point. See `files/03-coincident-point-point-coincident-pp-data.json`.

📌 LLM doc: COINCIDENT snaps the less-constrained point to the more-constrained one.

---

## 04 — PARALLEL

Script: `scripts/04-parallel.mjs` — ✅ l2 rotated to become parallel to fixed horizontal l1.

| ![before](files/04-parallel-before-sketch-Sketch.png) | ![after](files/04-parallel-after-sketch-Sketch.png) |
|---|---|

**Data:** l1 fixed horizontal. l2 at (0,30)→(60,50) became (0,30)→(63.25, 30). l2 is now horizontal (parallel to l1), length preserved (√(60²+20²)≈63.25). See `files/04-parallel-parallel-data.json`.

---

## 05 — PERPENDICULAR

Script: `scripts/05-perpendicular.mjs` — ✅ l2 rotated to become perpendicular to fixed horizontal l1.

| ![before](files/05-perpendicular-before-sketch-Sketch.png) | ![after](files/05-perpendicular-after-sketch-Sketch.png) |
|---|---|

**Data:** l1 fixed horizontal. l2 at (30,10)→(40,60) became (30,10)→(30, 60.99). l2 is now vertical (perpendicular to l1), length preserved. See `files/05-perpendicular-perp-data.json`.

---

## 06 — TANGENT arc-line

Script: `scripts/06-tangent-arc-line.mjs` — ✅ Arc center moved from (40,25) to (40,15) — tangent to line at y=0.

| ![before](files/06-tangent-arc-line-before-sketch-Sketch.png) | ![after](files/06-tangent-arc-line-after-sketch-Sketch.png) |
|---|---|

**Data:** Line at y=0 (fixed). Arc center at (40,25), radius 15. After TANGENT: center moved to (40,15). Distance from center to line = 15 = radius. ✅ Tangent. See `files/06-tangent-arc-line-tangent-data.json`.

📌 LLM doc: TANGENT moves the unconstrained arc/circle so its edge touches the fixed line. Works immediately.

---

## 07 — EQUAL_LENGTH (unexpected: no resize)

Script: `scripts/07-equal-length.mjs` — ⚠️ Constraint created but l2 length unchanged (30, not 60).

| ![before](files/07-equal-length-before-sketch-Sketch.png) | ![after](files/07-equal-length-after-sketch-Sketch.png) |
|---|---|

**Data:** l1 fixed, length 60. l2 free, length 30. After EQUAL_LENGTH: l2 still length 30. Constraint created (ID 74, maxLevel=31, no error). See `files/07-equal-length-equal-length-data.json`.

---

## 07b — EQUAL_LENGTH with more constraints (still no resize)

Script: `scripts/07b-equal-length-constrained.mjs` — ⚠️ Even with l2.start fixed + HORIZONTAL, EQUAL_LENGTH didn't resize.

| ![before](files/07b-equal-length-constrained-before-sketch-Sketch.png) | ![after](files/07b-equal-length-constrained-after-sketch-Sketch.png) |
|---|---|

**Data:** l2 start fixed at (0,30), HORIZONTAL applied, then EQUAL_LENGTH(l1, l2). l2 stayed at length 30, not 60. See `files/07b-equal-length-constrained-equal-length-constrained-data.json`.

**Learned:** EQUAL_LENGTH creates the constraint but the solver does not retroactively resize lines. The constraint may only prevent future changes from breaking equality, or may need dimensions/updateDimension to trigger resizing. This contrasts with directional constraints (HORIZONTAL, PARALLEL, etc.) which DO reposition geometry immediately.

📌 LLM doc: EQUAL_LENGTH does NOT resize lines at creation time. The constraint is stored but requires additional solver triggers (dimension changes) to enforce.

---

## 08 — EQUAL_RADIUS

Script: `scripts/08-equal-radius.mjs` — Constraint created (ID 68, maxLevel=31). Radius change not numerically verified (getGeometry returns IDs only).

| ![before](files/08-equal-radius-before-sketch-Sketch.png) | ![after](files/08-equal-radius-after-sketch-Sketch.png) |
|---|---|

**Data:** c1 radius 30 (fixed), c2 radius 15. After EQUAL_RADIUS: constraint created. See `files/08-equal-radius-equal-radius-data.json`. Likely same behavior as EQUAL_LENGTH — constraint stored but radius not changed immediately.

---

## 09 — SYMMETRY

Script: `scripts/09-symmetry.mjs` — ✅ pt2 moved to mirror of pt1 about axis.

| ![before](files/09-symmetry-before-sketch-Sketch.png) | ![after](files/09-symmetry-after-sketch-Sketch.png) |
|---|---|

**Data:** Axis at x=40, pt1 fixed at (10,20), pt2 at (60,25). After SYMMETRY: pt2 moved to (70, 20). Mirror of (10,20) about x=40 is (70,20). ✅ Perfect symmetry. See `files/09-symmetry-symmetry-data.json`.

**Learned:** SYMMETRY geomIds = [axis, elem1, elem2]. Axis first. The less-constrained element moves to mirror the fixed one. Both X and Y are mirrored about the axis.

📌 LLM doc: SYMMETRY format: `geomIds: [axisLine, element1, element2]`. Axis first. Solver mirrors the unconstrained element.

---

## 10 — FIXATION prevents movement

Script: `scripts/10-fixation.mjs` — ✅ Fixed line stayed put, free line adjusted for PARALLEL.

| ![result](files/10-fixation-result-sketch-Sketch.png) |
|---|

**Data:** l1 fixed (diagonal), l2 free (different angle). After PARALLEL(l1, l2): l1 did NOT move, l2 DID move to become parallel. See `files/10-fixation-fixation-data.json`.

📌 LLM doc: FIXATION locks geometry position. Other constraints affect only non-fixed geometry. Use FIXATION to anchor reference geometry before adding constraints.

---

## 11 — MIDPOINT on free point (partial convergence)

Script: `scripts/11-midpoint.mjs` — ⚠️ Point moved in X toward midpoint but Y didn't reach line.

| ![before](files/11-midpoint-before-sketch-Sketch.png) | ![after](files/11-midpoint-after-sketch-Sketch.png) |
|---|---|

**Data:** Line fixed at (0,0)→(80,0), midpoint=(40,0). Free point at (20,30). After MIDPOINT: point at (40, 27.7). X is correct (40), Y is wrong (27.7 vs 0). See `files/11-midpoint-midpoint-data.json`.

---

## 11b — MIDPOINT on line endpoint (works perfectly)

Script: `scripts/11b-midpoint-line-endpoint.mjs` — ✅ Line endpoint snapped to midpoint, free point barely moved.

| ![result](files/11b-midpoint-line-endpoint-result-sketch-Sketch.png) |
|---|

**Data:**
- Free sketch.point at (10,60): moved to (18, 64) — NOT at midpoint (40,20). Solver barely converged.
- Line endpoint at (100,50): moved to (40, 20) — exactly at midpoint. ✅

See `files/11b-midpoint-line-endpoint-midpoint-follow-up-data.json`.

**Learned:** MIDPOINT works correctly with line endpoints but NOT with free sketch.points. The solver fails to converge for free points. Always use a line endpoint as the constrained point, not a standalone sketch.point.

📌 LLM doc: MIDPOINT works reliably with line endpoints. Free sketch.points don't converge — avoid them with MIDPOINT.

---

## 12 — COLINEAR

Script: `scripts/12-colinear.mjs` — ✅ l2 snapped onto l1's infinite line.

| ![before](files/12-colinear-before-sketch-Sketch.png) | ![after](files/12-colinear-after-sketch-Sketch.png) |
|---|---|

**Data:** l1 fixed at y=0. l2 at (60,15)→(100,10). After COLINEAR: l2 at (60,0)→(100.3, 0). Both endpoints on y=0. Length preserved. See `files/12-colinear-colinear-data.json`.

---

## 13 — CONCENTRIC

Script: `scripts/13-concentric.mjs` — ✅ c2 center moved to match c1 center.

| ![before](files/13-concentric-before-sketch-Sketch.png) | ![after](files/13-concentric-after-sketch-Sketch.png) |
|---|---|

**Data:** c1 center at (0,0) fixed. c2 center at (50,30). After CONCENTRIC: c2 center at (0,0). ✅ See `files/13-concentric-concentric-data.json`.

---

## 14 — COINCIDENT point-on-line

Script: `scripts/14-coincident-pt-on-curve.mjs` — ✅ Point snapped onto line.

| ![before](files/14-coincident-pt-on-curve-before-sketch-Sketch.png) | ![after](files/14-coincident-pt-on-curve-after-sketch-Sketch.png) |
|---|---|

**Data:** Line fixed at y=0. Free point at (30,25). After COINCIDENT(pt, line): point at (30,0). ✅ On line. X preserved, Y snapped to 0. See `files/14-coincident-pt-on-curve-coincident-on-curve-data.json`.

📌 LLM doc: COINCIDENT works for point-on-curve (line, circle, arc). Order doesn't matter.

---

## 15 — HORIZONTAL on point pair

Script: `scripts/15-horiz-vert-points.mjs` — ✅ pt2 Y aligned with fixed pt1 Y.

| ![result](files/15-horiz-vert-points-result-sketch-Sketch.png) |
|---|

**Data:** pt1 fixed at (10,20). pt2 at (50,35). After HORIZONTAL([pt1, pt2]): pt2 at (52.72, 20). Y matches pt1's Y. ✅ See `files/15-horiz-vert-points-horiz-vert-points-data.json`.

---

## 16 — Batch constraint creation

Script: `scripts/16-batch-constraints.mjs` — ✅ Array input returns array of IDs.

| ![result](files/16-batch-constraints-result-sketch-Sketch.png) |
|---|

**Data:** Batch of 3 constraints on rectangle. Result: `[92, 94, 96]` — one ID per constraint. maxLevel=31. Named constraint in batch also works. See `files/16-batch-constraints-batch-data.json`.

📌 LLM doc: Pass array of param objects to create multiple constraints in one call. Returns array of IDs.

---

## 17 — Over-constraining (HORIZONTAL + VERTICAL on same line)

Script: `scripts/17-overconstraint.mjs` — ⚠️ No error on conflicting constraints, but solver keeps first solution.

| ![result](files/17-overconstraint-result-sketch-Sketch.png) |
|---|

**Data:** Diagonal line. HORIZONTAL applied → line rotated horizontal to (0,0)→(58.31, ~0). Then VERTICAL applied → constraint created (ID 66, maxLevel=31, no error) but line DID NOT change. Still horizontal. Duplicate HORIZONTAL also accepted silently.

See `files/17-overconstraint-overconstraint-data.json`.

**Learned:** Conflicting constraints are accepted without error. The solver satisfies the first constraint and ignores subsequent conflicting ones. No over-constraint detection. No warning. The constraint is stored in the tree but the solver treats it as unsatisfiable and keeps the existing solution.

📌 LLM doc: No conflict detection. Conflicting constraints are silently accepted. Solver satisfies what it can and ignores the rest.

---

## 18 — moveGeometry with active solver

Script: `scripts/18-moveGeometry-with-solver.mjs` — ❌ moveGeometry FAILS with error (null, maxLevel=51).

| ![before](files/18-moveGeometry-with-solver-before-sketch-Sketch.png) | ![after](files/18-moveGeometry-with-solver-after-sketch-Sketch.png) |
|---|---|

**Data:** Rectangle with bottom-left point fixed + HORIZONTAL on bottom edge. moveGeometry(bottom, [0,10,0]): returned null, maxLevel=51 (error). Geometry unchanged.

**Learned:** moveGeometry with an active solver (planeId set) returns error when the move conflicts with constraints. This is opposite to without planeId, where moveGeometry was a raw translation that always succeeded. With the solver active, moveGeometry is constraint-aware and rejects invalid moves.

📌 LLM doc: moveGeometry is constraint-aware with active solver. Returns null + error if move conflicts with constraints. Without planeId it was a raw translation — with planeId it's a constrained solve.

---

## 19 — Error cases

Script: `scripts/19-error-cases.mjs` — Mixed results. Some invalid constraints are created, some return null.

**Data:**
1. **PARALLEL with 1 line**: Created (ID 67!) but maxLevel=51, solver error "Index 1 ausserhalb des Arraybereichs" (array index out of bounds)
2. **HORIZONTAL on circle**: Created (ID 69!) but maxLevel=51, same solver error
3. **NONEXISTENT type**: null, maxLevel=51, "The provided value for parameter 'type' is not valid"
4. **Empty geomIds**: Created (ID 71!) but maxLevel=51, multiple solver errors
5. **EQUAL_LENGTH line+circle**: null, maxLevel=51, "Wrong number of geometry ids provided"

See `files/19-error-cases-error-cases.json`.

**Learned:** Error behavior is inconsistent:
- Invalid type → null (rejected properly)
- Wrong geometry count for EQUAL_LENGTH → null (rejected properly)
- Too few geomIds for PARALLEL, wrong geometry type for HORIZONTAL → **still created** (gets ID) but produces solver error (maxLevel=51)

📌 LLM doc: Always check maxLevel after constraint creation. A non-null result does NOT guarantee success — the constraint may be created but produce solver errors. Only maxLevel ≤ 31 is clean.

---

## 20 — Named constraints in structure tree

Script: `scripts/20-named-constraint.mjs` — ✅ Names appear in structure tree.

| ![result](files/20-named-constraint-result-sketch-Sketch.png) |
|---|

**Data:**
- Named "MyHoriz": node.name = "MyHoriz", class = "CC_2DHorizontalConstraint"
- Unnamed VERTICAL: node.name = "V" (auto-generated)
- Structure shows: entities array (geomIds), lgsState=1 (solved), alignment=1

See `files/20-named-constraint-named-constraint-data.json`.

📌 LLM doc: Constraint names appear in structure tree. Unnamed constraints get auto-names (H, V, etc.). Structure node has `entities` (geomIds), `lgsState` (1=solved).

---

## Summary of Key Findings (correcting 2026-04-08 session)

### The solver IS active with planeId

**All prior findings about "constraints being declarative only" were WRONG.** With `planeId` set on sketch creation:
1. **Constraints reposition geometry immediately** at creation time for directional/positional types: HORIZONTAL, VERTICAL, PARALLEL, PERPENDICULAR, COINCIDENT, COLINEAR, CONCENTRIC, TANGENT, SYMMETRY
2. **Length/radius equality constraints (EQUAL_LENGTH, EQUAL_RADIUS)** do NOT resize at creation time — the constraint is stored but length changes require other triggers
3. **MIDPOINT** works for line endpoints but fails for free sketch.points
4. **FIXATION** anchors geometry so other constraints affect only non-fixed elements
5. **moveGeometry** is now constraint-aware — returns error (null, maxLevel=51) when move conflicts with constraints
6. **No conflict detection** — conflicting constraints are accepted silently, solver satisfies what it can

### Constraint Type Summary

| Type | Tested | geomIds | Solver moves geometry? |
|---|---|---|---|
| COINCIDENT | ✅ | [pt, pt], [pt, line], [pt, circle], [pt, arc] | ✅ Yes — snaps points together / onto curves |
| HORIZONTAL | ✅ | [line] or [pt1, pt2] | ✅ Yes — rotates line / aligns Y coordinates |
| VERTICAL | ✅ | [line] or [pt1, pt2] | ✅ Yes — rotates line / aligns X coordinates |
| PARALLEL | ✅ | [line1, line2] | ✅ Yes — rotates unconstrained line |
| PERPENDICULAR | ✅ | [line1, line2] | ✅ Yes — rotates unconstrained line |
| TANGENT | ✅ | [arc/circle, line] | ✅ Yes — moves arc center to tangent distance |
| COLINEAR | ✅ | [line1, line2] | ✅ Yes — snaps onto same infinite line |
| CONCENTRIC | ✅ | [circle1, circle2] or [arc1, arc2] | ✅ Yes — moves center to match |
| SYMMETRY | ✅ | [axis, elem1, elem2] | ✅ Yes — mirrors unconstrained element |
| FIXATION | ✅ | [any geometry] | N/A — prevents movement |
| MIDPOINT | ⚠️ | [pt/lineEnd, line] | ✅ for line endpoints, ❌ for free points |
| EQUAL_LENGTH | ⚠️ | [line1, line2] | ❌ No resize at creation |
| EQUAL_RADIUS | ⚠️ | [circle1, circle2] | ❌ Likely no resize at creation |
| SPLINE_FIT_POINT | ❌ | — | Not tested (no spline creation API) |
