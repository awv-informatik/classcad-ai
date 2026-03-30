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

## Using Expressions in Feature Parameters

### `@expr.NAME` syntax

Reference named expressions in any feature param that accepts `expression` type:

```js
await api.v1.part.box({ id: partId, length: '@expr.L', width: '@expr.W', height: '@expr.H' })
await api.v1.part.cylinder({ id: partId, diameter: '@expr.cylDiam', height: '@expr.cylHt' })
```

**The `@expr.` prefix is mandatory.** Bare names (`'L'`, `'L + 10'`) fail with error 1000 "Could not convert api params."

### Inline formulas (no named expressions)

Feature params also accept raw formula strings — no `@expr.` or named expressions needed:

```js
await api.v1.part.box({ id: partId, length: '3 * 40', width: 'sqrt(2500)', height: 'C:PI * 20' })
```

### Mixing `@expr.` with arithmetic and functions

Full expression syntax works:

```js
length: '@expr.base + 20'                    // @expr + constant
diameter: '@expr.base - 2 * @expr.margin'    // two @expr refs + arithmetic
length: 'sqrt(@expr.base)'                   // function wrapping @expr
height: 'max(@expr.base, @expr.margin) / 2'  // multi-arg function
length: 'min(max(@expr.val, 50), 200)'       // clamp pattern
```

### String-encoded point arrays

`@expr.` works inside string-encoded arrays for offset/position params:

```js
await api.v1.part.workCSys({
  id: partId,
  offset: '[@expr.offsetX, @expr.offsetY, @expr.offsetZ]',
})
```

## Updating Expressions & Recalculation

### updateExpression syntax

**CRITICAL:** `updateExpression` uses a `toUpdate` array, NOT direct `name`/`value` params:

```js
// ✅ CORRECT
await api.v1.part.updateExpression({
  id: partId,
  toUpdate: [{ name: 'size', value: 120 }],
})

// ❌ WRONG — silently ignored (result=1, no error, value unchanged)
await api.v1.part.updateExpression({ id: partId, name: 'size', value: 120 })
```

`updateExpression` can change both numeric values and formula strings:

```js
await api.v1.part.updateExpression({
  id: partId,
  toUpdate: [{ name: 'y', value: 'x * 3 + 5' }],  // change formula
})
```

### Immediate geometry update

`updateExpression` updates everything in one call — expression values, derived expressions, and feature geometry. No `common.recalc()` needed:

```js
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'S', value: 100 }] })
// Expression value, derived expressions, and all bound feature geometry are already updated
```

### Cascade behavior

- Derived expressions auto-cascade: updating `base` propagates to `doubled = base * 2`
- Multiple features sharing one expression all update
- WCS offsets with `@expr.` in string-encoded arrays also update
- The full chain works: base expr → derived expr → feature param → geometry

## Usage Hints

- Pass numeric values as numbers (`value: 50`), not strings (`value: '50'`) — both work, but numbers are cleaner.
- `getExpression` returns `{ expression: "<formula>", value: <number|null> }`. For plain numeric values, `expression` is empty string. For non-existent names, `value` is `null` (not an error). See `references/part/getExpression.md` for full details.
- Empty `toCreate: []` or omitted `toCreate` is a no-op (result=1, no error).
- 50+ expressions in a single batch works fine — no practical limit observed.
- Negative expression results are validated by the feature — e.g., box requires length > 0.

## Working Example: Parametric Model

```js
const partId = (await api.v1.part.create({ name: 'FlangedBlock' })).result

// Define master dimensions and derived values
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'baseL', value: 120 },
    { name: 'baseW', value: 80 },
    { name: 'baseH', value: 30 },
    { name: 'towerL', value: 'baseL * 0.5' },
    { name: 'towerW', value: 'baseW * 0.5' },
    { name: 'towerH', value: 'baseL * 0.8' },
  ],
})

// Base plate
await api.v1.part.box({
  id: partId, name: 'BasePlate',
  length: '@expr.baseL', width: '@expr.baseW', height: '@expr.baseH',
})

// Tower placed on top via expression-driven WCS
const wcsId = (await api.v1.part.workCSys({
  id: partId, name: 'TowerOrigin',
  offset: '[@expr.baseL/4, @expr.baseW/4, @expr.baseH]',
})).result

await api.v1.part.box({
  id: partId, name: 'Tower', references: [wcsId],
  length: '@expr.towerL', width: '@expr.towerW', height: '@expr.towerH',
})

// Change master dimension — everything scales
await api.v1.part.updateExpression({
  id: partId, toUpdate: [{ name: 'baseL', value: 200 }],
})
// towerL=100, towerH=160, WCS offset updated — full cascade (geometry updates immediately)
```

## Related

- `part.getExpression` — read back an expression's formula and current value
- `part.updateExpression` — change an existing expression's value (uses `toUpdate` array!)
- `part.deleteExpression` — remove an expression
- `part.renameExpression` — rename an expression
- `part.linkWithExpression` — programmatically bind an expression to a feature parameter (`{ id: featureId, exprName, name }`)
- `common.evaluateExpression` — evaluate a formula (pass ExpressionSet ID 6 to reference named expressions)
- `common.recalc` — full drawing recalculation (not needed after `updateExpression` — geometry auto-updates)
