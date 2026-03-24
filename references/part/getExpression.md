# part.getExpression

Returns a single expression entry from a part by name, including both the stored expression text and its current evaluated numeric value.

## Prerequisites

- A part (`part.create`)
- At least one expression created via `part.expression` (otherwise lookup can soft-miss)

## Key Parameters

- `id` — **part ID** (required). Must be an ID of type `part`.
- `name` — expression name (required, case-sensitive).

## Return Value

`result` is either:

- `{ expression: string, value: real|VOID }`
- or `null` on hard parameter/type errors

Observed payload patterns:

- Literal numeric expression (`value: 42` at creation): `{ expression: "", value: 42 }`
- Formula expression (`value: 'base * 2 + 5'`): `{ expression: "base * 2 + 5", value: 25 }`
- Missing expression name: `{ expression: "", value: null }` (soft miss)

## Gotchas

- **Missing expression is not treated as an error.** You get `value: null` with success severity (`maxLevel: 31`) and no error messages.
- **Name lookup is case-sensitive.** `Width` and `width` are different names.
- **Wrong ID type hard-fails.** If you pass a feature ID instead of a part ID, the call fails with code `1001`.

## Common Errors

| Error | Code | Meaning |
|---|---:|---|
| `The parameter "id" has a wrong id type! Provide only following id types: ["part"]` | 1001 | `id` is not a part ID |

## Usage Hints

- Treat `value: null` as "expression not found" (soft miss), not success with numeric zero.
- If you need strict existence checks, add an explicit null check on `result.value`.
- For lifecycle checks, `getExpression` is useful right after `updateExpression`, `renameExpression`, and `deleteExpression`.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ExprReadback' })).result

await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'base', value: 10 },
    { name: 'height', value: 'base * 2 + 5' },
  ],
})

const r = await api.v1.part.getExpression({ id: partId, name: 'height' })
// r.result -> { expression: 'base * 2 + 5', value: 25 }

const miss = await api.v1.part.getExpression({ id: partId, name: 'HEIGHT' })
// miss.result -> { expression: '', value: null }  (soft miss)
```

## Related

- `part.expression` — create expressions
- `part.updateExpression` — update expression values/formulas
- `part.renameExpression` — rename expression symbols
- `part.deleteExpression` — remove expressions
