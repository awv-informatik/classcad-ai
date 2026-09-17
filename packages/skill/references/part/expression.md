# part.expression

Creates named expressions (parametric variables) in a part: numeric values or formulas that can reference each other and drive feature parameters via `@expr.NAME`.

## Key Parameters

- `id` — part ID or part-template ID (required). Assemblies have no expression set: assembly IDs are rejected with `wrong id type ... ["part"]`. For values shared by several parts, see `recipes/assembly-parameters`.
- `toCreate` — array of `{ name, value }` (both required per item; empty/omitted array is a no-op, result=1)
  - `name` — word chars only (`[a-zA-Z_][a-zA-Z0-9_]*`), must start with a non-digit. Spaces/special chars → error 1014.
  - `value` — `real | string`. Numbers stored directly (preferred over `'50'`, though both work). Strings are parsed as math expressions (`'width * 2'`, `'C:PI * pow(radius, 2)'`).
- The param may also be an array of `{ id, toCreate }` objects to create expressions in multiple parts in one call.
- 50+ expressions in a single batch works — no practical limit observed.

## Return Value

- `result: 1` (success) or `0` (failure) — numeric, not JS boolean; `null` when a required param is missing entirely (e.g. no `value` field)
- `maxLevel`: 31 on success, 51 on error

## Cross-References & Order

- Expressions reference others by name: `{ name: 'area', value: 'width * height' }`
- **Order in `toCreate` doesn't matter** — forward and backward references resolve; references to expressions from a prior call work too
- Math functions (`sin`, `sqrt`, `pow`, etc.) and `C:PI` work
- Another part's expression is readable by object path: `{ name: 'H', value: 'Params.ExpressionSet.W' }`. The value is read when this part is evaluated — changes in `Params` reach this part on its next `updateExpression` or on `common.recalc()`

## Gotchas

- **⚠️ The direct `{id, name, value}` form is a SILENT NO-OP that LOOKS successful.** `part.expression({id, name: 'W', value: 40})` (without `toCreate`) returns result=1, maxLevel=31 — and creates NOTHING (`getExpression('W')` → value null). Every downstream `@expr` reference then points at a nonexistent expression and fails (dimensions: error 51 "Couldn't set the value"; features: silent). Always use `toCreate: [...]` and, when a downstream `@expr` mysteriously fails, check `getExpression` FIRST.
- **Duplicate name → error 1014, result=0.** Original value preserved. Use `updateExpression` to change it.
- **Formulas with undefined variables ARE registered** despite result=0, with value 1 and the broken formula. Fix with `deleteExpression` or `updateExpression` — re-creating gives "already exists".
- **Syntax errors are batch-atomic** — one item with e.g. `'2++3'` fails the ENTIRE `toCreate` batch; nothing is created (unlike undefined-variable errors).
- **Error accumulation** — creating an expression re-evaluates ALL expressions in the set; errors of previously broken formulas appear in the new call's messages.
- **Values must be numeric** (floating-point only). String-valued expressions (e.g. `'"hello"'`) fail with "evaluates to the type String".
- **Circular references silently succeed** — no loop, no error. Single-pass evaluation with seed value 1; results are NOT consistent: `a = b + 1`, `b = a + 1` gives a=3, b=2.
- **Names can shadow math functions** — an expression named `sin` sets `sin`, but `sin(x)` still works as a function call.
- **Negative results are validated by the feature** — e.g. box requires length > 0.

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

Any feature param of `expression` type accepts `@expr.NAME`:

```js
await api.v1.part.box({ id: partId, length: '@expr.L', width: '@expr.W', height: '@expr.H' })
```

- **The `@expr.` prefix is mandatory.** Bare names (`'L'`, `'L + 10'`) fail with error 1000 "Could not convert api params."
- **Inline formulas** without named expressions also work: `length: '3 * 40'`, `width: 'sqrt(2500)'`, `height: 'C:PI * 20'`.
- **Full syntax mixes @expr, arithmetic and functions:** `'@expr.base + 20'`, `'@expr.base - 2 * @expr.margin'`, `'sqrt(@expr.base)'`, `'max(@expr.base, @expr.margin) / 2'`, `'min(max(@expr.val, 50), 200)'` (clamp).
- **String-encoded point arrays** for offset/position: `offset: '[@expr.offsetX, @expr.offsetY, @expr.offsetZ]'`.

## Updating Expressions

- **CRITICAL:** `updateExpression` takes a `toUpdate` array: `{ id, toUpdate: [{ name: 'size', value: 120 }] }`. The direct `{ id, name, value }` form is silently ignored (result=1, no error, value unchanged).
- Values can be numbers or formula strings (`value: 'x * 3 + 5'`).
- One call updates everything — expression values, derived expressions (cascade: `base` → `doubled = base * 2`), all features sharing the expression, WCS offsets with `@expr.` in string arrays, and geometry. No `common.recalc()` needed.
- `getExpression` returns `{ expression: "<formula>", value: <number|null> }`; `expression` is `""` for plain numbers, `value` is `null` for non-existent names (not an error). See `references/part/getExpression.md`.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'FlangedBlock' })).result

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

await api.v1.part.box({
  id: partId, name: 'BasePlate',
  length: '@expr.baseL', width: '@expr.baseW', height: '@expr.baseH',
})

// Tower on top via expression-driven WCS
const wcsId = (await api.v1.part.workCSys({
  id: partId, name: 'TowerOrigin',
  offset: '[@expr.baseL/4, @expr.baseW/4, @expr.baseH]',
})).result

await api.v1.part.box({
  id: partId, name: 'Tower', references: [wcsId],
  length: '@expr.towerL', width: '@expr.towerW', height: '@expr.towerH',
})

// Change master dimension — everything scales
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'baseL', value: 200 }] })
// towerL=100, towerH=160, WCS offset updated — geometry updates immediately
```

## Related

`part.getExpression` · `part.updateExpression` · `part.deleteExpression` · `part.renameExpression` · `part.linkWithExpression` · `common.evaluateExpression` · `common.recalc`
