# curve.shape / deleteShape / cleanShape

Shape containers hold 2D/3D curves inside an entity injection (EI). Every curve creation API (`line`, `circle`, `arc*`, `ellipse`, `bezierCurve`, `polyline2d`, `advancedPolyline`, …) takes a shape ID as `id`.

## curve.shape — Create a shape container

### Key Parameters

- `id` (required) — EI ID. Part ID → error 1001 `"Provide only following id types: [\"entityinjection\"]"`.
- `name` (optional) — default `"Shape"`. Duplicates auto-suffix (`"Shape"`, `"Shape0"`, `"Shape1"`, …); the first keeps the exact name. Rename later with `common.setObjectName({ id: shapeId, name: '...' })`.

### Return Value

Numeric shape ID. **No retrieval API** (`getShape`/`listShapes` don't exist) — store it at creation.

### Structure Tree

Shape nodes have class `CC_CurveEntity` (not `CC_Shape`), children of the EI (multiple shapes per EI work). Properties:
- `geometryIdList` — geometry entity IDs; curves may share one (a line + circle in one shape may share one ID). `undefined` for empty/cleaned shapes.
- `consumed` — always `{value: 1}`, does not track curve count.
- `parent` — the EI feature ID.

Curves are **not** child nodes; they exist only in the geometry referenced by `geometryIdList`.

### Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1001 | `"Provide only following id types: [\"entityinjection\"]"` | Part ID or wrong ID type |
| 1004 | `"The parameter \"id\" must be provided"` | Missing `id` |
| 1006 | `"An element of parameter \"id\" has an invalid id!"` | Non-existent or deleted ID |

## curve.deleteShape — Delete shapes entirely

`{ ids: [shapeId, ...] }` — deletes shapes with all their curves (non-empty shapes delete without error). Returns VOID.
- Only shape IDs; part/EI IDs → error 1001 `"Provide only following id types: [\"shape\"]"`.
- `ids: []` is a silent no-op (maxLevel 31). Double-delete → error 1006.

## curve.cleanShape — Remove curves, keep container

`{ ids: [shapeId, ...] }` — removes all curves (maxLevel 31) but keeps the containers; `geometryIdList` becomes `undefined`. The shape ID stays valid and accepts new curves. Check the shape still exists in the structure tree before reusing it.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result

await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
await api.v1.curve.circle({ id: shapeId, centerPos: [25, 25, 0], radius: 15 })

// Empty the shape and reuse it
await api.v1.curve.cleanShape({ ids: [shapeId] })
await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 20 })

// Delete shapes entirely
const tmp = (await api.v1.curve.shape({ id: eifId })).result
await api.v1.curve.line({ id: tmp, startPos: [0, 0, 0], endPos: [10, 0, 0] })
await api.v1.curve.deleteShape({ ids: [tmp] })
```

## Related

`part.entityInjection` · `curve.line` · `common.setObjectName`
