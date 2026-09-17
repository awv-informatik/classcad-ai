# part.updateRevolve

Modifies a revolve feature. Must be wrapped in `openFeature` / `closeFeature`. Omitted parameters keep their current values (e.g. updating only `endAngle` preserves `startAngle` and `inverted`).

```js
await api.v1.part.openFeature({ id: revId })
await api.v1.part.updateRevolve({ id: revId, endAngle: Math.PI / 2 })
await api.v1.part.closeFeature({ id: revId })
```

## Key Parameters

- `id` — **feature ID** from `part.revolve`. Part or sketch ID → error 1007 "not a feature or work geometry id"
- `name` — renames the feature node; child bodies keep their original name (`OriginalName_0`)
- `references` — swap the profile (region IDs); changes the cross-section (rectangle → circle = ring → torus)
- `axisIds` — swap the axis (work axis, sketch line, or two points); changes the solid's orientation
- `startAngle`, `endAngle` — radians; numbers or `@expr.NAME`
- `inverted` — integer `1` (CW) or `0` (CCW). JS booleans or `'TRUE'`/`'FALSE'` → error 1004

## Return Value

The **feature ID** (same as creation), not VOID. maxLevel 31 on success, 51 on error.

## Behavior

- Multiple `updateRevolve` calls in one open/close session are cumulative; one `closeFeature` at the end. All params (name, references, axisIds, angles, inverted) can also go in one call.
- **Expression bindings are live** whether set at creation (`part.revolve({ endAngle: '@expr.ANG' })`) or via `updateRevolve` inside open/close: changing the value via `updateExpression` auto-recalcs geometry — no open/close or `recalc()` needed (ANG π→π/2 halves the volume).

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "not allowed to update. It's not active and open" | No `openFeature` | Call `openFeature({ id: revId })` first |
| 1007 | "not a feature or work geometry id" | Part ID or sketch ID | Use the ID from `revolve()` |
| 1004 | "\"id\" must be provided for update" | Accompanies 1200 or 1007 | Fix the primary error |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result
const xAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'XAxis' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0] })).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
const revId = (await api.v1.part.revolve({ id: partId, references: [regionId], axisIds: [yAxisId] })).result

// Several updates in one session
await api.v1.part.openFeature({ id: revId })
await api.v1.part.updateRevolve({ id: revId, endAngle: Math.PI / 2 })
await api.v1.part.updateRevolve({ id: revId, startAngle: Math.PI / 4 })
await api.v1.part.updateRevolve({ id: revId, inverted: 1 })
await api.v1.part.closeFeature({ id: revId })

// All params at once
await api.v1.part.openFeature({ id: revId })
await api.v1.part.updateRevolve({ id: revId, name: 'Updated', axisIds: [xAxisId], startAngle: 0, endAngle: Math.PI, inverted: 0 })
await api.v1.part.closeFeature({ id: revId })
```

## Related

`part.revolve` · `part.openFeature` / `part.closeFeature` · `part.expression` / `part.updateExpression` · `part.linkWithExpression` · `sketch.sketchRegion`
