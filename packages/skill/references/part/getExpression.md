# part.getExpression

Returns the current value and formula string of a named expression in a part.

## Key Parameters

- `id` — part ID (required). Invalid or missing → `result: null`, maxLevel=51.
- `name` — expression name (required). Case-sensitive: `MyVar` ≠ `myvar` ≠ `MYVAR`.

## Return Value

- **Found or not found:** `result: { expression: string, value: number|null }`, maxLevel=31
- **Parameter error** (missing `id`/`name`, invalid ID): `result: null`, maxLevel=51, with error messages

| Created with | `expression` | `value` |
|---|---|---|
| Numeric (`value: 50`) | `""` | `50` |
| Formula (`value: 'base * 2 + 10'`) | `"base * 2 + 10"` | evaluated result (e.g. `210`) |
| Constant (`value: 'C:PI'`) | `"C:PI"` (stored as formula, not resolved at creation) | `3.14159...` |
| Broken formula (`value: 'undefinedVar + 5'`) | `"undefinedVar + 5"` | `1` (seed value) |
| Circular ref (`value: 'b + 1'`) | `"b + 1"` | seed-pass result |
| **Not found** | `""` | `null` |

## Detecting "Not Found"

Check `result.value === null` — there is **no error** for non-existent names (maxLevel=31, no messages). `value: 0` is a valid existing expression; don't confuse it with not found.

- Empty name `''` → "not found", not an error.
- Deleted, renamed-away, and never-existing names all return the same response — no way to distinguish them.
- Broken formulas are readable with NO error on GET — only the original `expression()` call returned an error.

## Timing

Reflects `updateExpression` changes **immediately** — direct values, formula changes (both fields update), and cascaded derived expressions (updating `base` immediately updates `derived = base * 2`). Feature geometry updates immediately too; no `recalc()` needed for either.

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

if (r.result.value === null) {
  console.log('Expression not found')
}
```

## Related

`part.expression` · `part.updateExpression` · `part.deleteExpression` · `part.renameExpression`
