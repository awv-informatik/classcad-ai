# sketch.constraint

Creates geometric constraints between sketch elements (points, lines, circles, arcs), enforced by the solver immediately.

**Critical (#1 mistake):** the solver only runs when the sketch has an explicit `planeId` (`sketch.create`). Without it, constraints are stored but never enforced — no error, no warning.

## Key Parameters

- **`id`** (required) — sketch ID
- **`type`** (required) — one of 14 types (below)
- **`geomIds`** (required) — geometry IDs; contents depend on type
- **`name`** (optional) — tree name; unnamed get auto-names ("H", "V", …)

## Return Value

`result: id | VOID | Array<id|VOID>` — VOID for rejected constraints. Batch: pass an array of param objects, get an array of IDs:

```js
const ids = (await api.v1.sketch.constraint([
  { id: skId, type: 'HORIZONTAL', geomIds: [lineA] },
  { id: skId, name: 'eq1', type: 'EQUAL_LENGTH', geomIds: [lineA, lineB] },
])).result
```

**Non-null result ≠ success.** `maxLevel ≤ 31` clean; `≥ 51` error (constraint may exist but solver failed). Invalid geomIds are inconsistent: wrong count returns null for some types, creates a failing constraint for others — validate first.

## Constraint Types

### Directional / Positional (repositions immediately)

| Type | geomIds | Effect |
|---|---|---|
| `HORIZONTAL` | `[line]` / `[pt1, pt2]` | Line rotates to horizontal (length kept); points align Y |
| `VERTICAL` | `[line]` / `[pt1, pt2]` | Line rotates to vertical (length kept); points align X |
| `PARALLEL` | `[line1, line2]` | Rotates unconstrained line to match; length kept |
| `PERPENDICULAR` | `[line1, line2]` | Rotates unconstrained line to 90°; length kept |
| `COINCIDENT` | `[pt, pt]` / `[pt, curve]` | Snaps points together, or point onto line/circle/arc. Order irrelevant. |
| `COLINEAR` | `[line1, line2]` | Moves unconstrained line onto the other's infinite line |
| `CONCENTRIC` | `[circ1, circ2]` / `[arc1, arc2]` | Moves unconstrained center to the other's |
| `TANGENT` | `[arc/circle, line]` / `[circle1, circle2]` | Arc/circle + line: center-to-line distance = radius. Circle + circle: external tangency (r1 + r2) **when seeded apart**; INTERNAL branch (R − r) fully supported when seeded internally tangent — kept through creation and every re-solve (R12 dome arc inside-tangent to Ø5.6 circles followed Ø5.6→7 to 1e-14). |
| `SYMMETRY` | `[axis, elem1, elem2]` | Mirrors unconstrained element. **Axis first.** Points exact; lines approximate if lengths differ (orientation mirrored, lengths kept) — add EQUAL_LENGTH or use point-pair SYMMETRY for exact. |
| `FIXATION` | `[geometry]` | Locks any geometry type in place; anchor references first |

### Equality (may resize EITHER element)

| Type | geomIds | Effect |
|---|---|---|
| `EQUAL_LENGTH` | `[line1, line2]` | Equalizes lengths |
| `EQUAL_RADIUS` | `[circ1, circ2]` / `[arc1, arc2]` | Equalizes radii |

### Special

| Type | geomIds | Effect |
|---|---|---|
| `MIDPOINT` | `[point, line]` | Point to line midpoint. **Only reliable with line endpoints** (`getPoints`); free `sketch.point` IDs don't converge. |
| `SPLINE_FIT_POINT` | — | For splines; untested (no spline creation API) |

## Solver Behavior

- **FIXATION doesn't lock length.** EQUAL_LENGTH/EQUAL_RADIUS may change a FIXATION-constrained line/circle; COINCIDENT between a fixed line's endpoint and another point can STRETCH the fixed line along its direction (end moved 50→55). Fix both endpoints individually to protect length — then the other geometry snaps instead.
- **No conflict / over-constraint detection.** Conflicting (e.g. HORIZONTAL + VERTICAL on one line), duplicate, and redundant constraints are accepted silently (maxLevel 31). Geometry follows the earlier constraint; the loser's node has `lgsState: 0` — the only conflict signal.
- **Chaining propagates:** PARALLEL(A,B) + PARALLEL(B,C) → C parallel to A.
- **Deleting a constraint does NOT revert geometry.**
- **Recommended order:** FIXATION → COINCIDENT → directional (H/V/PARALLEL/PERP) → equality/dimensions.
- **Junction on a FULL circle** (dome arc/fillet meeting a boss circle that must stay closed): `COINCIDENT [curveEndpointPt, circleId]` + `TANGENT [curve, circle]`. Tangency fixes the circle relation, endpoint-on-circle kills the end-angle DOF; endpoint lands exactly at the tangency point (1e-14).
- **`moveGeometry` is constraint-aware** with an active solver: conflicting move → `null`, maxLevel 51, geometry unchanged (without planeId it is a raw translation).
- **`lgsState`:** constraint nodes 1 = solved, 0 = unsolved. Also observed: 16 on solved geometry nodes, 9 on FIXATION — flag set, semantics unconfirmed; only treat 0 as "unsolved" with confidence.

## Gotchas

- **TANGENT (line ↔ circle/arc) uses the INFINITE line** — contact may lie past the segment ends and still solves exactly (1.6e-14). Nothing forces it into the segment.
- **Explicit junction wiring contradicting auto-constraints diverges DoSolve GLOBALLY.** Autos (`Auto_Coinc` etc.) wire junctions from seed positions; an explicit COINCIDENT to the other endpoint of the same arc (classic: mirrored arcs with swapped start/end) makes every later solve fail (`CalcBulges radius too small`, `SetSE NullMem`, arcs collapse to r=0, dims refuse values, unrelated subgraphs wrecked) — no loser marked. Consistent duplication is harmless. Diagnose by re-running with batch gen* flags off: the mis-wiring shows as a plain solvable displacement.
- **EQUAL_RADIUS works across independent tangent chains** (all four R3 fillets of two arms on one driving dim, exact 1e-14) once wiring is consistent — the old "cross-side EQUAL_RADIUS breaks the solver" report was the wiring confounder above.
- **`getPositions` returns null for circles** — use `getPoints({id: circleId}).result.centerId`, then `getPositions`.
- **Constraints survive the trim workflow** (`preTrim`/`trim`/`postTrim`; seen under former `splitAllCurves`/`trimCurves`/`splitCurvesMergeBack` names, re-verify on retrain): recreated with NEW IDs and suffixed names (`Fix`→`Fix0`) — re-fetch by name after `postTrim`. TANGENT keeps driving curves that became arcs; a constraint whose partner is fully trimmed away is removed cleanly; `Auto_Coinc` is added at cut points. See `postTrim.md` (retrain pending).

## Common Errors

| Error | Cause |
|---|---|
| "The provided value for parameter 'type' is not valid" | Invalid type string |
| "Wrong number of geometry ids provided for a equal length constraint" | EQUAL_LENGTH needs exactly 2 lines |
| "Index N ausserhalb des Arraybereichs" | Too few geomIds for the type |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ConstraintDemo' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [60, 40, 0] })).result
const p1 = (await api.v1.sketch.getPoints({ id: l1 })).result
const p2 = (await api.v1.sketch.getPoints({ id: l2 })).result

await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [p1.startId] })
await api.v1.sketch.constraint([
  { id: skId, type: 'HORIZONTAL', geomIds: [l1] },
  { id: skId, type: 'VERTICAL', geomIds: [l2] },
  { id: skId, type: 'COINCIDENT', geomIds: [p1.endId, p2.startId] },
])
```

## Related

`sketch.create` · `sketch.dimension` · `sketch.updateDimension` · `sketch.getPoints` · `sketch.getPositions` · `sketch.moveGeometry` · `sketch.generateAutoConstraints`
