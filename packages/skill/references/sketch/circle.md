# sketch.circle

Creates one or more circles in a sketch.

## Key Parameters

- **`id`** (required) — sketch ID
- **`centerPos`** (required) — `[x, y, 0]`; non-zero Z → 1014
- **`radius`** (required) — zero and negative values silently accepted; negative stored as-is (no normalization). Avoid both.
- **`genFixation`** (default TRUE) — "Auto_Fix" **only when the center is at origin**
- **`genIncidence`** (default TRUE) — "Auto_Coinc" when the center **exactly matches** (no tolerance) an existing point (standalone points, line endpoints, other centers)
- **`isConstruction`** (default FALSE) — construction geometry (dashed): drives the profile via constraints/dimensions (a real curve can be tangent to it), full solver participant, excluded from profile and operations; construction-only curves in `part.extrusion`/`part.revolve`/`part.twist` → error (maxLevel 51), no solid. See `recipes/constrained-sketching` (§ Construction geometry).

## Return Value

`result: id | VOID | Array<id|VOID>`. Success: ID, maxLevel 31, no messages. Batch (array of param objects): IDs in input order. Failure: null, maxLevel 51.

## Structure & Queries

`CC_Circle` (members `radius`, `rigidSetId` default 0) with child `CC_Point` "center" (id N+1, member `pos`). Consumes 3 IDs, +2 per auto-constraint.

- `getPoints(circleId)` → `{ centerId }`
- **`getPositions(circleId)` DOES NOT WORK** — null, "objId not found" (API docs wrongly claim `{ centerPos }`). Use `getPoints` → `centerId` → `getPositions` → `{ pos: { x, y, z } }`.
- `getGeometry(sketchId)` lists it in `circles`.
- After `deleteObject` (VOID), `getPoints` → null, maxLevel 51.

## Updating

`updateGeometry({ id: skId, circles: [{ id, centerPos, radius }] })`. Partial updates work: `{ id, radius: 9 }` keeps the center; `centerPos` alone keeps the radius.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "centerPos which is a 2D point, must have a z-value of 0!" | 1014 | Non-zero Z |
| "centerPos must be provided in the api call!" | 1004 | Missing centerPos when creating (updateGeometry accepts partial updates) |
| "radius must be provided in the api call!" | 1004 | Missing radius when creating |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

const [circleId] = (await api.v1.sketch.circle([
  { id: skId, centerPos: [30, 20, 0], radius: 15 },
  { id: skId, centerPos: [80, 0, 0], radius: 10 },
])).result

const centerId = (await api.v1.sketch.getPoints({ id: circleId })).result.centerId
const pos = (await api.v1.sketch.getPositions({ id: centerId })).result // { pos: { x: 30, y: 20, z: 0 } }

await api.v1.sketch.updateGeometry({ id: skId, circles: [{ id: circleId, centerPos: [50, 40, 0], radius: 20 }] })
await api.v1.sketch.deleteObject({ ids: [circleId] })
```

## Related

`sketch.getPoints` · `sketch.getGeometry` · `sketch.updateGeometry` · `sketch.deleteObject` · `sketch.constraint` · `sketch.sketchRegion`
