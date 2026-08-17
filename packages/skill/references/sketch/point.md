# sketch.point

Creates one or multiple construction points in a sketch. Returns the point ID(s).

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create` or `part.sketch`)

## Key Parameters

- **`id`** (required) — sketch ID (not part ID). Error code 1001 if you pass the wrong type.
- **`pos`** (required) — `[x, y, z]` in **sketch-local coordinates**. Z must be exactly 0 — non-zero Z is a hard error (code 1014), not a silent projection. On non-XY sketches, the local coordinate system maps to world coords via the sketch's work plane.
- **`genFixation`** (optional, default TRUE) — auto-generates a `CC_2DFixationConstraint` ("Auto_Fix") **only when the point is placed at the origin** (0,0,0). Has no effect for off-origin points.
- **`genIncidence`** (optional, default TRUE) — auto-generates a `CC_2DCoincidentConstraint` ("Auto_Coinc") when the new point's position **exactly matches** an existing point's position. No tolerance — even 0.001 apart does not trigger it. Works cross-geometry: coincidence between a standalone point and a line's endpoint is detected.

## Batch Creation

Pass an array of param objects to create multiple points in one call:

```js
const r = await api.v1.sketch.point([
  { id: skId, pos: [0, 0, 0] },
  { id: skId, pos: [50, 0, 0] },
  { id: skId, pos: [50, 50, 0] },
])
// r.result → [58, 62, 64] — array of IDs in matching order
```

## Return Value

```js
{ result: id | VOID | Array<id|VOID>, messages?: [...], maxLevel?: real }
```

- Success: numeric ID (e.g., 58), maxLevel=31 (info), no messages
- Batch: array of IDs matching input order
- Failure: result=null, maxLevel=51, messages with error details

## Structure

Each point creates a `CC_Point` node in the structure tree:
- `name`: auto-generated — first is "Point", then "Point0", "Point1", "Point2", ...
- `class`: "CC_Point"
- `parent`: the sketch ID
- `members`: `pos` (point), `_VERSION` (string), `rigidSetId` (id, default 0)

ID increment: each point consumes 2 IDs. Auto-constraints (fixation, coincidence) consume additional IDs. First point in a sketch typically starts at sketch ID + 6.

## Coordinate Space

- **Input (`pos`)**: sketch-local coordinates. On an XY sketch, local = world. On other planes, the sketch's coordinate system transforms local → world.
- **Output (`getPositions`)**: returns `{ pos: { x, y, z } }` in **world coordinates**. Example: point at local (30,20,0) on a YZ-plane sketch → world `{x:0, y:-20, z:30}`.

## Gotchas

- **Z must be 0** — even though pos is `[x, y, z]`, the Z component must be exactly 0 in sketch-local space. Non-zero Z → error 1014.
- **genFixation only matters at origin** — the doc says "fixation in the Origin." Off-origin points get no fixation regardless of this flag.
- **genIncidence is exact-match only** — no tolerance. Points 0.001 apart are treated as separate.
- **getPositions returns world coords** — not sketch-local. If your sketch is on a non-XY plane, the returned coordinates differ from the input.
- **Auto-naming is inconsistent** — first point is "Point" (no number), subsequent are "Point0", "Point1", etc.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "parameter 'id' must be provided" | 1004 | Missing `id` |
| "parameter 'pos' must be provided" | 1004 | Missing `pos` |
| "wrong id type! Provide only following id types: ['sketch']" | 1001 | Passed part ID instead of sketch ID |
| "invalid id" | 1006 | Non-existent ID |
| "pos which is a 2D point, must have a z-value of 0!" | 1014 | Non-zero Z coordinate |

## Deletion

Use `sketch.deleteObject({ ids: [pointId] })` to remove points. Returns VOID on success. Accessing a deleted point via `getPositions` returns null with maxLevel=51.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Single point
const ptId = (await api.v1.sketch.point({ id: skId, pos: [30, 20, 0] })).result

// Verify position
const pos = await api.v1.sketch.getPositions({ id: ptId })
// pos.result → { pos: { x: 30, y: 20, z: 0 } }

// Point at origin with no auto-fixation
const pt2 = (await api.v1.sketch.point({
  id: skId, pos: [0, 0, 0], genFixation: false
})).result

// Batch
const pts = (await api.v1.sketch.point([
  { id: skId, pos: [10, 0, 0] },
  { id: skId, pos: [20, 0, 0] },
])).result
// pts → [id1, id2]
```

## Related

- `sketch.getPositions` — retrieve point position (returns world coords)
- `sketch.deleteObject` — delete points (and other sketch geometry)
- `sketch.line` — lines create implicit CC_Point children at endpoints
- `sketch.constraint` — manually add constraints between points
