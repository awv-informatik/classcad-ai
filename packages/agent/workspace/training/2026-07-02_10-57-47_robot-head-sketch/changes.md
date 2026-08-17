# Skill changes — robot-head sketch session (2026-07-02)

Diff of `knowledge/classcad-skill/references/` (staged before commit):

```diff
diff --git a/references/SKETCHING.md b/references/SKETCHING.md
index b6c3d6a..6b722f7 100644
--- a/references/SKETCHING.md
+++ b/references/SKETCHING.md
@@ -187,6 +187,14 @@ await api.v1.sketch.dimension({
 await api.v1.sketch.dimension({
   id: skId, type: 'ANGLE', geomIds: [line1, line2], dimPos: [x, y, 0]
 })
+
+// "Distance to a center mark" (drawing crosshair with no geometry under it, e.g. a slot
+// center): make the mark a real, constrainable point — the dimension then drives it.
+const ctr = (await api.v1.sketch.point({ id: skId, pos: [xRough, yRough, 0] })).result
+await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [ctr, axisLineId] })
+await api.v1.sketch.dimension({
+  id: skId, type: 'VERTICAL_DISTANCE', geomIds: [slotBottomEndPt, ctr], value: 3.5
+})
 ```
 
 ### Dimension API notes
@@ -198,8 +206,11 @@ await api.v1.sketch.dimension({
 - `updateDimension` re-solves the system: `result: 1` = solved, `0` = unsolved. A 0 usually means a planeless sketch or a conflicting constraint.
 - `dimPos` for ANGLE selects which of the 4 angle sectors to constrain.
 
-### Solver facts (verified 2026-06-10)
+### Solver facts (verified 2026-06-10, extended 2026-07-02)
 
+- **TANGENT keeps the seeded branch.** Circle–circle/arc–circle tangency seeded EXTERNAL solves external (d = r1+r2); seeded INTERNAL stays internal (d = R−r) through creation and every re-solve — an R12 dome inside-tangent to Ø5.6 eye circles followed the internal branch exactly when the eyes were re-dimensioned to Ø7 (robot-head session).
+- **Encode "2×" annotations as ONE driving dimension + EQUAL_RADIUS/EQUAL_LENGTH**, not two dims. `updateDimension` has NO batch form (an array param is a silent null no-op), so twin dims must be updated sequentially — and for symmetric schemes the intermediate state is unsolvable (result 0), which can leave a **stale arc `bulge`** in the structure tree even after the pair completes and all positions solve exactly (server bug, TODO #174 — see `sketch/updateDimension.md`). With EQUAL_*, one update re-solves both sides in a single solvable step and the trap never triggers.
+- **Don't pass `dimPos` at dimension creation** (except for ANGLE sector selection) — it can poison the whole `dimension` batch (maxLevel 51, VOID dims, half-driven sketch). Create dims bare, then place text via `updateDimensionPosition` (see `sketch/dimension.md`).
 - Rotational constraints preserve line length (HORIZONTAL on a 50-long tilted line keeps it 50).
 - Conflicts and redundancies are accepted SILENTLY (maxLevel 31) even with an active solver. Geometry follows the earlier constraint; the losing constraint carries `lgsState: 0` in the structure tree — check that when a layout won't converge.
 - Deleting a constraint does NOT revert geometry.
@@ -238,6 +249,11 @@ the drawing's dimension scheme hangs off — exactly the dashed centerlines/refe
   from it. To identify construction geometry use `getObjectInfo` (`isConstruction: 0|1`), `getObjectsLists`
   (`constructionGeometry: id[]`), or `getGlobalState` (`constructionCount`).
 - In snapshots, construction geometry renders **dashed** (distinct from the solid profile).
+- **Construction curves participate in `preTrim` splitting.** A construction centerline
+  crossing a circle adds real split points: an eye circle tangent to two curves AND crossed
+  by its centerline staged as **4** arcs, not 2 (verified 2026-07-02). Budget for the extra
+  segments when classifying, and remember the centerline's own splits merge back on `postTrim`
+  as long as you don't trim them.
 
 ---
 
@@ -332,6 +348,15 @@ trim, `postTrim`, and check the realized geometry matches — a falsifiable test
 - **Constrained sketches trim safely** — constraints/dimensions survive, `Auto_Coinc` appears at cut points, and the profile stays re-solvable. Re-fetch dimension/constraint handles by NAME after `postTrim` (dimension names preserved; constraint names suffix-renamed `Fix`→`Fix0`)
 - **Contiguous kept segments coalesce** into a single curve on `postTrim` — keeping 3 adjacent segments of a circle yields 1 arc
 - Tangent-only contacts: a singly-tangent circle stays whole (staged as one full-circle part); a doubly-tangent circle (fillet between two shapes) splits into 2 arcs at the tangent points
+- **Drawing-faithful ≠ extrudable.** A sketch that keeps its boss/eye circles FULL (as drawings
+  draw them) with the profile tangent to them is NOT a valid region: `part.extrusion` fails
+  with *"Brep after linear sweep not manifold"* — and still creates a broken feature object
+  (non-null result, maxLevel 51) that you must `part.deleteFeature`. To get a solid, rim-trim
+  first: `preTrim` splits each doubly-tangent circle at its tangent points (plus any
+  construction-centerline crossings — expect 4 segments, all minor arcs), trim the inner arcs
+  (apex = center + R·unit(chordMid − center); nearest-to-body apexes are the inner ones), keep
+  the rim — contiguous rim pieces coalesce on `postTrim` — then extrude (verified 2026-07-02,
+  volume matched analytic area to 1e-4).
 
 ---
 
diff --git a/references/sketch/constraint.md b/references/sketch/constraint.md
index 80b14b2..cca8ffc 100644
--- a/references/sketch/constraint.md
+++ b/references/sketch/constraint.md
@@ -54,7 +54,7 @@ const ids = (await api.v1.sketch.constraint([
 | `COINCIDENT` | `[pt, pt]` or `[pt, curve]` | Points: snaps together. Point-on-curve: snaps point onto line/circle/arc. Order doesn't matter. |
 | `COLINEAR` | `[line1, line2]` | Moves unconstrained line onto the same infinite line as the other. |
 | `CONCENTRIC` | `[circ1, circ2]` or `[arc1, arc2]` | Moves unconstrained circle/arc center to match the other's center. |
-| `TANGENT` | `[arc/circle, line]` or `[circle1, circle2]` | Arc/circle + line: moves so edge touches line (center-to-line distance = radius). Circle + circle: moves to external tangency (center distance = r1 + r2). |
+| `TANGENT` | `[arc/circle, line]` or `[circle1, circle2]` | Arc/circle + line: moves so edge touches line (center-to-line distance = radius). Circle + circle: moves to external tangency (center distance = r1 + r2) **when seeded apart**. The INTERNAL branch (center distance = R − r) is fully supported: seed the pair internally tangent and the solver keeps that branch through creation and every re-solve (verified 2026-07-02: R12 dome arc inside-tangent to Ø5.6 circles; re-dimensioning Ø5.6→7 followed the internal branch to 1e-14). |
 | `SYMMETRY` | `[axis, elem1, elem2]` | Mirrors the unconstrained element about the axis line. **Axis must be first in geomIds.** Works with points (exact) and lines (approximate if different lengths — solver mirrors orientation but preserves individual line lengths). |
 | `FIXATION` | `[geometry]` | Locks geometry in place. All geometry types (point, line, arc, circle). Use to anchor reference geometry before adding other constraints. |
 
@@ -79,6 +79,12 @@ const ids = (await api.v1.sketch.constraint([
 - **No conflict detection.** Conflicting constraints (e.g., HORIZONTAL + VERTICAL on the same line) are accepted silently (maxLevel=31, no error). The solver satisfies what it can and ignores the rest. Verified under an ACTIVE solver 2026-06-10: geometry follows the earlier constraint and the losing constraint's structure node carries `lgsState: 0` — that field is the only conflict signal.
 - **No over-constraint warnings.** Duplicate and redundant constraints are also accepted silently.
 - **Constraint chaining propagates.** If PARALLEL(A,B) and PARALLEL(B,C), then C becomes parallel to A. The solver resolves transitive relationships automatically.
+- **Junction-on-a-full-circle pattern:** to connect an open curve (arc/line) to a FULL circle
+  at their tangency point — e.g. a dome arc or fillet meeting a boss/eye circle that must stay
+  closed — combine `COINCIDENT [curveEndpointPt, circleId]` (point-on-curve) with
+  `TANGENT [curve, circle]`. Tangency fixes the circle relation, the endpoint-on-circle kills
+  the curve's end-angle DOF, and the endpoint lands exactly at the tangency point (verified
+  2026-07-02 to 1e-14, robot-head session).
 - **Deleting a constraint does NOT revert geometry.** Geometry stays where the solver placed it. Only the constraint relationship is removed.
 - **Recommended application order:** FIXATION (anchor) → COINCIDENT (connect) → directional (H/V/PARALLEL/PERP) → equality/dimensional (EQUAL_LENGTH, dimensions).
 
diff --git a/references/sketch/dimension.md b/references/sketch/dimension.md
index 9862db2..678c661 100644
--- a/references/sketch/dimension.md
+++ b/references/sketch/dimension.md
@@ -70,6 +70,12 @@ const ids = (await api.v1.sketch.dimension([
 
 ## Gotchas
 
+- **⚠️ `dimPos` at CREATION can poison a whole batch.** Passing `dimPos` on
+  HORIZONTAL_DISTANCE/VERTICAL_DISTANCE point-pair dims inside a batch made the batch return
+  maxLevel 51 with several dims created as VOID and the solve left incomplete (observed
+  2026-07-02 on a 21-dim batch; not isolated to a single type). Safe route: create all
+  dimensions WITHOUT `dimPos`, then place text with `updateDimensionPosition` — that works on
+  every type. (`dimPos` for ANGLE sector selection is a different, documented use.)
 - **DIAMETER value is diameter, not radius.** `value: 60` on a circle means radius=30.
 - **ANGLE value needs `deg` suffix.** Use `'60deg'` not `60`. Without the suffix, the value is interpreted as radians.
 - **Negative values create broken dimensions.** A negative OFFSET value creates the dimension (gets an ID) but fails to set the value (maxLevel=51). The dimension exists in a broken state.
diff --git a/references/sketch/updateDimension.md b/references/sketch/updateDimension.md
index ce88bda..cd6b7e9 100644
--- a/references/sketch/updateDimension.md
+++ b/references/sketch/updateDimension.md
@@ -61,6 +61,25 @@ Updates a dimension's value and re-solves the sketch. The solver immediately rep
 - **No open/close feature editing required.** Works regardless of feature state.
 - **Sequential updates work.** Call updateDimension multiple times — each update re-solves.
 - **result=0 doesn't always mean "no change."** For ANGLE/ANGLEOX, the solver may partially converge (geometry moves) but still report 0 if the sketch is under-determined.
+- **NO batch form.** Passing an ARRAY of `{id, value}` params (like `dimension`/`constraint`
+  accept) returns `result: null` with no messages and updates NOTHING. Loop single calls
+  (verified 2026-07-02).
+- **Symmetric dimension pairs traverse an unsolvable intermediate.** Updating "2×" twins one
+  at a time (e.g. two Ø5.6 bosses that a dome is tangent to, symmetric about a fixed axis)
+  makes the FIRST call return `result 0` — correctly, the asymmetric state is contradictory —
+  and the second call returns 2 with the whole system landing exact. Prefer ONE driving
+  dimension + `EQUAL_RADIUS`/`EQUAL_LENGTH` on the twin: a single update then re-solves both
+  sides in one solvable step (verified 2026-07-02, exact to 1e-14).
+- **⚠️ Stale `bulge` after a failed(0)→solved(2) sequence (server bug, TODO #174).** A failed
+  update attempt can write a garbage `bulge` into an arc; the subsequent SUCCESSFUL update
+  re-solves all positions exactly (start/end/center/radius verified to 1e-15) but may NOT
+  rewrite the bulge — the structure tree then carries a wrong sweep (observed: 1.2988643 =
+  209.6° instead of 0.7022581 = 140.3°, reproduced 3/3). Anything reading `bulge` (renderers,
+  the trim boundary-test) sees a corrupted arc while all position readbacks pass. `common.recalc`
+  does NOT refresh it; a same-value re-set is a solver no-op and doesn't either; only a later
+  value-CHANGING successful solve that moves the arc may. Avoidance: never drive the sketch
+  through a result-0 intermediate — use the EQUAL_RADIUS pattern above. If you must verify,
+  check `members.bulge.value` against `tan(sweep/4)` computed from solved endpoints/center.
 
 ## Common Errors
 
```

# Post-review method amendments (commit e97b7aa + workspace HOW-TO-TRAIN.md)

SKETCHING.md diff:

```diff
diff --git a/references/SKETCHING.md b/references/SKETCHING.md
index 6b722f7..d6fa8d3 100644
--- a/references/SKETCHING.md
+++ b/references/SKETCHING.md
@@ -4,16 +4,40 @@ A practical guide for parsing 2D technical drawings and recreating them as Class
 
 ## The Method
 
-**Don't try to draw the final profile directly.** The visible outline of a mechanical part is the result of trimming and intersecting simpler shapes. Reconstruct those original shapes, let the solver lay them out from constraints and dimensions, then trim.
+**Don't hand-compute the layout — and don't assume the drawing is an outline.** Technical
+drawings vary: some show a single trimmed profile, most mix COMPLETE features (full circles
+with Ø callouts, centerlines, center marks) with TRIMMED remainders (partial arcs with R
+callouts). Classify first, reconstruct the curves AS DRAWN, let the solver lay them out from
+constraints and dimensions, and trim only what the drawing shows trimmed — or when deriving
+a solid profile as a separate, explicitly-requested artifact.
 
 ```
-1. Analyze → 2. Checklist → 3. Recognize Shapes → 4. Constrain & Dimension → 5. Trim → 6. Evaluate
+0. Classify → 1. Analyze → 2. Checklist → 3. Recognize Shapes → 4. Constrain & Dimension → 5. Trim (conditional) → 6. Evaluate
 ```
 
 **The sketch is a conditioned model, not a coordinate dump.** Analysis (Steps 1–2) tells you the drawing's dimension *scheme*; constraints and dimensions (Step 4) hand that scheme to ClassCAD so the solver computes the layout. Hardcoding every coordinate works for a one-shot reproduction, but the result can't adapt — change one value and nothing follows. A constrained sketch re-solves (verified: re-dimensioning a boss Ø45→Ø60 moved its tangent fillet to the new exact position automatically).
 
 ---
 
+## Step 0 — Classify the Drawing and the Deliverable
+
+Two questions before any analysis:
+
+1. **What is the deliverable?** Reproducing the DRAWING as drawn is the default. A closed,
+   extrudable profile is a DIFFERENT artifact — derive it from the finished sketch in a
+   separate rim-trim step (Step 5), and only when a solid is actually requested.
+2. **Per curve: complete or partial?** Walk every curve in the image. If you can trace the
+   full curve in the drawing, create the full curve. If only a portion is drawn, it is the
+   remainder of a trimmed shape — chain or trim it.
+
+**When the method's expectation and the drawing image disagree, the drawing wins — it is the
+spec.** Stop and re-classify instead of making the drawing fit the method. This is the
+drawing-side mirror of the snapshot-vs-data rule. Past failure (2026-07-02, robot-head):
+closed Ø5.6 eye circles were converted into boundary arcs because this guide used to claim
+every visible outline is trimmed shapes — the image plainly showed complete circles.
+
+---
+
 ## Step 1 — Analyze the Technical Drawing
 
 Read the drawing systematically. Don't start coding until you've identified every annotation.
@@ -57,13 +81,18 @@ If a dimension doesn't fit, the interpretation is wrong. Keep trying until all d
 Before writing any code, create a checklist. Every dimension annotation in the drawing gets a row:
 
 ```markdown
-- [ ] D1: Ø38 — DIAMETER — hub outer circle
-- [ ] D2: 48 — HORIZONTAL_DISTANCE — center to boss
-- [ ] D3: 14° — ANGLE — arm angle from horizontal
+- [ ] D1: Ø38 — DIAMETER — [hub outer circle] — hub bore
+- [ ] D2: 48 — HORIZONTAL_DISTANCE — [hub center → boss center] — boss position
+- [ ] D3: 14° — ANGLE — [arm axis ↔ horizontal centerline] — arm angle
 ...
 ```
 
-**Format**: `[ ] <id> <value> — <type> — <what it controls>`
+**Format**: `[ ] <id> <value> — <type> — [<anchors: from → to>] — <what it controls>`
+
+**Record anchors exactly as the drawing measures them** (eye center → jaw edge, slot bottom →
+center mark). The same references must be used when the dimension entity is created in Step 4
+— deciding the anchors here, during analysis, prevents improvising constraint-equivalent
+substitutes later.
 
 This checklist serves three purposes:
 1. **Completeness** — forces you to account for every annotation before coding
@@ -74,9 +103,19 @@ This checklist serves three purposes:
 
 ## Step 3 — Recognize the Original Shapes
 
-**What you see in a technical drawing is not what was drawn.** The visible profile is the result of trimming simpler, natural shapes — circles, lines, arcs — at their intersection points. An organic-looking contour is often just a handful of overlapping circles with interior segments removed.
+**Complete curves stay complete.** A circle drawn closed (Ø callout, both sides visible in
+the image) is a complete entity — create it whole and connect adjacent profile curves to it
+with COINCIDENT-endpoint-on-curve + TANGENT (the junction-on-a-full-circle pattern in
+`sketch/constraint.md`), never by converting it to an arc.
+
+**For the curves Step 0 classified as PARTIAL, what you see is not what was drawn.** A
+partial arc is the result of trimming a simpler, natural shape — a full circle or line — at
+intersection or tangency points. An organic-looking contour is often just a handful of
+overlapping circles with interior segments removed.
 
-If you can recognize the original shapes BEFORE trimming, reconstruction is straightforward: place the shapes, then trim. Trying to trace the final profile directly means working backwards, and errors compound.
+If you can recognize those original shapes BEFORE trimming, reconstruction is
+straightforward: place the shapes, then trim. Trying to trace the final profile directly
+means working backwards, and errors compound.
 
 ### How to see through the trim
 
@@ -127,6 +166,18 @@ Constraints and dimensions are ACTIVE. On a `planeId` sketch the solver enforces
 2. **Relate** — COINCIDENT (connect), TANGENT (tangency), CONCENTRIC, PARALLEL / PERPENDICULAR, HORIZONTAL / VERTICAL, SYMMETRY (axis FIRST in geomIds). Full tables in `sketch/constraint.md`.
 3. **Dimension** — drive sizes/distances to the drawing's values. `value` at creation WORKS; omit `value` to lock the current measurement instead. Formulas (`'60+10'`) work; angles need the `'45deg'` suffix; `@expr.NAME` is NOT supported in dimensions.
 
+### One annotation = one dimension entity
+
+Every row of the Step 2 checklist must exist in the sketch as a DIMENSION, anchored to the
+SAME references the drawing uses (eye center → jaw edge, not a constraint-equivalent datum
+point). Redundant annotations are still annotations: create them as driven dims (no `value`)
+— they double as verification readouts. If the drawing measures to something that isn't
+geometry (a center mark, a virtual point), materialize the reference first (sketch point +
+constraints — see the center-mark pattern below). Encoding an annotation only implicitly (a
+coincidence that happens to produce the value) is NOT a reproduction of the drawing's
+dimension scheme. Past failure (2026-07-02, robot-head): three annotations (slot width 3,
+3.5-to-center, 8 eye-to-jaw) existed only implicitly or re-anchored, and the review bounced.
+
 ### Worked example — the solver does the tangent math
 
 Two Ø45 bosses 38 apart joined by an R10 waist fillet. Nobody computes the fillet center — drop it in roughly on the correct side and constrain:
@@ -364,9 +415,19 @@ trim, `postTrim`, and check the realized geometry matches — a falsifiable test
 
 ### Pass 1: Checklist verification
 
-Go through the dimension checklist. For each item, compute the actual value from placed geometry and compare to the expected value. Only check the box if it matches within tolerance.
+Go through the dimension checklist. A row is checked ONLY by citing the dimension ENTITY
+(name/id) that realizes it plus the measured value from placed geometry, within tolerance.
+"Satisfied implicitly by constraints" is a fail unless the drawing genuinely has no such
+annotation.
+
+### Pass 2: Topology comparison
+
+Count and classify curves against the drawing BEFORE judging looks: full circles vs arcs vs
+lines, per feature. A sketch can match the silhouette perfectly while being topologically
+wrong — closed eye circles reproduced as boundary arcs passed the silhouette pass and failed
+review (2026-07-02).
 
-### Pass 2: Visual comparison
+### Pass 3: Visual comparison
 
 Snapshot the sketch and compare side-by-side with the source:
 - Overall proportions and silhouette
```
