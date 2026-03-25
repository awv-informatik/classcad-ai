# part.deleteExpression

Deletes named expressions from a part.

## Prerequisites

- A part (`part.create`)
- Expressions created via `part.expression`

## Key Parameters

- `id` — part ID (required). Missing → result=null, code 1004. Invalid → result=null, code 1006.
- `toDelete` — array of **strings** (expression names). NOT objects — just names.

```js
// ✅ CORRECT
await api.v1.part.deleteExpression({
  id: partId,
  toDelete: ['width', 'height'],
})
```

## CRITICAL: Use `toDelete` Array

Same silent no-op trap as `updateExpression`:

```js
// ❌ WRONG — direct name param. Returns result=1, NO error, expression NOT deleted.
await api.v1.part.deleteExpression({ id: partId, name: 'width' })

// ❌ WRONG — string instead of array. At least this one errors (code 1001).
await api.v1.part.deleteExpression({ id: partId, toDelete: 'width' })
```

## Return Value

- **Success:** `result: 1` (numeric), `messages: []`, `maxLevel: 31`
- **Failure** (non-existent name): `result: 0`, `maxLevel: 51`, code 1014 "X does not exist and can not be deleted"
- **Parameter error** (missing id/toDelete type): `result: null`, `maxLevel: 51`

## Batch Behavior — ATOMIC

The `toDelete` array is **atomic**. If ANY name does not exist, the ENTIRE batch is rolled back — no expressions are deleted:

```js
// One bad name kills everything — 'a' and 'b' are NOT deleted
await api.v1.part.deleteExpression({
  id: partId,
  toDelete: ['a', 'doesNotExist', 'b'],
})
// result=0, a and b still exist
```

## Formula Inlining on Delete

When you delete an expression that is referenced by other expressions' formulas, the reference is **automatically inlined** with the current literal value:

```js
// Before: base=10, derived="base * 2" (value: 20)
await api.v1.part.deleteExpression({ id: partId, toDelete: ['base'] })
// After: base gone, derived="10 * 2" (value: 20)
// The formula was rewritten: "base" → "10"
```

This means derived expressions **survive** deletion of their dependencies. The formula is modified in-place to use the literal value at the time of deletion.

## Feature Survival

Deleting an expression used by a feature via `@expr.NAME` does NOT destroy the feature. The value is baked into the feature parameter. After `recalc()`, the geometry is preserved with the last known value.

## Edge Cases

- **Empty `toDelete: []`** — no-op, result=1.
- **Omitted `toDelete`** — no-op, result=1.
- **Duplicate names** — `['x', 'x']` succeeds (result=1). First occurrence deletes, second is silently ignored.
- **Delete order** — order does not matter for cross-referenced expressions. Both `['derived', 'base']` and `['base', 'derived']` succeed.
- **Recreate after delete** — works fine. Delete then `expression()` with same name succeeds.
- **Array param form** — does NOT work. Returns result=null, code 1001. Use separate calls per part.

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

// Recreate if needed
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'width', value: 200 }] })
```

## Related

- `part.expression` — create expressions (uses `toCreate` array)
- `part.getExpression` — read expression value and formula
- `part.updateExpression` — change value/formula (uses `toUpdate` array)
- `part.renameExpression` — rename expressions (uses `toRename` array)
