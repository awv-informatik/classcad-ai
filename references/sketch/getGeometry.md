# sketch.getGeometry

Returns all geometry IDs from a sketch (or subset), grouped by type: `{ points, lines, arcs, circles }`.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create`) with geometry

## Key Parameters

- `id` — ID of the scope to query. Accepted types:
  - **sketch** — returns all geometry in the sketch
  - **sketchregion** — returns only geometry belonging to that region
  - **rigidset** — returns geometry in the rigid set
  - **sketch-curve** (line, arc, circle ID) — returns just that single curve
  - **sketch-point** — returns just that single point

The last two are undocumented but confirmed working. Passing a curve/point ID effectively answers "does this ID exist and what type is it?"

## Return Value

```js
{
  result: {
    points: id[],   // explicit sketch points
    lines: id[],    // lines (including rectangle edges + construction lines)
    arcs: id[],     // ALL arcs (arcByCenter + arcBy3Points merged, + construction arcs)
    circles: id[]   // circles (including construction circles)
  }
}
```

Always returns all 4 arrays, even when empty. maxLevel=31 on success.

## Gotchas

- **Arc types are merged.** `arcs` contains both `arcByCenter` and `arcBy3Points` IDs — no way to distinguish creation method from this query. Compare with `sketch.geometry()` which uses separate `arcsByCenter`/`arcsBy3Points` keys at creation time.
- **Sketch region scopes results.** Passing a region ID returns only geometry in that region, not the whole sketch. If you want everything, pass the sketch ID.
- **Constraint points are invisible.** Auto-generated constraint anchor points (fixation, coincidence) do NOT appear in the result. Only explicitly created geometry shows up.
- **Construction geometry is included, not separated.** The `lines`/`arcs`/`circles` arrays contain construction (reference) curves mixed in with real profile curves — `getGeometry` gives you no way to tell them apart. Construction curves (`isConstruction: 1`) are skeleton geometry (axes, bolt circles, centerlines) that drive the real profile through constraints/dimensions but are excluded from operations; passing one to `part.extrusion` hangs. To identify them, use `sketch.getObjectInfo` (`isConstruction: 0|1` per curve), `sketch.getObjectsLists` (`constructionGeometry: id[]`), or `sketch.getGlobalState` (`constructionCount`). See `SKETCHING.md` § Construction geometry.
- **Reflects deletions immediately.** After `sketch.deleteObject`, the deleted ID disappears from the next `getGeometry` call — no recalc needed.
- **No `update*` counterpart.** This is a read-only query. To modify geometry, use `sketch.updateGeometry`.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1001 | ERROR | `wrong id type! Provide only following id types: ["sketch","sketchregion","rigidset","sketch-curve","sketch-point"]` | Passed a non-sketch ID (e.g., part ID) |
| 1006 | ERROR | `An element of parameter "id" has an invalid id!` | ID does not exist |
| 1004 | ERROR | `The parameter "id" must be provided` | Missing `id` parameter |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create mixed geometry
const geo = await api.v1.sketch.geometry({
  id: skId,
  lines: [{ startPos: [0, 0, 0], endPos: [50, 0, 0] }],
  circles: [{ centerPos: [25, 25, 0], radius: 10 }],
  arcsByCenter: [{ startPos: [0, 40, 0], endPos: [40, 40, 0], centerPos: [20, 40, 0] }],
})

// Query all geometry
const r = await api.v1.sketch.getGeometry({ id: skId })
// r.result = { points: [], lines: [60], arcs: [68], circles: [73] }
```

## Related

- `sketch.geometry` — batch-create geometry (creation counterpart)
- `sketch.getPoints` — get start/end point IDs of a curve
- `sketch.getPositions` — get actual coordinates of geometry
- `sketch.sketchRegion` — create a region (whose ID can scope this query)
- `sketch.deleteObject` — delete geometry (reflected immediately by this query)
