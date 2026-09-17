# sketch.deleteObject

Deletes sketch objects — geometry (lines, circles, arcs, points), constraints, dimensions, sketch regions, rigid sets. Not whole sketches (use `deleteSketch`). Permanent — no undo.

## Key Parameters

- **`ids`** (required) — always an array; mixed types allowed in one call.

## Return Value

VOID. maxLevel 31 on success (also for `ids: []`, a silent no-op); 51 on error.

## Cascading

**Geometry cascades:** deleting a line/circle/arc also deletes its child points AND every constraint/dimension referencing it — no orphans. Deleting one of two perpendicular joined lines removed the line, its points, its coincident/horizontal/perpendicular constraints, the distance constraint *and* its `CC_LinearFeatureDimension`; only the surviving line's own vertical constraint remained (deleting the gone items then → 51 "invalid id"). Orphan points come from the **trim** workflow (a circle trimmed to arcs can leave its center point), not from `deleteObject`.

**Non-geometry does NOT cascade** — geometry is preserved when deleting a constraint, dimension, sketch region, rigid set (only the grouping goes), or pattern constraint (original + copies remain as independent elements). Deleting a pattern's source geometry removes only that element; copies survive.

## Errors & Gotchas

- **ALL-OR-NOTHING.** Any invalid id rejects the whole call — `deleteObject([validE, 999999, validF])` left E and F intact (1006). Filter invalid/`null` ids first (e.g. `.filter(Boolean)`); one stale id from a failed create silently blocks the batch.
- **Invalid/nonexistent or already-deleted id:** level-41 warning "ToId()/TOID() didn't get an existing or valid id" + error "An element of parameter ids has an invalid id!" (1006, maxLevel 51).
- **`null` id** (e.g. result of a failed creation): "An element of parameter ids has the wrong type!" (1001, maxLevel 51).

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
const circ = (await api.v1.sketch.circle({ id: skId, centerPos: [80, 30, 0], radius: 15 })).result

const r = await api.v1.sketch.deleteObject({ ids: [line, circ] }) // result null, maxLevel 31
```

## Related

`sketch.deleteSketch` · `sketch.getGeometry` · `sketch.constraint` / `sketch.dimension`
