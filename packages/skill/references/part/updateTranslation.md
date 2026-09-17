# part.updateTranslation

Modifies an existing translation feature. Partial updates: omitted fields keep their values (`{ id: tId, distance: 80 }` changes only the distance). Must be wrapped in `part.openFeature` / `part.closeFeature`.

## Key Parameters

- `id` — **translation feature ID** (not the part ID)
- `name` — rename
- `targets` — change translated features
- `references` — change direction (work axis, brep edge, two work points)
- `distance` — new distance
- `inverted` — 0/1

## Return Value

Feature ID, maxLevel=31. null on failure (maxLevel=51).

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "The provided feature is not allowed to update. It's not active and open." | Missing openFeature | Call `openFeature({ id: tId })` first |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'TransUpd' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 30, width: 20, height: 25 })).result
// Axes must exist before the translation (openFeature rolls the tree back to it)
const waX = (await api.v1.part.workAxis({ id: partId, name: 'AxisX', direction: [1, 0, 0] })).result
const waY = (await api.v1.part.workAxis({ id: partId, name: 'AxisY', direction: [0, 1, 0] })).result
const tId = (await api.v1.part.translation({ id: partId, targets: [boxId], references: [waX], distance: 50 })).result

// Distance + invert
await api.v1.part.openFeature({ id: tId })
await api.v1.part.updateTranslation({ id: tId, distance: 80, inverted: 1 })
await api.v1.part.closeFeature({ id: tId })

// Change direction
await api.v1.part.openFeature({ id: tId })
await api.v1.part.updateTranslation({ id: tId, references: [waY] })
await api.v1.part.closeFeature({ id: tId })
```

## Related

`part.translation` · `part.openFeature` / `part.closeFeature`
