# curve.line

Creates one or more lines in a shape container (`curve.shape` inside `part.entityInjection`).

## Key Parameters (all required, no optional ones)

- `id` — shape ID (not part or EI)
- `startPos`, `endPos` — `[x, y, z]`, exactly 3 elements (no 2D shorthand: `"If point is defined as array, it must have exactly 3 real values"`)

3D lines work; no coordinate limits (negative, 100000, 0.0001 all fine).

## Return Value

VOID (null), maxLevel 31. No ID — lines get no structure-tree node of their own; they share a `geometryIdList` entry on the shape node.

## Batch Creation

Pass an array of parameter objects (may mix shape IDs). Single VOID response; **errors are per-item** — a degenerate line doesn't block the others; maxLevel reflects the worst error.

## Gotchas

- **Degenerate lines** (startPos == endPos) → ERROR `"Start point and end point must not be equal"`. Any non-zero length works, even 0.001.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1001 | `"Provide only following id types: [\"shape\"]"` | Part or EI ID instead of shape ID |
| 1004 | `"The parameter \"<startPos\|endPos\|id>\" must be provided"` | Missing parameter |
| 1006 | `"An element of parameter \"id\" has an invalid id!"` | Non-existent or deleted shape ID |
| 0 | `"Start point and end point must not be equal"` | Degenerate line |
| 0 | `"...must have exactly 3 real values"` | Point not exactly 3 elements |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'LinePart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Lines' })).result

// Single line
await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })

// Batch — closed triangle
await api.v1.curve.line([
  { id: shapeId, startPos: [0, 10, 0], endPos: [60, 10, 0] },
  { id: shapeId, startPos: [60, 10, 0], endPos: [30, 60, 0] },
  { id: shapeId, startPos: [30, 60, 0], endPos: [0, 10, 0] },
])
```

## Related

`curve.shape` · `curve.circle` · `curve.polyline2d` · `curve.deleteShape` / `curve.cleanShape`
