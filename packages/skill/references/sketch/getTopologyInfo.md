# sketch.getTopologyInfo

Read-only defect scan of a whole sketch: which solid curves cross, which points almost (but not exactly) coincide, which curves are tiny. Call it **right before `sketchRegion` / `part.extrusion`** on hand-computed or overlapping profiles, and **after `postTrim`** as the acceptance check for a trimmed outline. A crossing or near-miss reported inside your profile predicted a failed extrusion in every case tested. An empty result does NOT mean the profile is closed: the method does not report loops, regions, open ends, dangling curves or counts.

```js
const r = await api.v1.sketch.getTopologyInfo({ id: sketchId }) // maxLevel 31, messages []
r.result === {
  intersectingCurves: [{ curves: [187, 193], intersections: [{ x: 50, y: 25, z: 0 }] }], // one entry per crossing PAIR
  nearCoincidence: [{ points: [76, 83], distance: 0.01 }],                           // two point ids, lower first
  tinyEntities: [{ id: 92, length: 0.08 }, { id: 125, radius: 0.08 }],               // ONE mixed array
}
// empty sketch, closed rectangle, rectangle + inner circle → all three []
```

Ids are the curve ids returned by `line`/`rectangle`/`circle`/`arc*` and the point ids from `getPoints` (`startId`/`endId`); all of them appear in [getObjectsLists.md](getObjectsLists.md). Region ids never appear, and regions do not change the result.

## What each list reports

`tol` = 0.001 × the shorter side of the bounding box of ALL sketch geometry (construction and loose points included, origin not included).

| list | reported | not reported |
|---|---|---|
| `intersectingCurves` | two **solid** curves crossing in their interiors, or touching tangentially (line–circle, circle–circle: 1 point). Every point of a pair is in one entry; 3 lines through one point → 3 entries | anything with a construction curve on either side; shared endpoints, T-junction ends, line → arc joints; collinear overlaps; concentric circles; a crossing within 0.1 % of a line's/arc's length from its end (0.05 from the end of a 100 line: no, 0.2: yes) |
| `nearCoincidence` | two points with `1e-6 < distance < tol` — line endpoints, loose `sketch.point`s, construction endpoints. 100×50 → tol 0.05 (gap 0.049 in, 0.051 out); 1000×500 → 0.5; 10×5 → 0.005 | coincident points (distance 0); gaps ≥ tol (a 1 mm gap on 100×50) |
| `tinyEntities` | line length `< 2·tol` → `{ id, length }`; arc/circle radius `< 2·tol` → `{ id, radius }`. Construction curves count. Order: lines, arcs, circles | — |

## Prediction vs. extrusion (`sketchRegion` + `part.extrusion` limit2 10)

| sketch | result | extrusion |
|---|---|---|
| rectangle 100×50 | `[]` | OK, 50000 |
| rectangle + inner circle r10 | `[]` | OK, plate with hole, 46858.9 |
| two overlapping rectangles | 2 crossing pairs | fails: `self intersect at least at position {60,20,0}` (the first reported crossing) |
| rectangle with a 0.01 gap | 1 near pair | fails: `Brep after linear sweep not manifold` |
| rectangle with a 0.05×0.05 corner chamfer | 1 tiny line | OK (tiny is a warning, not a blocker) |
| overlapping rectangles trimmed to their union, after `postTrim` | `[]` | OK, 42000 = analytic |
| **rectangle with a 5 mm gap** | `[]` | **fails**: `not manifold` |
| **two rectangles sharing a collinear edge** | `[]` | **fails**: `self intersect at least at position "unknown"` |
| **rectangle + dangling line** | `[]` | **fails**: `not manifold` |
| two disjoint rectangles | `[]` | OK, both bodies in ONE `CC_Solid` — no count in the result |

Non-empty `intersectingCurves` / `nearCoincidence` → fix before extruding. Empty → only these two defects are absent. Open gaps of `tol` or more, shared collinear edges and dangling curves need their own check.

## Traps

- **Whole sketch, not per profile.** A stray line crossing your rectangle is reported even when the region you extrude does not contain it (and that extrusion succeeds). Filter `curves` against your profile's ids.
- **Construction is asymmetric:** excluded from `intersectingCurves`, included in `nearCoincidence`, `tinyEntities` and the bbox. A big construction circle makes the check coarser (an r500 construction circle around a 100×50 profile → tol 1, a 0.1 gap is now reported).
- **Relative tolerance.** The same 0.04 point distance is reported on a 100×50 sketch and ignored on a 10×5 one. Geometry with zero width or height (e.g. only vertical lines) gives tol 0: a 0.01 gap between two collinear lines is not reported.
- **`intersections` are `{ x, y, z }` objects in WORLD coordinates** (same frame as `getPositions`), not `[x, y, z]`. On a Front-plane sketch, local (50,25) comes back as `{ x: 50, y: 0, z: -25 }`.
- **Between `preTrim` and `postTrim` the result does not move.** It keeps reporting the original crossing pair; staged segments are invisible. Check after `postTrim`. A preTrim → postTrim restore without `trim` leaves the crossing reported.
- A line shorter than `tol` shows up twice: in `tinyEntities`, and its own two endpoints in `nearCoincidence`.
- Auto-incidence (`genIncidence`, default on) does not close a sub-`tol` gap. Close it yourself: `COINCIDENT` on the reported `points` (example below).
- Works on planeless sketches and on sketches already used by an extrusion (same result, maxLevel 31). It changes nothing (`getObjectsLists` is identical before and after the call).
- Cost: 5 ms for a plate with 4 holes. An 80-line grid with 1600 crossings takes 565 ms, because every pair of curves is checked.

## Errors (maxLevel 51; scripts throw)

| `id` | code | message |
|---|---|---|
| part, curve, point, region, work plane, feature | 1001 | `The parameter "id" has a wrong id type! Provide only following id types: ["sketch"]` |
| nonexistent (`999999`) or non-numeric string (`"abc"`) | 1006 | `An element of parameter "id" has an invalid id!` (preceded by a level-41 code-0 `ToId()…` / `couldn't be converted to an id` warning) |
| missing | 1004 | `The parameter "id" must be provided in the api call!` |

## Working example

```js
const partId = (await api.v1.part.create({ name: 'Plate' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const lines = (await api.v1.sketch.line([
  { id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] },
  { id: skId, startPos: [100, 0, 0], endPos: [100, 50, 0] },
  { id: skId, startPos: [100, 50, 0], endPos: [0, 50, 0] },
  { id: skId, startPos: [0, 50, 0], endPos: [0, 0.01, 0] }, // ends 0.01 short
])).result

let topo = (await api.v1.sketch.getTopologyInfo({ id: skId })).result
// topo.nearCoincidence → [{ points: [59, 84], distance: 0.01 }]  (start of line 1, end of line 4)
for (const { points } of topo.nearCoincidence) {
  await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: points })
}
topo = (await api.v1.sketch.getTopologyInfo({ id: skId })).result
if (topo.intersectingCurves.length || topo.nearCoincidence.length) throw new Error('profile still has defects')
await api.v1.part.extrusion({ id: partId, references: lines, limit2: 10 }) // volume 50000
```

## Related

[sketchRegion.md](sketchRegion.md) (no closure validation of its own) · [preTrim.md](preTrim.md) / [trim.md](trim.md) (fix crossings) · [constraint.md](constraint.md) (`COINCIDENT` fixes near-misses) · [getObjectsLists.md](getObjectsLists.md) · [extrusion.md](../part/extrusion.md)
