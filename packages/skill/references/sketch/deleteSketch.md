# sketch.deleteSketch

Deletes one or more whole sketches. (`sketch.deleteObject` cannot — it only handles sub-sketch items: dimensions, sketch-curves, sketch-points, 2D constraints, sketch regions.)

## Key Parameters

- **`ids`** (required) — array of sketch IDs, e.g. `[skId]` or `[sk1, sk2]`.

## Return Value

VOID (null), maxLevel=31 on success.

## Gotchas

- **Empty array is a silent no-op** (maxLevel=31).
- **All-or-nothing.** If any ID is invalid, **no sketches are deleted** — not even the valid ones. If some IDs may be invalid, delete one per call.
- **Removes everything:** `CC_Sketch`, `CC_SketchReference`, `CC_SketchDimensionSet` nodes plus all geometry and constraints inside. Afterwards `part.getSketch` for that name returns null with error 1015.
- **Dependent features become broken, not deleted.** A consuming feature (e.g. extrusion) stays in the tree but errors on re-evaluation ("CCObject can not be opened", maxLevel=51). The solid remains as stale mesh data and cannot be regenerated.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "invalid id" (plus warning level 41 "ToId() didn't get valid id") | 1006 | Nonexistent or already-deleted sketch ID; maxLevel 51 |
| "wrong id type! Provide only following id types: ['sketch']" | 1001 | ID is not a sketch (part ID, negative number, …) |
| "parameter 'ids' must be provided" | 1004 | `ids` omitted |
| "string couldn't be converted to an id" | 0 (warning) | String instead of numeric ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const sk1 = (await api.v1.sketch.create({ id: partId, planeId, name: 'Sk1' })).result
const sk2 = (await api.v1.sketch.create({ id: partId, planeId, name: 'Sk2' })).result
await api.v1.sketch.circle({ id: sk1, centerPos: [0, 0, 0], radius: 10 })

await api.v1.sketch.deleteSketch({ ids: [sk1, sk2] })
```

## Related

`sketch.create` / `part.sketch` · `sketch.deleteObject` · `part.getSketch`
