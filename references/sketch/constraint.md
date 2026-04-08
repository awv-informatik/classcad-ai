# sketch.constraint

Creates one or more geometric constraints in a sketch. Constraints define relationships between sketch geometry (lines, points, circles, arcs) that the solver enforces.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create`)
- Sketch geometry to constrain (lines, points, circles, arcs)

## Key Parameters

- **`id`** (required) — sketch ID.
- **`type`** (required) — one of 14 constraint types (see table below).
- **`geomIds`** (required) — array of sketch geometry IDs to constrain. The required count and type depends on the constraint type.
- **`name`** (optional) — names the constraint object.

## Critical: Constraints Are Declarative Only

**Constraints NEVER reposition geometry.** Adding a constraint stores a rule and returns an ID (maxLevel=31 = success), but the solver does not run. Geometry stays exactly where it was. This applies to ALL constraint types without exception.

**No operation triggers the solver either:**
- `moveGeometry` — raw translation of specified geometry only. Ignores all constraints. Returns `0` (false = unsolved).
- `updateGeometry` — raw position setter. Does not enforce constraints.
- `dimension` / `updateDimension` — stores dimensional constraints but does not reposition.
- Adding more constraints — never triggers solving regardless of constraint count.

**Implication for agents:** You cannot use `constraint()` to reposition sketch geometry. Constraints define design intent that the parametric system uses during feature operations (extrusions, etc.) and when the sketch is saved/loaded. To move geometry, use `moveGeometry` or `updateGeometry` to set positions directly.

## Constraint Types and geomIds

| Type | geomIds | What it does |
|---|---|---|
| `COINCIDENT` | `[pt1, pt2]` or `[pt, curve]` | Point-point coincidence, or point-on-curve. Works with lines, circles, arcs. **Order-independent** — `[pt, circle]` and `[circle, pt]` both work. Accepts line endpoint IDs from `getPoints` AND standalone sketch.point IDs. |
| `COLINEAR` | `[line1, line2]` | Two lines on the same infinite line |
| `CONCENTRIC` | `[circle1, circle2]` or `[arc1, arc2]` | Two circles or arcs share center. Works for circle-circle, arc-arc, and circle-arc. |
| `EQUAL_LENGTH` | `[line1, line2]` | Two lines constrained to same length |
| `EQUAL_RADIUS` | `[circle1, circle2]` or `[arc1, arc2]` | Two circles or arcs constrained to same radius. Works for both geometry types. |
| `FIXATION` | `[geomId]` | Pins geometry in place. Works on **all geometry types**: points, lines, arcs, circles. Takes 1 geomId. |
| `HORIZONTAL` | `[lineId]` or `[pt1, pt2]` | Line horizontal, or two points same Y |
| `MIDPOINT` | `[pointId, lineId]` | Point constrained to midpoint of a line. Accepts standalone sketch.point IDs or line endpoint IDs from `getPoints`. |
| `PARALLEL` | `[line1, line2]` | Two lines same direction |
| `PERPENDICULAR` | `[line1, line2]` | Two lines at 90 degrees |
| `SPLINE_FIT_POINT` | unknown | Listed but untestable — no sketch spline creation API exists |
| `SYMMETRY` | `[axisLine, geom1, geom2]` | **Axis line MUST be first.** Works with both points and lines as the symmetric pair. |
| `TANGENT` | `[curve1, curve2]` | Tangency between arc-line, circle-line, or arc-arc. |
| `VERTICAL` | `[lineId]` or `[pt1, pt2]` | Line vertical, or two points same X |

## Return Value

Always returns a constraint ID (numeric) on success, never VOID. maxLevel=31 (info) on success.

## Batch Creation

Pass an array of param objects to create multiple constraints in one call:

```js
const r = await api.v1.sketch.constraint([
  { id: skId, type: 'HORIZONTAL', geomIds: [l1] },
  { id: skId, type: 'PARALLEL', geomIds: [l1, l2] },
])
// r.result → [68, 70] — array of IDs in matching order
```

Different constraint types can be mixed in one batch call.

## Gotchas

- **Constraints do NOT move geometry.** This is the single most important thing to know. Adding a HORIZONTAL constraint to an angled line does nothing to the line's position. The constraint is stored, the line stays angled.
- **moveGeometry is a raw translation.** It moves ONLY the specified geomIds, ignoring constraints. It breaks apart connected geometry (e.g., a rectangle). Returns `0` (false = unsolved) to indicate constraint violations.
- **No conflict detection.** HORIZONTAL + VERTICAL on the same line, duplicate constraints, over-constraining — all silently accepted with maxLevel=31. No error, no warning.
- **No redundancy detection.** Applying the same constraint twice on the same geometry creates two identical constraint objects.
- **SYMMETRY geomIds order matters.** The axis line MUST be the first element: `[axisLine, geom1, geom2]`. Putting points first gives: "First geometry id of a symmetry constraint must be a line."
- **No geomIds count validation.** Passing too few geomIds (e.g., PARALLEL with 1 line) silently succeeds. The constraint is created but may be meaningless.
- **`getPositions` returns null for circles.** Use `getPoints` instead (returns `{ centerId }`).
- **`getPoints` returns null for standalone sketch points.** But `getPositions` works directly on sketch.point IDs.

## Point IDs for Constraints

To get point IDs from geometry for point-based constraints (COINCIDENT, HORIZONTAL on points, MIDPOINT), use `sketch.getPoints({ id: geomId })`:

| Geometry type | `getPoints` returns |
|---|---|
| Line | `{ startId, endId }` |
| Arc | `{ startId, endId, centerId }` |
| Circle | `{ centerId }` |
| Standalone point (`sketch.point`) | `null` — use the point ID directly |

`getPositions` works on all sub-point IDs from `getPoints` AND directly on standalone sketch.point IDs.

## Common Errors

- **Invalid type** → error code 1013, maxLevel=51. Message includes the full list of valid types.
- **SYMMETRY with wrong geomIds order** → "First geometry id of a symmetry constraint must be a line."
- **Wrong ID type in geomIds** → error 1001: "An element of parameter 'geomIds' has the wrong type!" Usually means you passed null/VOID (from a failed geometry creation) or a non-geometry ID.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create two lines without auto-constraints
const l1 = (await api.v1.sketch.line({
  id: skId, startPos: [0, 0, 0], endPos: [50, 5, 0],
  genFixation: false, genVertAndHoriz: false,
})).result
const l2 = (await api.v1.sketch.line({
  id: skId, startPos: [0, 20, 0], endPos: [50, 30, 0],
  genFixation: false, genVertAndHoriz: false,
})).result

// Add constraints (these are stored, not enforced)
const r = await api.v1.sketch.constraint([
  { id: skId, type: 'HORIZONTAL', geomIds: [l1] },
  { id: skId, type: 'HORIZONTAL', geomIds: [l2] },
  { id: skId, type: 'EQUAL_LENGTH', geomIds: [l1, l2] },
])
// r.result → [id1, id2, id3]
// NOTE: l1 and l2 are still at their original positions!
```

## Related

- `sketch.generateAutoConstraints` — auto-generate constraints for geometry
- `sketch.dimension` — dimensional constraints (RADIUS, OFFSET, ANGLE, etc.)
- `sketch.getPoints` — get point IDs from geometry (needed for point-based constraints)
- `sketch.getPositions` — get positions (works for lines/arcs sub-points and standalone sketch.point IDs)
- `sketch.moveGeometry` — raw translation (does not enforce constraints)
- `sketch.updateGeometry` — raw position setter (does not enforce constraints)
