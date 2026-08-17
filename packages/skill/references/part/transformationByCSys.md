# part.transformationByCSys

Creates a parametric transformation feature that repositions target features using the matrix between two work coordinate systems. This is the most general parametric transform — it handles translation, rotation, and combined transforms in a single feature.

## Prerequisites

- A part (`part.create`) with at least one feature containing solid geometry
- Two work coordinate systems (`part.workCSys`) — one defining "from" and one defining "to"

## Key Parameters

- `id` — **part ID** (not feature ID)
- `targets` — array of feature IDs to transform. Accepts flat IDs `[featureId]` or object format `[{ id: featureId, indices: [0] }]`
- `references` — **exactly 2** WCS IDs: `[toWCS, fromWCS]`. Index 0 = "to", index 1 = "from". The transform computes the matrix from the "from" WCS to the "to" WCS and applies it to the targets.
- `name` — feature name (default `"TransformationByCSys"`)

## Return Value

Feature ID (numeric) on success, maxLevel=31.

## How It Works

The transformation is the matrix that maps the "from" coordinate system to the "to" coordinate system. If both WCS are at the origin with no rotation, the transform is identity (no movement). To translate, give the WCS different offsets. To rotate, give them different rotations. To do both, use both.

**Reference order matters:** `references: [wcsTo, wcsFrom]` moves geometry from wcsFrom-space to wcsTo-space. Swap them to reverse the direction.

## Gotchas

- **Exactly 2 references required.** Fewer or more gives error code 1002.
- **Empty targets array** gives a confusing error (code 1004: "type '0' is not supported") instead of a clear message.
- **`updateTransformationByCSys` requires `openFeature`/`closeFeature`.** Without it: error code 1200 "feature is not allowed to update. It's not active and open."
- **All WCS references must exist BEFORE the transform feature in the tree.** If you create a new WCS after `openFeature`, it won't be recognized as a valid reference for the update (error code 1001: wrong type). Create all WCS references first, then create the transform.
- **This is a MOVE, not a copy.** Target features physically relocate. Non-targeted features stay put.
- **Multiple targets move together** as a group, maintaining relative positions.
- Both WCS types work: `CUSTOM` (offset/rotation) and `XYAXISORIGIN` (work point references).

## Common Errors

| Code | Message | Cause |
|---|---|---|
| 1002 | "references has invalid number of elements! There should be 2" | Passed fewer or more than 2 WCS IDs |
| 1004 | "type '0' is not supported in PrepareAPIParams" | Empty targets array |
| 1200 | "feature is not allowed to update. It's not active and open" | Called `updateTransformationByCSys` without `openFeature` |
| 1001 | "element of 'references' has the wrong type" | WCS created after `openFeature` — not visible in rolled-back tree |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'TransformDemo' })).result

const boxId = (await api.v1.part.box({
  id: partId, name: 'Box1',
  length: 40, width: 30, height: 20,
})).result

const wcsFrom = (await api.v1.part.workCSys({
  id: partId, name: 'WCS_From',
  offset: [0, 0, 0],
})).result

const wcsTo = (await api.v1.part.workCSys({
  id: partId, name: 'WCS_To',
  offset: [60, 40, 30],
  rotation: [0, 0, Math.PI / 4],
})).result

const tId = (await api.v1.part.transformationByCSys({
  id: partId,
  name: 'MoveAndRotate',
  targets: [boxId],
  references: [wcsTo, wcsFrom],
})).result

// Update: change to a different WCS (must already exist in tree)
await api.v1.part.openFeature({ id: tId })
await api.v1.part.updateTransformationByCSys({
  id: tId,
  references: [anotherWcsTo, wcsFrom],
})
await api.v1.part.closeFeature({ id: tId })
```

## Related

- `part.updateTransformationByCSys` — modify after creation (requires openFeature/closeFeature)
- `part.workCSys` — create the coordinate systems this consumes
- `part.translation` — simpler: move along a direction by a distance
- `part.rotation` — simpler: rotate around an axis by an angle
