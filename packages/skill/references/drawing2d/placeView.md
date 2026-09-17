# drawing2d.placeView

Moves views by relative offsets from their current position. Needs views from `drawing2d.view` (none → 1200).

## Key Parameters

- `id` — part or assembly ID (as used for `view()`)
- `placements` — array of `{ type, offset }`:
  - `type` — `'TOP'`, `'FRONT'`, `'RIGHT'`, `'LEFT'`, `'BOTTOM'`, `'RIGHT_90'`, `'LEFT_90'`, `'BACK'`, `'ISO'`
  - `offset` — `[x, y, z]` relative translation. Z is accepted but pointless for 2D layout.

## Return Value

`null` (VOID), maxLevel 31.

## Behavior

- **Cumulative.** Two calls with `[50, 0, 0]` move X+100. The same type twice in one `placements` array also stacks (`[10,0,0]` + `[20,0,0]` → X+30).
- `centerView` resets views to origin-centered, undoing prior offsets. Workflow: `view()` → `centerView()` → `placeView()` → `exportSVG()`/`exportDXF()`.

## Edge Cases

- `placements: []` → silent no-op, maxLevel 31
- `[0,0,0]` offset → accepted, no-op
- **Valid type whose view wasn't created** (e.g. `'RIGHT'` with only TOP/FRONT) → level 51, code 0, "View of type: N = XX, does not exist in ViewSet!" — **other valid placements in the same call still execute**

## Common Errors

| Code | Level | Cause |
|---|---|---|
| 1200 | 51 | No views: "There are no views exisiting on product" |
| 1013 | 51 | Invalid type string (same as `view()`/`centerView()`) |
| 0 | 51 | Valid type but that view wasn't created |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })
await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT', 'RIGHT', 'ISO'] })
await api.v1.drawing2d.centerView({ id: partId })

// Standard drawing layout
await api.v1.drawing2d.placeView({
  id: partId,
  placements: [
    { type: 'TOP', offset: [0, 80, 0] },
    { type: 'RIGHT', offset: [120, 0, 0] },
    { type: 'ISO', offset: [250, 80, 0] },
  ],
})
```

## Related

`drawing2d.view` · `drawing2d.centerView` · `drawing2d.getBoundaryBoxFromView` · `drawing2d.exportSVG` / `drawing2d.exportDXF`
