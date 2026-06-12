# curve.union2d / subtraction2d / intersection2d

2D boolean operations on shape containers. Merges, subtracts, or intersects two closed 2D shapes within entity injections.

All three APIs share identical signatures and behavior patterns — they differ only in the geometric operation performed.

## Prerequisites

- Two shapes (`curve.shape`) each containing **closed curves** (circles, closed polylines, closed advancedPolylines)
- Shapes must be **coplanar** (same plane)
- Both shapes must have at least one curve — empty shapes cause NULLID errors

## CRITICAL: No Recalc Before Boolean

**Triggering a recalc (`common.recalc` directly, or indirectly via a render/visualization or export step) between shape creation and a 2D boolean invalidates the shapes' internal solid body references.** The boolean will fail with `NULLID not allowed` in `CADH_AddSolid`. This is not recoverable — `openFeature` does not fix it.

**Always perform all 2D boolean operations BEFORE any recalc-triggering call.** Render or export only after the booleans are complete.

## Key Parameters

- `target` (required) — shape ID. Modified in-place with the boolean result. Must be a shape ID (not EI or part ID).
- `tool` (required) — shape ID. Consumed (deleted) by default.
- `keepShape` (optional, default: `false`) — when `true`, the tool shape is preserved after the operation.

## Return Value

Returns `VOID` (null). maxLevel=31 (info) on success. No messages on success.

## Behavior

- **Target**: modified in-place. Same shape ID, same geometry ID, name preserved. Bounding box updates to reflect the boolean result.
- **Tool (default)**: completely removed from the structure tree. The EI's children array shrinks.
- **Tool (keepShape: true)**: preserved with its original geometry IDs. Both shapes remain in the tree.
- **Cross-EI**: works — target and tool can be in different entity injections.
- **Chaining**: works — perform union(A, B), then union(A, C) to combine three shapes.
- **Non-overlapping shapes**: all three operations succeed silently (maxLevel=31). No error.

## Gotchas

- **NEVER pass the same shape ID as both target and tool.** This crashes the ClassCAD worker (infinite loop, 100% CPU). The worker must be killed with `kill -9`.
- **Open curves fail** with "Could not create plane with 3D curves". Both shapes must contain closed curves.
- **Different planes fail** with "Boolean operation failed with error 1001". Shapes must be coplanar.
- **Empty shapes fail** with NULLID error. Both shapes must have at least one curve.
- **Recalc invalidation** — see critical note above. The most common cause of unexpected NULLID failures.

## Common Errors

| Error Message | Cause |
|---|---|
| `"The parameter \"target\" must be provided"` | Missing target param |
| `"The parameter \"tool\" must be provided"` | Missing tool param |
| `"Provide only following id types: [\"shape\"]"` | Passed EI or part ID instead of shape ID |
| `"ToId()/TOID() didn't get an existing or valid id."` | Invalid or deleted shape ID |
| `NULLID not allowed` in `CADH_AddSolid` | Empty shape, or recalc triggered before boolean |
| `"Could not create plane with 3D curves"` | Open curves (not closed shapes) |
| `"Boolean operation failed with error 1001"` | Shapes in different planes |

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Two overlapping closed shapes
const s1 = (await api.v1.curve.shape({ id: eifId })).result
await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 30 })

const s2 = (await api.v1.curve.shape({ id: eifId })).result
await api.v1.curve.circle({ id: s2, centerPos: [40, 0, 0], radius: 30 })

// Union — MUST happen before any recalc/render/export
await api.v1.curve.union2d({ target: s1, tool: s2 })
// s1 now contains the union. s2 is consumed (deleted).

// Subtraction (with keepShape to preserve tool):
// await api.v1.curve.subtraction2d({ target: s1, tool: s2, keepShape: true })

// Intersection:
// await api.v1.curve.intersection2d({ target: s1, tool: s2 })

// Chaining — union three shapes:
// const s3 = ... (create third shape)
// await api.v1.curve.union2d({ target: s1, tool: s3 })

// Only recalc/render/export AFTER all booleans are done
```

## Related

- `curve.shape` — create the shape containers these operate on
- `curve.polyline2d` / `curve.circle` / `curve.advancedPolyline` — create closed curves inside shapes
- `curve.deleteShape` — manually delete shapes
- `solid.union` / `solid.subtraction` / `solid.intersection` — 3D boolean equivalents for solid bodies
