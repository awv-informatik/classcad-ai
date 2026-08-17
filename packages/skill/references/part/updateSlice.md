# part.updateSlice

Updates an existing slice feature — changes the reference plane, inverted flag, targets, or name.

## Prerequisites

- An existing slice feature (from `part.slice`)
- The feature must be opened with `part.openFeature` before updating

## Key Parameters

- `id` — the **slice feature ID** (not the part ID). This is the ID returned by `part.slice`.
- `reference` — new work plane ID to slice at (optional — omit to keep existing)
- `inverted` — `0` (FALSE) or `1` (TRUE) to change which side is kept (optional)
- `name` — new name for the slice feature (optional)
- `targets` — new target features (optional — use to change what gets sliced)

## Return Value

Returns the same slice feature ID on success. MaxLevel 31 = success.

## Usage Pattern

```js
await api.v1.part.openFeature({ id: sliceId })
await api.v1.part.updateSlice({ id: sliceId, inverted: 1 })
await api.v1.part.closeFeature({ id: sliceId })
```

## Gotchas

- **`openFeature` is mandatory.** Without it, you get two errors:
  - `"The provided feature is not allowed to update. It's not active and open."` (code 1200)
  - `"\"id\" must be provided for update."` (code 1004)
- Only pass the parameters you want to change — omitted parameters keep their current values.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'UpdateDemo' })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 50, height: 60 })).result

const wp1 = (await api.v1.part.workPlane({ id: partId, name: 'Low', origin: [0, 0, 15], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
const wp2 = (await api.v1.part.workPlane({ id: partId, name: 'High', origin: [0, 0, 45], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result

const sliceId = (await api.v1.part.slice({
  id: partId,
  targets: [{ id: boxId }],
  reference: wp1,
})).result

// Later: change the reference plane and flip inverted
await api.v1.part.openFeature({ id: sliceId })
await api.v1.part.updateSlice({
  id: sliceId,
  reference: wp2,
  inverted: 1,
  name: 'NewSliceName',
})
await api.v1.part.closeFeature({ id: sliceId })
```

## Related

- `part.slice` — creates the feature this updates
- `part.openFeature` / `part.closeFeature` — required gate for all `update*` calls
