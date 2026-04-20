# part.linearPattern

Creates a linear pattern feature that repeats one or more target features along one or two directions, producing evenly spaced copies.

## Prerequisites

- A part (`part.create`) with at least one feature containing solid geometry
- A direction reference: work axis, brep edge, or two work points

## Key Parameters

- `id` — **part ID** (not feature ID)
- `targets` — array of feature IDs to pattern. Accepts two formats:
  - Flat IDs: `[featureId1, featureId2]` — patterns all features together
  - Object format: `[{ id: featureId, indices: [0, 1] }]` — `indices` selects specific solids when a feature has multiple
- `dir1` — **required** first direction object:
  - `references` — array containing a work axis ID, brep edge ID, OR two work point IDs `[wp1, wp2]` (defines direction from wp1 to wp2)
  - `distance` — spacing between instances (number or `@expr.NAME` string)
  - `count` — **total number of instances including the original** (number or `@expr.NAME`). count=4 → 1 original + 3 copies. Minimum 1. Default 2.
  - `inverted` — `1` to reverse direction along reference, `0` for default (numeric, not boolean)
  - `merged` — `1` to boolean-union all copies into a single body, `0` for separate bodies (default)
- `dir2` — optional second direction (same sub-params as dir1 except `count` defaults to 1). Creates a 2D grid: total = dir1.count × dir2.count.
- `name` — feature name (default `"LinearPattern"`)

## Return Value

Feature ID (numeric) on success, maxLevel=31 (info). Returns null on failure (maxLevel=51).

## Gotchas

- **`count` includes the original.** count=4 means 4 total bodies, not 4 copies. count=1 creates the feature but adds no copies.
- **count=0 errors** with a misleading message (code 1004: "id must be provided"). Minimum count is 1.
- **`inverted` and `merged` use numeric 0/1**, not JS booleans or `'TRUE'`/`'FALSE'` strings.
- **`merged: 1` performs a boolean union.** All pattern copies (including the original) become a single continuous body. Only useful when copies overlap — non-overlapping merged copies look the same as non-merged.
- **Two work points define a custom direction** without needing a work axis. `references: [wp1, wp2]` uses the vector from wp1→wp2.
- **Brep edges work as direction references.** Use `getGeometryIds` to get edge IDs from existing geometry.
- **Multiple targets are patterned together**, maintaining their relative positions. A box and cylinder in `targets` produce matching box+cylinder groups at each position.

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1004 | "id must be provided to create CC_LinearPattern" | count=0 or internal param issue | Use count ≥ 1 |
| 1004 | '"targets" must be provided in the api call!' | Missing targets | Pass `targets: [featureId]` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'PatternDemo' })).result

const boxId = (await api.v1.part.box({
  id: partId, name: 'Box1',
  length: 20, width: 15, height: 25,
})).result

const waX = (await api.v1.part.workAxis({
  id: partId, name: 'AxisX',
  origin: [0, 0, 0], direction: [1, 0, 0],
})).result

// 1D pattern: 4 boxes along X, 40mm apart
const lpId = (await api.v1.part.linearPattern({
  id: partId,
  name: 'LP1',
  targets: [boxId],
  dir1: { references: [waX], distance: 40, count: 4 },
})).result

// 2D grid: add Y direction
const waY = (await api.v1.part.workAxis({
  id: partId, name: 'AxisY',
  origin: [0, 0, 0], direction: [0, 1, 0],
})).result

const gridId = (await api.v1.part.linearPattern({
  id: partId,
  name: 'Grid',
  targets: [boxId],
  dir1: { references: [waX], distance: 30, count: 4 },
  dir2: { references: [waY], distance: 30, count: 3 },
})).result
// → 4×3 = 12 total bodies

// Expression-driven spacing
await api.v1.part.expression({
  id: partId,
  toCreate: [{ name: 'spacing', value: 35 }],
})
const exprLp = (await api.v1.part.linearPattern({
  id: partId,
  name: 'ExprLP',
  targets: [boxId],
  dir1: { references: [waX], distance: '@expr.spacing', count: 5 },
})).result
```

## Related

- `part.updateLinearPattern` — modify after creation (requires openFeature/closeFeature)
- `part.circularPattern` — circular copies around an axis
- `part.mirror` — reflection across a plane
- `part.workAxis` — create direction references
- `part.getGeometryIds` — get brep edge IDs for direction references
