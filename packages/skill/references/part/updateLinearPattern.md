# part.updateLinearPattern

Modifies an existing linear pattern. Partial updates: omitted fields keep their values. Must be wrapped in `part.openFeature` / `part.closeFeature`.

## Key Parameters

- `id` — **linear pattern feature ID** (not the part ID, unlike `linearPattern`)
- `name` — rename
- `targets` — change patterned features
- `dir1` — any sub-field (`references`, `distance`, `count`, `inverted`, `merged`); `dir1: { count: 6 }` changes only the count, keeping references and distance
- `dir2` — update, or add to a 1D pattern to make it a 2D grid
- `merged` (in dir1/dir2) can be toggled 0→1 or 1→0

## Return Value

Feature ID, maxLevel=31. null on failure (maxLevel=51).

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "The provided feature is not allowed to update. It's not active and open." | Missing openFeature | Call `openFeature({ id: lpId })` first |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'LPUpd' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 20, width: 15, height: 25 })).result
// Axes must exist before the pattern (openFeature rolls the tree back to it)
const waX = (await api.v1.part.workAxis({ id: partId, name: 'AxisX', direction: [1, 0, 0] })).result
const waY = (await api.v1.part.workAxis({ id: partId, name: 'AxisY', direction: [0, 1, 0] })).result
const lpId = (await api.v1.part.linearPattern({
  id: partId, targets: [boxId], dir1: { references: [waX], distance: 40, count: 3 },
})).result

// Count 3 → 6 and merge on
await api.v1.part.openFeature({ id: lpId })
await api.v1.part.updateLinearPattern({ id: lpId, dir1: { count: 6, merged: 1 } })
await api.v1.part.closeFeature({ id: lpId })

// Add second direction → 2D grid
await api.v1.part.openFeature({ id: lpId })
await api.v1.part.updateLinearPattern({ id: lpId, dir2: { references: [waY], distance: 30, count: 3 } })
await api.v1.part.closeFeature({ id: lpId })
```

## Related

`part.linearPattern` · `part.openFeature` / `part.closeFeature`
