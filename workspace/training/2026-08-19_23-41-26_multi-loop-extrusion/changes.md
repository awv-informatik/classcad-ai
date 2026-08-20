diff --git a/packages/skill/references/part/extrusion.md b/packages/skill/references/part/extrusion.md
index 142c81fb..7f94360b 100644
--- a/packages/skill/references/part/extrusion.md
+++ b/packages/skill/references/part/extrusion.md
@@ -11,7 +11,7 @@ Creates a parametric extrusion feature inside a part by sweeping a 2D sketch pro
 ## Key Parameters
 
 - `id` — **part ID** (not sketch ID, not region ID, not EIF ID)
-- `references` — **required**. Array of sketch region IDs or sketch contour element IDs (line IDs). Both work. Must form a closed profile — open profiles fail with "not manifold."
+- `references` — **required**. Array of sketch region IDs or sketch contour element IDs (line IDs). Both work. Must form a closed profile — open profiles fail with "not manifold." Multiple loops in one array form holes — see "Profiles with holes" below.
 - `type` — extrusion direction mode:
   - `'UP'` (default) — extrudes along sketch plane normal (+Z for XY plane)
   - `'DOWN'` — extrudes opposite to sketch normal
@@ -30,6 +30,16 @@ Feature ID (numeric) on success, with maxLevel=31. The feature ID works with `op
 
 On error: returns null or a feature ID with maxLevel=51 (degenerate feature).
 
+## Profiles with holes (multi-loop) — measured 2026-08-19
+
+- **Nested loops auto-subtract.** Pass ALL loops' curve ids in ONE `references` array: `[outerCircle, innerCircle]` → annulus, one body (vol 25131.9 ≈ analytic, r=30/10×h=10); rectangle lines + hole circles → plate with holes, one body. No boolean needed for holes that live in the same sketch.
+- **Containment is even-odd**: an island inside a hole materializes again — `[r40, r20, r8]` → annulus + island post (volume matches analytic sum).
+- **Loop order is irrelevant** — `[inner, outer]` ≡ `[outer, inner]`.
+- **Disjoint outers combine in one call**, each hole assigned to its containing outer: two plates + their two holes in one array → both plates-with-holes from one feature.
+- **Loops must not touch or cross.** A hole straddling the outline fails with error 1121 "Curves … self intersect at least at position {x,y,z}" — and STILL returns a feature id at maxLevel 51 that you must `deleteFeature`.
+- **`CC_SketchRegion` exists only AFTER a curve-based extrusion** (child of the sketch, named "SketchRegion") — a fresh sketch has none, so first-time extrusion goes by curve ids. `getSketchRegion({ id: partId, name: 'SketchRegion' })` resolves it; passing the region id in `references` re-extrudes the SAME multi-loop profile, holes included (verified: volume exactly doubled extruding the region the other way).
+- Caveat: `updateExtrusion` CHANGING `references` on a committed feature errored 1200 "not allowed to update. It's not active and open" — param-only updates (`limit2`, type) are verified working. Recreate the feature, or open it first (`openFeature`), for reference changes.
+
 ## Gotchas
 
 - **Sketch MUST have `planeId` set.** Without it, extrusion produces maxLevel=51 error (`Sketch.GetNormal:CCObject can not be opened`) even though geometry may be created. Always pass `planeId` to `sketch.create`.
