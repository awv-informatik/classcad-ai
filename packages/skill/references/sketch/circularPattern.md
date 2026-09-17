# sketch.circularPattern

Patterns a rigid set (or single geometry element) circularly around a center point.

## Key Parameters

- `id` — sketch ID
- `rigidSetId` — rigid set ID **or** a single geometry ID (auto-wrapped; `geometry[0]` is then a new rigid set ID, not the geometry ID)
- `centerId` — any sketch point ID at any position: `sketch.point` (param is `pos`, not `position`), line endpoints or arc centers from `getPoints`
- `angle` — **spacing** between neighbors in **radians**, NOT total sweep. N evenly spaced over a full circle: `2 * Math.PI / count`. `Math.PI / 2` with `count: 4` → 0°, 90°, 180°, 270°. Negative = clockwise (valid).
- `count` — total **including the original** (`count: 4` = original + 3 copies; N copies → N+1). Fractional counts are floored (`3.7` → 3).

## Return Value

`{ constraint, dimension, geometry }`, maxLevel 31:

- `geometry` — all rigid set IDs, `[original, ...copies]`, length = `count` (when ≥ 2)
- `dimension` — angle spacing dimension (always returned, never VOID); update with `sketch.updateDimension({ id, value: Math.PI / 3 })` — no `openFeature`/`closeFeature` needed

## Gotchas

- **`count` ≤ 1 (0, 1, negative) or `angle: 0` → solver error** `"[Evaluation error in CP.SetSE:Division by zero!]"` (code 0, level 51). Pattern nodes are still created but invalid (zero angle stacks copies on one spot). `linearPattern` silently handles count ≤ 1 instead.
- **Delete** via `sketch.deleteObject({ ids: [constraintId] })` — copies survive as independent geometry.
- **Works on a fully constrained, dimension-driven original:** a Ø6 hole with center COINCIDENT on a construction bolt circle + vertical centerline, driven by DIAMETER dims, patterned 6× about the hub circle's centerId AFTER the solve — all 6 centers on the Ø42 circle at 60° to 1.6e-14. Pattern after the layout is solved so copies replicate final geometry.

## Common Errors

- **Division by zero** (code 0, level 51) — see above.
- **1001** (level 51): `"Set the parameter \"centerId\" = VOID is not allowed"` — center ID invalid/null; check `sketch.point` returned an ID (use `pos`).

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const hole = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 0, 0], radius: 5 })).result
const center = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result
const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [hole] })).result

// 8 holes, 45° apart
const r = await api.v1.sketch.circularPattern({ id: skId, rigidSetId: rsId, centerId: center, angle: Math.PI / 4, count: 8 })
// r.result.geometry.length === 8
await api.v1.sketch.updateDimension({ id: r.result.dimension, value: Math.PI / 6 })
```

## Related

`sketch.rigidSet` · `sketch.linearPattern` · `sketch.mirrorPattern` · `sketch.updateDimension` · `sketch.deleteObject` · `sketch.getPoints`
