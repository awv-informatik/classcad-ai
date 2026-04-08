# Training: sketch.point

**Date:** 2026-04-08

## Goal

Testing `v1.sketch.point` — creating points in a sketch.

**Methods to cover:**

- `point` — basic point creation with `pos` parameter
- `point` — `genFixation` flag (default TRUE) — controls auto-fixation constraint
- `point` — `genIncidence` flag (default TRUE) — controls auto-coincidence constraint
- `point` — batch creation (Array<object> input)
- `point` — return value (id, messages, maxLevel)
- `getPositions` — verify point position after creation
- `deleteObject` — delete a point
- `point` — edge cases: duplicate positions, 3D coords in 2D sketch, origin point, large coords

**Questions:**

- What ID type does sketch.point return? Numeric? What's the typical ID increment?
- Does genFixation=FALSE leave the point unconstrained? What constraints appear when TRUE?
- Does genIncidence create a coincidence when two points overlap?
- Can you create a point at the same position as an existing one?
- What happens with non-zero Z coordinates in a sketch on the XY plane?
- Can you create multiple points in one batch call?
- How does deleteObject work with point IDs?

---

## 01 — basic point creation

Script: `scripts/01-basic-point.mjs` — ✅ Three points created successfully.

| ![three-points](files/01-basic-point-three-points.png) |
|---|

**Data:** First point at origin → ID 58, maxLevel=31, no messages. Second at (50,30,0) → ID 62 (Δ4). Third at (-25,-15,0) → ID 64 (Δ2). `getPositions` returns `{ pos: { x, y, z } }` — note the object format with named fields, not an array. All positions match input exactly (see `files/01-basic-point-all-positions.json`).

**Learned:** Return value is a numeric ID. getPositions returns `{ pos: { x, y, z } }`. First point has Δ4 to second (due to auto-fixation constraint), subsequent Δ2.
**📌 LLM doc:** Return value format, getPositions return shape.

## 02 — genFixation=TRUE (default)

Script: `scripts/02-genFixation-true.mjs` — ✅ Point at (30,20,0) with default genFixation.

Structure dump examined (24KB). No visible fixation constraint in structure for off-origin point.

**Learned:** genFixation=TRUE does NOT create a fixation constraint for a point that's not at the origin.

## 03 — genFixation=FALSE

Script: `scripts/03-genFixation-false.mjs` — ✅ Point at (30,20,0) with genFixation=0.

Structure identical to script 02. Same nodes, same IDs.

**Learned:** genFixation has no effect for off-origin points — confirmed by comparing structure trees.

## 06 — genFixation at origin (TRUE)

Script: `scripts/06-point-at-origin-fixation.mjs` — ✅ / ❌ partial.

First part (genFixation=TRUE at origin): created `Auto_Fix` constraint (class `CC_2DFixationConstraint`, ID 60). Second part (genFixation=0) in same session errored (result: null, maxLevel: 51) — likely due to passing integer 0 instead of boolean false in multi-part context.

**Learned:** genFixation=TRUE at the origin creates `Auto_Fix` (`CC_2DFixationConstraint`). The doc phrase "fixation in the Origin" means: auto-fix only when the point is AT the origin.
**📌 LLM doc:** genFixation only affects points at the origin. Creates CC_2DFixationConstraint named "Auto_Fix".

## 10 — genFixation=FALSE at origin (clean)

Script: `scripts/10-genFixation-false-origin.mjs` — ✅ Single part, genFixation=false at origin.

4 nodes: Sketch, SketchRef, SketchDimensionSet, Point. **No fixation constraint.** Compare to script 06 which had 5 nodes (same + Auto_Fix).

**Learned:** genFixation=false at origin successfully suppresses the auto-fixation constraint.
**📌 LLM doc:** genFixation=false prevents auto-fixation even at origin.

## 11 — genFixation off-origin

Script: `scripts/11-genFixation-offorigin.mjs` — ✅ genFixation=TRUE at (50,30,0).

4 nodes only — no fixation constraint created. Confirms: genFixation only triggers at (0,0,0).

## 04 — genIncidence overlap (TRUE)

Script: `scripts/04-genIncidence-overlap.mjs` — ✅ Two points at (30,20,0), genIncidence=TRUE.

Second point created successfully (ID 60). Structure examined but coincidence was not visible — this was before I knew to filter for constraint classes properly.

## 05 — genIncidence overlap (FALSE)

Script: `scripts/05-genIncidence-false.mjs` — ✅ Two points at (30,20,0), genIncidence=FALSE.

No coincidence constraint. Confirmed after re-examining structure dump.

## 15 — genIncidence exact overlap (definitive)

Script: `scripts/15-genIncidence-exact-overlap.mjs` — ✅ Definitive test.

- genIncidence=true at same position → `Auto_Coinc` (`CC_2DCoincidentConstraint`, ID 62) created
- genIncidence=false at same position → no coincidence constraint

**Learned:** genIncidence creates `Auto_Coinc` when a new point is placed at the **exact** same position as an existing point. Only exact match — 0.001 apart does NOT trigger it (see script 12).
**📌 LLM doc:** genIncidence behavior — exact match only, creates CC_2DCoincidentConstraint.

## 12 — genIncidence near (not exact)

Script: `scripts/12-genIncidence-near.mjs` — ✅ Points 0.001 apart and 5 apart.

No coincidence constraint for either case. Only points (Point, Point0, Point1) in the structure.

**Learned:** genIncidence has no tolerance — only exact coordinate match triggers it.

## 07 — batch creation

Script: `scripts/07-batch-create.mjs` — ✅ Batch of 4 points.

**Data:** Returned `[58, 62, 64, 66]` — array of IDs. All positions verified correct. First point Δ4 to next (fixation constraint), remaining Δ2 (see `files/07-batch-create-batch-response.json`).

**Learned:** Batch works by passing an array of param objects. Returns array of IDs in matching order. Auto-constraints still apply per-point (first gets fixation at origin).
**📌 LLM doc:** Batch creation syntax and return value.

## 08 — non-zero Z coordinate

Script: `scripts/08-nonzero-z.mjs` — ❌ Error.

**Data:** result=null, maxLevel=51, error code 1014: `"The parameter 'pos' which is a 2D point, must have a z-value of 0!"` (see `files/08-nonzero-z-z-test-failed.json`).

**Learned:** Z must be exactly 0 in sketch coordinates. Non-zero Z is a hard error, not a silent projection.
**📌 LLM doc:** Z=0 is strictly enforced — error code 1014.

## 09 — deleteObject with points

Script: `scripts/09-delete-point.mjs` — ✅ Delete middle point from 3.

| ![before-delete](files/09-delete-point-before-delete.png) | ![after-delete](files/09-delete-point-after-delete.png) |
| --- | --- |

**Data:** deleteObject returns null (VOID), maxLevel=31. getPositions on deleted point returns null/maxLevel=51. Surviving points unaffected (see `files/09-delete-point-delete-response.json`).

**Learned:** deleteObject works with point IDs. Returns VOID on success. Accessing deleted point fails gracefully.
**📌 LLM doc:** Deletion via sketch.deleteObject.

## 13 — large and tiny coordinates

Script: `scripts/13-large-coords.mjs` — ✅ Both extremes work.

**Data:** 1e6 and 1e-10 coordinates both accepted, stored exactly as given.

**Learned:** No apparent coordinate range limits.

## 14 — error handling

Script: `scripts/14-invalid-sketch-id.mjs` — ✅ All error cases documented.

**Data (see `files/14-invalid-sketch-id-error-cases.json`):**
- Part ID as sketch: code 1001 — "wrong id type! Provide only following id types: ['sketch']"
- Invalid ID: code 1006 — "invalid id" (warning 41 first)
- Missing pos: code 1004 — "parameter 'pos' must be provided"
- Missing id: code 1004 — "parameter 'id' must be provided"

**📌 LLM doc:** Common error codes and messages.

## 16 — ID increment pattern

Script: `scripts/16-point-id-increment.mjs` — ✅

**Data:** With genFixation=false, genIncidence=false: IDs increment by exactly 2 per point. IDs: 58, 60, 62, 64, 66, 68.

**Learned:** Each CC_Point consumes 2 IDs (the point itself + an internal hidden object). Auto-constraints add additional IDs.

## 17 — auto-naming pattern

Script: `scripts/17-point-naming.mjs` — ✅

**Data:** First point is "Point", subsequent are "Point0", "Point1", "Point2", "Point3". Note: first is "Point" (no number), not "Point0".

**Learned:** Auto-naming starts at "Point" then "Point0", "Point1", ...
**📌 LLM doc:** Naming convention.

## 18 — point on non-XY work plane

Script: `scripts/18-workplane-sketch.mjs` — ✅

| ![point-on-yz-plane](files/18-workplane-sketch-point-on-yz-plane.png) |
|---|

**Data:** Point at (30,20,0) in sketch on YZ plane → stored as world coords `{x:0, y:-20, z:30}`. Input is in **sketch-local coordinates**, Z must be 0 in local space. (See `files/18-workplane-sketch-yz-plane-point.json`.)

**Learned:** pos parameter is in sketch-local coordinates. getPositions returns world coordinates.
**📌 LLM doc:** Coordinate space — local input, world output.

## 19 — point + line interaction

Script: `scripts/19-point-with-line.mjs` — ✅

**Data:** Line creates sub-points (startPoint @ 59, endPoint @ 60). Point at line endpoint triggers `Auto_Coinc` between standalone point and line's endPoint. Also: line auto-generates `Auto_Fix` (fixation) and `Auto_H` (horizontal constraint).

**Learned:** genIncidence works cross-geometry — coincidence between standalone points and line endpoints. Lines implicitly create CC_Point children.
**📌 LLM doc:** Cross-geometry coincidence via genIncidence.

## 20 — CC_Point structure deep dive

Script: `scripts/20-point-structure-members.mjs` — ✅

**Data:** CC_Point has members: `pos` (point), `_VERSION` (string), `rigidSetId` (id, default 0). flags=4097. Parent is the sketch ID.

**Learned:** Points are simple objects — pos + rigidSetId. No constraint data stored on the point itself.

---

## Coverage Checklist

- [x] API called successfully
- [x] Required params tested (id, pos)
- [x] Optional params exercised (genFixation, genIncidence)
- [x] Batch creation tested
- [x] deleteObject tested
- [x] Realistic usage (point + line combination)
- [x] Behavioral claims verified with data (filewrite dumps, log values)
- [x] Error handling documented (wrong type, invalid id, missing params, non-zero Z)
- [x] Edge cases (large/small coords, non-XY plane, naming patterns, ID patterns)
