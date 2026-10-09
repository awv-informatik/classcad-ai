# sketch.geometry

Batch-creates points, lines, arcs, and circles in one call — equivalent to `sketch.point`/`line`/`circle`/`arcBy3Points`/`arcByCenter`, fewer round-trips.

## Key Parameters

- `id` — sketch ID (required)
- `points` — `[{ pos }]`
- `lines` — `[{ startPos, endPos, isConstruction? }]`
- `arcsBy3Points` — `[{ startPos, endPos, midPos, isConstruction? }]` — `midPos` is ON the arc, not the center
- `arcsByCenter` — `[{ startPos, endPos, centerPos, isClockwise?, isConstruction? }]` — `isClockwise` default TRUE
- `circles` — `[{ centerPos, radius, isConstruction? }]`
- `genFixation` (fixation at origin), `genIncidence` (coincidence at overlapping endpoints), `genTangency` (tangency between touching curves), `genVertAndHoriz` (H/V for axis-aligned lines) — all default TRUE, and apply to EVERY item in the call

All arrays optional, any combination; `{ id }` alone or empty arrays return all-empty results without error.

**`isConstruction`** (default FALSE; curves only, not points) marks a skeleton curve (axes, bolt circles, centerlines) that drives the profile through constraints/dimensions but isn't part of it: fully in the solver (a real circle can be tangent to a construction axis), rendered dashed, and construction-only curves in `part.extrusion`/`part.revolve`/`part.twist` → error (maxLevel 51), no solid. See `recipes/constrained-sketching` (§ Construction geometry).

## Return Value

`result: { points, lines, arcsBy3Points, arcsByCenter, circles }` — always all 5 arrays (unrequested ones `[]`); IDs ascending, matching input order.

## Auto-constraints

- Defaults on two connected lines (H + V): `Auto_Fix` (`CC_2DFixationConstraint`, at origin), `Auto_H`, `Auto_V`, `Auto_Coinc` (shared endpoints). All 4 flags `false` → 0 autos.
- **Individual creators auto-generate too:** `sketch.line`/`circle`/`arcByCenter` produced `Auto_Fix`, `Auto_Coinc` (exactly-shared endpoints), `Auto_H`, `Auto_V` — but NO tangency for exactly-tangent circle/line pairs. Only this call's `genTangency` generates tangency, and only this call exposes flags to suppress generation.
- **⚠️ Autos + contradictory explicit wiring = global solver divergence.** Autos encode junction topology FROM SEED POSITIONS. If an explicit COINCIDENT disagrees (e.g. mirrored arcs with swapped start/end wired by a side-uniform loop), `DoSolve` flags no loser — it diverges from an already-satisfied state: batches 51, `CalcBulges radius too small`, `SetSE NullMem`, small arcs collapse to r=0, every later dimension value refused (mounting-plate, 19 curves). Consistent duplication is harmless (autos ON and OFF both solved rough→exact at 2.8e-14). For fully explicit builds pass `genIncidence: false, genTangency: false, genVertAndHoriz: false` — the same wiring bug then solves to a visibly displaced layout a numeric readback catches.

## Gotchas

- **No degenerate-geometry validation.** Zero/negative-radius circles and zero-length lines are accepted silently (maxLevel 31) and may break extrusion or solving downstream.
- **The structure tree (`api.tree()`) holds the whole drawing** (all parts/sketches), not just the new items — compare constraint effects in isolated parts/scripts.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

const r = await api.v1.sketch.geometry({
  id: skId,
  points: [{ pos: [0, 0, 0] }],
  lines: [
    { startPos: [0, 0, 0], endPos: [50, 0, 0] },
    { startPos: [50, 0, 0], endPos: [50, 30, 0] },
  ],
  circles: [{ centerPos: [25, 15, 0], radius: 10 }],
  genFixation: false,
})
// r.result.points = [id1], lines = [id2, id3], circles = [id4]
```

## Related

`sketch.point` · `sketch.getGeometry` · `sketch.deleteObject` · `sketch.constraint`
