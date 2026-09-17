# curve.circle

Creates one or more circles in a shape container (`curve.shape` inside `part.entityInjection`).

## Key Parameters

- `id` (required) — shape ID (not part or EI)
- `centerPos` (required) — `[x, y, z]`, exactly 3 elements (no 2D shorthand)
- `radius` (required) — must be > 0; `radius <= 0` → code 1014
- `normal` (optional) — plane normal, default `[0, 0, 1]` (XY). Auto-normalized (non-unit and very small like `[0, 0, 0.001]` work); negative flips orientation.
- `xAxis` (optional) — seam/parametric start direction, default `[1, 0, 0]`. **Must be orthogonal to `normal`**, else `The parameter "normal" and "xAxis" must be orthogonal.` — so a normal of `[1, 0, 0]` needs an explicit `xAxis` such as `[0, 1, 0]`.

| normal | Plane |
|---|---|
| `[0, 0, 1]` | XY (default) |
| `[1, 0, 0]` | YZ (with `xAxis` `[0, 1, 0]`) |
| `[0, 1, 0]` | XZ (with `xAxis` `[1, 0, 0]`) |
| `[1, 1, 1]` | tilted (auto-normalized; needs an orthogonal `xAxis`, e.g. `[1, -1, 0]`) |
| `[0, 0, -1]` | XY, flipped orientation |

## Return Value

VOID (null), maxLevel 31. No ID — circles share a geometry entry in the shape's `geometryIdList`.

## Batch Creation

Pass an array of parameter objects (may mix shape IDs). Single VOID response; **errors are per-item** — one bad entry doesn't block valid ones; maxLevel reflects the worst.

## Gotchas

- **`radius <= 0` is rejected** (code 1014, maxLevel 51, `"The parameter \"radius\" must be greater than 0."`).
- **Zero normal `[0, 0, 0]` silently succeeds** (maxLevel 31); plane unclear, possibly `[0, 0, 1]`. Don't rely on it.
- **No individual circle IDs** — can't address, update, or delete one circle; only the whole shape (`curve.deleteShape` / `curve.cleanShape`).

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1001 | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Part/EI ID instead of shape ID |
| 1004 | `"The parameter \"<centerPos\|radius\|id>\" must be provided..."` | Missing parameter |
| 1014 | `"The parameter \"radius\" must be greater than 0."` | `radius <= 0` |
| 0 | `"...must have exactly 3 real values"` | Point not exactly 3 elements |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result

// XY plane (defaults)
await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 20 })

// YZ plane — xAxis must be orthogonal to the normal
await api.v1.curve.circle({ id: shapeId, centerPos: [50, 0, 0], radius: 15, normal: [1, 0, 0], xAxis: [0, 1, 0] })

// Batch
await api.v1.curve.circle([
  { id: shapeId, centerPos: [0, 30, 0], radius: 10 },
  { id: shapeId, centerPos: [30, 30, 0], radius: 5 },
])
```

## Related

`curve.shape` · `curve.line` · `curve.deleteShape` / `curve.cleanShape`
