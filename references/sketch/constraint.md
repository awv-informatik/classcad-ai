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

## Constraint Types and geomIds

| Type | geomIds | What it does |
|---|---|---|
| `HORIZONTAL` | `[lineId]` or `[pt1, pt2]` | Line horizontal, or two points same Y |
| `VERTICAL` | `[lineId]` or `[pt1, pt2]` | Line vertical, or two points same X |
| `COINCIDENT` | `[pt1, pt2]` or `[pt, curve]` | Point-point coincidence, or point-on-curve |
| `COLINEAR` | `[line1, line2]` | Two lines on the same infinite line |
| `CONCENTRIC` | `[circle1, circle2]` | Two circles/arcs share center |
| `EQUAL_LENGTH` | `[line1, line2]` | Two lines constrained to same length |
| `EQUAL_RADIUS` | `[circle1, circle2]` | Two circles/arcs constrained to same radius |
| `FIXATION` | `[geomId]` | Pins a point or curve in place (1 geomId) |
| `MIDPOINT` | `[pointId, lineId]` | Point constrained to midpoint of a line |
| `PARALLEL` | `[line1, line2]` | Two lines same direction |
| `PERPENDICULAR` | `[line1, line2]` | Two lines at 90 degrees |
| `SYMMETRY` | `[axisLine, geom1, geom2]` | **Axis line MUST be first.** Works with points or lines. |
| `TANGENT` | `[curve1, curve2]` | Tangency between arc-line or arc-arc |
| `SPLINE_FIT_POINT` | unknown | Listed but untestable — no sketch spline creation API exists |

## Return Value

Always returns a constraint ID (numeric) on success, never VOID. maxLevel=31 (info) on success.

## Batch Creation

Pass an array of param objects to create multiple constraints in one call:

```js
const r = await api.v1.sketch.constraint([
  { id: skId, type: 'HORIZONTAL', geomIds: [line1Id] },
  { id: skId, type: 'PARALLEL', geomIds: [line1Id, line2Id] },
])
// r.result → [68, 70] — array of IDs in matching order
```

Different constraint types can be mixed in one batch call.

## Gotchas

- **SYMMETRY geomIds order matters.** The axis line MUST be the first element: `[axisLine, geom1, geom2]`. Putting points first gives: "First geometry id of a symmetry constraint must be a line."
- **No geomIds count validation.** Passing too few geomIds (e.g., PARALLEL with 1 line) silently succeeds. The constraint is created but may be meaningless.
- **No redundancy detection.** Applying the same constraint twice on the same geometry creates two identical constraint objects. No warning.
- **Constraints don't necessarily move geometry.** In underconstrained systems, the solver stores the constraint but may not reposition geometry. The constraint is still active and will affect future solving when more constraints reduce DOFs.
- **`getPositions` returns null for circles.** Use `getPoints` instead (returns `{ centerId }`).
- **Point IDs for constraints.** To get point IDs from a line/arc for point-based constraints (COINCIDENT, HORIZONTAL on points, etc.), use `sketch.getPoints({ id: geomId })` — takes the geometry ID directly (not the sketch ID). Returns `{ startId, endId }` for lines, `{ startId, endId, centerId }` for arcs, `{ centerId }` for circles.

## Common Errors

- **Invalid type** → error code 1013, maxLevel=51. Message includes the full list of valid types.
- **SYMMETRY with wrong geomIds order** → "First geometry id of a symmetry constraint must be a line."

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create two lines
const l1 = (await api.v1.sketch.line({
  id: skId, startPos: [0, 0, 0], endPos: [50, 5, 0],
  genFixation: false, genVertAndHoriz: false,
})).result
const l2 = (await api.v1.sketch.line({
  id: skId, startPos: [0, 20, 0], endPos: [50, 30, 0],
  genFixation: false, genVertAndHoriz: false,
})).result

// Make both horizontal and parallel
const r = await api.v1.sketch.constraint([
  { id: skId, type: 'HORIZONTAL', geomIds: [l1] },
  { id: skId, type: 'HORIZONTAL', geomIds: [l2] },
  { id: skId, type: 'EQUAL_LENGTH', geomIds: [l1, l2] },
])
// r.result → [id1, id2, id3]
```

## Related

- `sketch.generateAutoConstraints` — auto-generate constraints for geometry
- `sketch.dimension` — dimensional constraints (RADIUS, OFFSET, ANGLE, etc.)
- `sketch.getPoints` — get point IDs from geometry (needed for point-based constraints)
- `sketch.getPositions` — get positions (works for lines/arcs, returns null for circles)
