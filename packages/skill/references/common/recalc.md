# common.recalc

Forces a full recalculation of the entire drawing. No parameters (`recalc()` ≡ `recalc({})`), returns VOID. Safe on empty drawings, with geometry, or after any operation.

## Return Value

`result: null`, maxLevel 31, `messages: []` — always. The envelope carries the structure tree; `graphic` is null/absent in CLI context (recalc generates no mesh data).

## When recalc is NOT needed

These auto-recalculate: `part.closeFeature`, `part.updateExpression` (that part, then solves assemblies containing it), `part.linkWithExpression`, `part.unlinkExpression`, `sketch.updateGeometry`, `common.load` (OFB — drawing is consistent), feature creation (box, extrusion, …). `sketch.updateDimension` re-solves its sketch at once — but see below for a sketch an extrusion consumes.

## When recalc IS useful

- After manual state manipulation where consistency may be lost (e.g. batch operations modifying multiple features without close cycles).
- As a "just in case" call when unsure whether an operation recalculated — it is idempotent.
- In batch calls, to force a recalc between operations.
- **After `sketch.updateDimension` on a sketch an extrusion consumes.** The sketch re-solves at once, but `part.calculateMassProperties` kept the extrusion's old volume (width 80 → 100: still 80 000) until `common.recalc()` (→ 100 000).
- **After changing a value other parts read by path** (e.g. `Params.ExpressionSet.W`). `part.updateExpression` only regenerates the part it targets; `recalc()` re-evaluates every part. Each call is one pass, so a part reading a value through another consuming part needs a second call. See `recipes/assembly-parameters`.

## What recalc does not do

- **It does not run the assembly constraint solver.** Part geometry and work csys regenerate, but constrained instances keep their placement. If a mounting csys moved, follow with `part.updateExpression` on an instanced part or an update on the affected constraint — see `assembly/generic.md` → Constraint Solving.

## Gotchas

- **Invalidates curve shape IDs.** After `recalc()`, all shape IDs from `curve.shape()` are invalid; `curve.translateShape` / `rotateShape` / `scaleShape` / `transformShape` with them fail with 1006. **Do all shape transforms BEFORE recalc** — and before any visualization/export step, since render/export pipelines often recalc internally.
- **Renumbers brep and graphic ids of feature-built bodies.** After `recalc()` every face/edge id (`getGeometryIds`, graphic `edges`/`meshes`) and every graphic container id (`part.solids`) is new; an old edge id throws "invalid id". Re-query them. `CC_Solid`, sketch, feature and part ids survive.
- **Can destroy injected bodies.** In complex EIF sessions a recalc has destroyed the body (a sprocket blank minus many tools); a simple box − cylinder survived. Don't recalc in `solid.*` flows; keep `recalc: false` (the default) on `api.graphic()` and snapshots.

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
