# part.sliceBySheet

Cuts a solid with a sheet body (surface) instead of a work plane — supports curved and arbitrary cutting surfaces. Consumes both target and tool.

## Key Parameters

- `id` — part ID (not feature ID)
- `target` — solid feature ID, or `{ id, indices }`
- `tool` — **sheet** feature ID (not a solid), or `{ id, indices }`. Typically `part.extrusion` with `capEnds: 0`.
- `inverted` — **integer 0 or 1** (NOT `true`/`false`/`'TRUE'`). `0` (default): keep the side along the sheet's normal; `1`: the opposite side.
- `name` — default `"SliceBySheet"`

## Return Value

New feature ID (maxLevel 31). Target and tool are consumed — reusing either gives code 1014 `"Entity \"...\" is not available. It has already been consumed/used in another operation."`. Use the returned ID for subsequent operations (boolean, another slice, …).

## Creating the Sheet (tool)

`part.extrusion` with `capEnds: 0` gives an open tube (walls, no caps). Place the profile so ONE wall passes through the solid at the cut location and the other 3 walls stay well outside the solid's bounding box.

**Sketch-plane coordinates map to world axes** — on the Front plane, local y → world **−Z** (see `sketch/getPositions`). A wall at world z=20 needs local y=−20.

## Gotchas

- **Verify the result is a solid.** Sheets from any plane can work (Front `UP`, Top `SYMMETRIC`), but some placements leave a `CC_Sheet` instead of a solid half (seen with Front `DOWN`/`SYMMETRIC` in a setup where `UP` worked); mass properties then fail. Check `calculateMassProperties` returns the expected volume.
- **Wrong `inverted` type** (`true`, `false`, `'TRUE'`, `'FALSE'`) fails with the misleading `"\"id\" must be provided to create CC_SliceBySheet"`.
- **Solid as tool** → `"The solid selected as sheet body used for SliceBySheet (CC_SliceBySheet) is not a sheet"`; a degenerate feature is still created.
- **No intersection is a silent no-op** — succeeds (maxLevel 31), solid unchanged, no warning.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"The solid selected as sheet body ... is not a sheet"` | — | Tool is a solid | `capEnds: 0` on the extrusion |
| `"Entity \"...\" is not available. It has already been consumed"` | 1014 | Reusing consumed target/tool | Use the returned ID |
| `"\"id\" must be provided to create CC_SliceBySheet"` | 1004 | `inverted` as bool/string | Use `0` or `1` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'SliceBySheetDemo' })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 50 })).result

// Sheet from Front plane: wall at local y=−20 (world z=20); other edges far outside the box
const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [-20, -20, 0], endPos: [100, -200, 0] })).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
const sheetId = (await api.v1.part.extrusion({
  id: partId, name: 'Sheet', references: [regionId], type: 'UP', limit2: 80, capEnds: 0, // extrudes along +Y through the box
})).result

// Keeps the part below z=20 (volume 80×60×20 = 96000); inverted: 1 keeps the other side
const sliceId = (await api.v1.part.sliceBySheet({ id: partId, target: boxId, tool: sheetId })).result
// boxId and sheetId are consumed — use sliceId
```

## Differences from part.slice

| | `part.slice` | `part.sliceBySheet` |
|---|---|---|
| Cutting tool | Work plane (infinite) | Sheet body (finite surface) |
| Target param | `targets` (array, multiple) | `target` (singular) |
| Tool param | `reference` (work plane ID) | `tool` (sheet feature ID) |
| Curved cuts | No | Yes (curved sheets) |

## Related

`part.updateSliceBySheet` · `part.slice` · `part.extrusion` · `part.boolean`
