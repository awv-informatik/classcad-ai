# Skill changes — 2026-06-10 constraint-solver investigation

Committed in `knowledge/classcad-skill` as 9bf4505.

```diff
diff --git a/references/SKETCHING.md b/references/SKETCHING.md
index 7abe9da..b38479f 100644
--- a/references/SKETCHING.md
+++ b/references/SKETCHING.md
@@ -1,15 +1,17 @@
 # Sketching Guide — Reproducing Technical Drawings in ClassCAD
 
-A practical guide for parsing 2D technical drawings and recreating them as ClassCAD sketches. Covers the full pipeline from dimension analysis through construction, trimming, constraints, and iterative evaluation.
+A practical guide for parsing 2D technical drawings and recreating them as ClassCAD sketches. Covers the full pipeline from dimension analysis through constraint-driven layout, trimming, and iterative evaluation.
 
 ## The Method
 
-**Don't try to draw the final profile directly.** The visible outline of a mechanical part is the result of trimming and intersecting simpler shapes. Reconstruct those original shapes first, then trim.
+**Don't try to draw the final profile directly.** The visible outline of a mechanical part is the result of trimming and intersecting simpler shapes. Reconstruct those original shapes, let the solver lay them out from constraints and dimensions, then trim.
 
 ```
-1. Analyze → 2. Checklist → 3. Recognize Shapes → 4. Dimensions → 5. Trim → 6. Constrain → 7. Evaluate
+1. Analyze → 2. Checklist → 3. Recognize Shapes → 4. Constrain & Dimension → 5. Trim → 6. Evaluate
 ```
 
+**The sketch is a conditioned model, not a coordinate dump.** Analysis (Steps 1–2) tells you the drawing's dimension *scheme*; constraints and dimensions (Step 4) hand that scheme to ClassCAD so the solver computes the layout. Hardcoding every coordinate works for a one-shot reproduction, but the result can't adapt — change one value and nothing follows. A constrained sketch re-solves (verified: re-dimensioning a boss Ø45→Ø60 moved its tangent fillet to the new exact position automatically).
+
 ---
 
 ## Step 1 — Analyze the Technical Drawing
@@ -101,27 +103,61 @@ Before coding, list every original shape:
 
 ### Place full shapes first, trim later
 
-Don't draw arcs or try to compute tangent points upfront. Place every circle and line at its full extent:
+Don't draw trimmed arcs or hand-compute tangent points upfront. Place every circle and line at its full extent — rough/nominal positions are fine where exact coordinates aren't known, because Step 4's constraints and dimensions drive the solver to the exact layout:
 
 ```js
-const noGen = { genFixation: false, genIncidence: false,
-                genVertAndHoriz: false, genTangency: false }
-await api.v1.sketch.circle({
-  id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen
-})
+await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r })
 ```
 
-Always disable auto-constraint generation (`gen*` flags) — auto-constraints interfere with precise programmatic placement.
+**The sketch MUST be created with `planeId`** (`sketch.create({ id: partId, planeId })`). Without it the constraint solver is silently disabled — constraints and dimensions are accepted (maxLevel 31, IDs returned) but never enforced, which makes the whole of Step 4 dead weight. This is the #1 trap (see `sketch/create.md`).
 
-This gives you a "skeleton" of overlapping shapes. Snapshot and compare against the source — you should be able to trace the final profile through the outermost arcs. If the shapes don't overlap in the right places, fix center positions before proceeding.
+**Leave the `gen*` auto-constraint flags ON (the defaults).** Auto-incidence wires endpoint-matching geometry together (`Auto_Coinc`), auto-H/V locks axis-aligned lines. That wiring is what lets a later dimension edit move the whole connected profile instead of tearing it: a gen-ON rectangle survives a width change closed; a gen-OFF one stretches one line and leaves the rest behind (verified 2026-06-10). Disable a flag selectively only when it would fight the design intent — e.g. `genVertAndHoriz: false` for a line drawn axis-aligned that will be dimensioned to an angle, or `genTangency: false` when overlapping skeleton circles must stay independently placeable until trimming.
+
+This gives you a "skeleton" of overlapping shapes. Snapshot and compare against the source — you should be able to trace the final profile through the outermost arcs. If the shapes don't overlap in the right places, fix the layout scheme (anchors, dimensions) before proceeding.
 
 ---
 
-## Step 4 — Add Dimensions
+## Step 4 — Constrain & Dimension — let the solver lay out the sketch
+
+Constraints and dimensions are ACTIVE. On a `planeId` sketch the solver enforces them immediately, physically moving and resizing geometry (all verified 2026-06-10: COINCIDENT snaps points, TANGENT moves to exact tangency, HORIZONTAL rotates preserving length, `DIAMETER value: 45` resizes an r=20 circle to r=22.5 at creation, HD/VD dimensions land a circle center on exact offsets). Declare the drawing's relationships and values; don't hand-compute what the solver can derive.
+
+### Order of operations
+
+1. **Anchor the datum** — `FIXATION` on reference geometry first; without an anchor the solver chooses what to move. To lock a line completely, fix its two **endpoints** individually: FIXATION on the line itself locks position/direction but NOT length — the solver will happily stretch a "fixed" line to satisfy a COINCIDENT or EQUAL_LENGTH elsewhere (verified).
+2. **Relate** — COINCIDENT (connect), TANGENT (tangency), CONCENTRIC, PARALLEL / PERPENDICULAR, HORIZONTAL / VERTICAL, SYMMETRY (axis FIRST in geomIds). Full tables in `sketch/constraint.md`.
+3. **Dimension** — drive sizes/distances to the drawing's values. `value` at creation WORKS; omit `value` to lock the current measurement instead. Formulas (`'60+10'`) work; angles need the `'45deg'` suffix; `@expr.NAME` is NOT supported in dimensions.
+
+### Worked example — the solver does the tangent math
+
+Two Ø45 bosses 38 apart joined by an R10 waist fillet. Nobody computes the fillet center — drop it in roughly on the correct side and constrain:
+
+```js
+const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [41, 40, 0], radius: 20 })).result
+const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [79, 40, 0], radius: 20 })).result
+const p1 = (await api.v1.sketch.getPoints({ id: c1 })).result.centerId
+const p2 = (await api.v1.sketch.getPoints({ id: c2 })).result.centerId
+await api.v1.sketch.constraint([                          // datum
+  { id: skId, type: 'FIXATION', geomIds: [p1] },
+  { id: skId, type: 'FIXATION', geomIds: [p2] },
+])
+await api.v1.sketch.dimension([                           // drawing values
+  { id: skId, type: 'DIAMETER', geomIds: [c1], value: 45 },
+  { id: skId, type: 'DIAMETER', geomIds: [c2], value: 45 },
+])
+const cf = (await api.v1.sketch.circle({ id: skId, centerPos: [58, 60, 0], radius: 8 })).result // rough!
+await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [cf], value: 10 })
+await api.v1.sketch.constraint([
+  { id: skId, type: 'TANGENT', geomIds: [cf, c1] },
+  { id: skId, type: 'TANGENT', geomIds: [cf, c2] },
+])
+// fillet center solved to (60, 66.367594) — exact to 15 significant figures
+```
+
+Seed rough geometry on the correct SIDE of the intended solution (here: above the waist) — among valid solutions the solver takes the nearest/minimal-motion one. Circle–circle TANGENT solves to external tangency (center distance = r1 + r2).
+
+### Verification readouts
 
-Add ClassCAD dimensions to the placed geometry. This serves two purposes:
-1. **Position verification** — auto-calculated values should match the source drawing. If a dimension reads 47.8 instead of 48, the geometry is off.
-2. **Readability** — dimensions appear in snapshots, making comparison easier.
+Dimensions created WITHOUT `value` double as measurements: their auto-calculated value must match the source drawing (a reading of 47.8 where the drawing says 48 means the layout scheme is off). They also render in snapshots, which makes the visual comparison in Step 6 self-documenting.
 
 ### Dimension patterns
 
@@ -147,9 +183,17 @@ await api.v1.sketch.dimension({
 - `HORIZONTAL_DISTANCE` / `VERTICAL_DISTANCE` with 2 geomIds: **both must be points**. Use `getPoints(circleId).centerId` to get point IDs from circles.
 - `ANGLE` works with non-intersecting lines — the solver extends them to their virtual intersection.
 - `OFFSET` between two parallel lines measures perpendicular distance, even if the lines don't overlap in projection.
-- The `value` parameter at creation time is **broken** — always create first, then call `updateDimension` to set values.
+- `value` at creation drives the solver (verified 2026-06-10 — an earlier version of this guide called it broken; that observation came from planeless sketches whose solver never ran). Anchor a datum first or the solver picks what to move.
+- `updateDimension` re-solves the system: `result: 1` = solved, `0` = unsolved. A 0 usually means a planeless sketch or a conflicting constraint.
 - `dimPos` for ANGLE selects which of the 4 angle sectors to constrain.
 
+### Solver facts (verified 2026-06-10)
+
+- Rotational constraints preserve line length (HORIZONTAL on a 50-long tilted line keeps it 50).
+- Conflicts and redundancies are accepted SILENTLY (maxLevel 31) even with an active solver. Geometry follows the earlier constraint; the losing constraint carries `lgsState: 0` in the structure tree — check that when a layout won't converge.
+- Deleting a constraint does NOT revert geometry.
+- Open question: how `splitAllCurves`/`mergeBack` (Step 5) interacts with constraints from this step — not yet retested under an active solver. If trims fail on a constrained sketch, suspect this first and report findings.
+
 ---
 
 ## Step 5 — Trim
@@ -189,26 +233,7 @@ Assign roles to your shapes before trimming:
 
 ---
 
-## Step 6 — Add Constraints
-
-Constraints declare geometric relationships between sketch elements. In ClassCAD, they are metadata only — they don't reposition geometry.
-
-```js
-await api.v1.sketch.constraint({ id: skId, type: 'CONCENTRIC', geomIds: [circle1, circle2] })
-await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [lineId, circleId] })
-await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [lineId] })
-```
-
-### Constraint behavior
-
-- **Constraints never move geometry.** They store rules in the structure tree. The solver does not run.
-- No conflict or redundancy detection — contradictory or duplicate constraints are silently accepted.
-- SYMMETRY requires the axis line as the FIRST element: `geomIds: [axisLine, geom1, geom2]`
-- Auto-generated constraints (from `gen*` flags) are named `Auto_*`.
-
----
-
-## Step 7 — Evaluate and Iterate
+## Step 6 — Evaluate and Iterate
 
 ### Pass 1: Checklist verification
 
@@ -255,6 +280,8 @@ function outerTangent(A, B, r) {
 
 ## Reference: Deriving Circle Centers from Tangency
 
+**Prefer the solver:** TANGENT constraints + a RADIUS/DIAMETER dimension derive these centers for you (see the worked example in Step 4). The math below remains useful for pre-planning and for cross-checking solver output against the drawing.
+
 When explicit coordinates aren't given, derive centers from tangency conditions between shapes:
 
 | Tangent type | Center-to-center distance |
@@ -316,10 +343,10 @@ const bossPt = add(offset, scale(dir, tBoss))
 | Apply trims | `sketch.splitCurvesMergeBack` | Commits staged state |
 
 ### Common pitfalls
+- **A sketch without `planeId` has a DEAD solver** — constraints and dimensions are accepted (maxLevel 31, IDs returned!) but never enforced; `updateDimension` returns 0; `dimension` with `value` errors (51) without resizing. Always pass `planeId` to `sketch.create`. This silent mode is what once led this guide to call constraints "metadata" and the value param "broken" — both wrong on a properly created sketch.
 - **Z must be 0** for all 2D sketch coordinates — non-zero Z is a hard error (code 1014)
-- **Disable `gen*` flags** when placing geometry programmatically
+- **FIXATION on a line does not lock its length** — fix both endpoints individually for a true datum
 - **`getPositions` fails on circle IDs** — use `getPoints` → `centerId` → `getPositions`
-- **`dimension` `value` param is broken** — create first, then `updateDimension`
 - **`splitAllCurves` ≠ `splitCurves`** — completely different operations with incompatible results
 
 ---
diff --git a/references/sketch/constraint.md b/references/sketch/constraint.md
index 3af5155..fde2706 100644
--- a/references/sketch/constraint.md
+++ b/references/sketch/constraint.md
@@ -76,7 +76,7 @@ const ids = (await api.v1.sketch.constraint([
 
 - **Constraints are enforced immediately** at creation time for directional/positional types. The solver repositions geometry to satisfy constraints, preserving line lengths.
 - **FIXATION anchors geometry.** Fix reference elements first, then add constraints — the solver moves only non-fixed geometry.
-- **No conflict detection.** Conflicting constraints (e.g., HORIZONTAL + VERTICAL on the same line) are accepted silently (maxLevel=31, no error). The solver satisfies what it can and ignores the rest.
+- **No conflict detection.** Conflicting constraints (e.g., HORIZONTAL + VERTICAL on the same line) are accepted silently (maxLevel=31, no error). The solver satisfies what it can and ignores the rest. Verified under an ACTIVE solver 2026-06-10: geometry follows the earlier constraint and the losing constraint's structure node carries `lgsState: 0` — that field is the only conflict signal.
 - **No over-constraint warnings.** Duplicate and redundant constraints are also accepted silently.
 - **Constraint chaining propagates.** If PARALLEL(A,B) and PARALLEL(B,C), then C becomes parallel to A. The solver resolves transitive relationships automatically.
 - **Deleting a constraint does NOT revert geometry.** Geometry stays where the solver placed it. Only the constraint relationship is removed.
@@ -93,6 +93,7 @@ With an active solver (planeId set), `moveGeometry` is constraint-aware:
 
 - **Without `planeId`, constraints do nothing.** The #1 mistake. Always create sketches with a plane.
 - **EQUAL_LENGTH/EQUAL_RADIUS may change either element.** The solver equalizes by adjusting whichever line/circle it finds easier to move — even a "FIXATION"-constrained one. FIXATION locks position/direction but not length. To protect a line's length, fix both its endpoints individually.
+- **The FIXATION-doesn't-lock-length caveat applies to COINCIDENT too** (verified 2026-06-10): COINCIDENT between a fixed line's endpoint and another point can be satisfied by STRETCHING the fixed line along its direction (end moved 50→55 to meet the other point). With both endpoints individually fixed, the other geometry snaps instead.
 - **MIDPOINT fails on free sketch.points.** Use line endpoints (`getPoints().startId` or `.endId`) instead.
 - **Non-null result ≠ success.** A constraint can be created (get an ID) but produce solver errors (maxLevel=51). Always check maxLevel.
 - **Invalid geomIds are inconsistent.** Wrong count for some types → returns null. Wrong count for others → creates constraint but produces solver errors. Always validate before creating.
diff --git a/references/sketch/dimension.md b/references/sketch/dimension.md
index 4130c89..5d49070 100644
--- a/references/sketch/dimension.md
+++ b/references/sketch/dimension.md
@@ -60,7 +60,9 @@ const ids = (await api.v1.sketch.dimension([
 
 ## Solver Behavior
 
-- **Dimensions are active constraints.** Providing a `value` that differs from current geometry causes the solver to reposition geometry immediately.
+- **Dimensions are active constraints.** Providing a `value` that differs from current geometry causes the solver to reposition geometry immediately. (Re-verified 2026-06-10: `DIAMETER value:45` resized an r=20 circle to r=22.5 at creation; HD=38/VD=0 between centers moved a free circle from (90,55) to exactly (78,40).)
+- **Re-solve cascades through the whole system.** Changing a dimension via `updateDimension` re-solves everything constrained to it — a doubly-tangent R10 fillet followed a Ø45→Ø60 boss re-dimension to its new exact position, (60, 75.199432), matching analytic geometry to float precision (verified 2026-06-10). This is the payoff of constraint-driven sketches over hardcoded coordinates: see the worked example in `SKETCHING.md` Step 4.
+- **Solved geometry nodes show `lgsState: 16`** in the structure tree (observed on driven circles; constraint nodes use 0/1 for unsolved/solved — the 16 on geometry nodes looks like a different flag set, meaning unconfirmed).
 - **Auto-value (omit `value`)** locks the current measurement without resizing. The dimension constrains the geometry to its current size/angle.
 - **Fix an anchor first.** Without a FIXATION constraint, the solver may move geometry in unexpected ways. Always fix at least one reference point.
 - **Formulas work:** `'60+10'`, `'sqrt(2)*50'`, `'45deg'`. Evaluated at creation time.
```
