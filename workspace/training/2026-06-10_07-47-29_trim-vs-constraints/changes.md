# Skill changes — 2026-06-10 trim-vs-constraints investigation

Committed in `knowledge/classcad-skill` as f18f8ab.

```diff
diff --git a/references/SKETCHING.md b/references/SKETCHING.md
index 3f040f8..9ecb0ef 100644
--- a/references/SKETCHING.md
+++ b/references/SKETCHING.md
@@ -160,7 +160,7 @@ Seed rough geometry on the correct SIDE of the intended solution (here: above th
 ### Chain vs trim — pick by topology knowledge
 
 - **Profile topology known** (you can list the arcs/lines and their adjacency — the normal case after Step 1 analysis): build the closed CHAIN directly from rough segments with COINCIDENT + TANGENT at each join. No trim phase at all. The liquid-mixer block (4 lines + 2 corner arcs), boss peanut (4-arc chain), and cutout (4 lines + 2 ear arcs) all build this way — every join and center solved exactly from the drawing's dimension scheme.
-- **Topology to be discovered** (overlapping shapes whose intersections define the outline): place full circles/lines, solve the layout, then Step 5's split/trim workflow.
+- **Topology to be discovered** (overlapping shapes whose intersections define the outline): place full circles/lines, solve the layout, then Step 5's split/trim workflow. Verified end-to-end on constrained sketches — the trimmed profile keeps its constraints and re-solves on dimension changes (see Step 5 trim rules).
 
 ### Diagnosing an under-constrained scheme
 
@@ -203,7 +203,7 @@ await api.v1.sketch.dimension({
 - Rotational constraints preserve line length (HORIZONTAL on a 50-long tilted line keeps it 50).
 - Conflicts and redundancies are accepted SILENTLY (maxLevel 31) even with an active solver. Geometry follows the earlier constraint; the losing constraint carries `lgsState: 0` in the structure tree — check that when a layout won't converge.
 - Deleting a constraint does NOT revert geometry.
-- Open question: how `splitAllCurves`/`mergeBack` (Step 5) interacts with constraints from this step — not yet retested under an active solver. If trims fail on a constrained sketch, suspect this first and report findings.
+- **Trim is safe on constrained sketches** (verified 2026-06-10): constraints and dimensions survive `splitAllCurves → trimCurves → mergeBack`, the system auto-wires cut points with `Auto_Coinc`, and the trimmed profile stays CONDITIONED — `updateDimension` re-solves it (even through an extrusion: a trimmed-then-extruded peanut regenerated to the analytic volume after re-dimensioning, Δ 0.002%). One hard rule: **all constraint/dimension handles are recreated with new IDs on every mergeBack** — re-fetch them by name from the structure tree before updating.
 
 ---
 
@@ -228,7 +228,9 @@ await api.v1.sketch.splitCurvesMergeBack({ id: skId })
 
 With many overlapping shapes, `splitAllCurves` can produce dozens to hundreds of segments. For each segment, determine whether it belongs to the final profile or should be removed.
 
-**Approach**: for each segment, compute its arc midpoint and test whether it falls inside another contour shape. If it does, it's an interior segment — trim it.
+**Approach — the boundary test.** Each staged segment node carries `partOf` (original curve ID) and `interval` (`[t0,t1]` as a **0..1 fraction** of the curve — not radians, phase not world-aligned). `getPositions` works on segment IDs. Compute the segment's world midpoint (angles of start/end around the center; pick the traversal direction whose span fraction is closer to the interval width), then probe the midpoint pushed **±ε radially**: the segment belongs to the final outline iff material lies on exactly ONE side.
+
+Plain midpoint-inside-another-shape is NOT sufficient: segments can be interior to the final region while outside every placed shape (e.g. a boss arc between its fillet-tangent point and the boss-boss crossing sits inside the fillet *patch*) — the boundary test handles all of these uniformly.
 
 Assign roles to your shapes before trimming:
 - **Contour shapes** (profile boundary): trim segments that fall inside other contour shapes
@@ -240,7 +242,10 @@ Assign roles to your shapes before trimming:
 - `trimCurves` only accepts IDs returned by `splitAllCurves` — not original geometry IDs
 - `trimCurves` is **atomic** — one invalid ID fails the entire call, no partial trims
 - After `mergeBack`, trimmed curve IDs are invalid — use `getGeometry` to discover new IDs
-- `splitAllCurves → mergeBack` without trimming is a safe no-op (round-trip restore)
+- `splitAllCurves → mergeBack` without trimming is a safe no-op for GEOMETRY ids (round-trip restore) — but constraint/dimension nodes are recreated with new IDs anyway
+- **Constrained sketches trim safely** — constraints/dimensions survive, `Auto_Coinc` appears at cut points, and the profile stays re-solvable. Re-fetch dimension/constraint handles by NAME after mergeBack (dimension names preserved; constraint names suffix-renamed `Fix`→`Fix0`)
+- **Contiguous kept segments coalesce** into a single curve on mergeBack — keeping 3 adjacent segments of a circle yields 1 arc
+- Tangent-only contacts: a singly-tangent circle stays whole (staged as one full-circle part); a doubly-tangent circle (fillet between two shapes) splits into 2 arcs at the tangent points
 
 ---
 
diff --git a/references/sketch/constraint.md b/references/sketch/constraint.md
index fde2706..669fc94 100644
--- a/references/sketch/constraint.md
+++ b/references/sketch/constraint.md
@@ -101,6 +101,14 @@ With an active solver (planeId set), `moveGeometry` is constraint-aware:
 - **SYMMETRY on lines with different lengths is approximate.** The solver mirrors orientation but preserves each line's original length. For exact mirroring, ensure lines have equal length (add EQUAL_LENGTH) or constrain individual endpoints with SYMMETRY on point pairs.
 - **`getPositions` returns null for circles.** To read a circle's center position, use `getPoints({id: circleId}).result.centerId`, then `getPositions({id: centerId})`.
 - **Constraint deletion doesn't undo geometry changes.** After deleting a constraint, geometry stays where the solver moved it. There is no automatic revert.
+- **Constraints survive the trim workflow** (split/trim/mergeBack, verified 2026-06-10): they
+  are recreated under NEW IDs with suffix-renamed names (`Fix`→`Fix0`) — re-fetch by name
+  after mergeBack. TANGENT constraints keep driving curves that became arcs. A constraint
+  whose partner curve is fully trimmed away is removed cleanly (no dangling). The system also
+  adds `Auto_Coinc` constraints at trim cut points. Details: `splitCurvesMergeBack.md`.
+- **lgsState values observed beyond 0/1:** geometry nodes show 16 when solved; FIXATION
+  constraints have shown 9. Looks like a flag set — semantics unconfirmed, treat only 0 as
+  "unsolved" with confidence.
 
 ## Common Errors
 
diff --git a/references/sketch/dimension.md b/references/sketch/dimension.md
index 5d49070..9fdb906 100644
--- a/references/sketch/dimension.md
+++ b/references/sketch/dimension.md
@@ -77,6 +77,11 @@ const ids = (await api.v1.sketch.dimension([
 - **OFFSET on a circle → null.** Wrong geometry type returns "Wrong number of geometry ids for offset".
 - **ANGLE needs 2 lines.** Single line → array index error. Use ANGLEOX for angle-to-X-axis on a single line.
 - **Over-constraining is silent.** Adding a dimension that conflicts with existing constraints creates the dimension (gets ID) but solver fails (maxLevel=51). Geometry doesn't change.
+- **Dimension handles die on every `splitCurvesMergeBack`** (verified 2026-06-10) — nodes are
+  recreated with new IDs (names preserved). Re-fetch by name from the structure tree before
+  calling `updateDimension` after any trim workflow, or you get error 1006 "invalid id".
+  Dimensions survive the trim itself and keep driving geometry — including a DIAMETER whose
+  circle became an arc.
 - **Structure tree value storage varies by type:**
   - RADIUS/DIAMETER: explicit `members.value` and `members.radius`/`members.center`
   - Linear dims (OFFSET, H_DIST, V_DIST): `members.startPt` and `members.endPt` — value derived from distance
diff --git a/references/sketch/splitAllCurves.md b/references/sketch/splitAllCurves.md
index 9b227f2..5e3d516 100644
--- a/references/sketch/splitAllCurves.md
+++ b/references/sketch/splitAllCurves.md
@@ -38,12 +38,32 @@ Two containers are created under the sketch geometry:
 - **`SplittedCurves`** (CC_Container) — holds all split sub-curve segments
 - **`NoneSplitted`** (CC_Container) — holds curves that had no intersections (original IDs)
 
+## Segment Anatomy (verified 2026-06-10)
+
+Each staged segment node carries two key members:
+
+- **`partOf`** — the ORIGINAL curve's ID. Use this to group segments by parent (robust,
+  no name parsing).
+- **`interval`** — `[t0, t1]` parameter range as a **0..1 FRACTION of the full curve**
+  (segment widths of one circle sum to 1.0). NOT radians, and the parameter phase is NOT
+  world-aligned — never convert `t` to world angles directly.
+
+**`getPositions` works on staged segment IDs** (returns world start/end/center). Robust
+arc-segment midpoint recipe: take world angles of start/end around the center, compute the
+CCW span; pick the traversal direction whose span fraction is closer to the interval width
+`w`; midpoint = halfway along that direction. For keep/trim classification, prefer the
+**boundary test**: probe the midpoint pushed ±ε radially — a segment belongs to the final
+outline iff material lies on exactly ONE side (midpoint-inside-another-shape is NOT
+sufficient: e.g. boss segments between a tangent point and a crossing sit inside a fillet
+PATCH while outside every disc).
+
 ## Intersection Behavior
 
 | Scenario | Behavior |
 |---|---|
 | **Two curves crossing** | Both split at intersection points |
-| **Tangent contact** (line tangent to circle) | Line split at tangent point; circle NOT split |
+| **Tangent contact** (line tangent to circle) | Line split at tangent point; circle becomes ONE full-circle part (`Circle_part0`, class CC_Circle) in SplittedCurves — staged but not subdivided |
+| **Circle–circle tangency** | Each circle staged as one full-circle part per the row above; with TWO tangent contacts (e.g. a fillet circle touching two bosses) the circle splits into 2 arcs at the tangent points |
 | **T-junction** (endpoint touches midpoint) | Continuous curve split at contact; terminating curve stays whole |
 | **Collinear overlapping lines** | Both lines split at overlap boundary points |
 | **Multiple curves at same point** | Each curve split once at the common crossing point (no extra segments) |
diff --git a/references/sketch/splitCurvesMergeBack.md b/references/sketch/splitCurvesMergeBack.md
index 46f9fc3..60990de 100644
--- a/references/sketch/splitCurvesMergeBack.md
+++ b/references/sketch/splitCurvesMergeBack.md
@@ -71,9 +71,33 @@ splitAllCurves → mergeBack → splitAllCurves → mergeBack → ...
 ```
 Each cycle gets fresh split IDs. No state accumulates between cycles.
 
+## Constrained Sketches (verified 2026-06-10)
+
+The whole trim workflow is SAFE on sketches with live constraints/dimensions — the sketch
+stays constrained AND conditioned through it. Behavior details:
+
+- **Every mergeBack recreates ALL constraint and dimension nodes with NEW IDs** — even on a
+  no-trim roundtrip that preserves the geometry IDs. Old handles fail with error 1006
+  ("invalid id"). **Re-fetch by NAME from the structure tree after every mergeBack:**
+  dimension nodes keep their names exactly; constraint nodes get suffix-renamed
+  (`Fix`→`Fix0`, `D1`→`D10`, repeat mergeBacks append further suffixes).
+- **`Auto_Coinc` constraints are auto-created at the cut points** — the trimmed profile gets
+  wired together, so a later `updateDimension` re-solves the whole profile coherently
+  (verified: arc joints re-landed on the analytic intersection points after both symmetric
+  and asymmetric re-dimensions, and a trimmed+extruded part regenerated end-to-end).
+- **Dimensions keep driving curves that changed class** — a DIAMETER on a circle that became
+  an arc still resizes it.
+- **A fully-trimmed-away curve takes its constraints with it** — removed cleanly, no dangling
+  nodes, the rest of the sketch keeps solving.
+- **Contiguous kept segments of one curve COALESCE into a single curve** on mergeBack
+  (keeping 3 adjacent segments of a circle yields 1 arc, not 3).
+- **updateDimension during the staged state works** (solves and moves geometry) but voids the
+  no-trim ID-preservation guarantee — curves come back with new IDs after mergeBack.
+
 ## Gotchas
 
 - **No return data.** Unlike `splitAllCurves` (which returns segment IDs), mergeBack returns nothing. You must call `getGeometry` afterward to discover the new IDs.
+- **Constraint/dimension handles die on EVERY mergeBack** — see Constrained Sketches above.
 - **All old IDs for trimmed curves are invalid after mergeBack.** Don't cache IDs across the trim workflow.
 - **Untrimmed curves keep their IDs.** Only curves that had segments removed get new IDs. This means you can safely reference untouched geometry after mergeBack.
 - **splitAllCurves segment ordering follows creation order.** The first-created curve's segments appear first in the array. This matters when selecting indices for `trimCurves`.
diff --git a/references/sketch/trimCurves.md b/references/sketch/trimCurves.md
index 88544ae..55acf43 100644
--- a/references/sketch/trimCurves.md
+++ b/references/sketch/trimCurves.md
@@ -37,6 +37,10 @@ VOID. No meaningful return value.
 - **After mergeBack, all IDs change.** Original curve IDs are invalidated. New geometry gets new IDs. Don't cache IDs across the trim workflow.
 - **Re-trimming an already-trimmed ID errors.** The sub-curve no longer exists after the first trim — second attempt returns maxLevel=51 "invalid id" error.
 - **Empty `curveIds` array is a no-op.** No error (maxLevel=31).
+- **Safe on constrained sketches** (verified 2026-06-10): constraints/dimensions survive the
+  trim workflow and the profile stays conditioned — but ALL constraint/dimension handles are
+  recreated with new IDs on mergeBack (re-fetch by name), and `Auto_Coinc` constraints appear
+  at the cut points. Full details in `splitCurvesMergeBack.md` → Constrained Sketches.
 
 ## How splitAllCurves Segments Map to Geometry
 
```
