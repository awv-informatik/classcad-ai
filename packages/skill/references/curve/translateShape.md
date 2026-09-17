# curve.translateShape

Translates all curves of a shape (lines, circles, arcs, polylines — as a unit) by a vector in part coordinates.

## Key Parameters

- `id` (required) — shape ID (`curve.shape`); part/EI IDs → error 1001
- `translation` (required) — `[x, y, z]`, **relative/cumulative**, not absolute: three `[10, 0, 0]` calls = `[30, 0, 0]`

## Return Value

VOID (`null`), maxLevel 31, no messages. In-place — the shape ID stays valid.

## Behavior

`[0, 0, 0]` is a silent no-op (maxLevel 31). Negative values and large values (100000+) work.

## Gotchas

- **`common.recalc` invalidates shape IDs** — afterwards `translateShape` fails with error 1006 ("An element of parameter `ids` has an invalid id!"); same for `rotateShape` / `scaleShape` / `transformShape`, and for ALL shape IDs in the drawing. Server bug: recalc rebuilds internal structures and stales the shape reference. **Render/export pipelines often trigger recalc internally** — do all shape transforms BEFORE any recalc, visualization or export. Workaround: add any curve to the shape after recalc to re-validate the ID.
- **Empty shapes** (no curves) cannot be transformed → error 1006.
- **Error message says `ids` (plural)** though the parameter is `id` — the server maps `id` → `ids` internally.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1006 | "An element of parameter `ids` has an invalid id!" | Shape ID invalid (after recalc, empty, or deleted) |
| 1001 | "Provide only following id types: [\"shape\"]" | EI or part ID instead of shape ID |
| 1004 | "The parameter `<translation\|id>` must be provided" | Missing parameter |

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
await api.v1.curve.circle({ id: shapeId, centerPos: [15, 10, 0], radius: 5 })

// All curves move together — result null, maxLevel 31
await api.v1.curve.translateShape({ id: shapeId, translation: [50, 30, 0] })
```

## Related

`curve.rotateShape` · `curve.scaleShape` · `curve.transformShape` · `curve.shape`
