# part.expression

Creates named expressions (parametric variables) inside a part. Expressions can hold numeric values or formula strings that reference other expressions, math functions, and constants.

## Prerequisites

- A part (`part.create`)

## Key Parameters

- `id` — part ID (from `part.create`). Accepts partId directly.
- `toCreate` — array of `{ name, value }` objects. Both `name` and `value` are required in each item.
  - `name` — string, must match `[a-zA-Z_][a-zA-Z0-9_]*` (word characters, starts with letter or underscore). Spaces, dashes, dots, leading digits all fail.
  - `value` — `real` or `string`. Numbers are stored directly. Strings are formula expressions (e.g., `'base * 2'`, `'sqrt(x)'`, `'C:PI'`).
- `param` can be an array of objects for batch creation: `[{ id, toCreate }, { id, toCreate }]`.

## Return Value

- `result` — numeric `1` on success, `0` on failure. **Not boolean** despite docs saying `boolean`.
- On certain errors (missing required params), `result` is `null`.

## Gotchas

- **Named expressions CANNOT be used directly in feature parameters.** Passing `'myExpr'` as a box `length` fails with "Could not convert api params." Inline formulas (`'3*40'`) work, but named references require `linkWithExpression`.
- **Duplicate names fail** with error code 1014. Use `updateExpression` to change an existing expression's value.
- **Empty or missing `toCreate`** is a silent no-op (returns 1, no error).
- **Dependent formulas work in one call** — if `toCreate: [{ name: 'w', value: 50 }, { name: 'h', value: 'w * 2' }]`, the dependency is resolved in array order.
- **Invalid formulas fail loudly** — non-existent refs, syntax errors, division by zero all return `result: 0`, maxLevel 51.
- **Error messages accumulate** within a session. Later calls may show error messages from earlier failed expressions.
- **Self-referencing formulas** (e.g., `d = d + 1`) don't error on creation but produce undefined behavior. Avoid.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1014 | "X already exists" | Duplicate expression name |
| 1004 | "value must be provided" | Missing `value` in toCreate item |
| 0 | "Datamember X not found" | Formula references non-existent expression |
| 0 | "is not a valid expression" | Syntax error in formula |
| 0 | "Division by zero!" | Formula divides by zero |
| 0 | "must start with a non-digit word character" | Invalid expression name |
| 0 | "must contain only word characters" | Invalid characters in name |

## ExpressionSet ID

Expressions live in an ExpressionSet node in the structure tree. For a default part (partId=4), the ExpressionSet ID is **6**. To resolve named expressions with `evaluateExpression`, pass the ExpressionSet ID (not the partId) as the `id` parameter.

The ExpressionSet ID is available in the structure tree: `structure.tree[partId].expressionSet`.

In the structure tree, each expression appears as a member with `{ value, type, visible, expression }`:
- `value` — the evaluated numeric result
- `expression` — the formula string (empty for direct numeric values)

## Usage Hints

- Use `evaluateExpression` with `id: 6` (ExpressionSet ID) to read expression values.
- All values are numeric (`type: "real"`) — no string or boolean expression types.
- Edge-case values (0, negatives, decimals, 1e15, 1e-10) all work fine.
- Formula values support the full expression syntax: arithmetic, functions (`sqrt`, `sin`, `abs`, etc.), and constants (`C:PI`).

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

// Create expressions — base values and derived formulas
const r = await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'width', value: 80 },
    { name: 'height', value: 'width * 1.5' },
    { name: 'angle', value: 'C:PI / 4' },
  ],
})
// r.result → 1 (success)

// Read back via evaluateExpression (use ExpressionSet ID 6, not partId)
const val = await api.v1.common.evaluateExpression({ expression: 'height', id: 6 })
// val.result → 120
```

## Related

- `part.getExpression` — read an expression's current value
- `part.updateExpression` — change an expression's value
- `part.deleteExpression` — remove an expression
- `part.renameExpression` — rename an expression
- `part.linkWithExpression` — connect a named expression to a feature parameter
- `part.unlinkExpression` — disconnect an expression from a feature parameter
- `common.evaluateExpression` — evaluate expressions (standalone or named)
