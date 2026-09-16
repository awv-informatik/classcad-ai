# part.renameExpression

Renames existing named expressions in a part. Auto-updates all formula references to the renamed expression.

## Prerequisites

- A part (`part.create`)
- Expressions created via `part.expression`

## Key Parameters

- `id` — part ID (required)
- `toRename` — array of `{ name, newName }` objects

```js
await api.v1.part.renameExpression({
  id: partId,
  toRename: [
    { name: 'w', newName: 'width' },
    { name: 'h', newName: 'height' },
  ],
})
```

## CRITICAL: Use `toRename` Array

Same silent no-op trap as update/delete:

```js
// ❌ WRONG — direct params. Returns result=1, NO error, NOT renamed.
await api.v1.part.renameExpression({ id: partId, name: 'x', newName: 'y' })
```

## Return Value

- **Success:** `result: 1` (numeric), `maxLevel: 31`
- **Failure:** `result: 0`, `maxLevel: 51`, code 1014

## Formula Propagation

Renaming auto-updates all formulas that reference the old name:

```js
// base=10, derived="base * 2"
await api.v1.part.renameExpression({
  id: partId,
  toRename: [{ name: 'base', newName: 'foundation' }],
})
// derived formula is now "foundation * 2" (auto-updated), value still 20
```

Renaming an expression that HAS a formula preserves the formula unchanged.

## Batch Behavior — ATOMIC with Pre-Batch Validation

The `toRename` array is atomic (one failure rolls back all), and **all renames validate against the pre-batch state**. This means:

- **No swaps:** `[{ name: 'a', newName: 'b' }, { name: 'b', newName: 'a' }]` fails because `b` already exists when the first rename is validated.
- **No chains:** `[{ name: 'a', newName: 'b' }, { name: 'b', newName: 'c' }]` fails for the same reason.
- **Workaround for swap:** Use an intermediate name across separate calls: `a→temp`, then `b→a`, then `temp→b`.

## Name Validation

Same rules as `expression()` creation:
- Must contain only word characters (`[a-zA-Z0-9_]`)
- Must start with a non-digit character
- Empty string is rejected
- **Cannot rename to an existing name** — error 1014 "X already exists"
- **Cannot rename to the same name** — treated as a collision with itself (error, not a no-op)

## Bindings Follow the Rename

Every binding to the expression is rewritten to the new name and stays live: feature parameters bound with `@expr.NAME` or `linkWithExpression` (stored as `ExpressionSet.<newName>`) and sketch dimensions bound with `@expr.NAME`.

```js
await api.v1.part.renameExpression({ id: partId, toRename: [{ name: 'H', newName: 'Height' }] })
// box.height now references ExpressionSet.Height
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'Height', value: 30 }] })
// box follows → height 30
```

If bindings look frozen after a rename, check that the rename happened (`getExpression` with the new name): the direct `{ id, name, newName }` form returns result=1 and renames nothing.

## Edge Cases

- **Empty `toRename: []`** — no-op, result=1.
- **Omitted `toRename`** — no-op, result=1.
- **Non-existent name** — result=0, code 1014 "X does not exist and can not be renamed".
- **Array param form** — works: `renameExpression([{ id, toRename: [...] }, ...])`.

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| "X does not exist and can not be renamed" | 1014 | Old name not found |
| "X already exists" | 1014 | New name collides with existing expression |
| "must contain only word characters" | 1014 | Invalid chars in newName |
| "must start with a non-digit word character" | 1014 | newName starts with digit or is empty |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'w', value: 100 },
    { name: 'h', value: 50 },
    { name: 'area', value: 'w * h' },
  ],
})

// Rename short names to descriptive ones — formulas auto-update
await api.v1.part.renameExpression({
  id: partId,
  toRename: [
    { name: 'w', newName: 'width' },
    { name: 'h', newName: 'height' },
  ],
})
// getExpression('area') → { expression: "width * height", value: 5000 }
```

## Related

`part.expression` · `part.getExpression` · `part.updateExpression` · `part.deleteExpression`
