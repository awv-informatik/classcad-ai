# Skill changes — variant A session (committed 2bf8910)

```diff
diff --git a/references/solid/curves-parameter.md b/references/solid/curves-parameter.md
index e3cd1b4..3c99241 100644
--- a/references/solid/curves-parameter.md
+++ b/references/solid/curves-parameter.md
@@ -55,6 +55,12 @@ The kernel doesn't care where the curves come from:
 
 ## Gotchas
 
+- **Curves from NON-default-plane sketches work in world space** (verified 2026-08-10,
+  sprocket-solid-A): arcs/lines on a Right-plane sketch extrude with a world `direction`
+  perpendicular to that plane exactly as expected. Combined with the `rotation`/`translation`
+  post-transforms this gives a solid-API "circular pattern" idiom: draw ONE profile, then N
+  `solid.extrusion` calls with `rotation: [k*2π/N, 0, 0]` — used to cut all 21 tooth spaces of a
+  sprocket from a single 8-curve profile, verified volume-exact vs the feature-tree build.
 - **sketchRegion ≠ sketch-curve.** `sketch.sketchRegion` creates a region object — it's a different type than the individual sketch geometry (lines, arcs, circles). Don't confuse them. `part.extrusion` (the feature version) accepts sketchRegion via its `references` param, but `solid.extrusion` does NOT.
 - **`sketch.circle` returns an ID; `curve.circle` returns VOID.** Sketch circles can be passed directly as a single curve. Curve circles are added to their shape container — pass the shape ID instead.
 - **Empty array is a type error**, not just "no curves found." The error message differs: `"wrong type"` vs `"wrong id type"`.
diff --git a/references/solid/subtraction.md b/references/solid/subtraction.md
index f611429..0e06548 100644
--- a/references/solid/subtraction.md
+++ b/references/solid/subtraction.md
@@ -23,6 +23,12 @@ Cuts tool solids from a target solid (boolean subtract). The target is modified
 
 ## Gotchas
 
+- **⚠️ NEVER `common.recalc` after direct solid booleans — it DESTROYS the EIF body** (verified
+  2026-08-10, sprocket-solid-A/00-diag): blank−tools subtraction healthy (massProps 2.12 in³),
+  then `common.recalc({})` → `calculateMassProperties` returns null with maxLevel 51 (NullMem) —
+  the direct geometry is not feature-history-backed, and recalc regenerates the part from the
+  feature tree. Related to the known "Recalc Invalidation Bug" (TODO). Direct solid results are
+  already current — just don't recalc.
 - **Consumed solid IDs are rejected with a clean error.** After a default subtraction (keepTools=false), the tool is deleted; referencing its ID in any later solid op (`solid.translation`, `solid.copy`, `solid.subtraction`, …) returns `maxLevel 51` with `"...has an invalid id!"` (code 1006) — the same as referencing an ID that never existed. (Older notes said this *hung* the server; that does not reproduce — the API's id-type validation rejects consumed IDs up front. Still, track which IDs are valid so you get the result you expect.)
 - **Non-overlapping tools are silent no-ops.** A tool that doesn't intersect the target produces no error — the target is unchanged, but the tool is still consumed (unless keepTools=true).
 - **Tool enveloping target destroys the target.** If the tool completely contains the target, the subtraction removes the target entirely. Result is null, maxLevel=51, code 1014.
```
