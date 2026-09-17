# part.deleteExpression

Deletes named expressions from a part.

## Key Parameters

- `id` — part ID (required). Missing → result=null, code 1004. Invalid → result=null, code 1006.
- `toDelete` — array of **strings** (expression names), not objects.

**Silent no-op trap** (same as `updateExpression`): `deleteExpression({ id, name: 'width' })` returns result=1, NO error, and deletes nothing. `toDelete: 'width'` (string, not array) at least errors (code 1001).

## Return Value

- **Success:** `result: 1` (numeric), `messages: []`, `maxLevel: 31`
- **Non-existent name:** `result: 0`, `maxLevel: 51`, code 1014
- **Parameter error** (missing id / wrong toDelete type): `result: null`, `maxLevel: 51`

## Batch Behavior — ATOMIC

If ANY name does not exist, the ENTIRE batch is rolled back: `toDelete: ['a', 'doesNotExist', 'b']` → result=0, `a` and `b` still exist.

## Formula Inlining on Delete

References to a deleted expression in other formulas are **rewritten in place with its literal value at deletion time**, so derived expressions survive:

```js
// Before: base=10, derived="base * 2" (value 20)
await api.v1.part.deleteExpression({ id: partId, toDelete: ['base'] })
// After: base gone, derived="10 * 2" (value 20)
```

## Feature Survival

Deleting an expression used by a feature via `@expr.NAME` or `linkWithExpression` does NOT destroy the feature. The parameter freezes at the expression's last value (same as unlink). No warning is emitted about orphaned feature bindings.

## Edge Cases

- **Empty `toDelete: []` or omitted** — no-op, result=1.
- **Duplicate names** — `['x', 'x']` succeeds (result=1); first occurrence deletes, second silently ignored.
- **Delete order** doesn't matter for cross-referenced expressions: `['derived', 'base']` and `['base', 'derived']` both succeed.
- **Recreate after delete** with the same name works.
- **Array param form** works: `deleteExpression([{ id: partA, toDelete: [...] }, { id: partB, toDelete: [...] }])`.

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| "X does not exist and can not be deleted" | 1014 | Expression name not found |
| "id must be provided" | 1004 | Missing `id` parameter |
| "invalid id" | 1006 | Bogus id string |
| "toDelete has the wrong type" | 1001 | Passed string instead of array |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'width', value: 100 },
    { name: 'height', value: 50 },
    { name: 'area', value: 'width * height' },
  ],
})

// Delete width — area formula gets inlined to "100 * height"
await api.v1.part.deleteExpression({ id: partId, toDelete: ['width'] })

// Delete multiple
await api.v1.part.deleteExpression({ id: partId, toDelete: ['height', 'area'] })

// Recreate
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'width', value: 200 }] })
```

## Related

`part.expression` · `part.getExpression` · `part.updateExpression` · `part.renameExpression`
