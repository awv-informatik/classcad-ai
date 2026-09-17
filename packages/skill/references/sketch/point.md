# sketch.point

Creates one or more construction points in a sketch.

## Key Parameters

- **`id`** (required) — sketch ID (part ID → 1001)
- **`pos`** (required) — `[x, y, 0]` in **sketch-local** coordinates. Non-zero Z is a hard error (1014), not a projection.
- **`genFixation`** (default TRUE) — "Auto_Fix" (`CC_2DFixationConstraint`) **only at the origin**; no effect elsewhere
- **`genIncidence`** (default TRUE) — "Auto_Coinc" (`CC_2DCoincidentConstraint`) when the position **exactly matches** an existing point (0.001 apart does not trigger), incl. line endpoints

## Return Value

`result: id | VOID | Array<id|VOID>`. Success: ID, maxLevel 31, no messages. Batch (array of param objects): IDs in input order. Failure: null, maxLevel 51.

## Structure

`CC_Point`, parent = sketch; names "Point", then "Point0", "Point1", …; members `pos`, `_VERSION`, `rigidSetId` (default 0). 2 IDs per point plus auto-constraints; first point typically at sketch ID + 6.

## Coordinate Space

`getPositions` returns **world** coordinates `{ pos: { x, y, z } }`. On XY sketches local = world; otherwise the work plane maps them — local (30,20,0) on a YZ-plane sketch → world `{x:0, y:-20, z:30}`.

After `deleteObject({ ids: [pointId] })` (VOID), `getPositions` → null, maxLevel 51.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "parameter 'id' / 'pos' must be provided" | 1004 | Missing param |
| "wrong id type! Provide only following id types: ['sketch']" | 1001 | Part ID instead of sketch ID |
| "invalid id" | 1006 | Nonexistent ID |
| "pos which is a 2D point, must have a z-value of 0!" | 1014 | Non-zero Z |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

const ptId = (await api.v1.sketch.point({ id: skId, pos: [30, 20, 0] })).result
const pos = (await api.v1.sketch.getPositions({ id: ptId })).result // { pos: { x: 30, y: 20, z: 0 } }

const pts = (await api.v1.sketch.point([
  { id: skId, pos: [0, 0, 0], genFixation: false },
  { id: skId, pos: [20, 0, 0] },
])).result // [id1, id2]
```

## Related

`sketch.getPositions` · `sketch.deleteObject` · `sketch.line` · `sketch.constraint`
