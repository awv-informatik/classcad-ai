# part.workAxis

Creates a work axis feature — an invisible construction line used as a revolve axis, pattern direction, or positioning reference.

## Key Parameters

- **`id`** (required) — part ID
- **`name`** — default `"WorkAxis"`. Duplicates are silently allowed (no error/warning), but `getWorkGeometry` returns only the first match — use unique names.
- **`type`** — default `"USERDEFINED"`:

| Type | References needed | Description |
|------|------------------|-------------|
| `USERDEFINED` | none | Free-standing axis from `position` and `direction` |
| `POINTDIRECTION` | 1 point + 1 direction | Point (brep-vertex, sketch-point, work-point) + direction (brep-edge, sketch-line, work-axis). Flexible — also accepted two edges without error. |
| `CURVE` | 1 edge | Axis follows the edge. Only accepts sketch-arc, sketch-circle, edge-arc, edge-circle, edge-line. **Rejects work axis IDs** despite the docs saying "brep-edge, sketch-line or work-axis". |
| `2POINTS` | 2 points | brep-vertex, sketch-point, work-point. Same point twice → error. |
| `2PLANES` | 2 planes | brep-face, work-plane — axis at their intersection. Parallel planes → error. |

- **`references`** — brep or work geometry IDs (from `part.getGeometryIds` or work geometry); mixed brep + work refs are valid. Not needed for USERDEFINED.
- **`position`** — `[x,y,z]`, USERDEFINED only. Default `[0,0,0]`. The key is `position` — `origin` is ignored without a message, leaving the axis at `[0,0,0]`.
- **`direction`** — `[x,y,z]`, USERDEFINED only. Default `[1,0,0]`. Need not be normalized. **Zero vector `[0,0,0]` is silently accepted** — degenerate axis, no error or warning.
- **Expressions:** pass the whole vector as one string — `position: '[@expr.X, 0, 0]'`, `direction: '[0, @expr.Y, 0]'` (live: the axis follows `updateExpression`). `position: ['@expr.X', 0, 0]` fails with a type error.

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Feature ID. Use as: `axisIds` element in `part.revolve`; `dir1/dir2.references` in `part.linearPattern`; `references` in `part.translation`; reference for other work geometry.

## Built-in Work Axes

Every part has `XAxis` `[1,0,0]`, `YAxis` `[0,1,0]`, `ZAxis` `[0,0,1]` — get via `getWorkGeometry({ id: partId, name: 'XAxis' })`. Use them instead of custom axes when standard directions suffice.

## Gotchas

- **`updateWorkAxis` requires openFeature/closeFeature** — otherwise every update fails with "not active and open".

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `"id" must be provided` | Missing part ID | Pass `id: partId` |
| `"type" is not valid` | Typo in type string | Use exact string: USERDEFINED, POINTDIRECTION, CURVE, 2POINTS, 2PLANES |
| `"references" must be provided` | Non-USERDEFINED type without refs | Pass `references: [...]` |
| `"references" has invalid number of elements` | Wrong count for type | 2PLANES needs 2, CURVE needs 1, etc. |
| `"references" has a wrong id type` | Wrong geometry type for CURVE | Use edge-line, edge-arc, edge-circle, sketch-arc, sketch-circle only |
| `"Direction cant be a null vector"` | 2POINTS with same point twice | Use two distinct points |
| `"planes mustn't be parallel"` | 2PLANES with parallel planes | Use non-parallel planes |
| `"not active and open"` | updateWorkAxis without openFeature | Wrap in openFeature/closeFeature |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// USERDEFINED
const waId = (await api.v1.part.workAxis({ id: partId, name: 'PatternDir', position: [0, 0, 0], direction: [1, 0, 0] })).result

// Built-in axis (no creation needed)
const yAxis = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

// 2PLANES: intersection of top and front faces of an 80×60×40 box
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
const gids = await api.v1.part.getGeometryIds({
  id: partId,
  planes: [{ positions: [[40, 30, 40]] }, { positions: [[40, 0, 20]] }], // top, front
})
const wa2 = (await api.v1.part.workAxis({
  id: partId, name: 'WA_intersection', type: '2PLANES',
  references: [gids.result.planes[0], gids.result.planes[1]],
})).result
```

## Related

`part.updateWorkAxis` · `part.getWorkGeometry` · `part.revolve` · `part.linearPattern` · `part.workPlane`
