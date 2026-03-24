# part.expression

Creates named expressions (parametric variables) inside a part. Expressions are numeric values or formulas that can reference each other and drive feature parameters via the `@expr.NAME` syntax.

## Prerequisites

- A part (`part.create`)

## Key Parameters

- `id` — part ID (required)
- `toCreate` — array of `{ name, value }` objects (required for each item, but array itself can be empty/omitted for a no-op)
  - `name` — string, word chars only (`[a-zA-Z_][a-zA-Z0-9_]*`). Must start with a non-digit. Spaces and special chars are rejected (error 1014).
  - `value` — `real | string`. Numbers are stored directly. Strings are parsed as math expressions (e.g., `'width * 2'`, `'C:PI * pow(radius, 2)'`).

## Param Form

The `param` argument accepts both a single object and an array of objects (each with its own `id` and `toCreate`). Array form allows creating expressions in multiple parts in one call.

## Return Value

- **result:** `1` (success) or `0` (failure) — numeric, not JS boolean
- **result:** `null` when a required param is entirely missing (e.g., no `value` field)
- **maxLevel:** 31 on success, 51 on error

## Cross-References & Order

- Expressions can reference other expressions by name: `{ name: 'area', value: 'width * height' }`
- **Order in `toCreate` doesn't matter** — forward and backward references both resolve
- Cross-call references work — expressions created in a prior `expression()` call can be referenced
- Math functions (`sin`, `sqrt`, `pow`, etc.) and `C:PI` all work in formula values

## Gotchas

- **Duplicate name → error 1014, result=0.** The original value is preserved. Use `updateExpression` to change an existing expression's value.
- **Invalid formulas with bad runtime refs (undefined variables) ARE registered** despite result=0. The expression exists in the ExpressionSet with a default value of 1 and a broken formula. You must `deleteExpression` or `updateExpression` to fix it — re-creating with the same name gives "already exists".
- **Syntax errors in a batch are atomic** — if any item in `toCreate` has a syntax error (e.g., `'2++3'`), the ENTIRE batch fails and no expressions are created. This differs from runtime ref errors where the expression gets registered.
- **Error accumulation** — when creating a new expression, the server re-evaluates ALL expressions in the set. If prior expressions have broken formulas, their errors appear in the messages of the new call.
- **Values must be numeric.** String-valued expressions (e.g., `'"hello"'`) fail with "evaluates to the type String". Expressions are floating-point only.
- **Circular references silently succeed.** No infinite loop or error. Values are evaluated single-pass with seed value 1. Results are NOT mathematically consistent — `a = b + 1` and `b = a + 1` gives a=3, b=2.
- **Names can shadow math functions** — creating an expression named `sin` sets `sin` to that value, but `sin(x)` still works as a function call. The parser distinguishes variable access from function calls.

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| "X already exists" | 1014 | Duplicate name — use `updateExpression` |
| "must contain only word characters" | 1014 | Invalid chars in name (spaces, etc.) |
| "must start with a non-digit word character" | 1014 | Name starts with digit or is empty |
| "value must be provided" | 1004 | Missing `value` field in toCreate item |
| "is not a valid expression" | 0 | Syntax error in formula string |
| "Datamember X not found" | 0 | Formula references undefined expression |
| "Division by zero!" | 0 | Formula divides by zero |
| "evaluates to the type String" | 0 | Formula returns a string, not a number |

## Usage Hints

- Pass numeric values as numbers (`value: 50`), not strings (`value: '50'`) — both work, but numbers are cleaner and don't need parsing.
- Use `@expr.NAME` in feature params: `await api.v1.part.box({ id: partId, length: '@expr.L' })`. The `@expr.` prefix is mandatory — bare names don't work in feature params.
- `getExpression` returns `{ expression: "<formula>", value: <number> }`. For plain numeric values, the `expression` field is an empty string.
- Empty `toCreate: []` or omitted `toCreate` is a no-op (result=1, no error).
- 50+ expressions in a single batch works fine — no practical limit observed.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

// Create expressions — order doesn't matter, cross-refs resolve automatically
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'L', value: 120 },
    { name: 'W', value: 80 },
    { name: 'H', value: 'L / 2' },               // formula referencing L
    { name: 'area', value: 'L * W' },             // formula referencing L and W
    { name: 'circ', value: '2 * C:PI * L / 2' },  // math functions + constants
  ],
})

// Use in a box feature via @expr. prefix
await api.v1.part.box({
  id: partId,
  length: '@expr.L',
  width: '@expr.W',
  height: '@expr.H',
})
```

## Related

- `part.getExpression` — read back an expression's formula and current value
- `part.updateExpression` — change an existing expression's value
- `part.deleteExpression` — remove an expression
- `part.renameExpression` — rename an expression
- `part.linkWithExpression` — programmatically bind an expression to a feature parameter
- `common.evaluateExpression` — evaluate a formula (pass ExpressionSet ID 6 to reference named expressions)
