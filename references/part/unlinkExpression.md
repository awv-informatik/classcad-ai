# part.unlinkExpression

Disconnects an expression from a feature parameter or sketch dimension. The parameter **freezes at the expression's current value** — it does NOT revert to the original hard-coded value from feature creation.

## Prerequisites

- A feature or dimension with an expression-linked parameter (via `@expr.NAME` or `linkWithExpression`)

## Key Parameters

- `id` — **feature or dimension ID** (NOT the part ID). Must be type `feature` or `dimension`.
- `name` — feature parameter name to disconnect (e.g., `'height'`, `'length'`, `'diameter'`)

## Return Value

Always returns `result: null` (VOID). Check `maxLevel`:
- `maxLevel: 31` — success (or silent no-op)
- `maxLevel: 51` — error (missing params, wrong ID type)

## Freeze Behavior (CRITICAL)

After unlinking, the parameter becomes a plain value equal to the expression's value **at the moment of unlinking**:

```js
// Box created with height=40, then linked to H=120
await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
await api.v1.common.recalc()
// Box height is now plain value 120 (NOT 40)
// Updating H has no effect on the box anymore
```

This applies equally to params set with `@expr.NAME` at creation or linked via `linkWithExpression`.

## Gotchas

- **No validation on param name.** Unlinking a non-existent parameter (`'fakeParam'`) returns maxLevel=31 with no error. Silent no-op.
- **Unlinking a never-linked param** is also a silent success (maxLevel=31). No way to detect this.
- **Idempotent.** Double-unlinking (unlink an already-unlinked param) succeeds silently.
- **Requires `common.recalc()`** for geometry to update reliably after unlink.

## Re-linking After Unlink

After unlinking, you can re-link the same param to a different (or the same) expression:

```js
await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'B', name: 'height' })
await api.v1.common.recalc()
```

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| "wrong id type! Provide only following id types: ['feature','dimension']" | 1001 | Passed part ID |
| "name must be provided" | 1004 | Missing `name` |
| "id must be provided" | 1004 | Missing `id` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

await api.v1.part.expression({
  id: partId,
  toCreate: [{ name: 'H', value: 120 }],
})

const boxId = (await api.v1.part.box({
  id: partId, length: 80, width: 60, height: '@expr.H',
})).result
// Box height = 120 (driven by H)

// Disconnect — height freezes at 120
await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
await api.v1.common.recalc()

// Updating H no longer affects the box
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'H', value: 999 }] })
await api.v1.common.recalc()
// Box height is still 120
```

## Related

- `part.linkWithExpression` — connect an expression to a feature param (post-hoc)
- `@expr.NAME` syntax — bind expressions at feature creation time
- `part.expression` — create named expressions
