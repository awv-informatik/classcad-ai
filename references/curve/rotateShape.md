# curve.rotateShape

Rotates all curves in a shape by a given rotation vector. Rotation is applied around the **part origin (0, 0, 0)**, not around the shape's center.

## Prerequisites

- A shape (`curve.shape`) containing at least one curve
- **Do NOT call `common.recalc` between shape creation/modification and rotateShape** — recalc invalidates shape IDs for this API (same bug as `translateShape`)

## Key Parameters

- `id` (required) — shape ID (from `curve.shape`). Only shape IDs accepted; part/EI IDs give error 1001.
- `rotation` (required) — `[rx, ry, rz]` rotation angles in **radians** around X, Y, and Z axes respectively. Positive = counterclockwise (right-hand rule). Negative = clockwise.

## Return Value

Returns VOID (`null`). On success, `maxLevel` is 31 (info). No messages on success.

## Behavior

- **In-place mutation.** The shape ID remains valid after rotation. No new shape is created.
- **Cumulative.** Two 45° rotations = one 90° rotation. Each call adds to the current orientation.
- **Rotation center is the origin.** Shapes offset from the origin will orbit around (0, 0, 0), not rotate in place. To rotate around a custom point P: translate by -P, rotate, translate by +P.
- **All curves rotate together.** Lines, circles, arcs, polylines — everything in the shape rotates as a unit.
- **Zero vector** `[0, 0, 0]` is a silent noop (maxLevel 31, no error).
- **Negative angles** rotate in the opposite direction (clockwise).
- **Large angles** (10π+) and full rotations (2π) work without issue.
- **Multi-axis rotation** — passing non-zero values for multiple axes in one call works (e.g., `[π/6, 0, π/4]` for 30° X + 45° Z).

## Gotchas

- **`common.recalc` invalidates shape IDs.** After calling `recalc`, `rotateShape` fails with error 1006. Same bug as `translateShape`. **Workaround:** do all shape transforms BEFORE any recalc call.
- **Empty shapes cannot be rotated.** A shape with no curves gives error 1006.
- **Render/export pipelines often trigger recalc internally.** Always do shape transforms BEFORE any visualization or export step, not after.
- **Error message says `ids` (plural)** even though the parameter is `id` (singular). The server internally maps `id` → `ids`.
- **Rotation is around origin, not shape center.** If your shape is at (50, 0, 0) and you rotate 90° around Z, it moves to (0, 50, 0). This is the most common source of unexpected results.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1006 | ERROR | "An element of parameter `ids` has an invalid id!" | Shape ID invalid (after recalc, empty shape, or deleted shape) |
| 1001 | ERROR | "The parameter `id` has a wrong id type! Provide only following id types: [\"shape\"]" | Passed EI ID or part ID instead of shape ID |
| 1004 | ERROR | "The parameter `rotation` must be provided" | Missing `rotation` parameter |
| 1004 | ERROR | "The parameter `id` must be provided" | Missing `id` parameter |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result

// Create some geometry
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [
    { xa: 0, ya: 0 },
    { xa: 30, ya: 0, r: 3 },
    { xa: 30, ya: 20, r: 3 },
    { xa: 0, ya: 20 },
  ],
  close: true,
})

// Rotate 90° counterclockwise around Z axis
await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, Math.PI / 2] })
// result: null, maxLevel: 31

// Rotate around a custom center point (e.g., rotate around (15, 10, 0)):
// 1. Translate to origin
await api.v1.curve.translateShape({ id: shapeId, translation: [-15, -10, 0] })
// 2. Rotate
await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, Math.PI / 4] })
// 3. Translate back
await api.v1.curve.translateShape({ id: shapeId, translation: [15, 10, 0] })
```

## Related

- `curve.translateShape` — translate a shape by a vector
- `curve.scaleShape` — scale a shape by a factor
- `curve.transformShape` — apply a 4x4 transformation matrix
- `curve.shape` — create the shape container this operates on
