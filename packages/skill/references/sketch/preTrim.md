# sketch.preTrim

Splits curves at their **mutual intersection points** (auto-computed) and **stages** the result — step 1 of the
three-step trim workflow `preTrim → trim → postTrim`. Unlike `splitCurve` (which takes explicit `[0,1]`
parameters and commits immediately), preTrim finds the cut points for you and does NOT commit until `postTrim`.

> Use preTrim when you want to cut curves at where they cross and then discard segments (a CAD "trim").
> To split at a known parameter, use `splitCurve`. preTrim returns the **same structured shape** as splitCurve.

## Prerequisites

- A part (`part.create`) and a sketch (`sketch.create`). No `planeId` needed — preTrim is solver-independent.
- The curves to intersect. With ≥2 mutually-crossing curves you get cuts; fewer/non-crossing → no cuts (still valid).

## Signature

```js
api.v1.sketch.preTrim({ id: skId })                       // split ALL curves against each other
api.v1.sketch.preTrim({ id: skId, curveIds: [c1, c2] })   // only these split against each other
```

- `id` — the **sketch** id (note: error `1001` says it expects `["sketch"]`; contrast `splitCurve.geomId` which wants `sketch-curve`).
- `curveIds` (optional) — restricts which curves are split. See the curveIds section.

## Return value

`Array<{ sourceId, splittedCurves: Array<{ id, interval }> }>` — one entry per input curve, in input order
(same shape as `splitCurve` — see `splitCurve.md` for the shared structure; on error the result is **VOID**, guard with `Array.isArray`).

- `interval` = `[t0,t1]` fractions on the original curve where the intersection cuts fall.
- **A curve that was NOT split** comes back as a single part with `interval [0,1]` **and `id === sourceId`**
  (preTrim REUSES the id of an unsplit curve — the opposite of `splitCurve`, which re-issues every id).
- Split curves get **new** segment ids (with `sourceId` = the original).
- **Identity rule:** `id === sourceId && interval == [0,1]` ⇒ the curve was not split. *Exception:* a singly-tangent
  circle is one whole-loop part whose interval is a length-1 *wrapped* window (e.g. `[-0.75,0.25]`), not `[0,1]`.

## Intersection finding (verified to ~1e-14)

- Splits land **exactly** on the analytic intersection (line-line cross, skew cross, line-circle, circle-circle).
- **Open curve crossed N times → N+1 segments. Closed circle crossed twice → 2 arcs (N, not N+1).**
- **Tangent (single contact):** the open line still splits (2 segments); the circle stays **one part** with a
  wrapped length-1 interval (a closed circle — `getPositions` fails mL51; use `getPoints`→`centerId`).
- **Circle arc intervals are turn-fractions** (param 0 at the **+X seam** — the tangent case landed +Y at 0.25,
  a quarter-turn) and can be **negative** (the seam-straddling arc) and **asymmetric** per circle.
  **Never infer arc endpoints from intervals — read `getPositions`** on the arc ids
  (which work; only whole-circle parts reject getPositions).
- Only **open-interior** intersections (0 < t < 1) cut. **Endpoint coincidences do NOT cut**: a T-junction splits
  the through-curve but leaves the curve whose *endpoint* touches it as `[0,1]`; shared corners and collinear
  tip-to-tip joints split neither curve.

## Staging — what preTrim leaves behind (and how to read it)

preTrim stages into two `CC_Container` nodes (find them by **name**, not class — class is generic, ids vary):

- **`SplittedCurves`** — holds the produced segments.
- **`NoneSplitted`** — holds curves not split (incl. curves excluded via `curveIds`, construction/rigidSet curves).

**`getGeometry` mid-workflow still reports only the ORIGINAL curve ids** — the staged segments are invisible to it.
So you **must drive `trim` off the ids in `preTrim`'s return value**, not from `getGeometry`.

## curveIds

- Restricts which curves are split **against each other**. `result.length === curveIds.length`.
- **An excluded curve is NOT split AND does NOT act as a cutter** — it is parked under `NoneSplitted`.
- **`curveIds: []` (empty array) is treated as ALL *existing* curves** — a footgun; it does NOT mean "split
  nothing". (With zero curves in the sketch the result is naturally `[]` — that's the empty-sketch case, not this.)
- A single id (no partner) → that curve comes back `[0,1]`, unsplit.
- **Duplicate ids are NOT de-duplicated** — `[L1,L1,L2]` yields 3 result entries (L1 split twice independently).

## The round-trip: preTrim → trim → postTrim

```js
const pre = await api.v1.sketch.preTrim({ id: skId })            // stage splits at intersections
// pick segment ids to discard from pre.result (getPositions to identify them)
await api.v1.sketch.trim({ id: skId, curveIds: [segA, segB] })   // remove staged segments; returns VOID
await api.v1.sketch.postTrim({ id: skId })                       // finalize; returns VOID
```

- `trim` and `postTrim` return **VOID** (`result: null`), maxLevel 31.
- **postTrim id semantics:** survivors of a **trimmed** curve get **NEW ids**; **untrimmed** participants keep their
  **original** ids. **No-trim postTrim and `trim([])` both cleanly restore the originals** (ids unchanged) — so
  "all ids change on postTrim" is false; only actually-trimmed curves churn.
- **Contiguous surviving segments of one source coalesce into a single curve** on postTrim.
- **Constraints are recreated:** geometric constraints come back **renamed with a numeric suffix** (`Auto_H`→`Auto_H0`)
  and **new ids**, plus a new **`Auto_Coinc` (`CC_2DCoincidentConstraint`) at the cut vertex** (verified on a
  single-corner L-profile). Re-fetch handles by **name** after postTrim.

## Gotchas & footguns

- **`trim` silently no-ops (maxLevel 31) if passed an ORIGINAL `sourceId` instead of a staged segment id** — removes
  nothing. `trim` atomic-fails (mL51, code 1006) on a bogus id (the valid segs are left intact). Multiple `trim()`
  calls before one `postTrim` are supported.
- **Construction lines and rigidSet members are silent `[0,1]` passthrough** (id reused, maxLevel 31, no message) —
  but they STILL cut the normal curves they cross. (Contrast: `splitCurve` *errors* mL51 on a rigidSet member.)
  The only signal that a curve was "not trimmable" is `id === sourceId`.
- **Overlap hazards (silent):** two identical fully-overlapping lines → both `[0,1]`, the overlap is **undetected**;
  a partial collinear overlap → the overlap region is **duplicated** as a segment in both curves. No warning.
- **`preTrim` twice without `postTrim`** silently overwrites the previous staging: the **first batch's segment ids
  go dead** (`getPositions` mL51) — never cache segment ids across a re-preTrim. After `postTrim`, a stale empty
  **`NoneSplitted0` container leaks** (cosmetic; geometry and original ids are fine).
- **Empty sketch** → `result: []` (an empty Array, not VOID), maxLevel 31; staging containers are still created.
- **Out-of-order** `postTrim`/`trim` with nothing staged are harmless no-ops (maxLevel 31).

## Common errors (maxLevel 51, result VOID)

| Message | code | Cause |
|---|---|---|
| `The parameter "id" must be provided in the api call!` | 1004 | Missing `id` |
| `An element of parameter "id"/"curveIds" has an invalid id!` | 1006 | Non-existent id |
| `The parameter "id" has a wrong id type! ... ["sketch"]` | 1001 | `id` was a part/plane, not a sketch |
| `The parameter "curveIds" has a wrong id type! ... ["sketch-curve"]` | 1001 | a curveIds element was a sketch/point id |

A single bad `curveIds` element atomic-fails the whole call. Invalid-id (1006) cases also emit a preceding
level-41 `ToId()` warning (code 0) alongside the 51-level error.

## Working example

```js
const partR = await api.v1.part.create({ name: 'P' })
const partId = partR.result
const topPlaneId = Object.values(partR.structure.tree).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top').id
const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlaneId })).result
const h = (await api.v1.sketch.line({ id: skId, startPos: [0, 50, 0], endPos: [100, 50, 0] })).result
const v = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 100, 0] })).result

const pre = await api.v1.sketch.preTrim({ id: skId })           // h & v each split at (50,50,0)
const hSegs = pre.result.find(e => e.sourceId === h).splittedCurves  // 2 segments, read getPositions to pick
// ... choose the overhang segment ids to discard ...
await api.v1.sketch.trim({ id: skId, curveIds: [overhangA, overhangB] })
await api.v1.sketch.postTrim({ id: skId })                      // finalize → clean corner, survivors get new ids
```

## Related

- `sketch.splitCurve` — split at explicit `[0,1]` params; commits immediately; destroys the source id. Shared result shape.
- `sketch.trim` — step 2: remove staged segments by id (returns VOID). (Own task — see `trim.md` when trained.)
- `sketch.postTrim` — step 3: finalize/restore (returns VOID). (Own task — see `postTrim.md` when trained.)
- `sketch.getPositions` — read segment/arc endpoints (fails on whole-circle parts → `getPoints`→`centerId`).
- `sketch.getGeometry` — **shows only original ids mid-workflow**; not a source of staged segment ids.
