# curve.translateShape

Translates all curves in a shape by a given vector. The translation is in part coordinates.

## Prerequisites

- A shape (`curve.shape`) containing at least one curve
- **Do NOT call `common.recalc` between shape creation/modification and translateShape** — recalc invalidates shape IDs for this API (see Gotchas)

## Key Parameters

- `id` (required) — shape ID (from `curve.shape`). Only shape IDs accepted; part/EI IDs give error 1001.
- `translation` (required) — `[x, y, z]` vector. Translation is **relative/cumulative** — each call adds to the current position. Not absolute.

## Return Value

Returns VOID (`null`). On success, `maxLevel` is 31 (info). No messages on success.

## Behavior

- **In-place mutation.** The shape ID remains valid after translation. No new shape is created.
- **Cumulative.** Three calls with `[10, 0, 0]` = total offset of `[30, 0, 0]`.
- **All curves move together.** Lines, circles, arcs, polylines — everything in the shape translates as a unit.
- **Zero vector** `[0, 0, 0]` is a silent noop (maxLevel 31, no error).
- **Negative values** work as expected (translate in the opposite direction).
- **Large values** (100000+) work without issue.

## Gotchas

- **`common.recalc` invalidates shape IDs.** After calling `recalc`, `translateShape` fails with error 1006 ("An element of parameter `ids` has an invalid id!"). This is a server bug — recalc rebuilds internal structures and stales the shape reference. **Workaround:** add any curve to the shape after recalc to re-validate the ID. Or simply avoid calling recalc before shape transforms.
- **Empty shapes cannot be translated.** A shape with no curves gives error 1006.
- **Error message says `ids` (plural)** even though the parameter is `id` (singular). The server internally maps `id` → `ids`. Don't be confused by this mismatch.
- The harness `snapshot()` function calls `recalc` internally (via the render pipeline), so **always do shape transforms BEFORE taking snapshots**, not after.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1006 | ERROR | "An element of parameter `ids` has an invalid id!" | Shape ID invalid (after recalc, empty shape, or deleted shape) |
| 1001 | ERROR | "Provide only following id types: [\"shape\"]" | Passed EI ID or part ID instead of shape ID |
| 1004 | ERROR | "The parameter `translation` must be provided" | Missing `translation` parameter |
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
await api.v1.curve.circle({ id: shapeId, centerPos: [15, 10, 0], radius: 5 })

// Translate the entire shape (all curves move together)
await api.v1.curve.translateShape({ id: shapeId, translation: [50, 30, 0] })
// result: null, maxLevel: 31
```

## Related

- `curve.rotateShape` — rotate a shape by Euler angles
- `curve.scaleShape` — scale a shape by a factor
- `curve.transformShape` — apply a 4x4 transformation matrix
- `curve.shape` — create the shape container this operates on
