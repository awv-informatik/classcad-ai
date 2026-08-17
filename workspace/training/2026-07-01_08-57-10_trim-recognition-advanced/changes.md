# changes.md — advanced trim-recognition session

Date: 2026-07-01. Deliverables: SKETCHING.md classification recipe (submodule) + render-direct.mjs arc fix + TOOLS.md (outer repo).

## SKETCHING.md diff
```diff
diff --git a/references/SKETCHING.md b/references/SKETCHING.md
index 47fb779..ce46820 100644
--- a/references/SKETCHING.md
+++ b/references/SKETCHING.md
@@ -211,14 +211,6 @@ await api.v1.sketch.dimension({
 
 Once shapes are positioned and verified, trim them to reveal the final profile.
 
-> **⚠️ RETRAIN PENDING (Category 4.10):** The APIs below were renamed (`splitAllCurves`→`preTrim`,
-> `trimCurves`→`trim`, `splitCurvesMergeBack`→`postTrim`) and `preTrim` now returns a **structured**
-> result — `[{ sourceId, splittedCurves: [{ id, interval }] }]`, one entry per input curve — not the
-> flat segment array the classification prose below assumes. `preTrim` also accepts a `curveIds`
-> subset. The behavioral findings (handles recreated, `Auto_Coinc`, atomic trim) are carried over
-> from the old workflow and must be re-verified during retraining. Treat the segment-walking logic
-> below as a sketch of intent, not a tested recipe, until then.
-
 ### The three-step trim workflow
 
 ```js
@@ -233,18 +225,50 @@ await api.v1.sketch.trim({ id: skId, curveIds: segmentsToRemove })
 await api.v1.sketch.postTrim({ id: skId })
 ```
 
-### Classifying segments
+### Recognizing which segments to trim — the boundary test (validated 2026-07-01)
 
-With many overlapping shapes, `preTrim` can produce dozens to hundreds of segments. For each segment, determine whether it belongs to the final profile or should be removed.
+`preTrim` returns `[{ sourceId, splittedCurves: [{ id, interval }] }]`. With many crossing elements it produces
+dozens of segments; the hard part is deciding which to remove. The robust, general method is the **boundary test**:
 
-**Approach — the boundary test.** Each staged segment node carries `partOf` (original curve ID) and `interval` (`[t0,t1]` as a **0..1 fraction** of the curve — not radians, phase not world-aligned). `getPositions` works on segment IDs. Compute the segment's world midpoint (angles of start/end around the center; pick the traversal direction whose span fraction is closer to the interval width), then probe the midpoint pushed **±ε radially**: the segment belongs to the final outline iff material lies on exactly ONE side.
+1. **Define the target filled region(s)** you want the outline of — closed shapes (`{kind:'circle',c,r}`,
+   `{kind:'rect',a,b}`, or a polygon). For a union of shapes, that's the shapes themselves; for "outer boundary of
+   a mesh", it's the bounding rectangle; to "extract a sub-region", it's that region's rectangle.
+2. **For each staged segment, compute its midpoint and outward normal from the segment's OWN geometry** (see box
+   below — never from the `interval`).
+3. **Probe `mid ± ε·normal`** and ask "is each probe point inside ANY target shape?" (point-in-shape: circle
+   `|P−c| < r−tol`; polygon ray-cast). **Keep the segment iff material is on exactly ONE side** (`in⁺ XOR in⁻`) —
+   it's a boundary edge. **Trim** the interior (`in⁺ AND in⁻`) and the dangling (`NOT in⁺ AND NOT in⁻`).
+4. `trim` the not-kept ids, then `postTrim`. Contiguous kept pieces coalesce.
 
-Plain midpoint-inside-another-shape is NOT sufficient: segments can be interior to the final region while outside every placed shape (e.g. a boss arc between its fillet-tangent point and the boss-boss crossing sits inside the fillet *patch*) — the boundary test handles all of these uniformly.
+```js
+// per segment: keep iff material on exactly one side of the target region(s)
+const p1 = [mid[0] + eps*nx, mid[1] + eps*ny], p2 = [mid[0] - eps*nx, mid[1] - eps*ny]
+const keep = inAnyShape(p1) !== inAnyShape(p2)     // XOR → boundary
+```
 
-Assign roles to your shapes before trimming:
-- **Contour shapes** (profile boundary): trim segments that fall inside other contour shapes
-- **Hole shapes** (through-holes, bores): keep all segments — they're entirely inside the body
-- **Slot shapes** (internal cutouts): keep segments inside the body contour, trim the rest
+**Computing a segment's midpoint + normal (do NOT use `interval`).** Look up the segment node by id in the
+structure tree and branch on its class:
+- **`CC_Line`** — midpoint = mean of `getPositions` endpoints; normal ⟂ the direction.
+- **`CC_Arc`** — derive it from the segment's signed **`bulge`** (`members.bulge.value`, = tan(includedAngle/4))
+  and its endpoints `s,e`: `θ = 4·atan(bulge)`, `R = |s−e|/(2·sin(θ/2))`, center = chord-midpoint offset by
+  `R·cos(θ/2)` along the chord's left-normal, arc-midpoint at start-angle `+ θ/2`, normal radial. This is the same
+  math the arc renderer uses, and it is **robust for a circle cut any number of times**.
+
+> **Why not the `interval`→angle shortcut?** Mapping a circle-arc `interval` (turn-fraction from the +X seam) to an
+> angle only holds when a circle is cut into exactly **2** arcs. A circle cut 4× (by another circle *and* a line)
+> has sub-arc intervals that are not global turn-fractions, and the shortcut silently mis-locates the midpoint
+> (→ everything mis-classified). Always use the bulge geometry.
+
+**The naive rule fails.** "Trim iff the midpoint is inside another shape" has no *both-sides* notion: it keeps
+**dangling stubs** that lie outside every shape (e.g. a line overhanging past all the circles it crosses), and it
+mis-handles segments that are interior to the target region yet outside every individual placed shape. The XOR
+boundary test handles all of these uniformly. (Verified: on two circles + a diameter line overhanging both ends,
+the naive rule left two dangling line stubs; the boundary test produced the clean 2-arc union outline.)
+
+**Operational rules.** Run **one trim workflow per harness run** — two independent `preTrim→trim→postTrim` cycles
+in the same run interfere (`trim` resolves `curveIds` globally). Trimming a circle down to arcs can leave the
+circle's **center point** behind as an isolated `points[]` entry — delete it with `deleteObject` if the profile
+must be point-clean.
 
 ### Trim rules
 
```
