# curve.circle

Creates one or more circles in a shape container.

## Prerequisites

- A shape (`curve.shape`) inside an entity injection (`part.entityInjection`)

## Key Parameters

- `id` (required) — shape ID. Must be a shape, not part or EI.
- `centerPos` (required) — `[x, y, z]` center point. Exactly 3 elements.
- `radius` (required) — circle radius. Must be > 0; the API rejects `radius <= 0` with error code 1014.
- `normal` (optional) — `[x, y, z]` plane normal. Default `[0, 0, 1]` (XY plane). Auto-normalized — non-unit vectors work. Negative normals flip orientation.

## Batch Creation

Pass an array of objects to create multiple circles in one call:

```js
await api.v1.curve.circle([
  { id: shapeId, centerPos: [0, 0, 0], radius: 10 },
  { id: shapeId, centerPos: [30, 0, 0], radius: 15 },
])
```

- Returns a single VOID response (maxLevel 31 on success)
- Can mix different shape IDs in the same batch
- **Errors are per-item** — one bad entry doesn't block valid ones. maxLevel reflects worst error.

## Return Value

Returns VOID (null). maxLevel 31 on success. No ID is returned — circles cannot be individually addressed after creation. They share a geometry entry in the shape's `geometryIdList`.

## Gotchas

- **`radius <= 0` is rejected with a proper error** (code 1014, maxLevel 51, message `"The parameter \"radius\" must be greater than 0."`). Previously this hung the server in an infinite loop — fixed in classcad/cclasses 2b5dd88c + classcad/runtime 3c5db6448.
- **Zero normal `[0, 0, 0]` silently succeeds.** No error, maxLevel 31. Unclear what plane is used — possibly defaults to `[0, 0, 1]`. Avoid relying on this.
- **No individual circle IDs.** Like lines, circles are merged into the shape's geometry. You can't address, update, or delete individual circles — only the whole shape (`curve.deleteShape` / `curve.cleanShape`).
- **Points must be exactly `[x, y, z]`** — no 2D shorthand. Error: `"...must have exactly 3 real values"`.

## Normal Vector Behavior

The `normal` parameter defines the plane the circle lies in:

- `[0, 0, 1]` — XY plane (default)
- `[1, 0, 0]` — YZ plane
- `[0, 1, 0]` — XZ plane
- `[1, 1, 1]` — tilted plane (auto-normalized)
- `[0, 0, -1]` — XY plane, flipped orientation

Non-unit vectors are auto-normalized. Very small normals like `[0, 0, 0.001]` work.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1001 | ERROR | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Passed part/EI ID instead of shape ID |
| 1004 | ERROR | `"The parameter \"centerPos\" must be provided..."` | Missing centerPos |
| 1004 | ERROR | `"The parameter \"radius\" must be provided..."` | Missing radius |
| 1004 | ERROR | `"The parameter \"id\" must be provided..."` | Missing id |
| 1014 | ERROR | `"The parameter \"radius\" must be greater than 0."` | `radius <= 0` |
| 0 | ERROR | `"...must have exactly 3 real values"` | Point array not exactly 3 elements |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result

// Simple circle in XY plane
await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 20 })

// Circle in YZ plane with explicit normal
await api.v1.curve.circle({ id: shapeId, centerPos: [50, 0, 0], radius: 15, normal: [1, 0, 0] })

// Batch creation
await api.v1.curve.circle([
  { id: shapeId, centerPos: [0, 30, 0], radius: 10 },
  { id: shapeId, centerPos: [30, 30, 0], radius: 5 },
])
```

## Related

- `curve.shape` — create the container this consumes
- `curve.line`, `curve.arcBy3Points`, etc. — other curve types in the same shape
- `curve.deleteShape` / `curve.cleanShape` — remove circles (no per-circle delete)
