# curve.rotateShape

Rotates all curves of a shape (as a unit) around the **part origin (0, 0, 0)**, not the shape's center.

## Key Parameters

- `id` (required) — shape ID (`curve.shape`); part/EI IDs → error 1001
- `rotation` (required) — `[rx, ry, rz]` in **radians** about X, Y, Z. Positive = counterclockwise (right-hand rule), negative = clockwise. Multiple non-zero axes in one call work (e.g. `[π/6, 0, π/4]` = 30° X + 45° Z).

## Return Value

VOID (`null`), maxLevel 31, no messages. In-place — the shape ID stays valid.

## Behavior

- **Orbits the origin:** a shape at (50, 0, 0) rotated 90° about Z moves to (0, 50, 0) — the most common surprise. To rotate around point P: translate by −P, rotate, translate by +P.
- **Cumulative:** two 45° calls = one 90°. `[0, 0, 0]` is a silent no-op; large (10π+) and full (2π) rotations work.

## Gotchas

- **`common.recalc` invalidates shape IDs** → error 1006; render/export often recalc internally. Do all shape transforms BEFORE any recalc, visualization or export (details: `curve/translateShape`).
- **Empty shapes** cannot be rotated → error 1006. Error messages say `ids` (plural) though the parameter is `id`.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1006 | "An element of parameter `ids` has an invalid id!" | Shape ID invalid (after recalc, empty, or deleted) |
| 1001 | "The parameter `id` has a wrong id type! Provide only following id types: [\"shape\"]" | EI or part ID instead of shape ID |
| 1004 | "The parameter `<rotation\|id>` must be provided" | Missing parameter |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [{ xa: 0, ya: 0 }, { xa: 30, ya: 0, r: 3 }, { xa: 30, ya: 20, r: 3 }, { xa: 0, ya: 20 }],
  close: true,
})

// 90° CCW about Z (around the origin) — result null, maxLevel 31
await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, Math.PI / 2] })

// Around a custom point (15, 10, 0): to origin → rotate → back
await api.v1.curve.translateShape({ id: shapeId, translation: [-15, -10, 0] })
await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, Math.PI / 4] })
await api.v1.curve.translateShape({ id: shapeId, translation: [15, 10, 0] })
```

## Related

`curve.translateShape` · `curve.scaleShape` · `curve.transformShape` · `curve.shape`
