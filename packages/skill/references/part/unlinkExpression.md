# part.unlinkExpression

Disconnects an expression from a feature parameter or sketch dimension (bound via `@expr.NAME` or `linkWithExpression`). The parameter **freezes at the expression's value at the moment of unlinking** — it does NOT revert to the original hard-coded value from creation (box created with height=40, linked to H=120, unlinked → plain height 120, not 40; updating H no longer affects it).

## Key Parameters

- `id` — **feature or dimension ID** (NOT the part ID)
- `name` — parameter name to disconnect (e.g. `'height'`, `'length'`, `'diameter'`)

## Return Value

Always `result: null` (VOID). Check `maxLevel`:
- `31` — success (or silent no-op)
- `51` — error (missing params, wrong ID type)

## Gotchas

- **No validation, silent success:** a non-existent parameter (`'fakeParam'`), a never-linked param, and double-unlinking all return maxLevel=31 with no error — no way to detect them.
- **Geometry updates immediately** — no `common.recalc()` needed.
- **Re-linking after unlink** to a different (or the same) expression works via `linkWithExpression`.

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| "wrong id type! Provide only following id types: ['feature','dimension']" | 1001 | Passed part ID |
| "name must be provided" | 1004 | Missing `name` |
| "id must be provided" | 1004 | Missing `id` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 120 }] })

const boxId = (await api.v1.part.box({
  id: partId, length: 80, width: 60, height: '@expr.H',
})).result
// height = 120, driven by H

// Disconnect — height freezes at 120
await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })

// No longer affects the box — height stays 120
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'H', value: 999 }] })
```

## Related

`part.linkWithExpression` · `@expr.NAME` · `part.expression`
