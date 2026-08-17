# sketch.circularPattern

Patterns a rigid set (or single geometry element) in a circular arrangement around a center point within a sketch.

## Prerequisites

- A sketch (`sketch.create`)
- A rigid set (`sketch.rigidSet`) OR a single sketch geometry ID (line, arc, circle, etc.)
- A center point ID — any sketch point: `sketch.point`, or a line/arc endpoint from `sketch.getPoints`

## Key Parameters

- `id` — sketch ID
- `rigidSetId` — rigid set ID **or** a single geometry ID (auto-wraps into a rigid set internally)
- `centerId` — ID of the rotation center point. Must be a sketch point ID (from `sketch.point` or `getPoints`). Can be at any position, not just origin.
- `angle` — angular **spacing** between neighboring copies, in **radians**. This is NOT the total sweep — it's the step between each copy. For N evenly-spaced copies around a full circle: `angle = 2 * Math.PI / count`.
- `count` — total number of items **including the original**. `count: 4` = original + 3 copies. **Must be ≥ 2** — values ≤ 1 cause a solver error.

## Return Value

```js
{
  constraint: id,        // pattern constraint node ID
  dimension: id,         // angle dimension ID (always returned, never VOID)
  geometry: Array<id>    // all rigid set IDs (original + copies)
}
```

- `geometry.length` = `count` (when count ≥ 2)
- `geometry[0]` = the original rigid set (or auto-created rigid set wrapping a single geometry)
- `dimension` = angle spacing dimension ID — update with `sketch.updateDimension`
- maxLevel is 31 on success

## Gotchas

- **Count includes the original.** `count: 4` means 4 total, not 4 copies. For N copies, set count to N+1.
- **Count must be ≥ 2.** `count: 0`, `count: 1`, and negative counts all trigger a solver error: `"[Evaluation error in CP.SetSE:Division by zero!]"`. The pattern nodes (constraint, dimension, geometry) are still created despite the error, but the pattern is in an invalid state. This differs from `linearPattern` which silently handles count ≤ 1.
- **Fractional counts are floored.** `count: 3.7` → 3 total (original + 2 copies).
- **Angle is spacing, not sweep.** `angle: Math.PI / 2` with `count: 4` produces copies at 0°, 90°, 180°, 270° — NOT copies spanning 90° total.
- **Negative angle is valid.** Rotates clockwise instead of counterclockwise. No error.
- **Zero angle causes solver error.** Same division by zero as count ≤ 1. Copies are created but stacked at the same position. Avoid `angle: 0`.
- **Single geometry ID works as rigidSetId.** The API auto-wraps it. `geometry[0]` will be a new rigid set ID, not the original geometry ID.
- **Any sketch point works as center.** Not limited to origin — off-center points, line endpoints (from `getPoints`), arc centers all work.
- **Works on a fully constrained, dimension-driven original** (verified 2026-07-02,
  mounting-plate bolt circle): a Ø6 hole whose center is COINCIDENT on a construction bolt
  circle + on the vertical centerline, driven by DIAMETER dims, patterned 6× about the hub
  circle's centerId AFTER the solve — all 6 centers landed on the Ø42 circle at 60° spacing
  to 1.6e-14. Pattern after the layout is solved, so copies replicate final geometry.
- **`sketch.point` uses `pos`, not `position`.** Common mistake: `sketch.point({ id, pos: [x, y, z] })`.

## Updating Pattern Angle

The `dimension` ID in the return value is a standard sketch dimension. Update angle spacing after creation:

```js
await api.v1.sketch.updateDimension({ id: dimId, value: Math.PI / 3 })
```

No `openFeature`/`closeFeature` needed — this is a sketch-level dimension update.

## Deleting a Pattern

Use `sketch.deleteObject({ ids: [constraintId] })` to remove the pattern constraint. Copied geometry survives as independent sketch geometry.

## Common Errors

- **Division by zero** (code 0, level 51): `"[Evaluation error in CP.SetSE:Division by zero!]"` — caused by count ≤ 1 or angle = 0. Pattern nodes are created but solver fails.
- **centerId = VOID** (code 1001, level 51): `"Set the parameter \"centerId\" = VOID is not allowed"` — the center point ID is invalid or null. Check that `sketch.point` returned a valid ID (use `pos`, not `position`).

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create geometry and center
const hole = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 0, 0], radius: 5 })).result
const center = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result

// Group into rigid set
const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [hole] })).result

// 8 holes evenly spaced around full circle
const r = await api.v1.sketch.circularPattern({
  id: skId,
  rigidSetId: rsId,
  centerId: center,
  angle: Math.PI / 4,  // 45° between each = 360° / 8
  count: 8,
})
// r.result.geometry.length = 8
// r.result.dimension = angle dimension ID

// Update spacing later
await api.v1.sketch.updateDimension({ id: r.result.dimension, value: Math.PI / 6 })
```

## Related

- `sketch.rigidSet` — create the rigid set input
- `sketch.linearPattern` — pattern in X/Y grid
- `sketch.mirrorPattern` — mirror across a line
- `sketch.updateDimension` — change angle spacing after creation
- `sketch.deleteObject` — delete the pattern constraint (preserves geometry)
- `sketch.getPoints` — get point IDs from line/arc endpoints for use as centerId
