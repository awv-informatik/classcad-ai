# common.evaluateExpression

Evaluates a math expression string and returns the result. Standalone math engine — works without any objects in the drawing.

## Prerequisites

None for basic math. To reference named expressions (created with `part.expression`), a part must exist and `id` must point to its ExpressionSet.

## Key Parameters

- `expression` — required string. The math expression to evaluate.
- `id` — optional. Pass the **ExpressionSet ID** (typically 6) to reference named expressions. Passing the partId does NOT work — it returns null/error.
- `silent` — optional boolean, default FALSE. When TRUE, suppresses error messages (maxLevel stays 31, messages=[]) but result is still null on failure. Does NOT suppress warnings (level 41).

## Return Value

- **Type:** `real` (number) for valid math, `string` for quoted strings, `null` for errors
- **maxLevel:** 31 on success, 41 when referencing named expressions (warning), 51 on error (unless `silent: true`)

## Expression Syntax

### Operators
- Arithmetic: `+`, `-`, `*`, `/`
- Parentheses: `(`, `)`
- Unary minus: `-5` works, but `--5` (double negative) is a syntax error
- **No power operator** (`^` and `**` fail) — use `pow(x, n)`
- **No modulo operator** (`%` fails) — use `fmod(a, b)`
- Scientific notation: `1e3` = 1000

### Constants
- `C:PI` — π (3.14159265358979323846). The only documented constant.

### Functions (all arguments in radians for trig)

| Function | Description | Example |
|---|---|---|
| `abs(x)` | Absolute value | `abs(-42)` → 42 |
| `sign(x)` | Sign: -1, 0, or 1 | `sign(-7)` → -1 |
| `max(a, ..., n)` | Maximum (variadic) | `max(1, 5, 3)` → 5 |
| `min(a, ..., n)` | Minimum (variadic) | `min(1, 5, 3)` → 1 |
| `sin(x)` | Sine (radians) | `sin(C:PI/2)` → 1 |
| `cos(x)` | Cosine (radians) | `cos(0)` → 1 |
| `tan(x)` | Tangent (radians) | `tan(C:PI/4)` → 1 |
| `asin(x)` | Arcsine → radians | `asin(1)` → π/2 |
| `acos(x)` | Arccosine → radians | `acos(0)` → π/2 |
| `atan(x)` | Arctangent → radians | `atan(1)` → π/4 |
| `atan(y, x)` | Two-arg arctangent | `atan(1, 1)` → π/4 |
| `sinh(x)` | Hyperbolic sine | `sinh(0)` → 0 |
| `cosh(x)` | Hyperbolic cosine | `cosh(0)` → 1 |
| `tanh(x)` | Hyperbolic tangent | `tanh(0)` → 0 |
| `exp(x)` | e^x | `exp(1)` → 2.718... |
| `ln(x)` | **Natural** logarithm | `ln(exp(1))` → 1 |
| `log(x)` | **Base 10** logarithm | `log(100)` → 2 |
| `sqrt(x)` | Square root (x≥0) | `sqrt(144)` → 12 |
| `pow(x, n)` | Power | `pow(2, 10)` → 1024 |
| `fmod(a, b)` | Remainder (modulo) | `fmod(17, 5)` → 2 |
| `div(a, b)` | Integer division | `div(17, 5)` → 3 |
| `a_r(deg)` | Degrees → radians | `a_r(180)` → π |
| `r_a(rad)` | Radians → degrees | `r_a(C:PI)` → 180 |

## Gotchas

- **`log` is base 10, `ln` is natural.** This is the opposite of many programming languages where `log` means natural log.
- **`1/0` is an error**, not Infinity. `sqrt(-1)` is an error, not NaN.
- **`--5` fails.** Double negative is a syntax error. Use `(-(-5))` if needed.
- **No `^`, `**`, or `%` operators.** Use `pow()` and `fmod()`.
- **`id` must be ExpressionSet ID, not partId.** For a default part, ExpressionSet is typically ID 6. Passing partId returns null with error.
- **Named expression references always produce a warning (level 41)** even when the result is correct. The warning says names "do not exist in the expressions" but this is misleading — the result is valid.
- **`silent: true` only suppresses errors (level 51+)**, not warnings (level 41). Named expression warnings still appear.
- **Quoted strings are valid expressions** — `"hello"` returns the string "hello".
- All error expressions return the same generic message: "Expression X could not be evaluated."

## Usage Hints

- Use as a **calculator** for any math expression an agent needs to compute.
- For degree-based angles, wrap with `a_r()`: `sin(a_r(45))` instead of `sin(C:PI/4)`.
- To test if an expression is valid without error noise: use `silent: true`, check `result !== null`.
- Whitespace is ignored — `" 2 + 3 "` works fine.

## Working Example

```js
// Basic math
const r = await api.v1.common.evaluateExpression({ expression: 'pow(sin(C:PI/6), 2) + pow(cos(C:PI/6), 2)' })
// r.result → 1 (sin²+cos²=1)

// With named expressions (need ExpressionSet ID)
const partId = (await api.v1.part.create({ name: 'Test' })).result
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'w', value: 50 }] })
const val = await api.v1.common.evaluateExpression({ expression: 'w * 2', id: 6 })
// val.result → 100 (with warning level 41 — ignore it)

// Silent evaluation (try/fallback pattern)
const tryExpr = await api.v1.common.evaluateExpression({ expression: 'maybe_valid', silent: true })
if (tryExpr.result !== null) { /* use it */ }
```

## Related

- `part.expression` — create named expressions inside a part
- `part.getExpression` — read back an expression's value
- `part.linkWithExpression` — connect expressions to feature parameters
