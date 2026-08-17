diff --git a/references/sketch/constraint.md b/references/sketch/constraint.md
index f452cab..08b7aab 100644
--- a/references/sketch/constraint.md
+++ b/references/sketch/constraint.md
@@ -1,130 +1,140 @@
 # sketch.constraint
 
-Creates one or more geometric constraints in a sketch. Constraints define relationships between sketch geometry (lines, points, circles, arcs) that the solver enforces.
+Creates geometric constraints in a sketch. Constraints define relationships between sketch elements (points, lines, circles, arcs) and are enforced by the solver in real time.
+
+**Critical:** The constraint solver only runs when the sketch has an explicit `planeId` (set via `sketch.create`). Without it, constraints are stored but never enforced — no error, no warning.
 
 ## Prerequisites
 
 - A part (`part.create`)
-- A sketch (`sketch.create`)
-- Sketch geometry to constrain (lines, points, circles, arcs)
+- A sketch created **with `planeId`** (`sketch.create({ id: partId, planeId: topPlane.id })`)
+- Sketch geometry (lines, circles, arcs, points) to constrain
 
 ## Key Parameters
 
-- **`id`** (required) — sketch ID.
-- **`type`** (required) — one of 14 constraint types (see table below).
-- **`geomIds`** (required) — array of sketch geometry IDs to constrain. The required count and type depends on the constraint type.
-- **`name`** (optional) — names the constraint object.
+- **`id`** (required) — sketch ID
+- **`type`** (required) — one of 14 constraint types (see table below)
+- **`geomIds`** (required) — array of sketch geometry IDs to constrain. Contents depend on type.
+- **`name`** (optional) — named constraints show their name in the structure tree. Unnamed ones get auto-names ("H", "V", etc.)
 
-## Critical: Constraints Are Declarative Only
+## Batch Creation
 
-**Constraints NEVER reposition geometry.** Adding a constraint stores a rule and returns an ID (maxLevel=31 = success), but the solver does not run. Geometry stays exactly where it was. This applies to ALL constraint types without exception.
+Pass an array of param objects to create multiple constraints in one call. Returns an array of IDs, one per constraint.
 
-**No operation triggers the solver either:**
-- `moveGeometry` — raw translation of specified geometry only. Ignores all constraints. Returns `0` (false = unsolved).
-- `updateGeometry` — raw position setter. Does not enforce constraints.
-- `dimension` / `updateDimension` — stores dimensional constraints but does not reposition.
-- Adding more constraints — never triggers solving regardless of constraint count.
+```js
+const ids = (await api.v1.sketch.constraint([
+  { id: skId, type: 'HORIZONTAL', geomIds: [lineA] },
+  { id: skId, type: 'VERTICAL', geomIds: [lineB] },
+  { id: skId, name: 'eq1', type: 'EQUAL_LENGTH', geomIds: [lineA, lineB] },
+])).result
+// ids = [92, 94, 96]
+```
 
-**Implication for agents:** You cannot use `constraint()` to reposition sketch geometry. Constraints define design intent that the parametric system uses during feature operations (extrusions, etc.) and when the sketch is saved/loaded. To move geometry, use `moveGeometry` or `updateGeometry` to set positions directly.
+## Return Value
 
-## Constraint Types and geomIds
+```js
+{ result: id | VOID | Array<id|VOID>, messages?: [...], maxLevel?: real }
+```
 
-| Type | geomIds | What it does |
-|---|---|---|
-| `COINCIDENT` | `[pt1, pt2]` or `[pt, curve]` | Point-point coincidence, or point-on-curve. Works with lines, circles, arcs. **Order-independent** — `[pt, circle]` and `[circle, pt]` both work. Accepts line endpoint IDs from `getPoints` AND standalone sketch.point IDs. |
-| `COLINEAR` | `[line1, line2]` | Two lines on the same infinite line |
-| `CONCENTRIC` | `[circle1, circle2]` or `[arc1, arc2]` | Two circles or arcs share center. Works for circle-circle, arc-arc, and circle-arc. |
-| `EQUAL_LENGTH` | `[line1, line2]` | Two lines constrained to same length |
-| `EQUAL_RADIUS` | `[circle1, circle2]` or `[arc1, arc2]` | Two circles or arcs constrained to same radius. Works for both geometry types. |
-| `FIXATION` | `[geomId]` | Pins geometry in place. Works on **all geometry types**: points, lines, arcs, circles. Takes 1 geomId. |
-| `HORIZONTAL` | `[lineId]` or `[pt1, pt2]` | Line horizontal, or two points same Y |
-| `MIDPOINT` | `[pointId, lineId]` | Point constrained to midpoint of a line. Accepts standalone sketch.point IDs or line endpoint IDs from `getPoints`. |
-| `PARALLEL` | `[line1, line2]` | Two lines same direction |
-| `PERPENDICULAR` | `[line1, line2]` | Two lines at 90 degrees |
-| `SPLINE_FIT_POINT` | unknown | Listed but untestable — no sketch spline creation API exists |
-| `SYMMETRY` | `[axisLine, geom1, geom2]` | **Axis line MUST be first.** Works with both points and lines as the symmetric pair. |
-| `TANGENT` | `[curve1, curve2]` | Tangency between arc-line, circle-line, or arc-arc. |
-| `VERTICAL` | `[lineId]` or `[pt1, pt2]` | Line vertical, or two points same X |
+- `result` — constraint ID (or array of IDs for batch). VOID for rejected constraints.
+- A non-null result does NOT guarantee success. Always check `maxLevel`:
+  - `maxLevel ≤ 31` — clean, solver happy
+  - `maxLevel ≥ 51` — error (constraint may be created but solver failed)
 
-## Return Value
+## Constraint Types
 
-Always returns a constraint ID (numeric) on success, never VOID. maxLevel=31 (info) on success.
+### Directional / Positional — solver repositions geometry immediately
 
-## Batch Creation
+| Type | geomIds | What it does |
+|---|---|---|
+| `HORIZONTAL` | `[line]` or `[pt1, pt2]` | Line: rotates to horizontal, preserves length. Points: aligns Y coordinates. |
+| `VERTICAL` | `[line]` or `[pt1, pt2]` | Line: rotates to vertical, preserves length. Points: aligns X coordinates. |
+| `PARALLEL` | `[line1, line2]` | Rotates unconstrained line to match direction of the other. Preserves length. |
+| `PERPENDICULAR` | `[line1, line2]` | Rotates unconstrained line to 90° from the other. Preserves length. |
+| `COINCIDENT` | `[pt, pt]` or `[pt, curve]` | Points: snaps together. Point-on-curve: snaps point onto line/circle/arc. Order doesn't matter. |
+| `COLINEAR` | `[line1, line2]` | Moves unconstrained line onto the same infinite line as the other. |
+| `CONCENTRIC` | `[circ1, circ2]` or `[arc1, arc2]` | Moves unconstrained circle/arc center to match the other's center. |
+| `TANGENT` | `[arc/circle, line]` | Moves unconstrained arc/circle so its edge touches the line (distance from center to line = radius). |
+| `SYMMETRY` | `[axis, elem1, elem2]` | Mirrors the unconstrained element about the axis line. **Axis must be first in geomIds.** Works with points and lines. |
+| `FIXATION` | `[geometry]` | Locks geometry in place. All geometry types (point, line, arc, circle). Use to anchor reference geometry before adding other constraints. |
+
+### Equality — constraint stored but does NOT resize at creation time
 
-Pass an array of param objects to create multiple constraints in one call:
+| Type | geomIds | What it does |
+|---|---|---|
+| `EQUAL_LENGTH` | `[line1, line2]` | Stores length equality constraint. Lines are NOT resized immediately. Requires dimension changes or other triggers. |
+| `EQUAL_RADIUS` | `[circ1, circ2]` or `[arc1, arc2]` | Stores radius equality constraint. Radii are NOT changed immediately. |
 
-```js
-const r = await api.v1.sketch.constraint([
-  { id: skId, type: 'HORIZONTAL', geomIds: [l1] },
-  { id: skId, type: 'PARALLEL', geomIds: [l1, l2] },
-])
-// r.result → [68, 70] — array of IDs in matching order
-```
+### Special
 
-Different constraint types can be mixed in one batch call.
+| Type | geomIds | What it does |
+|---|---|---|
+| `MIDPOINT` | `[point, line]` | Constrains point to the midpoint of the line. **Only works reliably with line endpoints** (from `getPoints`). Free `sketch.point` IDs don't converge — avoid them. |
+| `SPLINE_FIT_POINT` | — | For spline geometry. Not tested (no spline creation API available). |
 
-## Gotchas
+## Solver Behavior
 
-- **Constraints do NOT move geometry.** This is the single most important thing to know. Adding a HORIZONTAL constraint to an angled line does nothing to the line's position. The constraint is stored, the line stays angled.
-- **moveGeometry is a raw translation.** It moves ONLY the specified geomIds, ignoring constraints. It breaks apart connected geometry (e.g., a rectangle). Returns `0` (false = unsolved) to indicate constraint violations.
-- **No conflict detection.** HORIZONTAL + VERTICAL on the same line, duplicate constraints, over-constraining — all silently accepted with maxLevel=31. No error, no warning.
-- **No redundancy detection.** Applying the same constraint twice on the same geometry creates two identical constraint objects.
-- **SYMMETRY geomIds order matters.** The axis line MUST be the first element: `[axisLine, geom1, geom2]`. Putting points first gives: "First geometry id of a symmetry constraint must be a line."
-- **No geomIds count validation.** Passing too few geomIds (e.g., PARALLEL with 1 line) silently succeeds. The constraint is created but may be meaningless.
-- **`getPositions` returns null for circles.** Use `getPoints` instead (returns `{ centerId }`).
-- **`getPoints` returns null for standalone sketch points.** But `getPositions` works directly on sketch.point IDs.
+- **Constraints are enforced immediately** at creation time for directional/positional types. The solver repositions geometry to satisfy constraints, preserving line lengths.
+- **FIXATION anchors geometry.** Fix reference elements first, then add constraints — the solver moves only non-fixed geometry.
+- **No conflict detection.** Conflicting constraints (e.g., HORIZONTAL + VERTICAL on the same line) are accepted silently (maxLevel=31, no error). The solver satisfies what it can and ignores the rest.
+- **No over-constraint warnings.** Duplicate and redundant constraints are also accepted silently.
 
-## Point IDs for Constraints
+## moveGeometry with Constraints
 
-To get point IDs from geometry for point-based constraints (COINCIDENT, HORIZONTAL on points, MIDPOINT), use `sketch.getPoints({ id: geomId })`:
+With an active solver (planeId set), `moveGeometry` is constraint-aware:
+- Returns `null` + `maxLevel=51` (error) when the move conflicts with constraints
+- Geometry stays unchanged on failure
+- This is the opposite of without planeId, where moveGeometry was a raw translation
 
-| Geometry type | `getPoints` returns |
-|---|---|
-| Line | `{ startId, endId }` |
-| Arc | `{ startId, endId, centerId }` |
-| Circle | `{ centerId }` |
-| Standalone point (`sketch.point`) | `null` — use the point ID directly |
+## Gotchas
 
-`getPositions` works on all sub-point IDs from `getPoints` AND directly on standalone sketch.point IDs.
+- **Without `planeId`, constraints do nothing.** The #1 mistake. Always create sketches with a plane.
+- **EQUAL_LENGTH/EQUAL_RADIUS don't resize immediately.** Don't expect geometry to change at constraint creation — these are stored for solver consistency during future modifications.
+- **MIDPOINT fails on free sketch.points.** Use line endpoints (`getPoints().startId` or `.endId`) instead.
+- **Non-null result ≠ success.** A constraint can be created (get an ID) but produce solver errors (maxLevel=51). Always check maxLevel.
+- **Invalid geomIds are inconsistent.** Wrong count for some types → returns null. Wrong count for others → creates constraint but produces solver errors. Always validate before creating.
+- **`lgsState` in structure tree:** 1 = solved, 0 = unsolved. Check constraint nodes in the structure tree if you need to verify solver state.
 
 ## Common Errors
 
-- **Invalid type** → error code 1013, maxLevel=51. Message includes the full list of valid types.
-- **SYMMETRY with wrong geomIds order** → "First geometry id of a symmetry constraint must be a line."
-- **Wrong ID type in geomIds** → error 1001: "An element of parameter 'geomIds' has the wrong type!" Usually means you passed null/VOID (from a failed geometry creation) or a non-geometry ID.
+| Error | Cause |
+|---|---|
+| "The provided value for parameter 'type' is not valid" | Invalid constraint type string |
+| "Wrong number of geometry ids provided for a equal length constraint" | EQUAL_LENGTH needs exactly 2 line IDs |
+| "Index N ausserhalb des Arraybereichs" | Too few geomIds for the constraint type (array out of bounds in solver) |
 
 ## Working Example
 
 ```js
-const partId = (await api.v1.part.create({ name: 'Test' })).result
-const skId = (await api.v1.sketch.create({ id: partId })).result
-
-// Create two lines without auto-constraints
-const l1 = (await api.v1.sketch.line({
-  id: skId, startPos: [0, 0, 0], endPos: [50, 5, 0],
-  genFixation: false, genVertAndHoriz: false,
-})).result
-const l2 = (await api.v1.sketch.line({
-  id: skId, startPos: [0, 20, 0], endPos: [50, 30, 0],
-  genFixation: false, genVertAndHoriz: false,
-})).result
-
-// Add constraints (these are stored, not enforced)
-const r = await api.v1.sketch.constraint([
+const partR = await api.v1.part.create({ name: 'ConstraintDemo' })
+const partId = partR.result
+const topPlane = Object.values(partR.structure.tree)
+  .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
+
+const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
+
+// Two lines forming an L shape
+const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
+const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [60, 40, 0] })).result
+
+// Fix bottom-left corner
+const pts1 = (await api.v1.sketch.getPoints({ id: l1 })).result
+await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts1.startId] })
+
+// Make l1 horizontal, l2 vertical, and connect them
+await api.v1.sketch.constraint([
   { id: skId, type: 'HORIZONTAL', geomIds: [l1] },
-  { id: skId, type: 'HORIZONTAL', geomIds: [l2] },
-  { id: skId, type: 'EQUAL_LENGTH', geomIds: [l1, l2] },
+  { id: skId, type: 'VERTICAL', geomIds: [l2] },
+  { id: skId, type: 'COINCIDENT', geomIds: [pts1.endId, (await api.v1.sketch.getPoints({ id: l2 })).result.startId] },
 ])
-// r.result → [id1, id2, id3]
-// NOTE: l1 and l2 are still at their original positions!
 ```
 
 ## Related
 
-- `sketch.generateAutoConstraints` — auto-generate constraints for geometry
-- `sketch.dimension` — dimensional constraints (RADIUS, OFFSET, ANGLE, etc.)
-- `sketch.getPoints` — get point IDs from geometry (needed for point-based constraints)
-- `sketch.getPositions` — get positions (works for lines/arcs sub-points and standalone sketch.point IDs)
-- `sketch.moveGeometry` — raw translation (does not enforce constraints)
-- `sketch.updateGeometry` — raw position setter (does not enforce constraints)
+- `sketch.create` — must set `planeId` for solver to work
+- `sketch.dimension` — dimensional constraints (OFFSET, RADIUS, etc.)
+- `sketch.updateDimension` — modify dimension values (triggers solver)
+- `sketch.getPoints` — get point IDs from geometry (needed for COINCIDENT, MIDPOINT, etc.)
+- `sketch.getPositions` — read point coordinates to verify constraint effects
+- `sketch.moveGeometry` — constraint-aware with active solver
+- `sketch.generateAutoConstraints` — auto-detect constraints from geometry positions
