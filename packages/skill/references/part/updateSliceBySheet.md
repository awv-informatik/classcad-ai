# part.updateSliceBySheet

Updates a sliceBySheet feature's tool, inverted flag, target, or name. Requires `part.openFeature` before and `closeFeature` after.

## Key Parameters

- `id` — **slice feature ID** (returned by `part.sliceBySheet`, not the part ID)
- `tool` — new sheet feature: plain id or `{ id: sheetId }`
- `inverted` — integer `0` or `1`
- `name` — new name
- `target` — new target `{ id, indices? }`

All but `id` optional — omitted params keep current values.

## Return Value

Same slice feature ID; maxLevel 31 = success.

## Gotchas

- **`openFeature` is mandatory.** Without it:
  - `"The provided feature is not allowed to update. It's not active and open."` (code 1200)
  - `"\"id\" must be provided for update."` (code 1004)

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'UpdateDemo' })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 50 })).result
const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result

// Two sheets from the Front plane (local y → world −z): walls at z=15 and z=35
const sheets = []
for (const z of [15, 35]) {
  const sk = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result
  const rect = (await api.v1.sketch.rectangle({ id: sk, startPos: [-20, -z, 0], endPos: [100, -200, 0] })).result
  const reg = (await api.v1.sketch.sketchRegion({ id: sk, geomIds: rect })).result
  sheets.push((await api.v1.part.extrusion({ id: partId, name: `Sheet${z}`, references: [reg], type: 'UP', limit2: 80, capEnds: 0 })).result)
}

const sliceId = (await api.v1.part.sliceBySheet({ id: partId, target: boxId, tool: sheets[0] })).result

// Flip side, switch tool to the z=35 sheet, rename
await api.v1.part.openFeature({ id: sliceId })
await api.v1.part.updateSliceBySheet({ id: sliceId, inverted: 1, tool: { id: sheets[1] }, name: 'NewSlice' })
await api.v1.part.closeFeature({ id: sliceId })
```

## Related

`part.sliceBySheet` · `part.openFeature` / `part.closeFeature`
