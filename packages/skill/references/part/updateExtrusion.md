# part.updateExtrusion

Modifies an extrusion feature. Must be wrapped in `openFeature` / `closeFeature`. Omitted parameters keep their current values.

```js
await api.v1.part.openFeature({ id: extId })
await api.v1.part.updateExtrusion({ id: extId, limit2: 100 })
await api.v1.part.closeFeature({ id: extId })
```

## Key Parameters

- `id` — **feature ID** from `part.extrusion`, NOT the part ID
- `name` — renames the feature node; child bodies keep their original name (`OriginalName_0`)
- `references` — swap the profile (region or contour element IDs), e.g. rectangle → circle = box → cylinder. Multiple regions → multiple bodies from one feature
- `type` — `'UP'`, `'DOWN'`, `'SYMMETRIC'`, `'CUSTOM'`
- `limit2` — distance; numbers or `'@expr.H'`; negative reverses direction
- `limit1` — start offset (CUSTOM only); creates a gap between sketch plane and extrusion start
- `direction` — **sketch-local** (CUSTOM only): `[0,0,1]` follows the sketch normal, including on Front/Right planes
- `taperAngle` — radians; positive = inward (top smaller), negative = outward; 0 removes taper
- `capEnds` — integer `1` (solid) or `0` (sheet). Strings `'TRUE'`/`'FALSE'` → error 1001

## Return Value

The **feature ID** (same as creation), not VOID. maxLevel 31 on success, 51 on error — errors (e.g. limit2=0) may still return the feature ID, so check maxLevel.

## Behavior

- Multiple `updateExtrusion` calls in one open/close session are cumulative; one `closeFeature` at the end. All params can also go in one call.
- **Parameters persist**: switching CUSTOM→UP→CUSTOM restores the previous `direction` and `limit1` without re-specifying them.
- `@expr.` works for limit1, limit2, taperAngle, direction. Once bound, changing the value via `updateExpression` auto-recalcs — no open/close needed.

## Gotchas

- **Taper + non-normal CUSTOM direction fails** ("Extrudedirection with taper angle is not normal to curves"). Taper requires direction perpendicular to the sketch plane; set taperAngle 0 for angled directions.
- **limit2=0 → degenerate feature** (feature ID, maxLevel 51, error 1122). Recoverable — a later valid update restores it.
- **Sheet bodies (capEnds=0) are not solids** — consumers that only handle solid bodies show nothing.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "not allowed to update. It's not active and open" | No `openFeature` | Call `openFeature({ id: extId })` first |
| 1007 | "not a feature or work geometry id" | Part ID instead of feature ID | Use the ID from `extrusion()` |
| 1001 | "capEnds has the wrong type" | String `'TRUE'`/`'FALSE'` | Use `1` or `0` |
| 1122 | "Height not valid. Value for height must be greater than 0" | limit2=0 | Use positive or negative limit2 |
| 0 | "Extrudedirection with taper angle is not normal to curves" | Taper + non-normal custom direction | Taper 0 or normal direction |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
const extId = (await api.v1.part.extrusion({ id: partId, references: [regionId], type: 'UP', limit2: 30 })).result
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 80 }] })

await api.v1.part.openFeature({ id: extId })
await api.v1.part.updateExtrusion({ id: extId, limit2: 100 })
await api.v1.part.updateExtrusion({ id: extId, type: 'SYMMETRIC', taperAngle: 0.1 })
await api.v1.part.updateExtrusion({ id: extId, limit2: '@expr.H', taperAngle: 0 })
await api.v1.part.closeFeature({ id: extId })
```

## Related

`part.extrusion` · `part.openFeature` / `part.closeFeature` · `part.expression` / `part.updateExpression` · `sketch.sketchRegion`
