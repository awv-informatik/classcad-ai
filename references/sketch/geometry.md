# sketch.geometry

Batch-creates one or more sketch geometry items (points, lines, arcs, circles) in a single call. Functionally equivalent to calling `sketch.point`, `sketch.line`, `sketch.circle`, `sketch.arcBy3Points`, `sketch.arcByCenter` individually — this is a convenience wrapper that reduces round-trips.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create`)

## Key Parameters

- `id` — sketch ID (required)
- `points` — array of `{ pos: [x,y,z] }`
- `lines` — array of `{ startPos, endPos, isConstruction? }` — `isConstruction` defaults to FALSE
- `arcsBy3Points` — array of `{ startPos, endPos, midPos, isConstruction? }` — `midPos` is a point ON the arc, not the center; `isConstruction` defaults to FALSE
- `arcsByCenter` — array of `{ startPos, endPos, centerPos, isClockwise?, isConstruction? }` — `isClockwise` defaults to TRUE; `isConstruction` defaults to FALSE
- `circles` — array of `{ centerPos, radius, isConstruction? }` — `isConstruction` defaults to FALSE
- `genFixation` — auto-generate fixation constraint at origin (default TRUE)
- `genIncidence` — auto-generate coincidence constraints when endpoints overlap (default TRUE)
- `genTangency` — auto-generate tangency constraints between touching curves (default TRUE)
- `genVertAndHoriz` — auto-generate horizontal/vertical constraints for axis-aligned lines (default TRUE)

All geometry arrays are optional. You can pass any combination, including none at all.

Per-curve `isConstruction` (lines, circles, arcs; not points) marks a curve as construction/reference geometry — a skeleton (axes, bolt circles, centerlines) that drives the real profile through constraints and dimensions but is excluded from the profile itself: it participates fully in the constraint solver (e.g. a real circle can be made tangent to a construction axis) yet is not actionable — it renders dashed and must not be passed to `part.extrusion` (extruding construction curves hangs). See `SKETCHING.md` (§ Construction geometry).

## Return Value

```js
{
  result: {
    points: id[],        // IDs of created points
    lines: id[],         // IDs of created lines
    arcsBy3Points: id[], // IDs of created 3-point arcs
    arcsByCenter: id[],  // IDs of created center arcs
    circles: id[]        // IDs of created circles
  }
}
```

Always returns all 5 arrays, even for types not requested (those will be empty `[]`). IDs within each array are in ascending order matching input array order.

## Gotchas

- **No input validation for degenerate geometry.** Zero-radius circles, zero-length lines (start==end), and negative-radius circles are accepted silently (maxLevel=31, no error). They create objects in the sketch but may cause issues downstream (extrusion, constraint solving).
- **Empty/missing arrays are fine.** Passing `{ id: skId }` with no geometry arrays returns all 5 empty arrays without error. Passing empty arrays `points: []` also works.
- **gen flags affect ALL geometry in the call.** Setting `genFixation: false` suppresses fixation constraints for every item created in that call, not selectively.
- **Structure tree accumulation.** When reading `r.structure` after calling `geometry()`, the tree contains ALL objects in the drawing (all parts, all sketches), not just what was just created. To compare constraint effects, use isolated parts/scripts.

## Auto-Constraint Flags

With default flags (all TRUE), for two connected lines (horizontal + vertical):
- `CC_2DFixationConstraint` (Auto_Fix) — fixes geometry to the origin
- `CC_2DHorizontalConstraint` (Auto_H) — on horizontal lines
- `CC_2DCoincidentConstraint` (Auto_Coinc) — at shared endpoints
- `CC_2DVerticalConstraint` (Auto_V) — on vertical lines

Setting all 4 gen flags to `false` produces 0 auto-constraints.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create mixed geometry in one call
const r = await api.v1.sketch.geometry({
  id: skId,
  points: [{ pos: [0, 0, 0] }],
  lines: [
    { startPos: [0, 0, 0], endPos: [50, 0, 0] },
    { startPos: [50, 0, 0], endPos: [50, 30, 0] },
  ],
  circles: [{ centerPos: [25, 15, 0], radius: 10 }],
  genFixation: false,  // suppress auto-constraints if you'll add your own
})

// r.result.points = [id1]
// r.result.lines = [id2, id3]
// r.result.circles = [id4]
```

## Related

- `sketch.point`, `sketch.line`, `sketch.circle`, `sketch.arcByCenter`, `sketch.arcBy3Points` — individual creation APIs (equivalent results)
- `sketch.getGeometry` — retrieve all geometry IDs from a sketch
- `sketch.deleteObject` — delete created geometry by ID
- `sketch.constraint` — add constraints manually (when gen flags are off)
