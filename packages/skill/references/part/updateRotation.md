# part.updateRotation

Modifies an existing rotation feature. Partial updates: omitted fields keep their values (`{ id: rId, angle: 1.5708 }` changes only the angle). Must be wrapped in `part.openFeature` / `part.closeFeature`.

## Key Parameters

- `id` — **rotation feature ID** (not the part ID)
- `name` — rename
- `targets` — change rotated features
- `references` — change the axis (work axis, brep edge, two work points) — completely reorients the body
- `angle` — radians
- `inverted` — 0/1

## Return Value

Feature ID, maxLevel=31. null on failure (maxLevel=51).

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "The provided feature is not allowed to update. It's not active and open." | Missing openFeature | Call `openFeature({ id: rId })` first |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'RotUpd' })).result
const boxCS = (await api.v1.part.workCSys({ id: partId, name: 'BoxCS', offset: [20, 0, 0] })).result
const boxId = (await api.v1.part.box({ id: partId, length: 40, width: 15, height: 20, references: [boxCS] })).result
// Axes must exist before the rotation (openFeature rolls the tree back to it)
const waZ = (await api.v1.part.workAxis({ id: partId, name: 'AxisZ', direction: [0, 0, 1] })).result
const waX = (await api.v1.part.workAxis({ id: partId, name: 'AxisX', direction: [1, 0, 0] })).result
const rId = (await api.v1.part.rotation({ id: partId, targets: [boxId], references: [waZ], angle: 0.7854 })).result

// Update angle
await api.v1.part.openFeature({ id: rId })
await api.v1.part.updateRotation({ id: rId, angle: 1.5708 })
await api.v1.part.closeFeature({ id: rId })

// Change rotation axis
await api.v1.part.openFeature({ id: rId })
await api.v1.part.updateRotation({ id: rId, references: [waX] })
await api.v1.part.closeFeature({ id: rId })
```

## Related

`part.rotation` · `part.openFeature` / `part.closeFeature`
