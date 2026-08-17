# curve.shape / deleteShape / cleanShape

Shape containers hold 2D/3D curves inside an entity injection. All curve creation APIs (`curve.line`, `curve.circle`, etc.) require a shape ID as their `id` parameter.

## curve.shape — Create a shape container

### Prerequisites

- An entity injection feature (`part.entityInjection`)

### Key Parameters

- `id` (required) — ID of the entity injection feature. Must be an EI ID, not a part ID.
- `name` (optional) — display name. Default: `"Shape"`. Duplicate names auto-suffix: `"Shape"`, `"Shape0"`, `"Shape1"`, etc. First shape keeps the exact name.

### Return Value

Returns a numeric shape ID. This is the ID you pass to all `curve.*` creation APIs (`line`, `circle`, `arc*`, `ellipse`, `bezierCurve`, `polyline2d`, `advancedPolyline`, etc.) as `id`.

### Structure Tree

Shape nodes have class `CC_CurveEntity` (not `CC_Shape`). They are children of the EI node.

Key properties:
- `geometryIdList` — array of geometry entity IDs. Multiple curves share geometry IDs (a line + circle in the same shape may share one geometry ID). Empty/cleaned shapes have `undefined` geometryIdList.
- `consumed` — always `{value: 1}`, does not track curve count.
- `parent` — the EI feature ID.

Curves are **not** represented as child nodes of the shape. They exist only in the geometry data referenced by `geometryIdList`.

### Gotchas

- **Only accepts EI IDs.** Passing a part ID gives error 1001: `"Provide only following id types: [\"entityinjection\"]"`.
- **No retrieval API.** There is no `getShape` or `listShapes` API. Store the shape ID at creation time.
- **Rename with `setObjectName`.** `common.setObjectName({ id: shapeId, name: '...' })` works.
- **Multiple shapes per EI** work fine — each shape is a separate child of the EI.

### Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1001 | ERROR | `"Provide only following id types: [\"entityinjection\"]"` | Passed part ID or wrong ID type |
| 1004 | ERROR | `"The parameter \"id\" must be provided"` | Missing `id` param |
| 1006 | ERROR | `"An element of parameter \"id\" has an invalid id!"` | Non-existent or deleted ID |

### Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result

// Now use shapeId for curve creation
await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
await api.v1.curve.circle({ id: shapeId, centerPos: [25, 25, 0], radius: 15 })
```

---

## curve.deleteShape — Delete shapes entirely

Takes `ids` (array of shape IDs). Deletes shapes and all curves within them. Returns VOID.

### Key Behavior

- Accepts only shape IDs. Part/EI IDs give error 1001: `"Provide only following id types: [\"shape\"]"`.
- Non-empty shapes (containing curves) are deleted without error.
- Empty `ids` array is a silent noop (maxLevel 31).
- Double-delete (already deleted shape) gives error 1006 (invalid ID).

### Working Example

```js
await api.v1.curve.deleteShape({ ids: [shapeId1, shapeId2] })
```

---

## curve.cleanShape — Remove curves, keep container

Takes `ids` (array of shape IDs). Removes all curves from the shapes but preserves the shape containers for reuse.

### Key Behavior

- **Always reports maxLevel=51** with internal error: `"Trying to open database which does not exist"`. This is a server-side bug, not a user error. **The operation succeeds despite the error.**
- After cleaning, `geometryIdList` becomes `undefined` (empty).
- Cleaned shapes accept new curves normally — the shape ID remains valid.
- Calling cleanShape on an already-empty shape also triggers the same internal error.

### Gotchas

- **Do not treat maxLevel=51 as failure** for cleanShape. Check whether the shape still exists in the structure tree rather than relying on maxLevel.

### Working Example

```js
// Remove all curves from a shape, then reuse it
await api.v1.curve.cleanShape({ ids: [shapeId] })
// Shape is now empty but still exists
await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 20 })
// New curves work in the cleaned shape
```

---

## Related

- `part.entityInjection` — must create this first to hold shapes
- `curve.line`, `curve.circle`, `curve.arc*`, etc. — consume the shape ID
- `common.setObjectName` — rename a shape after creation
