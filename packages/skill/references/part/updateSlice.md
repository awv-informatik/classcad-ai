# part.updateSlice

Updates a slice feature's reference plane, inverted flag, targets, or name. Requires `part.openFeature` before and `closeFeature` after.

## Key Parameters

- `id` — **slice feature ID** (returned by `part.slice`, not the part ID)
- `reference` — new work plane ID
- `inverted` — `0` (FALSE) or `1` (TRUE)
- `name` — new name
- `targets` — new target features

All but `id` optional — omitted params keep current values.

## Return Value

Same slice feature ID; maxLevel 31 = success.

## Gotchas

- **`openFeature` is mandatory.** Without it you get two errors:
  - `"The provided feature is not allowed to update. It's not active and open."` (code 1200)
  - `"\"id\" must be provided for update."` (code 1004)

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'UpdateDemo' })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 50, height: 60 })).result

const wp1 = (await api.v1.part.workPlane({ id: partId, name: 'Low', position: [0, 0, 15], normal: [0, 0, 1] })).result
const wp2 = (await api.v1.part.workPlane({ id: partId, name: 'High', position: [0, 0, 45], normal: [0, 0, 1] })).result

const sliceId = (await api.v1.part.slice({ id: partId, targets: [{ id: boxId }], reference: wp1 })).result

await api.v1.part.openFeature({ id: sliceId })
await api.v1.part.updateSlice({ id: sliceId, reference: wp2, inverted: 1, name: 'NewSliceName' })
await api.v1.part.closeFeature({ id: sliceId })
```

## Related

`part.slice` · `part.openFeature` / `part.closeFeature`
