# sketch.updateDimension

Updates a dimension's value and re-solves the sketch immediately. Works on all 7 types (OFFSET, HORIZONTAL_DISTANCE, VERTICAL_DISTANCE, RADIUS, DIAMETER — value = diameter, ANGLE/ANGLEOX — use `'30deg'`), regardless of feature open/closed state. Sequential updates each re-solve.

Requires a sketch created with `planeId` — otherwise the solver is disabled and result is always 0.

## Key Parameters

- **`id`** (required) — the `CC_*FeatureDimension` ID from `sketch.dimension` (not the sketch ID). When recovering from `api.tree()`, pick the feature-dimension node, not the identically named `CC_2D*Constraint` referenced by `members.master.value`; constraint IDs → 1001. See [dimension](dimension.md#return-value).
- **`value`** (required):
  - numbers `50`, `0`; formulas `'50+70'`, `'sqrt(2)*50'`; angles `'30deg'`
  - **`'@expr.NAME'`** or prefixed formula (`'@expr.W*2'`) — LIVE binding; a later `updateExpression` moves geometry with no further calls. ANGLE dims: expression in radians (`C:PI/6` or a number), see `dimension.md`. The expression must EXIST — create via `part.expression({toCreate: [...]})`; the direct `{id,name,value}` form is a SILENT NO-OP (result=1), and `@expr` on it then fails with result=0 — check `getExpression` first. No prefix and `$NAME` fail (result=0).

## Return Value

`{ result: 0 | 1 | 2, messages?, maxLevel? }` — a solver state, **not a boolean** (despite API docs). Check `result > 0`; it mirrors [getGlobalState](getGlobalState.md)'s status, so ask that call for "fully constrained?".

| Value | Meaning | When |
|-------|---------|------|
| `0` | Not solved (`NOT_SOLVED`) | Over-constrained, negative value, conflicts — incl. an unsatisfied constraint ELSEWHERE in the sketch (the value may still apply: 70→80 measured 80.000), no `planeId` |
| `1` | Solved | Under-constrained OR fully constrained (`OK` / `FULLY_CONSTRAINED`), numeric and `@expr` alike |
| `2` | Solved, over-determined | A consistent redundancy exists (`OVERDEFINED`) |

**result=0 is not an error:** maxLevel stays 31, no messages.

## Gotchas

- **Bind with `@expr` in `value`, not `linkWithExpression`.** `linkWithExpression` on a dimension throws "Datamember ... not found" and leaves an unresolvable reference; later calls in that sketch fail with the same error.
- **Negative values:** result=0, no messages, but geometry may partially change to `|value|`. Avoid.
- **Zero is valid** — collapses to zero length/radius (result=2).
- **Over-constrained** (e.g. both endpoints fixed): result=0, geometry unchanged.
- **FIXATION protects circle radius** — RADIUS/DIAMETER update returns 0; remove FIXATION first.
- **result=0 ≠ "no change"** for ANGLE/ANGLEOX: the solver may partially converge (geometry moves) on under-determined sketches.
- **NO batch form.** An array of `{id, value}` throws an `objId` evaluation error and updates nothing. Loop single calls.
- **Symmetric twin dims traverse an unsolvable intermediate.** Updating "2×" twins one at a time (two Ø5.6 bosses a dome is tangent to, symmetric about a fixed axis): first call returns 0 (asymmetric state is contradictory), second returns 2, exact. Prefer ONE driving dim + `EQUAL_RADIUS`/`EQUAL_LENGTH` on the twin — one solvable step (exact to 1e-14).
- **⚠️ Stale `bulge` after a failed(0)→solved(2) sequence (server bug).** A failed update can write a garbage `bulge` into an arc; the next SUCCESSFUL update re-solves positions exactly (start/end/center/radius to 1e-15) but may NOT rewrite bulge — the tree carries a wrong sweep (1.2988643 = 209.6° instead of 0.7022581 = 140.3°, reproduced 3/3). Renderers and the trim boundary-test see a corrupted arc while position readbacks pass. `common.recalc` doesn't refresh it; a same-value re-set is a solver no-op; only a later value-CHANGING solve that moves the arc may. Avoid result-0 intermediates (EQUAL_RADIUS pattern above). To verify, compare `members.bulge.value` with `tan(sweep/4)` from solved endpoints/center.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| `"wrong id type! Provide only following id types: [\"dimension\"]"` | 1001 | Sketch/line/constraint/part ID |
| `"The parameter \"value\" must be provided"` | 1004 | Missing `value` |
| `"The parameter \"id\" must be provided"` | 1004 | Missing `id` |
| `"ToId()/TOID() didn't get an existing or valid id"` + `"invalid id"` | 0+1006 | Nonexistent dimension ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
// the corner at the origin already carries Auto_Fix — no FIXATION needed
const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result // auto-value 80

const r = await api.v1.sketch.updateDimension({ id: dimId, value: 120 }) // r.result 1 (height still free), now 120 wide
await api.v1.sketch.updateDimension({ id: dimId, value: 'sqrt(2)*100' }) // ~141.4 wide
```

## Related

`sketch.dimension` · `sketch.updateDimensionPosition` · `sketch.constraint` · `sketch.deleteObject`
