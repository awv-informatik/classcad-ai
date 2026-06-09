# sketch.constraint

Creates geometric constraints in a sketch. Constraints define relationships between sketch elements (points, lines, circles, arcs) and are enforced by the solver in real time.

**Critical:** The constraint solver only runs when the sketch has an explicit `planeId` (set via `sketch.create`). Without it, constraints are stored but never enforced — no error, no warning.

## Prerequisites

- A part (`part.create`)
- A sketch created **with `planeId`** (`sketch.create({ id: partId, planeId: topPlane.id })`)
- Sketch geometry (lines, circles, arcs, points) to constrain

## Key Parameters

- **`id`** (required) — sketch ID
- **`type`** (required) — one of 14 constraint types (see table below)
- **`geomIds`** (required) — array of sketch geometry IDs to constrain. Contents depend on type.
- **`name`** (optional) — named constraints show their name in the structure tree. Unnamed ones get auto-names ("H", "V", etc.)

## Batch Creation

Pass an array of param objects to create multiple constraints in one call. Returns an array of IDs, one per constraint.

```js
const ids = (await api.v1.sketch.constraint([
  { id: skId, type: 'HORIZONTAL', geomIds: [lineA] },
  { id: skId, type: 'VERTICAL', geomIds: [lineB] },
  { id: skId, name: 'eq1', type: 'EQUAL_LENGTH', geomIds: [lineA, lineB] },
])).result
// ids = [92, 94, 96]
```

## Return Value

```js
{ result: id | VOID | Array<id|VOID>, messages?: [...], maxLevel?: real }
```

- `result` — constraint ID (or array of IDs for batch). VOID for rejected constraints.
- A non-null result does NOT guarantee success. Always check `maxLevel`:
  - `maxLevel ≤ 31` — clean, solver happy
  - `maxLevel ≥ 51` — error (constraint may be created but solver failed)

## Constraint Types

### Directional / Positional — solver repositions geometry immediately

| Type | geomIds | What it does |
|---|---|---|
| `HORIZONTAL` | `[line]` or `[pt1, pt2]` | Line: rotates to horizontal, preserves length. Points: aligns Y coordinates. |
| `VERTICAL` | `[line]` or `[pt1, pt2]` | Line: rotates to vertical, preserves length. Points: aligns X coordinates. |
| `PARALLEL` | `[line1, line2]` | Rotates unconstrained line to match direction of the other. Preserves length. |
| `PERPENDICULAR` | `[line1, line2]` | Rotates unconstrained line to 90° from the other. Preserves length. |
| `COINCIDENT` | `[pt, pt]` or `[pt, curve]` | Points: snaps together. Point-on-curve: snaps point onto line/circle/arc. Order doesn't matter. |
| `COLINEAR` | `[line1, line2]` | Moves unconstrained line onto the same infinite line as the other. |
| `CONCENTRIC` | `[circ1, circ2]` or `[arc1, arc2]` | Moves unconstrained circle/arc center to match the other's center. |
| `TANGENT` | `[arc/circle, line]` or `[circle1, circle2]` | Arc/circle + line: moves so edge touches line (center-to-line distance = radius). Circle + circle: moves to external tangency (center distance = r1 + r2). |
| `SYMMETRY` | `[axis, elem1, elem2]` | Mirrors the unconstrained element about the axis line. **Axis must be first in geomIds.** Works with points (exact) and lines (approximate if different lengths — solver mirrors orientation but preserves individual line lengths). |
| `FIXATION` | `[geometry]` | Locks geometry in place. All geometry types (point, line, arc, circle). Use to anchor reference geometry before adding other constraints. |

### Equality — solver enforces immediately (may resize either element)

| Type | geomIds | What it does |
|---|---|---|
| `EQUAL_LENGTH` | `[line1, line2]` | Equalizes line lengths immediately. **The solver may change either line** — even a "fixed" one. FIXATION on a line locks position/direction but does not fully prevent length changes. |
| `EQUAL_RADIUS` | `[circ1, circ2]` or `[arc1, arc2]` | Equalizes radii immediately. Same caveat — the solver may change either circle. |

### Special

| Type | geomIds | What it does |
|---|---|---|
| `MIDPOINT` | `[point, line]` | Constrains point to the midpoint of the line. **Only works reliably with line endpoints** (from `getPoints`). Free `sketch.point` IDs don't converge — avoid them. |
| `SPLINE_FIT_POINT` | — | For spline geometry. Not tested (no spline creation API available). |

## Solver Behavior

- **Constraints are enforced immediately** at creation time for directional/positional types. The solver repositions geometry to satisfy constraints, preserving line lengths.
- **FIXATION anchors geometry.** Fix reference elements first, then add constraints — the solver moves only non-fixed geometry.
- **No conflict detection.** Conflicting constraints (e.g., HORIZONTAL + VERTICAL on the same line) are accepted silently (maxLevel=31, no error). The solver satisfies what it can and ignores the rest. Verified under an ACTIVE solver 2026-06-10: geometry follows the earlier constraint and the losing constraint's structure node carries `lgsState: 0` — that field is the only conflict signal.
- **No over-constraint warnings.** Duplicate and redundant constraints are also accepted silently.
- **Constraint chaining propagates.** If PARALLEL(A,B) and PARALLEL(B,C), then C becomes parallel to A. The solver resolves transitive relationships automatically.
- **Deleting a constraint does NOT revert geometry.** Geometry stays where the solver placed it. Only the constraint relationship is removed.
- **Recommended application order:** FIXATION (anchor) → COINCIDENT (connect) → directional (H/V/PARALLEL/PERP) → equality/dimensional (EQUAL_LENGTH, dimensions).

## moveGeometry with Constraints

With an active solver (planeId set), `moveGeometry` is constraint-aware:
- Returns `null` + `maxLevel=51` (error) when the move conflicts with constraints
- Geometry stays unchanged on failure
- This is the opposite of without planeId, where moveGeometry was a raw translation

## Gotchas

- **Without `planeId`, constraints do nothing.** The #1 mistake. Always create sketches with a plane.
- **EQUAL_LENGTH/EQUAL_RADIUS may change either element.** The solver equalizes by adjusting whichever line/circle it finds easier to move — even a "FIXATION"-constrained one. FIXATION locks position/direction but not length. To protect a line's length, fix both its endpoints individually.
- **The FIXATION-doesn't-lock-length caveat applies to COINCIDENT too** (verified 2026-06-10): COINCIDENT between a fixed line's endpoint and another point can be satisfied by STRETCHING the fixed line along its direction (end moved 50→55 to meet the other point). With both endpoints individually fixed, the other geometry snaps instead.
- **MIDPOINT fails on free sketch.points.** Use line endpoints (`getPoints().startId` or `.endId`) instead.
- **Non-null result ≠ success.** A constraint can be created (get an ID) but produce solver errors (maxLevel=51). Always check maxLevel.
- **Invalid geomIds are inconsistent.** Wrong count for some types → returns null. Wrong count for others → creates constraint but produces solver errors. Always validate before creating.
- **`lgsState` in structure tree:** 1 = solved, 0 = unsolved. Check constraint nodes in the structure tree if you need to verify solver state.
- **SYMMETRY on lines with different lengths is approximate.** The solver mirrors orientation but preserves each line's original length. For exact mirroring, ensure lines have equal length (add EQUAL_LENGTH) or constrain individual endpoints with SYMMETRY on point pairs.
- **`getPositions` returns null for circles.** To read a circle's center position, use `getPoints({id: circleId}).result.centerId`, then `getPositions({id: centerId})`.
- **Constraint deletion doesn't undo geometry changes.** After deleting a constraint, geometry stays where the solver moved it. There is no automatic revert.

## Common Errors

| Error | Cause |
|---|---|
| "The provided value for parameter 'type' is not valid" | Invalid constraint type string |
| "Wrong number of geometry ids provided for a equal length constraint" | EQUAL_LENGTH needs exactly 2 line IDs |
| "Index N ausserhalb des Arraybereichs" | Too few geomIds for the constraint type (array out of bounds in solver) |

## Working Example

```js
const partR = await api.v1.part.create({ name: 'ConstraintDemo' })
const partId = partR.result
const topPlane = Object.values(partR.structure.tree)
  .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

// Two lines forming an L shape
const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [60, 40, 0] })).result

// Fix bottom-left corner
const pts1 = (await api.v1.sketch.getPoints({ id: l1 })).result
await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts1.startId] })

// Make l1 horizontal, l2 vertical, and connect them
await api.v1.sketch.constraint([
  { id: skId, type: 'HORIZONTAL', geomIds: [l1] },
  { id: skId, type: 'VERTICAL', geomIds: [l2] },
  { id: skId, type: 'COINCIDENT', geomIds: [pts1.endId, (await api.v1.sketch.getPoints({ id: l2 })).result.startId] },
])
```

## Related

- `sketch.create` — must set `planeId` for solver to work
- `sketch.dimension` — dimensional constraints (OFFSET, RADIUS, etc.)
- `sketch.updateDimension` — modify dimension values (triggers solver)
- `sketch.getPoints` — get point IDs from geometry (needed for COINCIDENT, MIDPOINT, etc.)
- `sketch.getPositions` — read point coordinates to verify constraint effects
- `sketch.moveGeometry` — constraint-aware with active solver
- `sketch.generateAutoConstraints` — auto-detect constraints from geometry positions
