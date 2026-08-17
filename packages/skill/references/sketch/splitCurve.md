# sketch.splitCurve

Splits one or more sketch curves at explicit normalized parameter positions, in a single standalone call.
Replaces the deprecated `splitCurves` (plural) — same operation, but `splitCurve` returns a **structured**
result (`sourceId` + per-segment `interval`) instead of a flat id array.

> Use `splitCurve` when you already know *where* (as `[0,1]` parameters) to cut. To cut at curve
> **intersections**, use the `preTrim → trim → postTrim` workflow instead — it computes the positions for you.

## Prerequisites

- A part (`part.create`) and a sketch (`sketch.create`). A `planeId` is **not** required — splitCurve is
  solver-independent and works identically on a planeless (dead-solver) sketch (verified).
- One or more sketch curves (line / arc / circle) to split.

## Signature

```js
api.v1.sketch.splitCurve({
  id: skId,                                  // sketch id
  splits: [ { geomId: curveId, values: [0.25, 0.75] } ]  // one object per curve
})
```

## Return value

On success: `Array<{ sourceId, splittedCurves: Array<{ id, interval }> }>` — **one entry per input curve, in input order**.

```js
[ { sourceId: 58,
    splittedCurves: [ { id: 66, interval: [0, 0.25] },
                      { id: 70, interval: [0.25, 1] } ] } ]
```

- `sourceId` = the original curve id you passed (`result[i].sourceId === splits[i].geomId`, order-preserving).
- `splittedCurves[].id` = the **new** segment curve ids. The original curve id is **destroyed** (see Gotchas).
- `splittedCurves[].interval` = `[t0, t1]`, the portion of the original curve (in its `[0,1]` domain) the segment covers.
- On **any error the whole call atomic-fails**: `result` is **not an array** (VOID/null) and `maxLevel >= 51`.
  So "result.length === splits.length" only holds on success.

## Key facts (all verified live)

- **Values are normalized `[0,1]` fractions**, mapping **linearly** along the curve from `startPos` (param 0) to
  `endPos` (param 1). On a line `(0,0,0)→(100,0,0)`, `0.25` cuts at exactly `(25,0,0)`. True 2D chord-lerp, not
  axis-aligned coincidence (confirmed on a skew line).
- **Open curves (line, arc): N values → N+1 segments**, with contiguous intervals that exactly cover `[0,1]`
  (`t0=0` … `t1=1`, each `seg.t1 == next.t0`).
- **The original curve id is replaced**: after the split it is absent from `getGeometry`, and `getPositions` on it
  returns `maxLevel 51` (invalid). Always read `splittedCurves[].id`; never reuse the source id.
- **Standalone**: commits immediately, creates **no** `SplittedCurves`/`NoneSplitted` staging containers, and
  calling `postTrim` afterward is a harmless no-op. (`preTrim` is the staging variant — see its own doc.)
- **Constraints & dimensions survive** a split and the sketch stays **solver-live**: geometric constraints are
  duplicated onto the new segments, a `FIXATION` stays on the original point, dimensions are remapped to span the
  original endpoints (value preserved), handles are **renamed with a `_Split` suffix** (e.g. `LEN`→`LEN_Split`),
  and an **auto-coincidence (`CC_2DCoincidentConstraint`, named `Split_Coinc`) is added at the cut vertex**. After
  the split, `updateDimension` on the surviving dimension still re-solves and moves the geometry — pass the
  dimension's **master id** (the `CC_LinearFeatureDimension` node id), not the sketch id, or it errors
  `1001` (wrong id type, expects `dimension`). Re-fetch handles by name after splitting (ids change).

## Circles (closed curves) — different rules

- **A single value is rejected**: `maxLevel 51, "Circle shouldn't be split at a single point!"`. A closed loop
  needs **≥ 2** cut points.
- **N values → N arcs** (NOT N+1). Two values → 2 arcs.
- Values are **`[0,1]` turn-fractions measured from +X, counter-clockwise** (`value × 360°`): `0.25`→90°, `0.75`→270°.
  (This resolves the old `splitCurves` "0..2π" note — the new API is `[0,1]`.) The seam (param 0) is **implied to
  be +X (0°)** — deduced from the 0.25→90° mapping; a lone `value=0` can't be measured directly (single value is rejected).
- The **wrap-around arc's interval is encoded past 1.0**, e.g. `[0.75, 1.25]` (not `[0.75, 0.25]`).

## Gotchas & silent hazards — splitCurve does NOT validate input

All of the following return `maxLevel 31` (success) with **no warning** and can silently corrupt geometry. The
caller is fully responsible for clean input:

- **Values must be sorted ascending.** Unsorted values (e.g. `[0.75, 0.25]`) are applied **sequentially without
  sorting**, which re-parameterizes the remainder and **extrapolates** — a 100-long line came out 200 long with
  endpoints at `0→75→125→200`. **Always pre-sort.**
- **Values must be in `[0,1]`.** Out-of-range values extrapolate beyond the curve, silently: `[1.5]` cut at x=150
  on a 0..100 line; `[-0.2]` produced vertices outside the source. No clamp, no error.
- **De-duplicate values.** Duplicates (`[0.5,0.5]`) or near-duplicates produce **zero-length sliver segments**
  (`interval [0.5,0.5]`, start==end). No dedup, no warning.
- **Avoid boundary values 0 and 1.** Splitting at an endpoint yields a **zero-length degenerate segment**
  (`[0,0]` or `[1,1]`). `[0,1]` yields two of them. Silent.
- **Empty `values: []`** is a no-op that returns a single `[0,1]` segment — but **still re-issues the curve id**
  (the id changes even though geometry doesn't). Empty `splits: []` returns `result: []` cleanly.
- **`geomId` is resolved globally, not scoped to `id`.** A curve belonging to a *different* sketch on the same
  part splits successfully even when you pass an unrelated sketch as `id`. Don't rely on `id` to guard scope.
- **No undo / no reverse.** There is no `common.undo` / `sketch.undo` endpoint, and neither `postTrim` nor
  `splitCurvesMergeBack` restores a `splitCurve` result. A split is permanent. (The source guide's "Reversible? Yes"
  / "standard undo mechanism" claim is unbacked.)

## Common errors (maxLevel 51, whole call fails)

| Message | code | Cause |
|---|---|---|
| `The parameter "id"/"splits"/"values"/"geomId" must be provided` | 1004 | Missing required param (incl. nested) |
| `An element of parameter "geomId" has an invalid id!` | 1006 | Non-existent curve id |
| `The parameter "geomId" has a wrong id type! Provide only following id types: ["sketch-curve"]` | 1001 | Passed a part/sketch/point id |
| `Circle shouldn't be split at a single point!` | (51) | One value on a closed circle — need ≥2 |
| `Curve shouldn't be a part of rigidset!` | (51) | The curve is a `rigidSet` member |

Note: a **construction line** (`isConstruction:true`) **can** be split (the trim workflow refuses it; splitCurve does not).

## Working example

```js
// One part.create per run — a 2nd call returns VOID and poisons the drawing.
const partR = await api.v1.part.create({ name: 'P' })
const partId = partR.result
const topPlaneId = Object.values(partR.structure.tree).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top').id
const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlaneId })).result
const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result

// values MUST be in [0,1] and ascending
const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: line, values: [0.25, 0.75] }] })
const segs = r.result[0].splittedCurves          // [{id, interval:[0,0.25]}, {id, interval:[0.25,0.75]}, {id, interval:[0.75,1]}]
const firstCutVertex = (await api.v1.sketch.getPositions({ id: segs[0].id })).result.endPos  // {x:25,y:0,z:0}
```

## Related

- `sketch.preTrim` / `sketch.trim` / `sketch.postTrim` — the intersection-based trim workflow (use when you don't
  know the cut parameters). `preTrim` returns the **same structured shape** as `splitCurve`.
- `sketch.getPositions` — read segment endpoints (works on line/arc ids; **fails on circle ids** — use `getPoints`→`centerId`).
- `sketch.getGeometry` — confirm the new segment ids / that the original is gone.
- `~~sketch.splitCurves~~` (deprecated) — flat-array predecessor; returns `Array<Array<id>>` with no `sourceId`/`interval`.
