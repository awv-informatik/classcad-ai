# drawing2d.getBoundaryBoxFromView

Returns the min/max bounding box of each requested 2D view — for measuring extents, verifying centering/placement, or computing layout offsets. Needs views from `drawing2d.view` (none → 1200).

## Key Parameters

- `id` — part or assembly ID (as used for `view()`)
- `types` — `'TOP'`, `'FRONT'`, `'RIGHT'`, `'LEFT'`, `'BOTTOM'`, `'RIGHT_90'`, `'LEFT_90'`, `'BACK'`, `'ISO'`. **Effectively required** — omitting it errors (maxLevel 51).

## Return Value

`Array<{ min: { x, y, z }, max: { x, y, z } }>`, **in input `types` order** (unlike `view()`). z is always 0. Bboxes reflect the current position: after `centerView` they are symmetric about the origin, after `placeView` the offset is added to min and max.

## Gotchas

- **`types: []` returns `[]`, NOT all views** — the docs ("if empty, boundary boxes of all existing views will be returned") are wrong. Pass types explicitly.
- **Non-existent types are silently skipped** — `['TOP', 'RIGHT']` with only TOP returns 1 bbox, maxLevel 31; all missing → `[]`.
- **One invalid type string fails the whole call** (1013), no partial results — unlike `placeView`, where valid placements still execute.
- **min/max are `{ x, y, z }` objects**, not arrays like most point parameters.
- **Float noise:** RIGHT/LEFT min values like `4.9e-15` instead of 0 — treat < 1e-10 as zero.
- Duplicate types → duplicate identical entries (no dedup).

## Bbox Dimensions by View Type

80×60×40 box (length×width×height):

| Type | Width × Height | Projection |
|---|---|---|
| TOP / BOTTOM | 80 × 60 | XY (length × width) |
| FRONT / BACK | 80 × 40 | XZ (length × height) |
| RIGHT / LEFT | 60 × 40 | YZ (width × height) |
| RIGHT_90 / LEFT_90 | 40 × 60 | rotated YZ (height × width) |
| ISO | ~99 × ~90 | diagonal (larger) |

## Common Errors

| Code | Level | Cause |
|---|---|---|
| 1200 | 51 | No views — call `view()` first |
| 1013 | 51 | Invalid type string |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })
await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT'] })

const bboxes = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT', 'RIGHT'] })).result
// [0] TOP   { min: { x: 0, y: 0, z: 0 }, max: { x: 80, y: 60, z: 0 } }
// [1] FRONT { min: { x: 0, y: 0, z: 0 }, max: { x: 80, y: 40, z: 0 } }
// [2] RIGHT { min: { x: 0, y: 0, z: 0 }, max: { x: 60, y: 40, z: 0 } }
const topWidth = bboxes[0].max.x - bboxes[0].min.x   // 80
```

## Related

`drawing2d.view` · `drawing2d.centerView` · `drawing2d.placeView` · `drawing2d.exportSVG` / `drawing2d.exportDXF`
