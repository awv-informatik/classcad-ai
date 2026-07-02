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
