# curve.union2d / subtraction2d / intersection2d

2D booleans on shape containers. All three share signature and behavior; only the geometric operation differs.

## CRITICAL: No Recalc Before Boolean

**A recalc (`common.recalc` directly, or indirectly via render/visualization or export) between shape creation and a 2D boolean invalidates the shapes' internal solid body references.** The boolean then fails with `NULLID not allowed` in `CADH_AddSolid` — not recoverable (`openFeature` doesn't fix it). This is the most common cause of unexpected NULLID failures. **Do all 2D booleans BEFORE any recalc-triggering call.**

## Key Parameters

- `target` (required) — shape ID (not EI or part ID), modified in place.
- `tool` (required) — shape ID, consumed (deleted) by default.
- `keepShape` (optional, default `false`) — `true` preserves the tool.

Both shapes need **closed curves** (circles, closed polylines/advancedPolylines), must be **coplanar**, and must contain at least one curve.

## Return Value

`VOID` (null), maxLevel=31, no messages.

## Behavior

- **Target:** same shape ID, geometry ID and name; bounding box updates.
- **Tool:** removed from the structure tree by default (EI children shrink); with `keepShape: true` kept with its original geometry IDs.
- **Cross-EI** works (target and tool in different EIs). **Chaining** works: union(A, B) then union(A, C).
- **Non-overlapping shapes:** all three succeed silently (maxLevel=31).
- **Same shape as target and tool is rejected** (all three): maxLevel 51, `"A boolean operation requires distinct target and tool entities (the same id was given for both)."`, target preserved (previously hung the worker).

## Common Errors

| Error Message | Cause |
|---|---|
| `"The parameter \"target\" must be provided"` / `"...\"tool\" must be provided"` | Missing param |
| `"Provide only following id types: [\"shape\"]"` | EI or part ID instead of shape ID |
| `"ToId()/TOID() didn't get an existing or valid id."` | Invalid or deleted shape ID |
| `NULLID not allowed` in `CADH_AddSolid` | Empty shape, or recalc triggered before boolean |
| `"Could not create plane with 3D curves"` | Open curves |
| `"Boolean operation failed with error 1001"` | Shapes in different planes |

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

const s1 = (await api.v1.curve.shape({ id: eifId })).result
await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 30 })
const s2 = (await api.v1.curve.shape({ id: eifId })).result
await api.v1.curve.circle({ id: s2, centerPos: [40, 0, 0], radius: 30 })

// MUST happen before any recalc/render/export; s1 = union, s2 consumed
await api.v1.curve.union2d({ target: s1, tool: s2 })
// Same call shape: subtraction2d({ target, tool, keepShape: true }), intersection2d({ target, tool })
```

## Related

`curve.shape` · `curve.polyline2d` / `curve.circle` / `curve.advancedPolyline` · `curve.deleteShape` · `solid.union` / `solid.subtraction` / `solid.intersection`
