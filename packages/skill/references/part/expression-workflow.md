# Expression Workflow (End-to-End)

Building fully parametric models: create expressions → bind to features → update → geometry changes.

## Three Binding Types

| Type | Syntax | Live? | When to use |
|---|---|---|---|
| Inline formula | `height: '30 + 30'` | **No** — evaluated once at creation, a dead string | One-off computed values that never change |
| @expr reference | `height: '@expr.H'` | **Yes** | Bind at feature creation time |
| linkWithExpression | `linkWithExpression({ id: featureId, exprName: 'H', name: 'height' })` | **Yes** | Bind after feature creation (post-hoc) |

**@expr and linkWithExpression are functionally equivalent** live bindings: both respond to `updateExpression` immediately.

## Update Behavior

- **Immediate, no `common.recalc()`:** one `updateExpression` call updates expression values, derived expressions, and feature geometry **of that part**.
- **Cascade:** derived expressions follow their dependencies (`base`=50 → 80 makes `doubled = base * 2` 160 and `tripled = base * 3` 240), and every feature bound to them updates — the full chain base expr → derived expr → feature param → geometry.
- **Sharing:** one expression can drive multiple features, across feature types (e.g. box and cylinder); a single update changes all of them.
- **WCS:** offsets accept @expr in string-encoded arrays (`offset: '[0, 0, @expr.spacing]'`); updating the expression moves the WCS and everything placed on it.
- **Other parts are not part of that update.** Values shared by several parts of an assembly (assemblies host no expressions): `recipes/assembly-parameters`.

## Link / Unlink

- `linkWithExpression` can bind several params of one feature (`length`→L, `width`→W, `height`→H).
- **Unlink freezes at the expression's current value, not the original.** Box created with height=40, linked to H=120, then unlinked → plain height=120; updating H no longer affects it.
- After unlinking you can re-link to a different expression.

## Gotchas

- **@expr on boolean-consumed features.** Sketch-dimension bindings and `circularPattern` with `merged: 1` regenerate through booleans. A consumed `part.cylinder` with `diameter: '@expr.D'` in a single subtraction also updates correctly (D 10→20: volume and hole position exact). One complex model (a sprocket with patterns and several booleans) showed a wrong partial regeneration of a consumed primitive; when a boolean chain gets complex, verify volume after updates. With `merged: 0`, a consumed pattern does not regenerate correctly on count changes (the subtraction was lost) — use `merged: 1`. See `part/boolean.md`.
- **@expr also works in sketch dimension values**, including ANGLE (expression in radians) — see `sketch/dimension.md`.
- **Vectors take expressions as one string.** `offset: '[0, 0, @expr.H]'`, `position: '[@expr.X, 0, 0]'` work and stay live; `['@expr.X', 0, 0]` (expression inside a JS array) fails with a type error.
- **Deleting a linked expression does NOT destroy the feature.** The parameter freezes at the expression's last value (same as unlink). No warning is emitted.
- **Renaming keeps bindings live.** `@expr` and `linkWithExpression` bindings (and sketch dimensions) are rewritten to the new name.
- **linkWithExpression silently accepts bad param names.** Linking to `'fakeParam'` returns success. Always verify parameter names.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Model' })).result

// Define ALL dimensions as expressions (master + derived)
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'plateL', value: 100 },
    { name: 'plateW', value: 80 },
    { name: 'thick', value: 10 },
    { name: 'wallH', value: 'plateL * 0.6' },
    { name: 'H', value: 120 },
  ],
})

// Build features using @expr
await api.v1.part.box({ id: partId, name: 'Plate',
  length: '@expr.plateL', width: '@expr.plateW', height: '@expr.thick' })

const wcs = (await api.v1.part.workCSys({ id: partId, name: 'WallOrigin',
  offset: '[0, 0, @expr.thick]' })).result

await api.v1.part.box({ id: partId, name: 'Wall', references: [wcs],
  length: '@expr.thick', width: '@expr.plateW', height: '@expr.wallH' })

// Post-hoc: plain values first, bind later
const blockId = (await api.v1.part.box({ id: partId, name: 'Block', length: 80, width: 60, height: 40 })).result
await api.v1.part.linkWithExpression({ id: blockId, exprName: 'H', name: 'height' }) // height → 120
await api.v1.part.unlinkExpression({ id: blockId, name: 'height' })                  // frozen at 120, not 40

// Resize: update master expressions (geometry updates automatically)
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'plateL', value: 200 }] })
// wallH→120, WCS moves, wall resizes
```

## Related

`part.expression` · `part.getExpression` · `part.updateExpression` · `part.deleteExpression` · `part.renameExpression` · `part.linkWithExpression` · `part.unlinkExpression` · `common.recalc` · `assembly/generic.md`
