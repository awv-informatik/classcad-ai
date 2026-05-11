# drawing2d.getBoundaryBoxFromView

Returns the min/max bounding box for each requested 2D view. Use this to measure view extents, verify centering, or compute layout offsets before placing views.

## Prerequisites

- A part or assembly with views already created via `drawing2d.view`
- Without views: error 1200

## Key Parameters

- `id` — part or assembly ID (same as used for `view()`)
- `types` — array of view type strings: `'TOP'`, `'FRONT'`, `'RIGHT'`, `'LEFT'`, `'BOTTOM'`, `'RIGHT_90'`, `'LEFT_90'`, `'BACK'`, `'ISO'`. **Required** — omitting causes error.

## Return Value

`Array<{ min: { x, y, z }, max: { x, y, z } }>` — one entry per existing view in the requested types. z is always 0.

**Result order matches the input `types` array order.** This is different from `view()`, which does not guarantee order.

Non-existent view types are silently skipped — the result array only includes bboxes for views that actually exist. If all requested types are non-existent, result is `[]`.

## Gotchas

- **Empty `types: []` returns `[]`, NOT all existing views.** The docs say "if empty, boundary boxes of all existing views will be returned" — this is wrong. An empty array returns an empty array. Always pass the types you want explicitly.
- **Omitting `types` entirely causes an error** (maxLevel=51). The parameter is effectively required.
- **Invalid type string fails the entire call** (error 1013). Unlike `placeView` where valid placements still execute, one bad type here poisons the whole request — no partial results.
- **Non-existent types are silently skipped** — no error, no warning. `['TOP', 'RIGHT']` when only TOP exists returns 1 bbox (TOP only), maxLevel=31.
- **min/max are `{ x, y, z }` objects**, not `[x, y, z]` arrays. This differs from most ClassCAD point parameters which use arrays.
- **Float noise**: RIGHT/LEFT views may have min values like `4.9e-15` instead of exact 0. Treat values < 1e-10 as zero.

## Bbox Dimensions by View Type

For an 80×60×40 box (length×width×height):

| Type | Width × Height | Projection |
|---|---|---|
| TOP / BOTTOM | 80 × 60 | XY (length × width) |
| FRONT / BACK | 80 × 40 | XZ (length × height) |
| RIGHT / LEFT | 60 × 40 | YZ (width × height) |
| RIGHT_90 / LEFT_90 | 40 × 60 | rotated YZ (height × width) |
| ISO | ~99 × ~90 | diagonal projection (larger) |

## Interaction with centerView and placeView

Bboxes reflect the **current view position**. After `centerView`, min/max shift symmetrically around origin (dimensions unchanged). After `placeView`, the offset is added to both min and max. This makes `getBoundaryBoxFromView` the correct tool for verifying layout state.

## Duplicate Types

Duplicate types in the array are allowed and produce duplicate entries with identical values. No deduplication.

## Common Errors

| Code | Level | Cause |
|---|---|---|
| 1200 | 51 (ERROR) | No views exist — call `view()` first |
| 1013 | 51 (ERROR) | Invalid type string in `types` array |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })
await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT'] })

const bboxes = (await api.v1.drawing2d.getBoundaryBoxFromView({
  id: partId,
  types: ['TOP', 'FRONT', 'RIGHT']
})).result
// bboxes[0] = { min: { x: 0, y: 0, z: 0 }, max: { x: 80, y: 60, z: 0 } }  — TOP
// bboxes[1] = { min: { x: 0, y: 0, z: 0 }, max: { x: 80, y: 40, z: 0 } }  — FRONT
// bboxes[2] = { min: { x: 0, y: 0, z: 0 }, max: { x: 60, y: 40, z: 0 } }  — RIGHT

// Compute view width/height for layout
const topWidth = bboxes[0].max.x - bboxes[0].min.x   // 80
const topHeight = bboxes[0].max.y - bboxes[0].min.y   // 60
```

## Related

- `drawing2d.view` — create views (must be called first)
- `drawing2d.centerView` — center views to origin
- `drawing2d.placeView` — reposition views with offsets
- `drawing2d.exportSVG` / `drawing2d.exportDXF` — export the final layout
