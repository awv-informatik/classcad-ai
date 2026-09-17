# part.linearPattern

Creates a linear pattern feature that repeats target features along one or two directions as evenly spaced copies.

## Key Parameters

- `id` — **part ID** (not feature ID)
- `targets` — feature IDs: flat `[featureId1, featureId2]` (patterned together, keeping relative positions — a box + cylinder yield box+cylinder groups) or `[{ id: featureId, indices: [0, 1] }]` (`indices` selects solids of a multi-solid feature)
- `dir1` — **required** direction object:
  - `references` — work axis ID, brep edge ID (from `getGeometryIds`), OR two work point IDs `[wp1, wp2]` (direction wp1→wp2, no work axis needed)
  - `distance` — spacing (number or `@expr.NAME`)
  - `count` — **total instances including the original** (number or `@expr.NAME`). count=4 → 1 original + 3 copies. Minimum 1 (count=1: feature, no copies). Default 2.
  - `inverted` — `1` reverses direction, `0` default
  - `merged` — `1` boolean-unions all copies (incl. original) into one body, `0` separate bodies (default). Only matters when copies overlap — non-overlapping merged copies look the same.
- `dir2` — optional second direction (same sub-params; `count` defaults to 1). Grid total = dir1.count × dir2.count.
- `name` — default `"LinearPattern"`

`inverted`/`merged` are numeric 0/1, not JS booleans or `'TRUE'`/`'FALSE'`.

## Return Value

Feature ID (numeric), maxLevel=31. null on failure (maxLevel=51).

## Gotchas

- **The pattern consumes its targets** — pattern a fresh body for each new pattern.
- **count=0 errors with a misleading message** (code 1004 "id must be provided"). Minimum count is 1.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1004 | "id must be provided to create CC_LinearPattern" | count=0 or internal param issue | Use count ≥ 1 |
| 1004 | '"targets" must be provided in the api call!' | Missing targets | Pass `targets: [featureId]` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'PatternDemo' })).result
const waX = (await api.v1.part.workAxis({ id: partId, name: 'AxisX', position: [0, 0, 0], direction: [1, 0, 0] })).result
const waY = (await api.v1.part.workAxis({ id: partId, name: 'AxisY', position: [0, 0, 0], direction: [0, 1, 0] })).result

// 1D: 4 boxes along X, 40mm apart
const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 20, width: 15, height: 25 })).result
const lpId = (await api.v1.part.linearPattern({
  id: partId, name: 'LP1', targets: [boxId],
  dir1: { references: [waX], distance: 40, count: 4 },
})).result

// 2D grid with expression spacing: 4×3 = 12 bodies (fresh body — targets are consumed)
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'spacing', value: 35 }] })
const box2 = (await api.v1.part.box({ id: partId, name: 'Box2', length: 20, width: 15, height: 25 })).result
const gridId = (await api.v1.part.linearPattern({
  id: partId, name: 'Grid', targets: [box2],
  dir1: { references: [waX], distance: '@expr.spacing', count: 4 },
  dir2: { references: [waY], distance: 30, count: 3 },
})).result
```

## Related

`part.updateLinearPattern` · `part.circularPattern` · `part.mirror` · `part.workAxis` · `part.getGeometryIds`
