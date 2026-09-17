# common.recalc

Forces a full recalculation of the entire drawing. No parameters (`recalc()` ≡ `recalc({})`), returns VOID. Safe on empty drawings, with geometry, or after any operation.

## Return Value

`result: null`, maxLevel 31, `messages: []` — always. The envelope carries the structure tree; `graphic` is null/absent in CLI context (recalc generates no mesh data).

## When recalc is NOT needed

These auto-recalculate: `part.closeFeature`, `part.updateExpression` (that part, then solves assemblies containing it), `part.linkWithExpression`, `part.unlinkExpression`, `sketch.updateDimension`, `sketch.updateGeometry`, `common.load` (OFB — drawing is consistent), feature creation (box, extrusion, …).

## When recalc IS useful

- After manual state manipulation where consistency may be lost (e.g. batch operations modifying multiple features without close cycles).
- As a "just in case" call when unsure whether an operation recalculated — it is idempotent.
- In batch calls, to force a recalc between operations.
- **After changing a value other parts read by path** (e.g. `Params.ExpressionSet.W`). `part.updateExpression` only regenerates the part it targets; `recalc()` re-evaluates every part. Each call is one pass, so a part reading a value through another consuming part needs a second call. See `recipes/assembly-parameters`.

## What recalc does not do

- **It does not run the assembly constraint solver.** Part geometry and work csys regenerate, but constrained instances keep their placement. If a mounting csys moved, follow with `part.updateExpression` on an instanced part or an update on the affected constraint — see `assembly/generic.md` → Constraint Solving.

## Gotchas

- **Invalidates curve shape IDs.** After `recalc()`, all shape IDs from `curve.shape()` are invalid; `curve.translateShape` / `rotateShape` / `scaleShape` / `transformShape` with them fail with 1006. **Do all shape transforms BEFORE recalc** — and before any visualization/export step, since render/export pipelines often recalc internally.
- Solid, sketch, feature and part IDs survive recalc; the invalidation is specific to curve shape IDs.

## Common Errors

None observed — maxLevel 31 in every scenario tested (empty drawing, with geometry, after load, after clear, after partial clear with keepIds, while a feature is open).

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })

// Safe, but redundant here — geometry is already consistent
await api.v1.common.recalc()
```

## Related

`part.closeFeature` · `part.updateExpression` · `common.load` · `common.clear`
