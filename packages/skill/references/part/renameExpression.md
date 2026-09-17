# part.renameExpression

Renames named expressions in a part. All formula references and bindings follow the new name.

## Key Parameters

- `id` — part ID (required)
- `toRename` — array of `{ name, newName }` objects

**Silent no-op trap** (same as update/delete): `renameExpression({ id, name: 'x', newName: 'y' })` returns result=1, NO error, and renames nothing.

## Return Value

- **Success:** `result: 1` (numeric), `maxLevel: 31`
- **Failure:** `result: 0`, `maxLevel: 51`, code 1014

## Formula Propagation

Formulas referencing the old name are auto-updated: `base=10`, `derived="base * 2"` → rename `base`→`foundation` → `derived` is `"foundation * 2"`, value still 20. Renaming an expression that HAS a formula preserves its formula unchanged.

Only whole names are rewritten: renaming `h`→`k` turns `depth * h + hh` into `depth * k + hh`. Another part's path (`Params.ExpressionSet.h`) is left alone.

## Bindings Follow the Rename

Every binding is rewritten to the new name and stays live: feature parameters bound with `@expr.NAME` or `linkWithExpression` (stored as `ExpressionSet.<newName>`) and sketch dimensions bound with `@expr.NAME`. E.g. after renaming `H`→`Height`, `box.height` references `ExpressionSet.Height`, and `updateExpression` on `Height` = 30 moves the box to height 30.

If bindings look frozen after a rename, check that the rename happened (`getExpression` with the new name): the direct `{ id, name, newName }` form returns result=1 and renames nothing.

## Batch Behavior — ATOMIC with Pre-Batch Validation

One failure rolls back all, and **all renames validate against the pre-batch state**:

- **No swaps:** `[{ name: 'a', newName: 'b' }, { name: 'b', newName: 'a' }]` fails — `b` already exists when the first rename is validated.
- **No chains:** `[{ name: 'a', newName: 'b' }, { name: 'b', newName: 'c' }]` fails for the same reason.
- **Swap workaround:** intermediate name across separate calls: `a→temp`, `b→a`, `temp→b`.

## Name Validation

Same rules as `expression()` creation: word characters only (`[a-zA-Z0-9_]`), non-digit first character, empty string rejected. Renaming to an existing name → error 1014 "X already exists" — including renaming to the **same** name (collision with itself, not a no-op).

## Edge Cases

- **Empty `toRename: []` or omitted** — no-op, result=1.
- **Non-existent name** — result=0, code 1014 "X does not exist and can not be renamed".
- **Array param form** works: `renameExpression([{ id, toRename: [...] }, ...])`.

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
