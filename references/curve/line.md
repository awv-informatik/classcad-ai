# curve.line

Creates one or more lines in a shape container.

## Prerequisites

- A shape (`curve.shape`) inside an entity injection (`part.entityInjection`)

## Key Parameters

- `id` (required) — shape ID. Must be a shape ID, not part or EI.
- `startPos` (required) — `[x, y, z]` start point. Exactly 3 elements required.
- `endPos` (required) — `[x, y, z]` end point. Exactly 3 elements required.

All three parameters are required. No optional parameters.

## Batch Creation

Pass an array of objects to create multiple lines in one call:

```js
await api.v1.curve.line([
  { id: shapeId, startPos: [0, 0, 0], endPos: [40, 0, 0] },
  { id: shapeId, startPos: [0, 10, 0], endPos: [40, 10, 0] },
])
```

- Returns a single response (VOID, maxLevel 31 if all succeed)
- Can mix different shape IDs in the same batch
- **Errors are per-item** — one degenerate line doesn't block the others. maxLevel reflects the worst error, but valid lines are still created.

## Return Value

Returns VOID (null). maxLevel 31 on success. No ID is returned — lines cannot be individually addressed after creation.

## Gotchas

- **Degenerate lines** (startPos == endPos) produce ERROR: `"Start point and end point must not be equal"`. Any non-zero-length line works, even very short ones (0.001).
- **Points must be exactly `[x, y, z]`** — no 2D shorthand `[x, y]`. Error: `"If point is defined as array, it must have exactly 3 real values"`.
- **No individual line IDs.** Lines are added to the shape's geometry but don't get their own node in the structure tree. They share a `geometryIdList` entry on the shape node.
- **3D lines work.** Non-zero Z coordinates are fully supported.
- **No coordinate limits.** Negative, very large (100000), and very small (0.0001) coordinates all work.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1001 | ERROR | `"Provide only following id types: [\"shape\"]"` | Passed part ID or EI ID instead of shape ID |
| 1004 | ERROR | `"The parameter \"startPos\" must be provided"` | Missing required parameter |
| 1004 | ERROR | `"The parameter \"endPos\" must be provided"` | Missing required parameter |
| 1004 | ERROR | `"The parameter \"id\" must be provided"` | Missing `id` |
| 1006 | ERROR | `"An element of parameter \"id\" has an invalid id!"` | Non-existent or deleted shape ID |
| 0 | ERROR | `"Start point and end point must not be equal"` | Degenerate line (identical points) |
| 0 | ERROR | `"...must have exactly 3 real values"` | Point array not exactly 3 elements |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'LinePart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Lines' })).result

// Single line
await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })

// Batch — multiple lines at once
await api.v1.curve.line([
  { id: shapeId, startPos: [0, 0, 0], endPos: [60, 0, 0] },
  { id: shapeId, startPos: [60, 0, 0], endPos: [30, 50, 0] },
  { id: shapeId, startPos: [30, 50, 0], endPos: [0, 0, 0] },
])
```

## Related

- `curve.shape` — create the container this consumes
- `curve.circle`, `curve.arcBy3Points`, etc. — other curve types in the same shape
- `curve.polyline2d` — alternative for connected line sequences
- `curve.deleteShape` / `curve.cleanShape` — remove lines (no per-line delete)
