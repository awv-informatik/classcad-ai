# sketch.getGeometry

Returns geometry IDs grouped by type: `{ points, lines, arcs, circles }`.

## Key Parameters

- `id` — scope:
  - **sketch** — all geometry
  - **sketchregion** — only that region's geometry
  - **rigidset** — the set's geometry
  - **sketch-curve** / **sketch-point** — just that item (undocumented but confirmed; answers "does this ID exist and what type is it?")

## Return Value

`{ points, lines, arcs, circles }` — always all 4 arrays, maxLevel 31.

- `points` — explicit sketch points only; auto-constraint anchor points (fixation, coincidence) do NOT appear
- `lines` — incl. rectangle edges
- `arcs` — arcByCenter AND arcBy3Points merged (creation method not distinguishable, unlike `sketch.geometry`'s separate keys)
- Deletions are reflected immediately (no recalc).

## Gotchas

- **Construction curves are mixed in** with profile curves in `lines`/`arcs`/`circles`, indistinguishable here. Construction-only curves in `part.extrusion`/`part.revolve`/`part.twist` → error (maxLevel 51), no solid. Identify them with [`sketch.getObjectInfo`](getObjectInfo.md) (`isConstruction: 0|1`), [`sketch.getObjectsLists`](getObjectsLists.md) (`constructionGeometry`), or [`sketch.getGlobalState`](getGlobalState.md) (`constructionCount`). See `recipes/constrained-sketching` § Construction geometry.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1001 | `wrong id type! Provide only following id types: ["sketch","sketchregion","rigidset","sketch-curve","sketch-point"]` | e.g. part ID |
| 1006 | `An element of parameter "id" has an invalid id!` | Nonexistent ID |
| 1004 | `The parameter "id" must be provided` | Missing `id` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
await api.v1.sketch.geometry({
  id: skId,
  lines: [{ startPos: [0, 0, 0], endPos: [50, 0, 0] }],
  circles: [{ centerPos: [25, 25, 0], radius: 10 }],
  arcsByCenter: [{ startPos: [0, 40, 0], endPos: [40, 40, 0], centerPos: [20, 40, 0] }],
})

const r = await api.v1.sketch.getGeometry({ id: skId })
// r.result = { points: [], lines: [60], arcs: [68], circles: [73] }
```

## Related

`sketch.geometry` · `sketch.getPoints` · `sketch.getPositions` · `sketch.sketchRegion` · `sketch.deleteObject` · `sketch.updateGeometry`
