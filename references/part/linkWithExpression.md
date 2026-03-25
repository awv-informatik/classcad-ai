# part.linkWithExpression

Connects a named expression to a feature parameter or sketch dimension **after** the feature was already created. This is the post-hoc alternative to using `@expr.NAME` at creation time.

## Prerequisites

- A part with an expression (`part.expression`)
- A feature or sketch dimension already created

## Key Parameters

- `id` — **feature or dimension ID** (NOT the part ID). Must be type `feature` or `dimension`. Using the part ID gives error 1001 "wrong id type".
- `exprName` — name of the expression to link (must exist in the part's expression set)
- `name` — feature parameter name to bind (e.g., `'height'`, `'length'`, `'diameter'`)

## Return Value

Always returns `result: null` (VOID). Check `maxLevel` for success/failure:
- `maxLevel: 31` — success (or silent no-op for bad param name)
- `maxLevel: 51` — error (missing params, wrong ID type, non-existent expression)

## Gotchas

- **No validation on param name.** Linking to a non-existent parameter name (`'fakeParam'`) returns maxLevel=31 (success) with NO error. The link silently does nothing. Always double-check parameter names.
- **Non-existent expression name** gives maxLevel=51 with "Datamember X not found" but still returns VOID (not a distinct error shape).
- **Requires `common.recalc()`** for geometry to update reliably. The link may appear to take effect during rendering, but always call recalc explicitly.

## Re-linking

Can re-link a parameter that is already expression-bound — either via `@expr.NAME` at creation or via a prior `linkWithExpression` call. No need to unlink first.

```js
// Link to A, then switch to B — both succeed
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'A', name: 'height' })
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'B', name: 'height' })
```

## Multiple Params

Can link multiple params of the same feature to different (or the same) expressions:

```js
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'L', name: 'length' })
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'W', name: 'width' })
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'S', name: 'height' })
await api.v1.common.recalc()
```

Same expression can drive multiple params: `{ exprName: 'S', name: 'length' }` and `{ exprName: 'S', name: 'height' }` both work.

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| "wrong id type! Provide only following id types: ['feature','dimension']" | 1001 | Passed part ID instead of feature/dimension ID |
| "exprName must be provided" | 1004 | Missing `exprName` |
| "name must be provided" | 1004 | Missing `name` |
| "id must be provided" | 1004 | Missing `id` |
| "Datamember X not found" | 0 | Expression name doesn't exist |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'H', value: 120 },
    { name: 'D', value: 80 },
  ],
})

// Create features with plain values
const boxId = (await api.v1.part.box({
  id: partId, length: 80, width: 60, height: 40,
})).result

// Later, bind height to expression H
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
await api.v1.common.recalc()
// Box height is now 120, driven by expression H

// Update H → box updates too
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'H', value: 200 }] })
await api.v1.common.recalc()
// Box height is now 200
```

## Related

- `part.unlinkExpression` — disconnect an expression from a feature param (freezes current value)
- `part.expression` — create named expressions
- `@expr.NAME` syntax — bind expressions at feature creation time (alternative to linkWithExpression)
