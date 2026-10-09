# sketch.getDiagnosticsInfo

The solver's per-constraint verdict on one sketch: every constraint/dimension it could NOT satisfy (with the constraints it blames and the geometry involved), plus duplicated constraints. Read-only, ~1 ms, maxLevel 31. Call it **after every constraint/dimension batch** (impossible constraints report clean success when created) and **on the first `sketch.dimension` 51 / `updateDimension` 0** (those signals are sketch-wide and often hit an innocent call; this names the culprit).

```js
const r = await api.v1.sketch.getDiagnosticsInfo({ id: sketchId })
r.result === { conflictingSets: [], redundantConstraints: [] }   // clean; ALSO empty and under-constrained sketches
// line with Auto_H + FIXATION on its start, then OFFSET 50, OFFSET 70, HORIZONTAL_DISTANCE 40 on it:
r.result === {
  conflictingSets: [{ unsatisfied: 74, conflicting: [64, 66, 70], entities: [59, 60] }],
  redundantConstraints: [{ id: 70, reason: 'DUPLICATE' }],
}
```

- `conflictingSets` — one entry per unsatisfied constraint; independent conflicts add entries.
  - `unsatisfied` — the constraint/dimension not met. **The reliable field.**
  - `conflicting` — the solver's partial blame list, neither minimal nor complete: above it names the irrelevant FIXATION but not the Auto_H that makes HD 40 and OFFSET 50 incompatible; for a 30° ANGLE on a 3-side-dimensioned triangle it named a sibling angle + Auto_H, not the side dims.
  - `entities` — geometry the unsatisfied constraint references (endpoint `CC_Point`s for a linear dim, the curves for TANGENT/ANGLE, the circle for RADIUS).
- `redundantConstraints` — only `DUPLICATE` observed (same type on the same geometry): explicit HORIZONTAL on an Auto_H line; manual FIXATION on the corner of a rectangle drawn at (0,0) (already `Auto_Fix`); a second OFFSET on a line, **even with a contradicting value** (trap below). `ALREADY_IMPLIED` never appeared (driven ANGLE on a fully dimensioned triangle; Auto_H + both endpoints fixed; a COINCIDENT cycle p-q, q-r, p-r — never build one: the next geometry call loops the engine, see [constraint.md](constraint.md)). `WITHIN_RIGIDSET` / `RIGIDSETS_OVERLAP` untested.

## Ids

- **Constraint ids = what `sketch.constraint` returned.**
- **Dimension ids are SOLVER ids** (`CC_2D*Constraint`), not the display `CC_*FeatureDimension` that `sketch.dimension` returns: `tree[displayId].members.master.value` (68→66, 72→70) — the id space of [getObjectsLists](getObjectsLists.md) `dimensions`. A failing dimension call names the DISPLAY id in its error (`dimension $76`), the diagnosis the solver id (74).
- `deleteObject` takes either id and removes both nodes; `updateDimension` needs the display id.
- `sketch.getObjectInfo({ id: unsatisfied })` → `{ type: 'DIMENSION'|'CONSTRAINT', status: 'NOT_SATISFIED', value }`, `value` = the REQUESTED value (70, geometry 50.99).

## Traps

- **The creating call does not tell you.** TANGENT between a FIXATION'd circle and a both-ends-fixed line 40 away (r 10), TANGENT between two FIXATION'd circles 30 apart (r 10), OFFSET 70 on a line already OFFSET 50: all return an id, maxLevel 31, no messages, geometry unchanged.
- **Dimension failures are sketch-wide.** While any `conflictingSets` entry exists, every later `sketch.dimension` ends 51 "Couldn't set the value for dimension $N" and `updateDimension` returns 0 — **even when that call's own value was applied** (OFFSET 33 on an unrelated line: 51, measured 33.000; `updateDimension` 70→80 elsewhere: 0, measured 80.000). `sketch.constraint` keeps returning 31. A lone `DUPLICATE` does not do this (a later OFFSET 25: 31). Clear the `unsatisfied` id before trusting any per-call result.
- **A failed dimension stays.** The 51 rolls nothing back: solver constraint and display node remain and stay reported until deleted or fixed.
- **`DUPLICATE` hides a contradiction.** OFFSET 70 on a line already OFFSET 50: `conflictingSets` EMPTY, the 70 only in `redundantConstraints`, line stays 50. Check both arrays.
- **Empty ≠ solved as declared.** Not listed: consistent over-constraint (driven ANGLE on a 3-side-dimensioned triangle; Auto_H + both endpoints fixed — `getGlobalState` says `OVERDEFINED`) and remaining DOF (bare rectangle: empty, status `OK`).
- **Planeless sketch** (dead solver, [create](create.md)): EVERY constraint is listed as `unsatisfied`, incl. plain FIXATIONs, some with `conflicting: []`; all `lgsState` 0; `getGlobalState` `UNDEFINED`. Blame on constraints that cannot conflict → check `planeId`.
- **`lgsState` is not the conflict signal on a live solver:** unsatisfied constraints carried 8 or 10 (OFFSET, HD, RADIUS, TANGENT, ANGLE), satisfied 1 or 9; 0 only on the planeless sketch.

## Repair

The diagnosis clears on the next call after: `deleteObject` of the `unsatisfied` id (solver id straight from the diagnosis, or the display id); `updateDimension` of that dim to a satisfiable value (display id; it returns 2 = OVERDEFINED while the duplicate OFFSET is still there, see [updateDimension.md](updateDimension.md)); deleting an impossible TANGENT.

## Right check for "my sketch solved as declared"?

Yes for "**every declared constraint and dimension is met**" — on a live solver it is the only per-constraint failure signal, and the way to find the culprit after a 51/0. Not sufficient alone: it ignores remaining DOF and consistent redundancy (require `getGlobalState` `FULLY_CONSTRAINED`, or `OK` when DOF are intended), and whether the scheme matches the drawing is still numeric readback ([constrained-sketching](../../recipes/constrained-sketching.md)). Pass = both arrays empty on a sketch with `planeId`.

## Errors (`id` = sketch id; numeric string `'52'` works)

| `id` | maxLevel / code | message |
|---|---|---|
| part, line, point, constraint, display- or solver-dim id | 51 / 1001 | `The parameter "id" has a wrong id type! Provide only following id types: ["sketch"]` |
| nonexistent (999999) | 41 + 51 / 1006 | `ToId()/TOID() didn't get an existing or valid id.` + `An element of parameter "id" has an invalid id!` |
| `'abc'` | 41 + 51 / 1006 | `The string "abc" couldn't be converted to an id. ...` + same 1006 |
| `null` | 51 / 1001 | `Set the parameter "id" = VOID is not allowed in this situation!` |
| omitted | 51 / 1004 | `The parameter "id" must be provided in the api call!` |

## Working example

```js
const partR = await api.v1.part.create({ name: 'Diag' })
const top = Object.values(await api.tree({ refresh: true })).find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top')
const skId = (await api.v1.sketch.create({ id: partR.result, planeId: top.id })).result
const A = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [60, 20, 0] })).result
const pa = (await api.v1.sketch.getPoints({ id: A })).result
await api.v1.sketch.constraint([
  { id: skId, name: 'FixA1', type: 'FIXATION', geomIds: [pa.startId] }, // 62
  { id: skId, name: 'FixA2', type: 'FIXATION', geomIds: [pa.endId] }, // 64
])
try {
  await api.v1.sketch.dimension({ id: skId, name: 'A70', type: 'OFFSET', geomIds: [A], value: 70 })
} catch (e) {} // maxLevel 51 "Couldn't set the value for dimension $68" (throws in strict runners); the dim stays

const d = (await api.v1.sketch.getDiagnosticsInfo({ id: skId })).result
// { conflictingSets: [{ unsatisfied: 66, conflicting: [62, 64], entities: [59, 60] }], redundantConstraints: [] }
await api.v1.sketch.deleteObject({ ids: d.conflictingSets.map((s) => s.unsatisfied) }) // solver id; display goes too
// getDiagnosticsInfo → { conflictingSets: [], redundantConstraints: [] }
```

## Related

`sketch.getGlobalState` — one status for the whole sketch; observed alongside: `NOT_SOLVED`/`OVERDEFINED` whenever `conflictingSets` had an entry, `OK`/`OVERDEFINED`/`NOT_SOLVED` with a lone `DUPLICATE`, and still the old status right after a `deleteObject` of a constraint that had already cleared this diagnosis · `sketch.getObjectInfo` (status of one id) · [constraint](constraint.md) · [dimension](dimension.md) · [updateDimension](updateDimension.md) · [deleteObject](deleteObject.md) · [getObjectsLists](getObjectsLists.md)
