# part.getExpression

Returns the current value and formula string of a named expression in a part.

## Prerequisites

- A part (`part.create`)
- An expression created via `part.expression` (otherwise returns "not found" — see below)

## Key Parameters

- `id` — part ID (required). Invalid or missing → `result: null`, maxLevel=51.
- `name` — expression name string (required). Case-sensitive — `MyVar` and `myvar` are different lookups.

## Return Value

**Two distinct result shapes:**

1. **Success / not found:** `result: { expression: string, value: number|null }`
   - Found (numeric value): `{ expression: "", value: 50 }`
   - Found (formula): `{ expression: "base * 2 + 10", value: 210 }`
   - Found (constant): `{ expression: "C:PI", value: 3.14159... }`
   - **Not found:** `{ expression: "", value: null }` — maxLevel=31, no error messages

2. **Parameter error:** `result: null` — maxLevel=51, with error messages (missing `id` or `name`, invalid ID)

## How to Detect "Not Found"

Check `result.value === null`. The result object is always returned (never null/VOID at the top level for valid params), and there is **no error** for non-existent names. This means:
- `value: null` → expression does not exist (or was deleted, or part has no expressions)
- `value: 0` → expression exists with value zero

Zero is a valid expression value. Do not confuse `value: 0` with "not found".

## Expression Field Behavior

| Created with | `expression` field | `value` field |
|---|---|---|
| Numeric (`value: 50`) | `""` (empty string) | `50` |
| Formula (`value: 'base * 2'`) | `"base * 2"` | evaluated result |
| Constant (`value: 'C:PI'`) | `"C:PI"` | `3.14159...` |
| Broken formula (`value: 'undefinedVar + 5'`) | `"undefinedVar + 5"` | `1` (seed value) |
| Circular ref (`value: 'b + 1'`) | `"b + 1"` | seed-pass result |

Constants like `C:PI` are stored as formula strings, not resolved to numeric at creation time.

## Timing: Values Update Immediately

`getExpression` reflects changes **immediately** after `updateExpression`. This includes:
- Direct value changes
- Formula changes (both `expression` and `value` update)
- Cascaded derived expressions (e.g., updating `base` immediately updates `derived = base * 2`)

Both expression values and feature geometry update immediately after `updateExpression` — no `recalc()` needed for either.

## Gotchas

- **No error for non-existent names.** Returns `{ expression: "", value: null }` with maxLevel=31. You must check `value === null` yourself.
- **Broken formulas are readable.** A formula referencing an undefined variable returns `value: 1` (seed value) with NO error on GET — only the original `expression()` call returned an error.
- **Empty string name is "not found", not an error.** `name: ''` returns `{ expression: "", value: null }` silently.
- **Case-sensitive.** `MyVar` ≠ `myvar` ≠ `MYVAR`.
- **After delete/rename:** Deleted or renamed-away names return the same "not found" response — no way to distinguish "never existed" from "was deleted" from "was renamed".

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'width', value: 100 },
    { name: 'halfWidth', value: 'width / 2' },
  ],
})

const r = await api.v1.part.getExpression({ id: partId, name: 'halfWidth' })
// r.result = { expression: "width / 2", value: 50 }

// Check if exists:
if (r.result.value === null) {
  console.log('Expression not found')
}
```

## Related

- `part.expression` — create expressions (returns result=1/0, not the value)
- `part.updateExpression` — change value/formula (uses `toUpdate` array)
- `part.deleteExpression` — remove (uses `toDelete` array)
- `part.renameExpression` — rename (uses `toRename` array with `{ name, newName }`)
