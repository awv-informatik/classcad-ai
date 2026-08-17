# part.updateSliceBySheet

Updates an existing sliceBySheet feature — changes the tool, inverted flag, target, or name.

## Prerequisites

- An existing sliceBySheet feature (from `part.sliceBySheet`)
- The feature must be opened with `part.openFeature` before updating

## Key Parameters

- `id` — the **slice feature ID** (not the part ID). This is the ID returned by `part.sliceBySheet`.
- `tool` — new sheet feature as object `{ id: sheetId }` (optional — omit to keep existing)
- `inverted` — integer `0` or `1` to change which side is kept (optional)
- `name` — new name for the slice feature (optional)
- `target` — new target feature as object `{ id, indices? }` (optional)

## Return Value

Returns the same slice feature ID on success. MaxLevel 31 = success.

## Usage Pattern

```js
await api.v1.part.openFeature({ id: sliceId })
await api.v1.part.updateSliceBySheet({ id: sliceId, inverted: 1 })
await api.v1.part.closeFeature({ id: sliceId })
```

## Gotchas

- **`openFeature` is mandatory.** Without it, you get:
  - `"The provided feature is not allowed to update. It's not active and open."` (code 1200)
  - `"\"id\" must be provided for update."` (code 1004)
- Only pass the parameters you want to change — omitted parameters keep their current values.
- The `tool` parameter in updateSliceBySheet requires object form `{ id: sheetId }`, not a plain ID.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'UpdateDemo' })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 50 })).result

// Create two sheets at different z positions (from Front plane)
const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result

const sk1 = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result
const rect1 = (await api.v1.sketch.rectangle({ id: sk1, startPos: [-20, 15, 0], endPos: [100, 200, 0] })).result
const reg1 = (await api.v1.sketch.sketchRegion({ id: sk1, geomIds: rect1 })).result
const sheet1 = (await api.v1.part.extrusion({ id: partId, name: 'Sheet1', references: [reg1], type: 'UP', limit2: 80, capEnds: 0 })).result

const sk2 = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result
const rect2 = (await api.v1.sketch.rectangle({ id: sk2, startPos: [-20, 35, 0], endPos: [100, 200, 0] })).result
const reg2 = (await api.v1.sketch.sketchRegion({ id: sk2, geomIds: rect2 })).result
const sheet2 = (await api.v1.part.extrusion({ id: partId, name: 'Sheet2', references: [reg2], type: 'UP', limit2: 80, capEnds: 0 })).result

// Initial slice at z=15
const sliceId = (await api.v1.part.sliceBySheet({ id: partId, target: boxId, tool: sheet1 })).result

// Update: flip side, change tool to sheet2 (z=35), rename
await api.v1.part.openFeature({ id: sliceId })
await api.v1.part.updateSliceBySheet({
  id: sliceId,
  inverted: 1,
  tool: { id: sheet2 },
  name: 'NewSlice',
})
await api.v1.part.closeFeature({ id: sliceId })
```

## Related

- `part.sliceBySheet` — creates the feature this updates
- `part.openFeature` / `part.closeFeature` — required gate for all `update*` calls
