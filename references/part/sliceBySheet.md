# part.sliceBySheet

Cuts a solid using a sheet body (surface) instead of a work plane. More flexible than `part.slice` — supports curved and arbitrary cutting surfaces. Consumes both target and tool.

## Prerequisites

- A part (`part.create`)
- A solid feature as the target (e.g., `part.box`, `part.cylinder`)
- A **sheet** feature as the tool (e.g., `part.extrusion` with `capEnds: 0`)

## Key Parameters

- `id` — part ID (not feature ID)
- `target` — feature ID of the solid to cut. Accepts plain ID or object `{ id, indices }`.
- `tool` — feature ID of the sheet body. Accepts plain ID or object `{ id, indices }`. **Must be a sheet, not a solid.** A typical sheet is an extrusion with `capEnds: 0`.
- `inverted` — **integer 0 or 1** (NOT `true`/`false`/`'TRUE'`). `0` (default): keep the side along the sheet's normal. `1`: keep the opposite side.
- `name` — optional, defaults to `"SliceBySheet"`.

## Return Value

New feature ID on success (maxLevel 31). Both target and tool features are consumed — use the returned ID for subsequent operations.

## Creating a Sheet Body (the tool)

Use `part.extrusion` with `capEnds: 0` to create a sheet. The open extrusion produces a tube (4 walls without caps). Position the rectangle so one wall passes through the solid at the desired cut location.

**CRITICAL: The sketch plane determines whether the result is a solid or a sheet.**
- **Front (XZ) or Right (YZ) plane → CC_Solid result ✓**
- **Top (XY) plane → CC_Sheet result ✗** — the slice produces a sheet body instead of a solid half, making the result unusable in boolean operations

Always create the cutting sheet from the **Front or Right** plane, never the Top plane.

### Example: horizontal cut at z=20

```js
const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result
// On XZ plane: sketch x = world x, sketch y = world z
// Bottom edge at z=20 is the cutting wall. Other edges extend far outside the solid.
const rectIds = (await api.v1.sketch.rectangle({
  id: skId, startPos: [-20, 20, 0], endPos: [100, 200, 0],
})).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
// Extrude along +Y to span the solid
const sheetId = (await api.v1.part.extrusion({
  id: partId, name: 'CuttingSheet', references: [regionId],
  type: 'UP', limit2: 80, capEnds: 0,
})).result
```

## Consumption Behavior

Both target and tool are consumed after `sliceBySheet`. Reusing either gives: `"Entity \"...\" is not available. It has already been consumed/used in another operation."` (code 1014).

The returned slice feature ID is valid for subsequent operations (boolean, another slice, etc.).

## Gotchas

- **Sketch plane matters.** Sheets from the Top (XY) plane produce CC_Sheet results — the solid is destroyed and the result is an unusable surface body. Use Front (XZ) or Right (YZ) plane instead.
- **`inverted` must be integer 0 or 1.** Passing `true`, `false`, `'TRUE'`, or `'FALSE'` fails with misleading error: `"\"id\" must be provided to create CC_SliceBySheet"`. Use `0` or `1`.
- **Tool must be a sheet body.** Passing a solid as the tool gives: `"The solid selected as sheet body used for SliceBySheet (CC_SliceBySheet) is not a sheet"`. A degenerate feature is still created.
- **No-intersection is a silent no-op.** If the sheet doesn't intersect the target, the operation succeeds (maxLevel 31) and the solid is preserved unchanged. No error, no warning.
- **Position the cutting wall carefully.** Only one wall of the tube needs to intersect the solid. Make the rectangle large enough that the other 3 walls are well outside the solid's bounding box.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"The solid selected as sheet body ... is not a sheet"` | — | Tool is a solid, not a sheet | Use `capEnds: 0` on the extrusion |
| `"Entity \"...\" is not available. It has already been consumed"` | 1014 | Reusing consumed target or tool | Use the returned slice feature ID |
| `"\"id\" must be provided to create CC_SliceBySheet"` | 1004 | Wrong type for `inverted` (bool/string instead of int) | Use `0` or `1`, not `true`/`'TRUE'` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'SliceBySheetDemo' })).result

const boxId = (await api.v1.part.box({
  id: partId, name: 'Box', length: 80, width: 60, height: 50,
})).result

// Create sheet from Front (XZ) plane — cutting at z=20
const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result
const rectIds = (await api.v1.sketch.rectangle({
  id: skId, startPos: [-20, 20, 0], endPos: [100, 200, 0],
})).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
const sheetId = (await api.v1.part.extrusion({
  id: partId, name: 'Sheet', references: [regionId],
  type: 'UP', limit2: 80, capEnds: 0,
})).result

// Slice — keeps one side of the cut
const sliceId = (await api.v1.part.sliceBySheet({
  id: partId,
  target: boxId,
  tool: sheetId,
})).result
// boxId and sheetId are now consumed — use sliceId

// To keep the other side:
// const sliceId = (await api.v1.part.sliceBySheet({
//   id: partId, target: boxId, tool: sheetId, inverted: 1,
// })).result
```

## Differences from part.slice

| | `part.slice` | `part.sliceBySheet` |
|---|---|---|
| Cutting tool | Work plane (infinite plane) | Sheet body (finite surface) |
| Target param | `targets` (array, multiple features) | `target` (singular) |
| Tool param | `reference` (work plane ID) | `tool` (sheet feature ID) |
| Curved cuts | No | Yes (with curved sheet bodies) |

## Related

- `part.updateSliceBySheet` — modify after creation (requires `openFeature`/`closeFeature`)
- `part.slice` — simpler version using a work plane
- `part.extrusion` — create the sheet tool with `capEnds: 0`
- `part.boolean` — similar consumption pattern
