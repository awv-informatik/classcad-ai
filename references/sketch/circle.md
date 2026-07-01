# sketch.circle

Creates one or multiple circles in a sketch. Returns the circle ID(s).

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create` or `part.sketch`)

## Key Parameters

- **`id`** (required) — sketch ID
- **`centerPos`** (required) — `[x, y, z]`, Z must be 0. Error 1014 if non-zero Z.
- **`radius`** (required) — circle radius. Zero and negative values are silently accepted (no error, no warning). Negative radius is stored as-is in the structure — no normalization.
- **`genFixation`** (optional, default TRUE) — auto-generates `CC_2DFixationConstraint` ("Auto_Fix") **only when the center is at origin** (0,0,0). No effect for off-origin centers.
- **`genIncidence`** (optional, default TRUE) — auto-generates `CC_2DCoincidentConstraint` ("Auto_Coinc") when the center position **exactly matches** an existing point. Works cross-geometry (standalone points, line endpoints, other circle centers).
- **`isConstruction`** (optional, default FALSE) — marks the circle as construction/reference geometry (drawn dashed). Construction curves drive the profile through constraints/dimensions (e.g. a real curve made tangent to a construction circle) but are excluded from the profile and from operations. A full participant in the constraint solver, but not actionable — never pass construction curves to `part.extrusion` (it hangs). See `SKETCHING.md` (§ Construction geometry).

## Batch Creation

Pass an array of param objects:

```js
const r = await api.v1.sketch.circle([
  { id: skId, centerPos: [0, 0, 0], radius: 10 },
  { id: skId, centerPos: [40, 0, 0], radius: 15 },
])
// r.result → [58, 63] — array of IDs in matching order
```

## Return Value

```js
{ result: id | VOID | Array<id|VOID>, messages?: [...], maxLevel?: real }
```

- Success: numeric ID (e.g., 58), maxLevel=31 (info), no messages
- Batch: array of IDs matching input order
- Failure: result=null, maxLevel=51, messages with error details

## Structure

Each circle creates a `CC_Circle` node with one child:
- `CC_Circle` (id=N, parent=sketch) — members: `radius` (real), `rigidSetId` (id, default 0)
  - `CC_Point` named "center" (id=N+1) — members: `pos` (point)

ID increment: each circle consumes **3 IDs** (circle + center point + 1 internal). Auto-constraints add 2 IDs each on top.

## Querying Circle Data

**`getPoints(circleId)`** → `{ centerId: id }` — returns the center point's ID.

**`getPositions(circleId)`** — **DOES NOT WORK on circle IDs.** Returns null with error "objId not found" despite docs claiming it returns `{ centerPos }`. This is a doc discrepancy.

**Workaround:** Always use the two-step approach:
```js
const centerId = (await api.v1.sketch.getPoints({ id: circleId })).result.centerId
const pos = (await api.v1.sketch.getPositions({ id: centerId })).result
// pos → { pos: { x, y, z } }
```

**`getGeometry(sketchId)`** → `{ circles: [id, ...], lines: [...], arcs: [...], points: [...] }` — circles appear in the `circles` array.

## Updating

Use `updateGeometry` with the `circles` array:

```js
await api.v1.sketch.updateGeometry({
  id: skId,
  circles: [{ id: circleId, centerPos: [50, 40, 0], radius: 20 }]
})
```

**Both `centerPos` and `radius` are required.** Omitting either → error 1004. Partial updates are not supported.

## Deletion

```js
await api.v1.sketch.deleteObject({ ids: [circleId] })
```

Returns VOID on success. Accessing a deleted circle via `getPoints` returns null with maxLevel=51.

## Gotchas

- **getPositions fails on circle IDs** — use `getPoints` → `centerId` → `getPositions` instead. The docs are wrong about this.
- **Zero and negative radii accepted** — no error, no warning. Negative stored as-is. Avoid both.
- **updateGeometry requires both params** — cannot update just centerPos or just radius.
- **Non-zero Z → error 1014** — same as point/line.
- **genFixation only at origin** — same behavior as `sketch.point`.
- **genIncidence is exact-match** — no tolerance, same as `sketch.point`.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "centerPos which is a 2D point, must have a z-value of 0!" | 1014 | Non-zero Z coordinate |
| "centerPos must be provided in the api call!" | 1004 | Missing centerPos in updateGeometry |
| "radius must be provided in the api call!" | 1004 | Missing radius in updateGeometry |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create circle
const circleId = (await api.v1.sketch.circle({
  id: skId, centerPos: [30, 20, 0], radius: 15
})).result

// Query position (two-step — getPositions doesn't work on circle IDs)
const centerId = (await api.v1.sketch.getPoints({ id: circleId })).result.centerId
const pos = (await api.v1.sketch.getPositions({ id: centerId })).result
// pos → { pos: { x: 30, y: 20, z: 0 } }

// Update
await api.v1.sketch.updateGeometry({
  id: skId,
  circles: [{ id: circleId, centerPos: [50, 40, 0], radius: 20 }]
})

// Delete
await api.v1.sketch.deleteObject({ ids: [circleId] })
```

## Related

- `sketch.getPoints` — get centerId (then use getPositions on that)
- `sketch.getGeometry` — list all circles in a sketch
- `sketch.updateGeometry` — update circle position and radius
- `sketch.deleteObject` — delete circles
- `sketch.constraint` — manually add constraints to circle centers
- `sketch.sketchRegion` — create regions from closed circles
