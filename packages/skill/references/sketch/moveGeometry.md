# sketch.moveGeometry

Moves sketch geometry by a translation delta. On a sketch with `planeId` the move runs through the solver: connected/constrained geometry follows (moving a rectangle's right side +10 stretches top and bottom to 90); a move conflicting with constraints returns maxLevel 51 and leaves geometry unchanged. Without a plane it is a raw translation. (`updateGeometry` sets absolute positions without solving — prefer `moveGeometry` for deltas.)

## Key Parameters

- `id` (required) — sketch ID
- `geomIds` — `sketch-curve`/`sketch-point` IDs; all get the same translation. Points, lines, circles, arcs (both kinds — start/end/center all translated) from any creator. `[]` is a no-op (result 0, maxLevel 31). To move a group (e.g. a rectangle) as a unit, pass ALL its IDs.
- `translation` — `[x, y, 0]`; negatives fine, `[0,0,0]` a safe no-op. **Non-zero Z → 1014.**

## Return Value

`1` = constraints satisfied after the move, `0` = broken (e.g. fixations no longer match). Unreliable as logic — depends on internal solver state; treat as a hint. maxLevel 31 on success, 51 on error.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1001 | `wrong id type! Provide only following id types: ["sketch"]` | `id` not a sketch |
| 1001 | `wrong id type! Provide only following id types: ["sketch-curve","sketch-point"]` | Non-geometry ID in `geomIds` |
| 1006 | `invalid id` | Geometry ID doesn't exist |
| 1014 | `"translation" which is a 2D point, must have a z-value of 0!` | Non-zero Z |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [50, 10, 0] })).result
const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 30, 0], radius: 15 })).result

const r = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [lineId, circId], translation: [20, 15, 0] })
// line now [30,25]-[70,25], circle center [50,45]

const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 60, 0], endPos: [50, 90, 0] })).result
await api.v1.sketch.moveGeometry({ id: skId, geomIds: rectIds, translation: [20, 10, 0] }) // all 4 lines
```

## Related

`sketch.updateGeometry` · `sketch.getPositions` · `sketch.geometry`
