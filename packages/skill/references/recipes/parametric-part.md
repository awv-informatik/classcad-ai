# Recipe: A truly parametric part (expressions + constrained sketches)

How to build a model that **regenerates in-tree** when a master parameter changes —
not a script that must be re-run. Verified end-to-end on a 21→24-tooth sprocket
(tooth form, bore, keyway, hub, tapers, chamfer — all live).

## The architecture

```
expression graph  →  constrained sketches (@expr dimensions)  →  features  →  booleans
     (the parameters)      (the geometry logic)                 (the solid)
```

Everything the model should be able to change later flows through **sketch
dimensions bound to expressions**. Feature parameters play a supporting role only
(see liveness table below).

## 1. Create the expression graph first

```js
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'teeth',   value: 21 },
    { name: 'pitch',   value: 9.525 },                      // mm
    { name: 'pAng',    value: 'C:PI/teeth' },               // expressions reference expressions
    { name: 'Rp',      value: 'pitch/(2*sin(pAng))' },      // pitch radius — full derivation in-model
    { name: 'boreDia', value: 25.4 },
  ],
})
```

- **Only the `toCreate` array form creates expressions.** `part.expression({ id, name, value })`
  is a silent no-op (returns result=1, creates nothing) — see [part/expression](../part/expression.md).
- `C:PI` is the built-in π constant. Trig (`sin`, `cos`, …) works inside value strings.
- Change a parameter later with `part.updateExpression({ id, toUpdate: [{ name, value }] })` —
  the whole dependent chain recomputes and the model regenerates. The `toUpdate` array is
  REQUIRED: the bare `{ id, name, value }` form returns result=1 but changes NOTHING
  (silent no-op — see [part/updateExpression](../part/updateExpression.md)).

## 2. Constrained sketch with @expr dimensions

Create every sketch **with an explicit `planeId`** (a sketch without one has a dead
solver — every value-dimension then fails with "Couldn't set the value", see
[sketch/create](../sketch/create.md)). Then draw seed geometry roughly, constrain it,
and bind dimensions to expressions:

```js
const sk = (await api.v1.sketch.create({ id: partId, planeId: topPlaneId })).result
const c  = (await api.v1.sketch.circle({ id: sk, center: [0, 0], radius: 10 })).result
await api.v1.sketch.dimension({
  id: sk, type: 'DIAMETER', geomIds: [c],
  value: '@expr.boreDia',            // ← live binding; regenerates on updateExpression
})
```

- `@expr.NAME` works at creation AND via `updateDimension` — for length/distance/radius
  dims. **ANGLE dimensions reject `@expr`** (error 51); encode angles through geometry or
  constraints instead.
- Distance dims between points (HD/VD) are **unsigned and branch-keeping**: the solver
  stays on the seed's side. Seed the sketch near the intended solution.
- `sketch.getPositions` returns **world** coordinates, not sketch-local — map before
  comparing against your local math ([sketch/getPositions](../sketch/getPositions.md)).

## 3. What stays live through booleans — and what doesn't

Features get consumed (by patterns, by booleans). Liveness after consumption:

| Driven by | After consumption | Verdict |
|---|---|---|
| Sketch dimension (`@expr`) | regenerates exactly through extrusion → pattern copies → boolean → brep | ✅ use this for everything |
| `circularPattern` count/angle, **`merged: 1`** | fully live (single-brep tool; subtraction is count-independent) | ✅ always merge pattern-then-subtract |
| `circularPattern` count/angle, `merged: 0` | silently frozen; even explicit update reports success and changes nothing | ❌ avoid |
| Primitive feature param (e.g. cylinder `diameter: '@expr.D'`) | geometry **corrupts** on regen | ❌ route through a sketch instead |
| Edge-referenced chamfer/fillet downstream | tracks the regenerated topology | ✅ safe as tree tip |

## 4. Regeneration: step large parameter jumps

A constraint solver moves geometry minimally — after a **large** jump (e.g. teeth
21→24 changes the pitch radius by several mm) it can land on a mirrored/alternate
solution branch that satisfies every constraint but is not your design. Apply the
master parameter **stepwise**:

```js
for (const n of [22, 23, 24]) {
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'teeth', value: n }] })
}
```

Small parameter changes (bore 25.4→30, hub +20 %) regenerate exactly in one step.

## 5. Verify numerically after every regeneration

Don't trust success codes — several failure modes above report success. After a
regen, check volume and probe a known feature position: see
[recipes/verify-numerically](verify-numerically.md).

## Related

[part/expression-workflow](../part/expression-workflow.md) ·
[sketch/dimension](../sketch/dimension.md) · [part/circularPattern](../part/circularPattern.md) ·
[part/boolean](../part/boolean.md) · [SKETCHING](../SKETCHING.md)
