# part.transformationByCSys

Creates a parametric transformation feature that **moves** target features (not a copy) by the matrix between two work coordinate systems — translation, rotation, or both in one feature.

## Key Parameters

- `id` — **part ID** (not feature ID)
- `targets` — flat `[featureId]` or `[{ id: featureId, indices: [0] }]`. Multiple targets move together; non-targeted features stay put.
- `references` — **exactly 2** WCS IDs `[toWCS, fromWCS]` (index 0 = "to", 1 = "from"). Geometry moves from from-space to to-space; swap to reverse. Both WCS types work: `CUSTOM` (offset/rotation) and `XYAXISORIGIN` (work point references).
- `name` — default `"TransformationByCSys"`

Two identical WCS (e.g. both at origin, unrotated) = identity, no movement. Different offsets translate, different rotations rotate.

## Return Value

Feature ID (numeric), maxLevel=31.

## Gotchas

- **Empty targets** gives a confusing error (1004 "type '0' is not supported") instead of a clear message.
- **`updateTransformationByCSys` requires `openFeature`/`closeFeature`** (else 1200).
- **All WCS references must exist BEFORE the transform feature in the tree.** A WCS created after `openFeature` is not recognized for the update (1001 wrong type). Create all WCS first, then the transform.

## Common Errors

| Code | Message | Cause |
|---|---|---|
| 1002 | "references has invalid number of elements! There should be 2" | Fewer or more than 2 WCS IDs |
| 1004 | "type '0' is not supported in PrepareAPIParams" | Empty targets array |
| 1200 | "feature is not allowed to update. It's not active and open" | `updateTransformationByCSys` without `openFeature` |
| 1001 | "element of 'references' has the wrong type" | WCS created after `openFeature` — not visible in rolled-back tree |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'TransformDemo' })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 40, width: 30, height: 20 })).result
const wcsFrom = (await api.v1.part.workCSys({ id: partId, name: 'WCS_From', offset: [0, 0, 0] })).result
const wcsTo = (await api.v1.part.workCSys({
  id: partId, name: 'WCS_To', offset: [60, 40, 30], rotation: [0, 0, Math.PI / 4],
})).result

const tId = (await api.v1.part.transformationByCSys({
  id: partId, name: 'MoveAndRotate', targets: [boxId], references: [wcsTo, wcsFrom],
})).result
```

## Related

`part.updateTransformationByCSys` · `part.workCSys` · `part.translation` · `part.rotation`
