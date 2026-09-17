# sketch.updateDimensionPosition

Moves a dimension's text/annotation position (the `dimPt` member).

## Key Parameters

- **`id`** (required) — **dimension ID** from `sketch.dimension` (not the sketch ID). Other ID types → 1001.
- **`pos`** (required) — `[x, y, 0]`. **Z must be exactly 0** — even `0.001` → 1014. X/Y are not validated (negative, zero, 99999 all stored as-is).

## Return Value

`result: null`, `messages: []`, maxLevel 31, `structure` present, `graphic` absent. On error: `result: null`, maxLevel 51.

Works on all 7 dimension types: OFFSET, HORIZONTAL_DISTANCE, VERTICAL_DISTANCE (`CC_LinearFeatureDimension`), RADIUS (`CC_RadialFeatureDimension`), DIAMETER (`CC_DiameterFeatureDimension`), ANGLE, ANGLEOX (`CC_AngularFeatureDimension`). Independent of feature open/closed state (like `updateDimension`).

## Gotchas

- **Replaces auto-positioning permanently.** The computed `GetSE(...)` expression becomes a literal; there is no way to restore auto-placement:
  ```
  Before: dimPt.value = {x:40, y:8, z:0}, dimPt.expression = "GetSE([0,0,8,[0,0.5]])"
  After:  dimPt.value = {x:50, y:60, z:0}, dimPt.expression = "{50,60,0}"
  ```

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| `"wrong id type! Provide only following id types: [\"dimension\"]"` | 1001 | Sketch/part/line/constraint ID passed |
| `"The parameter \"pos\" which is a 2D point, must have a z-value of 0!"` | 1014 | Non-zero Z |
| `"The parameter \"pos\" must be provided in the api call!"` | 1004 | Missing `pos` |
| `"The parameter \"id\" must be provided in the api call!"` | 1004 | Missing `id` |
| `"ToId()/TOID() didn't get an existing or valid id"` + `"invalid id"` | 0+1006 | Dimension was deleted |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result

const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [lineId] })).result
await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [50, 60, 0] }) // dimPt = {x:50, y:60, z:0}
```

## Related

`sketch.dimension` · `sketch.updateDimension` · `sketch.deleteObject`
