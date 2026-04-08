# Skill Changes — sketch.constraint training

## New file: `references/sketch/constraint.md`

```diff
+# sketch.constraint
+
+Creates one or more geometric constraints in a sketch. Constraints define relationships between sketch geometry (lines, points, circles, arcs) that the solver enforces.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch (`sketch.create`)
+- Sketch geometry to constrain (lines, points, circles, arcs)
+
+## Key Parameters
+
+- **`id`** (required) — sketch ID.
+- **`type`** (required) — one of 14 constraint types (see table below).
+- **`geomIds`** (required) — array of sketch geometry IDs to constrain. The required count and type depends on the constraint type.
+- **`name`** (optional) — names the constraint object.
+
+## Constraint Types and geomIds
+
+| Type | geomIds | What it does |
+|---|---|---|
+| `HORIZONTAL` | `[lineId]` or `[pt1, pt2]` | Line horizontal, or two points same Y |
+| `VERTICAL` | `[lineId]` or `[pt1, pt2]` | Line vertical, or two points same X |
+| `COINCIDENT` | `[pt1, pt2]` or `[pt, curve]` | Point-point coincidence, or point-on-curve |
+| `COLINEAR` | `[line1, line2]` | Two lines on the same infinite line |
+| `CONCENTRIC` | `[circle1, circle2]` | Two circles/arcs share center |
+| `EQUAL_LENGTH` | `[line1, line2]` | Two lines constrained to same length |
+| `EQUAL_RADIUS` | `[circle1, circle2]` | Two circles/arcs constrained to same radius |
+| `FIXATION` | `[geomId]` | Pins a point or curve in place (1 geomId) |
+| `MIDPOINT` | `[pointId, lineId]` | Point constrained to midpoint of a line |
+| `PARALLEL` | `[line1, line2]` | Two lines same direction |
+| `PERPENDICULAR` | `[line1, line2]` | Two lines at 90 degrees |
+| `SYMMETRY` | `[axisLine, geom1, geom2]` | **Axis line MUST be first.** Works with points or lines. |
+| `TANGENT` | `[curve1, curve2]` | Tangency between arc-line or arc-arc |
+| `SPLINE_FIT_POINT` | unknown | Listed but untestable — no sketch spline creation API exists |
+
+## Return Value
+
+Always returns a constraint ID (numeric) on success, never VOID. maxLevel=31 (info) on success.
+
+## Batch Creation
+
+Pass an array of param objects to create multiple constraints in one call. Returns array of IDs in matching order. Different constraint types can be mixed.
+
+## Gotchas
+
+- SYMMETRY geomIds order: axis line MUST be first
+- No geomIds count validation — too few silently succeeds
+- No redundancy detection — duplicate constraints created silently
+- Constraints stored but solver may not move geometry in underconstrained systems
+- `getPositions` returns null for circles — use `getPoints` instead
+- `getPoints` takes geometry ID directly, not sketch ID
+
+## Common Errors
+
+- Invalid type → error code 1013
+- SYMMETRY wrong order → "First geometry id of a symmetry constraint must be a line."
```
