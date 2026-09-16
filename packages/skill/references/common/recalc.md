# common.recalc

Forces a full recalculation of the entire drawing and all its objects. Takes no parameters, returns VOID.

## Prerequisites

- None — safe to call on empty drawings, with geometry, or after any operation.

## Key Parameters

None. Call with `recalc()` or `recalc({})` — both are identical.

## Return Value

- `result: null` (VOID) — always
- `maxLevel: 31` (info) — always, even on empty drawings
- `messages: []` — no messages observed in any scenario
- `structure` — full object tree is returned in the envelope
- `graphic` — always null/absent in CLI context

## When recalc is NOT needed

Most ClassCAD operations auto-recalculate. You almost never need to call `recalc()` explicitly:

| Operation | Auto-recalculates? | recalc needed? |
|---|---|---|
| `part.closeFeature` | Yes | No |
| `part.updateExpression` | Yes — that part, then solves assemblies containing it | No |
| `part.linkWithExpression` | Yes | No |
| `part.unlinkExpression` | Yes | No |
| `sketch.updateDimension` | Yes | No |
| `sketch.updateGeometry` | Yes | No |
| `common.load` (OFB) | Yes — drawing is consistent | No |
| Feature creation (box, extrusion, etc.) | Yes | No |

## When recalc IS useful

- **After manual state manipulation** where internal consistency may be lost (e.g., custom batch operations modifying multiple features without close cycles)
- **As a "just in case" safety call** when you're unsure if a prior operation triggered recalculation — it's safe and idempotent
- **In batch calls** to force a recalc between other operations
- **After changing a value other parts read by path** (e.g. `Params.ExpressionSet.W`). `part.updateExpression` only regenerates the part it targets; `recalc()` re-evaluates every part. Each call is one pass, so a part reading a value through another consuming part needs a second call. See `recipes/assembly-parameters`.

## What recalc does not do

- **It does not run the assembly constraint solver.** Part geometry and work csys regenerate, but constrained instances keep their placement. If a mounting csys moved, follow with `part.updateExpression` on an instanced part or an update on the affected constraint — see `assembly/generic.md` → Constraint Solving.

## Gotchas

- **Invalidates curve shape IDs.** This is the main hazard. After calling `recalc()`, all shape IDs from `curve.shape()` become invalid. Any `curve.translateShape`, `curve.rotateShape`, `curve.scaleShape`, or `curve.transformShape` call using those IDs will fail with error 1006. **Always do all shape transforms BEFORE calling recalc.**
- **Render/export pipelines often trigger recalc internally.** Shape transforms must also happen before any visualization or export step, not just before explicit `recalc` calls.
- **Solid IDs, sketch IDs, feature IDs, and part IDs all survive recalc.** The invalidation bug is specific to curve domain shape IDs only.
- **Idempotent.** Calling recalc multiple times in a row is safe and produces identical results every time.
- **No graphic data.** Recalc does not generate graphic/mesh data in CLI context. It returns the structure tree but not rendering data.

## Common Errors

None observed. Recalc always succeeds with maxLevel=31 in every scenario tested (empty drawing, with geometry, after load, after clear, after partial clear with keepIds, while a feature is open, etc.).

## Working Example

```js
// Typical usage — rarely needed standalone
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })

// Safe to call, but redundant here — geometry is already consistent
await api.v1.common.recalc()

// In batch context:
await api.v1.common.batch({
  jobs: [
    { api: 'v1.common.recalc' },
    { api: 'v1.common.getAppVersion' },
  ]
})
```

## Related

`part.closeFeature` · `part.updateExpression` · `common.load` · `common.clear`
