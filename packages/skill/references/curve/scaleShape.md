# curve.scaleShape

Scales all curves of a shape by a uniform factor centered at the **origin (0, 0, 0)**, not the shape's center.

## Key Parameters

- `id` (required) — shape ID (`curve.shape`); part/EI IDs → error 1001
- `factor` (required) — real; all coordinates are multiplied relative to the origin

## Return Value

VOID (`null`), maxLevel 31, no messages. In-place — the shape ID stays valid.

## Behavior

- **Everything scales as a unit**, including circle/arc radii (with their centers) and `advancedPolyline` fillet radii.
- **Origin-centered:** (10, 5) × 3 → (30, 15); offset shapes move away from (or toward) the origin. Order matters: scale 2x then translate +100 ≠ translate +100 then scale 2x (the offset gets scaled too). To scale around point P: `translateShape` by −P, scale, translate by +P — no recalc/render/export in between.
- **Cumulative:** two ×2.0 calls = one ×4.0. Undo with `1/factor` (no recalc between the two calls).
- **Negative factors:** −1.0 = point reflection through the origin (mirror in all axes); −2.0 mirrors and doubles. The **only way** to reflect a shape — `transformShape` rejects left-handed (negative-determinant) matrices.
- **Factor 0** is silently accepted (maxLevel 31): all points collapse to the origin, no warning — likely unrecoverable.
- Factor 1.0 is a no-op; 1000+ and 0.001 work.

## Gotchas

- **`common.recalc` invalidates ALL shape IDs in the drawing** → error 1006; render/export pipelines often recalc internally. Do ALL shape transforms BEFORE any recalc, visualization or export (details: `curve/translateShape`).
- **Empty shapes** cannot be scaled → error 1006. Error messages say `ids` (plural) though the parameter is `id`.
- **`r.graphic` in the response is incremental**, not the full transformed state: its `min` reflects the new coordinates but edge point data may be partial. Request a fresh visualization to verify.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1006 | "An element of parameter `ids` has an invalid id!" | Shape ID invalid (after recalc, empty, or deleted) |
| 1001 | "The parameter `id` has a wrong id type! Provide only following id types: [`shape`]" | EI or part ID instead of shape ID |
| 1004 | "The parameter `<factor\|id>` must be provided in the api call!" | Missing parameter |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result
await api.v1.curve.advancedPolyline({
  id: shapeId,
  pld: [{ xa: 0, ya: 0 }, { xa: 40, ya: 0, r: 5 }, { xa: 40, ya: 25, r: 5 }, { xa: 0, ya: 25 }],
  close: true,
})

// 2x around the origin — coordinates and fillet radii doubled; result null, maxLevel 31
await api.v1.curve.scaleShape({ id: shapeId, factor: 2.0 })
// Only recalc/render/export AFTER all shape transforms
```

## Related

`curve.translateShape` · `curve.rotateShape` · `curve.transformShape` · `curve.shape`
