# sketch.splitCurve

Splits sketch curves at explicit normalized parameters in one standalone call. Replaces deprecated `splitCurves` (flat `Array<Array<id>>`, no `sourceId`/`interval`). To cut at **intersections**, use `preTrim → trim → postTrim` instead. Solver-independent: no `planeId` needed, identical on planeless sketches.

## Key Parameters

```js
api.v1.sketch.splitCurve({
  id: skId,
  splits: [{ geomId: curveId, values: [0.25, 0.75] }], // one object per curve (line/arc/circle)
})
```

## Return Value

`Array<{ sourceId, splittedCurves: Array<{ id, interval }> }>` — **one entry per input curve, in order** (`result[i].sourceId === splits[i].geomId`):

```js
[{ sourceId: 58, splittedCurves: [{ id: 66, interval: [0, 0.25] }, { id: 70, interval: [0.25, 1] }] }]
```

- `splittedCurves[].id` = **new** segment ids; `interval` = `[t0, t1]` of the original `[0,1]` domain.
- **Any error atomic-fails the whole call**: result not an array (VOID/null), maxLevel ≥ 51.

## Key facts

- **Values are `[0,1]` fractions, linear** from `startPos` (0) to `endPos` (1) — true 2D chord-lerp (skew line confirmed). On `(0,0,0)→(100,0,0)`, `0.25` cuts at exactly `(25,0,0)`.
- **Open curves (line, arc): N values → N+1 segments**, contiguous, exactly covering `[0,1]`.
- **The original id is destroyed** — gone from `getGeometry`, `getPositions` on it → maxLevel 51. Always use `splittedCurves[].id`.
- **Standalone:** commits immediately, no `SplittedCurves`/`NoneSplitted` containers; a later `postTrim` is a harmless no-op.
- **Constraints & dimensions survive**, sketch stays solver-live: geometric constraints duplicated onto segments, `FIXATION` stays on the original point, dimensions remapped to span the original endpoints (value kept), handles **renamed with `_Split`** (`LEN`→`LEN_Split`), plus **`Split_Coinc` (`CC_2DCoincidentConstraint`) at the cut vertex**. `updateDimension` still re-solves — pass the dimension's master id (`CC_LinearFeatureDimension` node), not the sketch id (→ 1001, expects `dimension`). Re-fetch handles by name (ids change).
- A **construction line** (`isConstruction:true`) **can** be split (trim workflow refuses it).

## Circles (closed) — different rules

- **Single value rejected:** maxLevel 51, `"Circle shouldn't be split at a single point!"` — need ≥ 2.
- **N values → N arcs** (not N+1).
- Values are **turn-fractions from +X, CCW** (`value × 360°`: 0.25→90°, 0.75→270°). Seam (0) implied at +X — deduced from that mapping (a lone 0 can't be tested).
- **Wrap-around interval encoded past 1.0:** `[0.75, 1.25]`, not `[0.75, 0.25]`.

## Gotchas — NO input validation

All return maxLevel 31, no warning, and can silently corrupt geometry:

- **Sort ascending.** Unsorted `[0.75, 0.25]` is applied sequentially, re-parameterizing and **extrapolating** — a 100-long line became 200 long (`0→75→125→200`).
- **Stay in `[0,1]`.** `[1.5]` cut at x=150 on a 0..100 line; `[-0.2]` put vertices outside the source. No clamp.
- **De-duplicate.** `[0.5,0.5]` or near-duplicates → zero-length slivers (`interval [0.5,0.5]`).
- **Avoid 0 and 1.** Endpoint splits → degenerate `[0,0]`/`[1,1]` segments; `[0,1]` gives two.
- **`values: []`** returns one `[0,1]` segment but **still re-issues the id**. `splits: []` → `result: []` cleanly.
- **`geomId` resolves globally, not scoped to `id`** — a curve from another sketch of the same part splits even with an unrelated sketch as `id`.
- **Permanent.** No `common.undo`/`sketch.undo`; neither `postTrim` nor `splitCurvesMergeBack` restores a split (older "Reversible? Yes" claims are unbacked).

## Common Errors (maxLevel 51, whole call fails)

| Message | code | Cause |
|---|---|---|
| `The parameter "id"/"splits"/"values"/"geomId" must be provided` | 1004 | Missing param (incl. nested) |
| `An element of parameter "geomId" has an invalid id!` | 1006 | Nonexistent curve id |
| `The parameter "geomId" has a wrong id type! Provide only following id types: ["sketch-curve"]` | 1001 | Part/sketch/point id |
| `Circle shouldn't be split at a single point!` | (51) | One value on a circle |
| `Curve shouldn't be a part of rigidset!` | (51) | Curve is a `rigidSet` member |

## Working example

```js
const partId = (await api.v1.part.create({ name: 'P' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result

const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: line, values: [0.25, 0.75] }] })
const segs = r.result[0].splittedCurves // intervals [0,0.25], [0.25,0.75], [0.75,1]
const firstCut = (await api.v1.sketch.getPositions({ id: segs[0].id })).result.endPos // {x:25,y:0,z:0}
```

## Related

- `sketch.preTrim` / `sketch.trim` / `sketch.postTrim` — cut at intersections; `preTrim` returns the same structured shape.
- `sketch.getPositions` — segment endpoints (line/arc ids; **fails on circle ids** — use `getPoints`→`centerId`).
- `sketch.getGeometry` — confirm new segment ids / original gone.
