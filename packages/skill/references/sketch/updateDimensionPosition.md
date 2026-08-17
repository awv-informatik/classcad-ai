# sketch.updateDimensionPosition

Moves the dimension text/annotation position in the sketch. Updates the `dimPt` member in the structure tree.

## Prerequisites

- A dimension created with `sketch.dimension` — you need the **dimension ID**, not the sketch ID.

## Key Parameters

- **`id`** (required) — dimension ID (returned by `sketch.dimension`). Must be type `"dimension"` — all other ID types are rejected with code 1001.
- **`pos`** (required) — `[x, y, z]` position for the dimension text. **Z must be exactly 0** — any non-zero Z value fails with code 1014.

## Return Value

```js
{
  result: null,       // VOID — always null on success
  messages: [],       // empty on success
  maxLevel: 31,       // info level on success
  structure: {...},   // full structure tree (present)
  graphic: null       // absent
}
```

On error: `result: null`, `maxLevel: 51`.

## Works on All Dimension Types

Tested and confirmed on all 7 types:

| Type | Structure class |
|------|----------------|
| OFFSET | CC_LinearFeatureDimension |
| HORIZONTAL_DISTANCE | CC_LinearFeatureDimension |
| VERTICAL_DISTANCE | CC_LinearFeatureDimension |
| RADIUS | CC_RadialFeatureDimension |
| DIAMETER | CC_DiameterFeatureDimension |
| ANGLE | CC_AngularFeatureDimension |
| ANGLEOX | CC_AngularFeatureDimension |

## Gotchas

- **Z must be 0.** Even `Z=0.001` fails with code 1014: `"The parameter \"pos\" which is a 2D point, must have a z-value of 0!"`. Always pass `[x, y, 0]`.
- **Replaces auto-positioning permanently.** At creation, `dimPt` has a computed `GetSE(...)` expression (auto-placement formula). After calling `updateDimensionPosition`, the expression is replaced with a literal `{x,y,z}` string. There is no way to restore auto-positioning — the dimension text stays exactly where you put it.
- **No XY validation.** Any X/Y values are accepted: negative, zero, huge (99999). The position is stored as-is.
- **Feature-state independent.** Works regardless of whether the feature is open or closed (same as `updateDimension`).

## Common Errors

| Error | Code | Cause | Fix |
|-------|------|-------|-----|
| `"wrong id type! Provide only following id types: [\"dimension\"]"` | 1001 | Passed sketch/part/line/constraint ID | Use the dimension ID from `sketch.dimension()` |
| `"The parameter \"pos\" which is a 2D point, must have a z-value of 0!"` | 1014 | Non-zero Z in pos | Use `[x, y, 0]` |
| `"The parameter \"pos\" must be provided in the api call!"` | 1004 | Missing pos param | Always provide `pos` |
| `"The parameter \"id\" must be provided in the api call!"` | 1004 | Missing id param | Always provide `id` |
| `"ToId()/TOID() didn't get an existing or valid id"` + `"invalid id"` | 0+1006 | Dimension was deleted | Verify dimension exists before updating |

## Working Example

```js
// Create a dimension, then reposition its text
const dimId = (await api.v1.sketch.dimension({
  id: skId,
  type: 'OFFSET',
  geomIds: [lineId]
})).result

// Move the dimension text to a specific position
await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [50, 60, 0] })
// dimPt in structure tree now reads {x:50, y:60, z:0}
```

## Structure Tree Effect

Updates the `dimPt` member of the dimension node:

```
Before: dimPt.value = {x:40, y:8, z:0}, dimPt.expression = "GetSE([0,0,8,[0,0.5]])"
After:  dimPt.value = {x:50, y:60, z:0}, dimPt.expression = "{50,60,0}"
```

## Related

- `sketch.dimension` — create the dimension this positions
- `sketch.updateDimension` — change the dimension value (length, angle, etc.)
- `sketch.deleteObject` — delete a dimension (use `ids: [dimId]`)
