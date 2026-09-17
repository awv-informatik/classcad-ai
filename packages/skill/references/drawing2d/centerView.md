# drawing2d.centerView

Translates views so each view's bounding box center (midpoint of `getBoundaryBoxFromView` min/max) sits at [0,0,0]. Dimensions unchanged — position only. Needs views from `drawing2d.view` (none → 1200).

## Key Parameters

- `id` — part or assembly ID (as used for `view()`)
- `types` — optional array (`'TOP'`, `'FRONT'`, `'RIGHT'`, …). Omitted → all existing views centered.

## Return Value

`null` (VOID), maxLevel 31.

## Behavior

- Example: TOP bbox [0,0]–[80,60] (center [40,30]) → [-40,-30]–[40,30].
- Per-view: centering only `['TOP']` leaves other views where they are.
- Shares position state with `placeView` — re-centering undoes placement offsets. Workflow: `view()` → `centerView()` → `placeView()` with layout offsets → export.

## Edge Cases

- `types: []` → silent no-op, maxLevel 31
- Type not created (e.g. `'RIGHT'` when only TOP/FRONT exist) → silent no-op
- Duplicate types → view centered once, no error

## Common Errors

| Code | Level | Cause |
|---|---|---|
| 1200 | 51 | No views: "There are no views exisiting on product" — call `view()` first |
| 1013 | 51 | Invalid type string (same as `view()`) |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })
await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })

await api.v1.drawing2d.centerView({ id: partId })

const [top] = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP'] })).result
// top.min ≈ { x: -40, y: -30 }, top.max ≈ { x: 40, y: 30 }
```

## Related

`drawing2d.view` · `drawing2d.placeView` · `drawing2d.getBoundaryBoxFromView` · `drawing2d.exportSVG` / `drawing2d.exportDXF`
