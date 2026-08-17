# drawing2d.placeView

Moves views by relative offset vectors. Each call translates the specified views from their current position — offsets accumulate across repeated calls.

## Prerequisites

- A part or assembly with views already created via `drawing2d.view`
- Without views: error 1200

## Key Parameters

- `id` — part or assembly ID (same as used for `view()`)
- `placements` — array of `{ type, offset }` objects:
  - `type` — view type string: `'TOP'`, `'FRONT'`, `'RIGHT'`, `'LEFT'`, `'BOTTOM'`, `'RIGHT_90'`, `'LEFT_90'`, `'BACK'`, `'ISO'`
  - `offset` — `[x, y, z]` point. Relative translation from current position. Z is technically accepted but pointless for 2D drawing layout.

## Return Value

Always `null` (VOID). maxLevel=31 on success.

## Behavior

Offsets are **cumulative/relative**. Each call adds to the view's current position, not the original position. Two calls with `[50, 0, 0]` move the view by X+100 total.

If the same type appears multiple times in one `placements` array, both offsets are applied sequentially (they stack). Placing `FRONT` with `[10,0,0]` and `[20,0,0]` in one call moves it X+30.

## Interaction with centerView

`centerView` resets views to origin-centered positions, completely undoing any prior `placeView` offsets.

**Recommended workflow:** `view()` → `centerView()` → `placeView()` → `exportSVG()`/`exportDXF()`. Center first to normalize, then arrange with relative offsets.

## Edge Cases

- **Empty `placements: []`**: silent no-op, maxLevel=31
- **Nonexistent view type** (e.g., `'RIGHT'` when only TOP/FRONT exist): error level 51, code 0, message "View of type: N = XX, does not exist in ViewSet!" — but **other valid placements in the same call still execute**
- **Invalid type string**: error 1013 (same as `view()` and `centerView()`)
- **Zero offset `[0,0,0]`**: accepted, no-op for that view
- **No views on product**: error 1200 — "There are no views exisiting on product"

## Common Errors

| Code | Level | Cause |
|---|---|---|
| 1200 | 51 (ERROR) | No views exist — call `view()` first |
| 1013 | 51 (ERROR) | Invalid type string in placements |
| 0 | 51 (ERROR) | Valid type but that view wasn't created |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

// Create and center views
await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })
await api.v1.drawing2d.centerView({ id: partId })

// Arrange in standard drawing layout
await api.v1.drawing2d.placeView({
  id: partId,
  placements: [
    { type: 'TOP', offset: [0, 80, 0] },
    { type: 'FRONT', offset: [0, 0, 0] },
    { type: 'RIGHT', offset: [120, 0, 0] },
    { type: 'ISO', offset: [250, 80, 0] },
  ],
})
```

## Related

- `drawing2d.view` — create views (must be called first)
- `drawing2d.centerView` — center views to origin (use before placeView to normalize)
- `drawing2d.getBoundaryBoxFromView` — get min/max bounds to verify placement
- `drawing2d.exportSVG` / `drawing2d.exportDXF` — export the final layout
