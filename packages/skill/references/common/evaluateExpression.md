# common.evaluateExpression

Evaluates a math expression string. Standalone — works without any objects in the drawing. Full language: `expression-syntax.md`.

## Key Parameters

- `expression` — required string. Whitespace ignored (`" 2 + 3 "` works).
- `id` — optional. The **ExpressionSet ID** (typically 6 for a default part) to reference named expressions (from `part.expression`). The part ID does NOT work — null + error.
- `silent` — optional boolean, default FALSE. TRUE suppresses errors (maxLevel stays 31, `messages: []`, result still null) but NOT warnings (level 41).

## Return Value

- `real` for math, `string` for quoted strings (`"hello"` → "hello"), `null` on error.
- maxLevel: 31 success, 41 when referencing named expressions, 51 error (unless `silent`).

## Syntax Summary

- Operators `+ - * /`, parentheses, unary minus (`-5`; `--5` is a syntax error — use `(-(-5))`). No `^`/`**` (use `pow`), no `%` (use `fmod`). Scientific notation: `1e3` = 1000.
- Constant: `C:PI` (3.14159265358979323846) — the only documented one.
- Trig in radians; degrees via `a_r()`: `sin(a_r(45))` instead of `sin(C:PI/4)`.

| Examples | |
|---|---|
| `abs(-42)` → 42 · `sign(-7)` → -1 | `max(1, 5, 3)` → 5 · `min(1, 5, 3)` → 1 (variadic) |
| `sin(C:PI/2)` → 1 · `cos(0)` → 1 · `tan(C:PI/4)` → 1 | `asin(1)` → π/2 · `acos(0)` → π/2 · `atan(1)` → π/4 · `atan(1, 1)` → π/4 |
| `sinh(0)` → 0 · `cosh(0)` → 1 · `tanh(0)` → 0 | `exp(1)` → 2.718… · `ln(exp(1))` → 1 · `log(100)` → 2 |
| `sqrt(144)` → 12 (x≥0) · `pow(2, 10)` → 1024 | `fmod(17, 5)` → 2 · `div(17, 5)` → 3 |
| `a_r(180)` → π · `r_a(C:PI)` → 180 | |

## Gotchas

- **`log` is base 10, `ln` is natural** — opposite of many languages.
- **`1/0` is an error**, not Infinity; `sqrt(-1)` is an error, not NaN.
- **Named expression references always warn (level 41)** even when correct — the warning says names "do not exist in the expressions"; it's misleading, the result is valid. `silent: true` doesn't suppress it.
- All errors give the same generic message: "Expression X could not be evaluated."
- Validity test without error noise: `silent: true`, check `result !== null`.

## Working Example

```js
const r = await api.v1.common.evaluateExpression({ expression: 'pow(sin(C:PI/6), 2) + pow(cos(C:PI/6), 2)' })
// r.result → 1

// Named expressions need the ExpressionSet ID
const partId = (await api.v1.part.create({ name: 'Test' })).result
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'w', value: 50 }] })
const val = await api.v1.common.evaluateExpression({ expression: 'w * 2', id: 6 })
// val.result → 100 (warning level 41 — ignore)

// Silent evaluation (try/fallback)
const tryExpr = await api.v1.common.evaluateExpression({ expression: 'maybe_valid', silent: true })
if (tryExpr.result !== null) { /* use it */ }
```

## Related

`part.expression` · `part.getExpression` · `part.linkWithExpression` · `expression-syntax.md`
