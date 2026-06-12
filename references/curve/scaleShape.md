# curve.scaleShape

Scales all curves in a shape by a uniform factor. Scaling is centered at the **origin (0, 0, 0)** — not the shape's center.

## Prerequisites

- A shape (`curve.shape`) containing at least one curve
- **Do NOT call `common.recalc` between shape creation/modification and scaleShape** — recalc invalidates shape IDs (same bug as `translateShape`/`rotateShape`/`transformShape`)

## Key Parameters

- `id` (required) — shape ID (from `curve.shape`). Only shape IDs accepted; part/EI IDs give error 1001.
- `factor` (required) — scale factor (real). All coordinates are multiplied by this factor relative to origin.

## Return Value

Returns VOID (`null`). On success, `maxLevel` is 31 (info). No messages on success.

## Behavior

- **In-place mutation.** The shape ID remains valid after scaling. No new shape is created.
- **Cumulative.** Two calls with factor 2.0 = one call with factor 4.0. Each call multiplies the current state.
- **Scale center is the origin.** A point at (10, 5) scaled by 3x moves to (30, 15). Shapes offset from the origin will also move further away (or closer) when scaled.
- **All curves scale together.** Lines, circles, arcs, polylines (including fillet radii) — everything in the shape scales as a unit.
- **Circle/arc radii scale** proportionally along with their center positions.
- **Fillet radii in advancedPolyline scale** proportionally.
- **Negative factors work.** Factor -1.0 produces a point reflection through the origin (mirror in all axes). Factor -2.0 mirrors and doubles. This is the **only way** to do point reflections — `transformShape` rejects left-handed (negative-determinant) matrices.
- **Factor 0** is silently accepted (maxLevel 31) — produces degenerate geometry with all points collapsed to the origin. No error or warning.
- **Factor 1.0** is a noop (maxLevel 31).
- **Large factors** (1000+) and **tiny factors** (0.001) work without issue.
- Can be **undone** by scaling with `1/factor` — but do not recalc between the two scale calls (recalc bug).

## Scale Around a Custom Point

To scale around a point P instead of the origin:

```js
// 1. Translate shape so P is at origin
await api.v1.curve.translateShape({ id: shapeId, translation: [-P[0], -P[1], -P[2]] })
// 2. Scale
await api.v1.curve.scaleShape({ id: shapeId, factor: 2.0 })
// 3. Translate back
await api.v1.curve.translateShape({ id: shapeId, translation: P })
```

**Do not recalc (or render/export) between any of these calls** — it will invalidate the shape ID.

## Transform Order Matters

Because scaling is origin-centered, the order of scale + translate operations affects the result:
- Scale 2x then translate +100 → shape at different position than
- Translate +100 then scale 2x (the translate offset also gets scaled)

## Gotchas

- **`common.recalc` invalidates shape IDs.** After calling `recalc`, `scaleShape` fails with error 1006. **Render/export pipelines often trigger recalc internally.** Always do ALL shape transforms BEFORE any recalc, visualization, or export step.
- **Recalc invalidates ALL shape IDs in the drawing**, not just the shape being operated on.
- **Empty shapes cannot be scaled.** A shape with no curves gives error 1006.
- **Error message says `ids` (plural)** even though the parameter is `id` (singular). Same as translateShape/rotateShape — server maps `id` → `ids` internally.
- **Factor 0 produces degenerate geometry** — all points collapse to origin with no error. This is likely unrecoverable.
- **The graphic data in the response is incremental**, not the full transformed state. The `min` field in the incremental graphic does reflect the new coordinates, but edge point data may be partial. Do not rely on `r.graphic` for full verification — request a fresh visualization after scaling instead.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1006 | ERROR | "An element of parameter `ids` has an invalid id!" | Shape ID invalid (after recalc, empty shape, or deleted shape) |
| 1001 | ERROR | "The parameter `id` has a wrong id type! Provide only following id types: [`shape`]" | Passed EI ID or part ID instead of shape ID |
| 1004 | ERROR | "The parameter `factor` must be provided in the api call!" | Missing `factor` parameter |
| 1004 | ERROR | "The parameter `id` must be provided in the api call!" | Missing `id` parameter |

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
    { xa: 40, ya: 0, r: 5 },
    { xa: 40, ya: 25, r: 5 },
    { xa: 0, ya: 25 },
  ],
  close: true,
})

// Scale 2x around origin — all coords doubled, fillet radii doubled
await api.v1.curve.scaleShape({ id: shapeId, factor: 2.0 })
// result: null, maxLevel: 31
// Only recalc/render/export AFTER all shape transforms are done
```

## Related

- `curve.translateShape` — translate a shape by a vector
- `curve.rotateShape` — rotate a shape by Euler angles
- `curve.transformShape` — apply a 4x4 transformation matrix (no scaling allowed in matrix — use scaleShape instead)
- `curve.shape` — create the shape container this operates on
