# drawing2d.view

Creates 2D projections of a product's 3D solids into the XY-plane. Views are data structures stored in the tree for DXF/SVG export — they do not change the 3D rendering.

## Prerequisites

- A part (`part.create`) or assembly (`assembly.create`) with at least one brep solid
- Without geometry: views are created but projection fails (error level 51)

## Key Parameters

- `id` — part ID or assembly ID. Instance IDs are rejected (error 1001: "Provide only following id types: ['part/assembly']").
- `types` — array of view type strings. All 9 standard views are supported:
  - `'TOP'`, `'FRONT'`, `'RIGHT'`, `'LEFT'`, `'BOTTOM'`, `'RIGHT_90'`, `'LEFT_90'`, `'BACK'`, `'ISO'`
- `color` — AutoCAD color index (0–256). Only affects DXF/SVG export. Default 0. Out-of-range values silently accepted.
- `layer` — string layer name for DXF export. Default `"0"`.

## Return Value

Always returns `Array<id>` — even for a single type, the result is a one-element array (e.g., `[120]`).

**Result order does NOT reliably match the input `types` array order.** To identify which ID corresponds to which view type, look up the `CC_View2D` node in the structure tree and check its `name` property or `viewType` member.

## Critical Gotcha: Each Call Replaces All Views

`view()` is destructive — it destroys all existing views and creates a fresh set. If you need TOP, FRONT, and ISO views, you must request all three in a single call:

```js
// CORRECT — one call with all types
await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'ISO'] })

// WRONG — second call destroys the TOP view from the first
await api.v1.drawing2d.view({ id: partId, types: ['TOP'] })
await api.v1.drawing2d.view({ id: partId, types: ['FRONT', 'ISO'] }) // TOP is gone!
```

## Internal View Names

Views are stored as `CC_View2D` nodes inside a `CC_ViewSet` container. The internal short names (derived from German):

| Type | Name | viewType Code |
|---|---|---|
| TOP | D | 1 |
| FRONT | V | 2 |
| RIGHT | SR | 3 |
| LEFT | SL | 4 |
| BOTTOM | U | 5 |
| RIGHT_90 | SDR | 6 |
| LEFT_90 | SDL | 7 |
| BACK | R | 8 |
| ISO | ISO | 9 |

Duplicate types in the array are allowed — the second instance gets a suffixed name (e.g., `D0` for a second TOP).

## Common Errors

| Code | Level | Cause |
|---|---|---|
| 1013 | 51 (ERROR) | Invalid type string in `types` array |
| 1001 | 51 (ERROR) | Wrong ID type — must be part or assembly, not instance |
| 1006 | 51 (ERROR) | Non-existent ID |
| — | 51 (ERROR) | Empty part (no brep): "There must be at least one brep to perform a projection" |

Empty `types: []` returns `[]` with no error (valid no-op).

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ViewDemo' })).result
await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

const viewIds = (await api.v1.drawing2d.view({
  id: partId,
  types: ['TOP', 'FRONT', 'RIGHT', 'ISO']
})).result
// viewIds = [id1, id2, id3, id4] — order may not match input types
```

## Dimension Workflow

Dimensions must be created **before** views. Each dimension specifies a `viewType` that links it to the corresponding view:

```js
// 1. Create dimensions first
await api.v1.drawing2d.dimension({
  id: partId,
  viewType: 'FRONT',
  common: { type: 'LINEAR', textPos: [40, -15, 0] },
  linear: { startPos: [0, 0, 0], endPos: [80, 0, 0], orientation: 'HORIZONTAL' }
})

// 2. Then create views — dimensions with matching viewType appear in the view
await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'ISO'] })
```

Dimension coordinates are in 3D model space. For FRONT view: X is horizontal, Z is vertical. A dimension measuring along Y (depth axis) will have value 0 in FRONT view.

## Related

- `drawing2d.dimension` — create dimensions (before view creation)
- `drawing2d.centerView` — center views to origin after creation
- `drawing2d.placeView` — reposition views with offsets
- `drawing2d.getBoundaryBoxFromView` — get min/max bounds of each view (returns in input types order, unlike `view()`)
- `drawing2d.exportSVG` / `drawing2d.exportDXF` — export views to file formats
