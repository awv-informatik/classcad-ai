# part.updateRevolve

Modifies an existing parametric revolve feature. Requires the `openFeature`/`closeFeature` gate. Any parameter not provided keeps its current value.

## Prerequisites

- A revolve feature created with `part.revolve`
- The feature ID (not the part ID)
- `openFeature` called on the feature before updating

## The Pattern

```js
await api.v1.part.openFeature({ id: revId })
await api.v1.part.updateRevolve({ id: revId, endAngle: Math.PI / 2 })
await api.v1.part.closeFeature({ id: revId })
```

## Key Parameters

- `id` — **feature ID** (from `part.revolve` result). NOT the part ID.
- `name` — renames the feature node in the tree. Child body nodes keep their original name (e.g., `OriginalName_0`).
- `references` — swap the profile. Pass different sketch region IDs. Completely changes the revolve cross-section (e.g., rectangle → circle = ring → torus).
- `axisIds` — swap the rotation axis. Pass a different work axis, sketch line, or two-point axis. Changes the orientation of the solid.
- `startAngle` — start angle in radians. Accepts numbers or `@expr.NAME` strings.
- `endAngle` — end angle in radians. Accepts numbers or `@expr.NAME` strings.
- `inverted` — integer `1` (CW) or `0` (CCW). NOT JS `true`/`false` or string `'TRUE'`/`'FALSE'`.

## Return Value

Returns the **feature ID** (same ID as creation), not VOID. maxLevel=31 on success, 51 on error.

## Behavior

- **Multiple updates per session.** Call `updateRevolve` multiple times within one `openFeature`/`closeFeature` session. Each call is cumulative. Only one `closeFeature` needed at the end.
- **All params in one call.** Set name + references + axisIds + startAngle + endAngle + inverted in a single `updateRevolve` call.
- **Parameters persist.** Omitted parameters keep their current values. Updating only `endAngle` preserves `startAngle` and `inverted`.
- **Expressions work.** `@expr.` syntax works for startAngle and endAngle. But see the auto-recalc caveat below.

## Expression Auto-Recalc Caveat

- **Binding set at creation time** (`part.revolve({ endAngle: '@expr.ANG' })`) creates a live parametric link. Changing the expression value via `updateExpression` auto-recalcs geometry — no open/close or recalc() needed.
- **Binding set via `updateRevolve`** (`updateRevolve({ endAngle: '@expr.ANG' })`) appears to bake in the current value rather than creating a live link. `updateExpression` does NOT auto-recalc the geometry. To get live binding after creation, use `linkWithExpression` instead.

## Gotchas

- **`inverted` is an integer.** Same as `revolve` creation — use `1` or `0`. JS booleans or `'TRUE'`/`'FALSE'` strings produce error 1004.
- **Must pass feature ID.** Passing part ID or sketch ID fails with code 1007: "not a feature or work geometry id".
- **Name update renames the feature only.** Child body nodes retain their original name with `_0` suffix.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "not allowed to update. It's not active and open" | No `openFeature` before update | Call `openFeature({ id: revId })` first |
| 1007 | "not a feature or work geometry id" | Passed part ID or sketch ID | Use the feature ID from `revolve()` result |
| 1004 | "\"id\" must be provided for update" | Accompanies 1200 or 1007 | Fix the primary error |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const rectIds = (await api.v1.sketch.rectangle({
  id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
})).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

const revId = (await api.v1.part.revolve({
  id: partId, references: [regionId], axisIds: [yAxisId]
})).result

// Update endAngle
await api.v1.part.openFeature({ id: revId })
await api.v1.part.updateRevolve({ id: revId, endAngle: Math.PI / 2 })
await api.v1.part.closeFeature({ id: revId })

// Multiple updates in one session
await api.v1.part.openFeature({ id: revId })
await api.v1.part.updateRevolve({ id: revId, startAngle: Math.PI / 4 })
await api.v1.part.updateRevolve({ id: revId, inverted: 1 })
await api.v1.part.closeFeature({ id: revId })

// All params at once
const xAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'XAxis' })).result
await api.v1.part.openFeature({ id: revId })
await api.v1.part.updateRevolve({
  id: revId,
  name: 'Updated',
  axisIds: [xAxisId],
  startAngle: 0,
  endAngle: Math.PI,
  inverted: 0
})
await api.v1.part.closeFeature({ id: revId })
```

## Related

- `part.revolve` — create the feature this updates
- `part.openFeature` / `part.closeFeature` — required gate pattern
- `part.expression` / `part.updateExpression` — drive params with expressions
- `part.linkWithExpression` — create live expression binding after creation
- `sketch.sketchRegion` — create profile references
