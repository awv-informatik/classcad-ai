# sketch.preTrim

Splits curves at their **mutual intersection points** (auto-computed) and **stages** the result — step 1 of `preTrim → trim → postTrim`. Unlike `splitCurve` (explicit `[0,1]` parameters, commits immediately), preTrim finds the cuts and commits only on `postTrim`. Solver-independent: no `planeId` needed.

## Key Parameters

```js
api.v1.sketch.preTrim({ id: skId })                       // split ALL curves against each other
api.v1.sketch.preTrim({ id: skId, curveIds: [c1, c2] })   // only these, against each other
```

- `id` — **sketch** id (1001 expects `["sketch"]`; contrast `splitCurve.geomId`, which wants `sketch-curve`)
- `curveIds` (optional) — see curveIds section

## Return Value

`Array<{ sourceId, splittedCurves: Array<{ id, interval }> }>` — one entry per input curve, in order (same shape as `splitCurve`). On error VOID — guard with `Array.isArray`.

- `interval` = `[t0,t1]` fractions of the original curve.
- **Unsplit curve:** one part, `interval [0,1]`, **`id === sourceId`** (preTrim REUSES the id — `splitCurve` re-issues every id). Split curves get **new** segment ids.
- **Identity rule:** `id === sourceId && interval == [0,1]` ⇒ not split. *Exception:* a singly-tangent circle is one whole-loop part with a length-1 *wrapped* interval (e.g. `[-0.75,0.25]`).

## Intersection finding (~1e-14)

- Cuts land **exactly** on analytic intersections (line-line, skew, line-circle, circle-circle). With fewer than 2 crossing curves: no cuts (still valid).
- **Open curve crossed N times → N+1 segments. Closed circle crossed twice → 2 arcs.**
- **Tangent contact:** the line splits (2 segments); the circle stays **one part** with wrapped interval (`getPositions` on it fails mL51 — use `getPoints`→`centerId`).
- **Circle intervals are turn-fractions** from the **+X seam** (tangent case landed +Y at 0.25), can be **negative** (seam-straddling arc) and **asymmetric** per circle. **Never infer arc endpoints from intervals — `getPositions` on the arc ids** (works; only whole-circle parts reject it).
- Only **open-interior** intersections (0 < t < 1) cut. **Endpoint coincidences do NOT cut:** a T-junction splits the through-curve but leaves the touching curve `[0,1]`; shared corners and collinear tip-to-tip joints split neither.

## Staging

Two `CC_Container` nodes (find by **name**; class is generic, ids vary):

- **`SplittedCurves`** — produced segments
- **`NoneSplitted`** — unsplit curves (incl. excluded via `curveIds`, construction/rigidSet curves)

**`getGeometry` mid-workflow reports only ORIGINAL curve ids** — drive `trim` off preTrim's return value.

## curveIds

- `result.length === curveIds.length`.
- **An excluded curve is NOT split AND does NOT cut** — parked under `NoneSplitted`.
- **`curveIds: []` means ALL existing curves**, not "nothing" (footgun). (An empty sketch naturally gives `[]`.)
- A single id → comes back `[0,1]`.
- **Duplicates are NOT de-duplicated** — `[L1,L1,L2]` → 3 entries (L1 split twice independently).

## Round-trip: trim → postTrim

- `trim` and `postTrim` return VOID, maxLevel 31.
- **postTrim ids:** survivors of a **trimmed** curve get **NEW ids**; **untrimmed** participants keep originals. No-trim postTrim and `trim([])` restore originals cleanly — only actually-trimmed curves churn.
- **Contiguous surviving segments of one source coalesce** into one curve.
- **Constraints are recreated** with numeric-suffix names (`Auto_H`→`Auto_H0`) and new ids, plus a new **`Auto_Coinc` (`CC_2DCoincidentConstraint`) at the cut vertex** (single-corner L-profile). Re-fetch by **name** after postTrim.

## Gotchas

- **`trim` with an ORIGINAL `sourceId` silently no-ops** (maxLevel 31). A bogus id atomic-fails (mL51, 1006; valid segs left intact). Multiple `trim()` calls before one `postTrim` are fine.
- **Construction lines and rigidSet members are silent `[0,1]` passthrough** (id reused, maxLevel 31) — but STILL cut normal curves they cross. (`splitCurve` *errors* mL51 on rigidSet members.) Only signal: `id === sourceId`.
- **Overlaps (silent):** identical fully-overlapping lines → both `[0,1]`, undetected; partial collinear overlap → overlap **duplicated** as a segment in both.
- **`preTrim` twice without `postTrim`** overwrites staging: **first batch's segment ids go dead** (`getPositions` mL51) — never cache them across a re-preTrim. After `postTrim`, an empty **`NoneSplitted0` container leaks** (cosmetic).
- **Empty sketch** → `result: []` (Array, not VOID), maxLevel 31; containers still created.
- Out-of-order `postTrim`/`trim` with nothing staged: harmless no-ops (maxLevel 31).

## Common Errors (maxLevel 51, result VOID)

| Message | code | Cause |
|---|---|---|
| `The parameter "id" must be provided in the api call!` | 1004 | Missing `id` |
| `An element of parameter "id"/"curveIds" has an invalid id!` | 1006 | Nonexistent id (plus level-41 `ToId()` warning, code 0) |
| `The parameter "id" has a wrong id type! ... ["sketch"]` | 1001 | Part/plane instead of sketch |
| `The parameter "curveIds" has a wrong id type! ... ["sketch-curve"]` | 1001 | Sketch/point id in curveIds |

A single bad `curveIds` element atomic-fails the whole call.

## Working example

```js
const partId = (await api.v1.part.create({ name: 'P' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const h = (await api.v1.sketch.line({ id: skId, startPos: [0, 50, 0], endPos: [100, 50, 0] })).result
const v = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 100, 0] })).result

const pre = await api.v1.sketch.preTrim({ id: skId }) // h & v each split at (50,50,0)
const segs = src => pre.result.find(e => e.sourceId === src).splittedCurves
const overhangH = segs(h).find(s => s.interval[0] > 0).id  // x 50..100
const overhangV = segs(v).find(s => s.interval[1] < 1).id  // y 0..50
await api.v1.sketch.trim({ id: skId, curveIds: [overhangH, overhangV] })
await api.v1.sketch.postTrim({ id: skId }) // clean corner; trimmed survivors get new ids
```

## Related

`sketch.splitCurve` · `sketch.trim` · `sketch.postTrim` · `sketch.getPositions` · `sketch.getGeometry`
