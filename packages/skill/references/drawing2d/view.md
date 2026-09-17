# drawing2d.view

Creates 2D projections of a product's 3D solids into the XY-plane. Views are tree data for DXF/SVG export — the 3D rendering is unchanged.

## Prerequisites

A part (`part.create`) or assembly (`assembly.create`) with at least one brep solid. Without geometry, views are created but projection fails (level 51).

## Key Parameters

- `id` — part or assembly ID. Instance IDs rejected (1001: "Provide only following id types: ['part/assembly']").
- `types` — any of the 9 views: `'TOP'`, `'FRONT'`, `'RIGHT'`, `'LEFT'`, `'BOTTOM'`, `'RIGHT_90'`, `'LEFT_90'`, `'BACK'`, `'ISO'`. `[]` → returns `[]`, no error.
- `color` — AutoCAD color index (0–256), default 0. Only affects DXF/SVG export; out-of-range silently accepted.
- `layer` — DXF layer name, default `"0"`.

## Return Value

Always `Array<id>`, even for one type (`[120]`). **Order does NOT reliably match `types`** — identify views via the `CC_View2D` node's `name` or `viewType` member in the structure tree.

## Critical Gotcha: Each Call Replaces All Views

`view()` destroys all existing views and creates a fresh set — request every view in ONE call:

```js
await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'ISO'] })  // CORRECT
// WRONG: a second call view({ types: ['FRONT', 'ISO'] }) after view({ types: ['TOP'] }) deletes TOP
```

## Internal View Names

`CC_View2D` nodes inside a `CC_ViewSet` container; short names derive from German:

| Type | TOP | FRONT | RIGHT | LEFT | BOTTOM | RIGHT_90 | LEFT_90 | BACK | ISO |
|---|---|---|---|---|---|---|---|---|---|
| Name | D | V | SR | SL | U | SDR | SDL | R | ISO |
| viewType | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |

Duplicate types are allowed; the second gets a suffixed name (`D0` for a second TOP).

## Common Errors

| Code | Level | Cause |
|---|---|---|
| 1013 | 51 | Invalid type string |
| 1001 | 51 | Wrong ID type — instance instead of part/assembly |
| 1006 | 51 | Non-existent ID |
| — | 51 | No brep: "There must be at least one brep to perform a projection" |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ViewDemo' })).result
await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

const viewIds = (await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })).result
// 4 ids — order may not match types
```

## Dimension Workflow

Create dimensions **before** views; each dimension's `viewType` links it to the matching view:

```js
await api.v1.drawing2d.dimension({
  id: partId,
  viewType: 'FRONT',
  common: { type: 'LINEAR', textPos: [40, -15, 0] },
  linear: { startPos: [0, 0, 0], endPos: [80, 0, 0], orientation: 'HORIZONTAL' },
})
await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'ISO'] })
```

Dimension coordinates are 3D model space. In FRONT, X is horizontal and Z vertical — a dimension along Y (depth) has value 0 there.

## Related

`drawing2d.dimension` · `drawing2d.centerView` · `drawing2d.placeView` · `drawing2d.getBoundaryBoxFromView` · `drawing2d.exportSVG` / `drawing2d.exportDXF`
