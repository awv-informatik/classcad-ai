# drawing2d.centerView

Translates views so each view's bounding box center sits at the origin [0,0,0]. Does not change view dimensions — only position.

## Prerequisites

- A part or assembly with views already created via `drawing2d.view`
- Calling without views: error 1200

## Key Parameters

- `id` — part or assembly ID (same as used for `view()`)
- `types` — optional array of view type strings (`'TOP'`, `'FRONT'`, `'RIGHT'`, etc.). If omitted or empty, all existing views are centered.

## Return Value

Always `null` (VOID). maxLevel=31 on success.

## Behavior

Each specified view is translated so that the midpoint of its `getBoundaryBoxFromView` min/max sits at [0,0,0]. The bbox dimensions (width × height) are unchanged.

Example: a TOP view with bbox [0,0]–[80,60] (center at [40,30]) becomes [-40,-30]–[40,30] (center at [0,0]).

Centering is per-view — if you center only `['TOP']`, other views keep their current positions.

## Interaction with placeView

`centerView` and `placeView` modify the same position state. Re-centering after a `placeView` call resets the view position back to origin, undoing the placement offset.

**Recommended workflow:** `view()` → `centerView()` → `placeView()` with layout offsets → export. Center first to normalize positions, then arrange the drawing layout with relative offsets.

## Edge Cases

- **Empty `types: []`**: silent no-op, maxLevel=31
- **Type not created** (e.g., `'RIGHT'` when only TOP/FRONT exist): silent no-op, no error
- **Invalid type string**: error 1013 — same as `view()`
- **Duplicate types**: silent no-op (centers the view once)
- **No views created**: error 1200 — "There are no views exisiting on product"

## Common Errors

| Code | Level | Cause |
|---|---|---|
| 1200 | 51 (ERROR) | No views exist — call `view()` first |
| 1013 | 51 (ERROR) | Invalid type string in `types` array |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

// Create views
await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })

// Center all views to origin
await api.v1.drawing2d.centerView({ id: partId })

// Arrange in standard drawing layout
await api.v1.drawing2d.placeView({
  id: partId,
  placements: [
    { type: 'TOP', offset: [0, 120, 0] },
    { type: 'FRONT', offset: [0, 0, 0] },
    { type: 'RIGHT', offset: [150, 0, 0] },
    { type: 'ISO', offset: [300, 120, 0] },
  ],
})
```

## Related

- `drawing2d.view` — create views (must be called first)
- `drawing2d.placeView` — reposition views with relative offsets (use after centering)
- `drawing2d.getBoundaryBoxFromView` — get min/max bounds to verify centering
- `drawing2d.exportSVG` / `drawing2d.exportDXF` — export the final layout
