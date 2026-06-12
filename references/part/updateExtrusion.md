# part.updateExtrusion

Modifies an existing parametric extrusion feature. Requires the `openFeature`/`closeFeature` gate. Any parameter not provided keeps its current value.

## Prerequisites

- An extrusion feature created with `part.extrusion`
- The feature ID (not the part ID)
- `openFeature` called on the feature before updating

## The Pattern

```js
await api.v1.part.openFeature({ id: extId })
await api.v1.part.updateExtrusion({ id: extId, limit2: 100 })
await api.v1.part.closeFeature({ id: extId })
```

## Key Parameters

- `id` — **feature ID** (from `part.extrusion` result). NOT the part ID.
- `name` — renames the feature node in the tree. Child body nodes keep their original name (e.g., `OriginalName_0`).
- `references` — swap the profile. Pass different sketch region IDs or contour element IDs. Multiple regions create multiple bodies from one feature.
- `type` — change extrusion direction mode: `'UP'`, `'DOWN'`, `'SYMMETRIC'`, `'CUSTOM'`.
- `limit2` — extrusion distance. Accepts numbers or expressions (`'@expr.H'`). Negative values reverse direction.
- `limit1` — start offset (CUSTOM type only). Creates a gap between the sketch plane and the extrusion start.
- `direction` — `[x, y, z]` vector (CUSTOM type only). Only needed when first switching to CUSTOM — the feature remembers the previous direction across type transitions.
- `taperAngle` — radians. Positive = inward (top smaller), negative = outward. Set to 0 to remove taper.
- `capEnds` — integer `1` (solid) or `0` (sheet). NOT string `'TRUE'`/`'FALSE'` — that gives error 1001.

## Return Value

Returns the **feature ID** (same ID as creation), not VOID. maxLevel=31 on success, 51 on error.

On error, may still return the feature ID (e.g., limit2=0) — check maxLevel, not just result.

## Behavior

- **Multiple updates per session.** You can call `updateExtrusion` multiple times within one `openFeature`/`closeFeature` session. Each call is cumulative. Only one `closeFeature` needed at the end.
- **All params in one call.** You can set type + direction + limit2 + taperAngle etc. in a single `updateExtrusion` call.
- **Parameters persist.** Omitted parameters keep their current values. Switching CUSTOM→UP→CUSTOM restores the previous direction and limit1 without re-specifying them.
- **Expressions work.** `@expr.` syntax works for limit1, limit2, taperAngle, direction. Once bound, changing the expression value via `updateExpression` auto-recalcs — no open/close needed.
- **Profile swap.** Changing `references` to a different region completely changes the extrusion shape (e.g., rectangle → circle = box → cylinder). Passing multiple regions creates multiple bodies from one feature.

## Gotchas

- **Taper + non-normal custom direction fails.** Error: "Extrudedirection with taper angle is not normal to curves". Taper only works when the direction is perpendicular to the sketch plane. For CUSTOM directions at an angle to the sketch, set taperAngle to 0.
- **limit2=0 creates a degenerate feature.** Returns feature ID with maxLevel=51, error 1122. The feature is recoverable — a subsequent valid update restores it.
- **capEnds must be integer.** `'TRUE'`/`'FALSE'` strings fail with error 1001. Use `1` or `0`.
- **Sheet bodies don't render as solids.** With capEnds=0 the result is a sheet body, not a solid — renderers/consumers that only handle solid bodies will show nothing.
- **Name update renames the feature only.** Child body nodes retain their original name with `_0` suffix.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "not allowed to update. It's not active and open" | No `openFeature` before update | Call `openFeature({ id: extId })` first |
| 1007 | "not a feature or work geometry id" | Passed part ID instead of feature ID | Use the feature ID from `extrusion()` result |
| 1001 | "capEnds has the wrong type" | String `'TRUE'`/`'FALSE'` | Use integer `1` or `0` |
| 1122 | "Height not valid. Value for height must be greater than 0" | limit2=0 | Use positive or negative limit2 |
| 0 | "Extrudedirection with taper angle is not normal to curves" | Taper + non-normal custom direction | Remove taper (set to 0) or use normal direction |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const rectIds = (await api.v1.sketch.rectangle({
  id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0]
})).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

const extId = (await api.v1.part.extrusion({
  id: partId, references: [regionId], type: 'UP', limit2: 30,
})).result

// Update limit2
await api.v1.part.openFeature({ id: extId })
await api.v1.part.updateExtrusion({ id: extId, limit2: 100 })
await api.v1.part.closeFeature({ id: extId })

// Change type to SYMMETRIC with taper
await api.v1.part.openFeature({ id: extId })
await api.v1.part.updateExtrusion({
  id: extId, type: 'SYMMETRIC', taperAngle: 0.1,
})
await api.v1.part.closeFeature({ id: extId })

// Expression-driven update
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 80 }] })
await api.v1.part.openFeature({ id: extId })
await api.v1.part.updateExtrusion({ id: extId, limit2: '@expr.H', taperAngle: 0 })
await api.v1.part.closeFeature({ id: extId })
```

## Related

- `part.extrusion` — create the feature this updates
- `part.openFeature` / `part.closeFeature` — required gate pattern
- `part.expression` / `part.updateExpression` — drive params with expressions
- `sketch.sketchRegion` — create profile references
