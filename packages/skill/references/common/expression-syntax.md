# Expression Syntax Reference

The expression language of `part.expression`, `common.evaluateExpression`, `@expr.NAME` feature params, and formula strings.

## Operators

`+`, `-`, `*`, `/` (/0 is an evaluation error), unary `-` (`-a`, `-(a + b)`), `()` grouping. Standard precedence (`*` `/` before `+` `-`).

**NOT supported:** `^`, `%`, `**`, `>`, `<`, `==`, `&&`, `||`, `?:`, `if()` — no comparison, boolean or conditional operators.

**Negative operands:** `2 + -3` is a **syntax error** — write `2 + (-3)`. `--5` fails — use `-(-5)`.

## Constants

Only `C:PI` = `3.14159265358979323846`. **Case-sensitive** — `C:pi`, `C:Pi`, `PI`, `pi` fail. No `C:E`, `C:TAU`, `C:SQRT2`, `E`, `INF`, `NaN`. Euler's number: `exp(1)`.

## Functions

| Function | Notes |
|---|---|
| `abs(x)` | |
| `sign(x)` | -1, 0, or +1 |
| `max(a, b, ...)` / `min(a, b, ...)` | Variadic, also work with 1 arg |
| `sin`, `cos`, `tan` | Radians |
| `asin`, `acos` | Return radians, domain [-1,1] |
| `atan(x)` | Returns radians |
| `atan(y, x)` | atan2: full [-π, π], like `Math.atan2(y, x)` |
| `sinh`, `cosh`, `tanh` | |
| `a_r(deg)` / `r_a(rad)` | Degrees ↔ radians: `a_r(180)` = π, `r_a(C:PI)` = 180 |
| `exp(x)` | e^x |
| `ln(x)` | **Natural** log: `ln(exp(1))` = 1 |
| `log(x)` | **Base-10** log (docs just say "logarithm"): `log(10)` = 1, `log(100)` = 2, `log(exp(1))` = 0.434 |
| `sqrt(x)` | null for negative x |
| `pow(x, n)` | Use instead of `^` |
| `fmod(a, b)` | Float modulo: `fmod(-10, 3)` = -1 |
| `div(a, b)` | Integer division: `div(7, 2)` = 3, `div(-7, 2)` = -3 |
| `round(x, d)` | Undocumented: `round(2.567, 2)` = 2.57, `round(2.5, 0)` = 3 |

**Do NOT exist** ("Function X not found"): `ceil`, `floor`, `trunc`, `cbrt`, `hypot`, `log2`, `log10`, `clamp`, `lerp`, `step`, `mod`, `rem`, `int`, `float`, `rand`, `random`.

| Missing | Workaround |
|---|---|
| `ceil(x)` | `-div(-x, 1)` or `div(x, 1) + sign(fmod(x, 1))` |
| `floor(x)` | `div(x, 1)` (positive x) |
| `log2(x)` | `ln(x) / ln(2)` |
| `log10(x)` | `log(x)` |
| `clamp(x, lo, hi)` | `min(max(x, lo), hi)` |

## Inter-Expression References

Named expressions reference each other by bare name:

```js
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'width', value: 100 },
    { name: 'height', value: 'width * 0.6' },
    { name: 'diagonal', value: 'sqrt(width*width + height*height)' },
  ],
})
```

Multi-level chains (`base → doubled → quadrupled → final`) cascade on update. Order in `toCreate` doesn't matter — forward and backward references resolve.

## Numeric Behavior

- IEEE 754 double: `0.1 + 0.2 = 0.30000000000000004`
- Scientific notation: `1e3`, `1e-10`, `1e100`. Max ~`1e308`; `1e309` overflows to null.
- `pow(0, 0) = 1`
- Division by zero → evaluation error (`evaluateExpression` throws "could not be evaluated"; with `silent: true` the result is null)
- Domain errors behave the same: `sqrt(-1)`, `asin(2)` → evaluation error; null with `silent: true`

## `common.evaluateExpression`

Returns the number directly; `null` for errors (`silent: true` keeps maxLevel 31, result still null). **Named expressions need the ExpressionSet id:** `evaluateExpression({ id: expressionSetId, expression: 'L * 2' })` resolves them (correct result, warning level 41); with the part id or no id, names don't resolve. The id is the `CC_ExpressionSet` node whose parent is the part. More: `evaluateExpression.md`.

## Patterns

```
clamp:        min(max(value, lowerBound), upperBound)
polar:        x = radius * cos(a_r(angleDeg)),  y = radius * sin(a_r(angleDeg))
diagonal:     sqrt(a*a + b*b)   // or sqrt(pow(a, 2) + pow(b, 2))
enclosure:    innerSize = componentSize + 2 * clearance;  outerSize = innerSize + 2 * wallThickness
gear:         pitchDiam = module * teeth;  outsideDiam = pitchDiam + 2 * module;  baseCircleDiam = pitchDiam * cos(a_r(pressureAngleDeg))
bend:         bendAllowance = a_r(bendAngleDeg) * (innerRadius + kFactor * thickness)
spring rate:  springRate = G * pow(wireDiam, 4) / (8 * pow(coilDiam, 3) * activeCoils)
```
