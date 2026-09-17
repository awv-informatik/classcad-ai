# part.updateTwist

Updates a twist feature. Must be wrapped in `openFeature` / `closeFeature`.

## Key Parameters

- `id` — **twist feature ID** returned by `part.twist` (not the part ID)
- Optional overrides (omitted params keep current values): `twistAngle`, `limit2`, `limit1`, `type`, `direction`, `twistCenter`, `capEnds`, `name`, `references`

## Gotchas

- **Without `openFeature`:** error 1200 "The provided feature is not allowed to update. It's not active and open."
- `type` can change (e.g. UP→SYMMETRIC); `capEnds` can switch solid↔sheet — still integer `1`/`0`, as in `part.twist`.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [-30, -20, 0], endPos: [30, 20, 0] })).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
const twistId = (await api.v1.part.twist({ id: partId, references: [regionId], twistAngle: Math.PI / 2, limit2: 100 })).result

await api.v1.part.openFeature({ id: twistId })
await api.v1.part.updateTwist({ id: twistId, twistAngle: Math.PI, limit2: 120, type: 'SYMMETRIC' })
await api.v1.part.closeFeature({ id: twistId })
```

## Related

[`part.twist`](twist.md) · [`part.openFeature`](openFeature.md)
