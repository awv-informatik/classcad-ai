# changes.md — sketch.splitCurve retrain (Category 4.10 #1)

Date: 2026-06-30. Session: 2026-06-30_10-19-00_sketch-splitCurve

## Summary (this session only — excludes ph's upstream api/*.md, bundle.json, method-registry.json, package.json, yarn.lock)

```
 SKILL.md                                  |   8 +-
 references/SKETCHING.md                   |  50 ++++++-----
 references/sketch/constraint.md           |   7 +-
 references/sketch/dimension.md            |   2 +-
 references/sketch/splitAllCurves.md       | 115 ------------------------
 references/sketch/splitCurve.md           | 126 ++++++++++++++++++++++++++
 references/sketch/splitCurves.md          |  92 -------------------
 references/sketch/splitCurvesMergeBack.md | 145 ------------------------------
 references/sketch/trimCurves.md           |  88 ------------------
 9 files changed, 165 insertions(+), 468 deletions(-)
```

## NEW: references/sketch/splitCurve.md (full)

```diff
diff --git a/references/sketch/splitCurve.md b/references/sketch/splitCurve.md
new file mode 100644
index 0000000..6c9c5d8
--- /dev/null
+++ b/references/sketch/splitCurve.md
@@ -0,0 +1,126 @@
+# sketch.splitCurve
+
+Splits one or more sketch curves at explicit normalized parameter positions, in a single standalone call.
+Replaces the deprecated `splitCurves` (plural) — same operation, but `splitCurve` returns a **structured**
+result (`sourceId` + per-segment `interval`) instead of a flat id array.
+
+> Use `splitCurve` when you already know *where* (as `[0,1]` parameters) to cut. To cut at curve
+> **intersections**, use the `preTrim → trim → postTrim` workflow instead — it computes the positions for you.
+
+## Prerequisites
+
+- A part (`part.create`) and a sketch (`sketch.create`). A `planeId` is **not** required — splitCurve is
+  solver-independent and works identically on a planeless (dead-solver) sketch (verified).
+- One or more sketch curves (line / arc / circle) to split.
+
+## Signature
+
+```js
+api.v1.sketch.splitCurve({
+  id: skId,                                  // sketch id
+  splits: [ { geomId: curveId, values: [0.25, 0.75] } ]  // one object per curve
+})
+```
+
+## Return value
+
+On success: `Array<{ sourceId, splittedCurves: Array<{ id, interval }> }>` — **one entry per input curve, in input order**.
+
+```js
+[ { sourceId: 58,
+    splittedCurves: [ { id: 66, interval: [0, 0.25] },
+                      { id: 70, interval: [0.25, 1] } ] } ]
+```
+
+- `sourceId` = the original curve id you passed (`result[i].sourceId === splits[i].geomId`, order-preserving).
+- `splittedCurves[].id` = the **new** segment curve ids. The original curve id is **destroyed** (see Gotchas).
+- `splittedCurves[].interval` = `[t0, t1]`, the portion of the original curve (in its `[0,1]` domain) the segment covers.
+- On **any error the whole call atomic-fails**: `result` is **not an array** (VOID/null) and `maxLevel >= 51`.
+  So "result.length === splits.length" only holds on success.
+
+## Key facts (all verified live)
+
+- **Values are normalized `[0,1]` fractions**, mapping **linearly** along the curve from `startPos` (param 0) to
+  `endPos` (param 1). On a line `(0,0,0)→(100,0,0)`, `0.25` cuts at exactly `(25,0,0)`. True 2D chord-lerp, not
+  axis-aligned coincidence (confirmed on a skew line).
+- **Open curves (line, arc): N values → N+1 segments**, with contiguous intervals that exactly cover `[0,1]`
+  (`t0=0` … `t1=1`, each `seg.t1 == next.t0`).
+- **The original curve id is replaced**: after the split it is absent from `getGeometry`, and `getPositions` on it
+  returns `maxLevel 51` (invalid). Always read `splittedCurves[].id`; never reuse the source id.
+- **Standalone**: commits immediately, creates **no** `SplittedCurves`/`NoneSplitted` staging containers, and
+  calling `postTrim` afterward is a harmless no-op. (`preTrim` is the staging variant — see its own doc.)
+- **Constraints & dimensions survive** a split and the sketch stays **solver-live**: geometric constraints are
+  duplicated onto the new segments, a `FIXATION` stays on the original point, dimensions are remapped to span the
+  original endpoints (value preserved), handles are **renamed with a `_Split` suffix** (e.g. `LEN`→`LEN_Split`),
+  and an **auto-coincidence (`CC_2DCoincidentConstraint`, named `Split_Coinc`) is added at the cut vertex**. After
+  the split, `updateDimension` on the surviving dimension still re-solves and moves the geometry — pass the
+  dimension's **master id** (the `CC_LinearFeatureDimension` node id), not the sketch id, or it errors
+  `1001` (wrong id type, expects `dimension`). Re-fetch handles by name after splitting (ids change).
+
+## Circles (closed curves) — different rules
+
+- **A single value is rejected**: `maxLevel 51, "Circle shouldn't be split at a single point!"`. A closed loop
+  needs **≥ 2** cut points.
+- **N values → N arcs** (NOT N+1). Two values → 2 arcs.
+- Values are **`[0,1]` turn-fractions measured from +X, counter-clockwise** (`value × 360°`): `0.25`→90°, `0.75`→270°.
+  (This resolves the old `splitCurves` "0..2π" note — the new API is `[0,1]`.) The seam (param 0) is **implied to
+  be +X (0°)** — deduced from the 0.25→90° mapping; a lone `value=0` can't be measured directly (single value is rejected).
+- The **wrap-around arc's interval is encoded past 1.0**, e.g. `[0.75, 1.25]` (not `[0.75, 0.25]`).
+
+## Gotchas & silent hazards — splitCurve does NOT validate input
+
+All of the following return `maxLevel 31` (success) with **no warning** and can silently corrupt geometry. The
+caller is fully responsible for clean input:
+
+- **Values must be sorted ascending.** Unsorted values (e.g. `[0.75, 0.25]`) are applied **sequentially without
+  sorting**, which re-parameterizes the remainder and **extrapolates** — a 100-long line came out 200 long with
+  endpoints at `0→75→125→200`. **Always pre-sort.**
+- **Values must be in `[0,1]`.** Out-of-range values extrapolate beyond the curve, silently: `[1.5]` cut at x=150
+  on a 0..100 line; `[-0.2]` produced vertices outside the source. No clamp, no error.
+- **De-duplicate values.** Duplicates (`[0.5,0.5]`) or near-duplicates produce **zero-length sliver segments**
+  (`interval [0.5,0.5]`, start==end). No dedup, no warning.
+- **Avoid boundary values 0 and 1.** Splitting at an endpoint yields a **zero-length degenerate segment**
+  (`[0,0]` or `[1,1]`). `[0,1]` yields two of them. Silent.
+- **Empty `values: []`** is a no-op that returns a single `[0,1]` segment — but **still re-issues the curve id**
+  (the id changes even though geometry doesn't). Empty `splits: []` returns `result: []` cleanly.
+- **`geomId` is resolved globally, not scoped to `id`.** A curve belonging to a *different* sketch on the same
+  part splits successfully even when you pass an unrelated sketch as `id`. Don't rely on `id` to guard scope.
+- **No undo / no reverse.** There is no `common.undo` / `sketch.undo` endpoint, and neither `postTrim` nor
+  `splitCurvesMergeBack` restores a `splitCurve` result. A split is permanent. (The source guide's "Reversible? Yes"
+  / "standard undo mechanism" claim is unbacked.)
+
+## Common errors (maxLevel 51, whole call fails)
+
+| Message | code | Cause |
+|---|---|---|
+| `The parameter "id"/"splits"/"values"/"geomId" must be provided` | 1004 | Missing required param (incl. nested) |
+| `An element of parameter "geomId" has an invalid id!` | 1006 | Non-existent curve id |
+| `The parameter "geomId" has a wrong id type! Provide only following id types: ["sketch-curve"]` | 1001 | Passed a part/sketch/point id |
+| `Circle shouldn't be split at a single point!` | (51) | One value on a closed circle — need ≥2 |
+| `Curve shouldn't be a part of rigidset!` | (51) | The curve is a `rigidSet` member |
+
+Note: a **construction line** (`isConstruction:true`) **can** be split (the trim workflow refuses it; splitCurve does not).
+
+## Working example
+
+```js
+// One part.create per run — a 2nd call returns VOID and poisons the drawing.
+const partR = await api.v1.part.create({ name: 'P' })
+const partId = partR.result
+const topPlaneId = Object.values(partR.structure.tree).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top').id
+const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlaneId })).result
+const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result
+
+// values MUST be in [0,1] and ascending
+const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: line, values: [0.25, 0.75] }] })
+const segs = r.result[0].splittedCurves          // [{id, interval:[0,0.25]}, {id, interval:[0.25,0.75]}, {id, interval:[0.75,1]}]
+const firstCutVertex = (await api.v1.sketch.getPositions({ id: segs[0].id })).result.endPos  // {x:25,y:0,z:0}
+```
+
+## Related
+
+- `sketch.preTrim` / `sketch.trim` / `sketch.postTrim` — the intersection-based trim workflow (use when you don't
+  know the cut parameters). `preTrim` returns the **same structured shape** as `splitCurve`.
+- `sketch.getPositions` — read segment endpoints (works on line/arc ids; **fails on circle ids** — use `getPoints`→`centerId`).
+- `sketch.getGeometry` — confirm the new segment ids / that the original is gone.
+- `~~sketch.splitCurves~~` (deprecated) — flat-array predecessor; returns `Array<Array<id>>` with no `sourceId`/`interval`.
```

## EDITED: guide + index (rename deprecated -> new, dangling-link fixes)

```diff
diff --git a/SKILL.md b/SKILL.md
index 1231365..acfde72 100644
--- a/SKILL.md
+++ b/SKILL.md
@@ -280,10 +280,10 @@ Assembly management: root assembly creation, templates, instances, constraints (
 | 28  | `moveGeometry`            | Moves the given sketch geometry by translation vector                 | [api](references/api/sketch.md) |
 | 29  | `fillet`                  | Creates a fillet in place of a point and its two connecting lines     | [api](references/api/sketch.md) |
 | 30  | `undoFillet`              | Deletes an existing fillet by removing the arc and reconnecting lines | [api](references/api/sketch.md) |
-| 31  | `trimCurves`              | Trims away curves if they are suitable for trimming                   | [api](references/api/sketch.md) |
-| 32  | `splitAllCurves`          | Splits all curves in the given sketch                                 | [api](references/api/sketch.md) |
-| 33  | `splitCurves`             | Splits curves in specified parameterized positions                    | [api](references/api/sketch.md) |
-| 34  | `splitCurvesMergeBack`    | Merges the splitted curves back                                       | [api](references/api/sketch.md) |
+| 31  | `trim`                    | Removes curve segments produced by `preTrim` (step 2 of trim workflow) | [api](references/api/sketch.md) |
+| 32  | `preTrim`                 | Splits curves at their mutual intersections (step 1 of trim workflow)  | [api](references/api/sketch.md) |
+| 33  | `splitCurve`              | Splits one curve at explicit normalized parameter positions            | [api](references/api/sketch.md) |
+| 34  | `postTrim`                | Merges split curves back, finalizing the trim (step 3 of trim workflow) | [api](references/api/sketch.md) |
 | 35  | `generateAutoConstraints` | Automatically generates constraints where sensible without redundancy | [api](references/api/sketch.md) |
 | 36  | `loadFrom`                | Loads an OFB file and copies sketch geometry to an existing sketch    | [api](references/api/sketch.md) |
 | 37  | `getGeometry`             | Gets all sketch geometry from a sketch, region or rigid set           | [api](references/api/sketch.md) |
diff --git a/references/SKETCHING.md b/references/SKETCHING.md
index 9ecb0ef..47fb779 100644
--- a/references/SKETCHING.md
+++ b/references/SKETCHING.md
@@ -203,7 +203,7 @@ await api.v1.sketch.dimension({
 - Rotational constraints preserve line length (HORIZONTAL on a 50-long tilted line keeps it 50).
 - Conflicts and redundancies are accepted SILENTLY (maxLevel 31) even with an active solver. Geometry follows the earlier constraint; the losing constraint carries `lgsState: 0` in the structure tree — check that when a layout won't converge.
 - Deleting a constraint does NOT revert geometry.
-- **Trim is safe on constrained sketches** (verified 2026-06-10): constraints and dimensions survive `splitAllCurves → trimCurves → mergeBack`, the system auto-wires cut points with `Auto_Coinc`, and the trimmed profile stays CONDITIONED — `updateDimension` re-solves it (even through an extrusion: a trimmed-then-extruded peanut regenerated to the analytic volume after re-dimensioning, Δ 0.002%). One hard rule: **all constraint/dimension handles are recreated with new IDs on every mergeBack** — re-fetch them by name from the structure tree before updating.
+- **Trim is safe on constrained sketches** (verified 2026-06-10): constraints and dimensions survive `preTrim → trim → postTrim`, the system auto-wires cut points with `Auto_Coinc`, and the trimmed profile stays CONDITIONED — `updateDimension` re-solves it (even through an extrusion: a trimmed-then-extruded peanut regenerated to the analytic volume after re-dimensioning, Δ 0.002%). One hard rule: **all constraint/dimension handles are recreated with new IDs on every `postTrim`** — re-fetch them by name from the structure tree before updating.
 
 ---
 
@@ -211,22 +211,31 @@ await api.v1.sketch.dimension({
 
 Once shapes are positioned and verified, trim them to reveal the final profile.
 
+> **⚠️ RETRAIN PENDING (Category 4.10):** The APIs below were renamed (`splitAllCurves`→`preTrim`,
+> `trimCurves`→`trim`, `splitCurvesMergeBack`→`postTrim`) and `preTrim` now returns a **structured**
+> result — `[{ sourceId, splittedCurves: [{ id, interval }] }]`, one entry per input curve — not the
+> flat segment array the classification prose below assumes. `preTrim` also accepts a `curveIds`
+> subset. The behavioral findings (handles recreated, `Auto_Coinc`, atomic trim) are carried over
+> from the old workflow and must be re-verified during retraining. Treat the segment-walking logic
+> below as a sketch of intent, not a tested recipe, until then.
+
 ### The three-step trim workflow
 
 ```js
-// 1. Split all curves at their intersection points (staged — nothing visible changes)
-const segments = (await api.v1.sketch.splitAllCurves({ id: skId })).result
+// 1. Split curves at their intersection points (staged — nothing visible changes)
+//    Returns structured result: [{ sourceId, splittedCurves: [{ id, interval }] }]
+const split = (await api.v1.sketch.preTrim({ id: skId })).result
 
-// 2. Mark unwanted segments for removal (still staged)
-await api.v1.sketch.trimCurves({ id: skId, curveIds: segmentsToRemove })
+// 2. Mark unwanted segments for removal (still staged) — pass the splittedCurves ids
+await api.v1.sketch.trim({ id: skId, curveIds: segmentsToRemove })
 
 // 3. Apply the trims (geometry changes now)
-await api.v1.sketch.splitCurvesMergeBack({ id: skId })
+await api.v1.sketch.postTrim({ id: skId })
 ```
 
 ### Classifying segments
 
-With many overlapping shapes, `splitAllCurves` can produce dozens to hundreds of segments. For each segment, determine whether it belongs to the final profile or should be removed.
+With many overlapping shapes, `preTrim` can produce dozens to hundreds of segments. For each segment, determine whether it belongs to the final profile or should be removed.
 
 **Approach — the boundary test.** Each staged segment node carries `partOf` (original curve ID) and `interval` (`[t0,t1]` as a **0..1 fraction** of the curve — not radians, phase not world-aligned). `getPositions` works on segment IDs. Compute the segment's world midpoint (angles of start/end around the center; pick the traversal direction whose span fraction is closer to the interval width), then probe the midpoint pushed **±ε radially**: the segment belongs to the final outline iff material lies on exactly ONE side.
 
@@ -239,12 +248,12 @@ Assign roles to your shapes before trimming:
 
 ### Trim rules
 
-- `trimCurves` only accepts IDs returned by `splitAllCurves` — not original geometry IDs
-- `trimCurves` is **atomic** — one invalid ID fails the entire call, no partial trims
-- After `mergeBack`, trimmed curve IDs are invalid — use `getGeometry` to discover new IDs
-- `splitAllCurves → mergeBack` without trimming is a safe no-op for GEOMETRY ids (round-trip restore) — but constraint/dimension nodes are recreated with new IDs anyway
-- **Constrained sketches trim safely** — constraints/dimensions survive, `Auto_Coinc` appears at cut points, and the profile stays re-solvable. Re-fetch dimension/constraint handles by NAME after mergeBack (dimension names preserved; constraint names suffix-renamed `Fix`→`Fix0`)
-- **Contiguous kept segments coalesce** into a single curve on mergeBack — keeping 3 adjacent segments of a circle yields 1 arc
+- `trim` only accepts IDs returned by `preTrim` — not original geometry IDs
+- `trim` is **atomic** — one invalid ID fails the entire call, no partial trims
+- After `postTrim`, trimmed curve IDs are invalid — use `getGeometry` to discover new IDs
+- `preTrim → postTrim` without trimming is a safe no-op for GEOMETRY ids (round-trip restore) — but constraint/dimension nodes are recreated with new IDs anyway
+- **Constrained sketches trim safely** — constraints/dimensions survive, `Auto_Coinc` appears at cut points, and the profile stays re-solvable. Re-fetch dimension/constraint handles by NAME after `postTrim` (dimension names preserved; constraint names suffix-renamed `Fix`→`Fix0`)
+- **Contiguous kept segments coalesce** into a single curve on `postTrim` — keeping 3 adjacent segments of a circle yields 1 arc
 - Tangent-only contacts: a singly-tangent circle stays whole (staged as one full-circle part); a doubly-tangent circle (fillet between two shapes) splits into 2 arcs at the tangent points
 
 ---
@@ -354,16 +363,16 @@ const bossPt = add(offset, scale(dir, tBoss))
 |------|-----|-------|
 | Move geometry | `sketch.updateGeometry` | Raw position set, requires ALL coords |
 | Delete | `sketch.deleteObject` | `{ ids: [id1, id2, ...] }` |
-| Split at intersections | `sketch.splitAllCurves` | Staged — needs mergeBack |
-| Mark for removal | `sketch.trimCurves` | Only splitAllCurves IDs |
-| Apply trims | `sketch.splitCurvesMergeBack` | Commits staged state |
+| Split at intersections | `sketch.preTrim` | Staged — needs postTrim; structured result |
+| Mark for removal | `sketch.trim` | Only preTrim segment IDs |
+| Apply trims | `sketch.postTrim` | Commits staged state |
 
 ### Common pitfalls
 - **A sketch without `planeId` has a DEAD solver** — constraints and dimensions are accepted (maxLevel 31, IDs returned!) but never enforced; `updateDimension` returns 0; `dimension` with `value` errors (51) without resizing. Always pass `planeId` to `sketch.create`. This silent mode is what once led this guide to call constraints "metadata" and the value param "broken" — both wrong on a properly created sketch.
 - **Z must be 0** for all 2D sketch coordinates — non-zero Z is a hard error (code 1014)
 - **FIXATION on a line does not lock its length** — fix both endpoints individually for a true datum
 - **`getPositions` fails on circle IDs** — use `getPoints` → `centerId` → `getPositions`
-- **`splitAllCurves` ≠ `splitCurves`** — completely different operations with incompatible results
+- **`preTrim` ≠ `splitCurve`** — completely different operations: `preTrim` splits at all mutual intersections (the trim workflow); `splitCurve` splits one curve at explicit normalized parameter values
 
 ---
 
@@ -375,6 +384,7 @@ const bossPt = add(offset, scale(dir, tBoss))
 - [sketch/line.md](sketch/line.md) — line creation
 - [sketch/arcByCenter.md](sketch/arcByCenter.md) — arc creation
 - [sketch/geometry.md](sketch/geometry.md) — batch geometry creation
-- [sketch/trimCurves.md](sketch/trimCurves.md) — trim workflow
-- [sketch/splitAllCurves.md](sketch/splitAllCurves.md) — split at intersections
-- [sketch/splitCurvesMergeBack.md](sketch/splitCurvesMergeBack.md) — apply trims
+- `sketch/preTrim.md` — split at intersections _(retrain pending — Category 4.10)_
+- `sketch/trim.md` — mark segments for removal _(retrain pending — Category 4.10)_
+- `sketch/postTrim.md` — apply trims / merge back _(retrain pending — Category 4.10)_
+- `sketch/splitCurve.md` — split one curve at explicit params _(retrain pending — Category 4.10)_
diff --git a/references/sketch/constraint.md b/references/sketch/constraint.md
index 669fc94..80b14b2 100644
--- a/references/sketch/constraint.md
+++ b/references/sketch/constraint.md
@@ -101,11 +101,12 @@ With an active solver (planeId set), `moveGeometry` is constraint-aware:
 - **SYMMETRY on lines with different lengths is approximate.** The solver mirrors orientation but preserves each line's original length. For exact mirroring, ensure lines have equal length (add EQUAL_LENGTH) or constrain individual endpoints with SYMMETRY on point pairs.
 - **`getPositions` returns null for circles.** To read a circle's center position, use `getPoints({id: circleId}).result.centerId`, then `getPositions({id: centerId})`.
 - **Constraint deletion doesn't undo geometry changes.** After deleting a constraint, geometry stays where the solver moved it. There is no automatic revert.
-- **Constraints survive the trim workflow** (split/trim/mergeBack, verified 2026-06-10): they
+- **Constraints survive the trim workflow** (`preTrim`/`trim`/`postTrim`, verified 2026-06-10 under
+  the former `splitAllCurves`/`trimCurves`/`splitCurvesMergeBack` names; re-verify on retrain): they
   are recreated under NEW IDs with suffix-renamed names (`Fix`→`Fix0`) — re-fetch by name
-  after mergeBack. TANGENT constraints keep driving curves that became arcs. A constraint
+  after `postTrim`. TANGENT constraints keep driving curves that became arcs. A constraint
   whose partner curve is fully trimmed away is removed cleanly (no dangling). The system also
-  adds `Auto_Coinc` constraints at trim cut points. Details: `splitCurvesMergeBack.md`.
+  adds `Auto_Coinc` constraints at trim cut points. Details: `postTrim.md` (retrain pending).
 - **lgsState values observed beyond 0/1:** geometry nodes show 16 when solved; FIXATION
   constraints have shown 9. Looks like a flag set — semantics unconfirmed, treat only 0 as
   "unsolved" with confidence.
diff --git a/references/sketch/dimension.md b/references/sketch/dimension.md
index 9fdb906..9862db2 100644
--- a/references/sketch/dimension.md
+++ b/references/sketch/dimension.md
@@ -77,7 +77,7 @@ const ids = (await api.v1.sketch.dimension([
 - **OFFSET on a circle → null.** Wrong geometry type returns "Wrong number of geometry ids for offset".
 - **ANGLE needs 2 lines.** Single line → array index error. Use ANGLEOX for angle-to-X-axis on a single line.
 - **Over-constraining is silent.** Adding a dimension that conflicts with existing constraints creates the dimension (gets ID) but solver fails (maxLevel=51). Geometry doesn't change.
-- **Dimension handles die on every `splitCurvesMergeBack`** (verified 2026-06-10) — nodes are
+- **Dimension handles die on every `postTrim`** (verified 2026-06-10, under the former `splitCurvesMergeBack`; re-verify on retrain) — nodes are
   recreated with new IDs (names preserved). Re-fetch by name from the structure tree before
   calling `updateDimension` after any trim workflow, or you get error 1006 "invalid id".
   Dimensions survive the trim itself and keep driving geometry — including a DIAMETER whose
```

## DELETED: 4 deprecated per-API LLM docs (content removed; will retrain as preTrim/trim/postTrim)
- references/sketch/trimCurves.md -> trim
- references/sketch/splitAllCurves.md -> preTrim
- references/sketch/splitCurves.md -> splitCurve (this doc)
- references/sketch/splitCurvesMergeBack.md -> postTrim
