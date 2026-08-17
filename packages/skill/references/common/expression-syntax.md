# Expression Syntax Reference

Complete guide to the expression language used in `part.expression`, `common.evaluateExpression`, `@expr.NAME` feature params, and formula strings.

## Operators

| Operator | Example | Notes |
|---|---|---|
| `+` | `a + b` | Addition |
| `-` | `a - b` | Subtraction |
| `*` | `a * b` | Multiplication |
| `/` | `a / b` | Division (returns null on /0) |
| `-` (unary) | `-a`, `-(a + b)` | Negation |
| `()` | `(a + b) * c` | Grouping |

**NOT supported:** `^` (power), `%` (modulo), `**` (exponent), `>`, `<`, `==`, `&&`, `||`, `?:`, `if()`. No comparison, boolean, or conditional operators exist.

**Precedence:** Standard math — `*` and `/` before `+` and `-`. Use parentheses to override.

**Negative values in expressions:** `2 + -3` is a **syntax error**. Always parenthesize: `2 + (-3)`. Similarly `--5` fails — use `-(-5)`.

## Constants

Only **one** constant exists:

| Constant | Value |
|---|---|
| `C:PI` | `3.14159265358979323846` |

`C:PI` is **case-sensitive** — `C:pi`, `C:Pi`, `PI`, `pi` all fail. No other constants exist (no `C:E`, `C:TAU`, `C:SQRT2`, `E`, `INF`, `NaN`).

To use Euler's number: `exp(1)` → `2.71828...`

## Functions

### Documented functions (all verified working)

| Function | Args | Returns | Notes |
|---|---|---|---|
| `abs(x)` | 1 | Absolute value | |
| `sign(x)` | 1 | -1, 0, or +1 | |
| `max(a, b, ...)` | 2+ | Largest value | Variadic, also works with 1 arg |
| `min(a, b, ...)` | 2+ | Smallest value | Variadic, also works with 1 arg |
| `sin(x)` | 1 | Sine | Radians |
| `cos(x)` | 1 | Cosine | Radians |
| `tan(x)` | 1 | Tangent | Radians |
| `asin(x)` | 1 | Arc sine | Returns radians, domain [-1,1] |
| `acos(x)` | 1 | Arc cosine | Returns radians, domain [-1,1] |
| `atan(x)` | 1 | Arc tangent | Returns radians |
| `atan(y, x)` | 2 | atan2 | Full [-π, π] range, like `Math.atan2(y, x)` |
| `sinh(x)` | 1 | Hyperbolic sine | |
| `cosh(x)` | 1 | Hyperbolic cosine | |
| `tanh(x)` | 1 | Hyperbolic tangent | |
| `a_r(deg)` | 1 | Degrees → radians | `a_r(180)` = π |
| `r_a(rad)` | 1 | Radians → degrees | `r_a(C:PI)` = 180 |
| `exp(x)` | 1 | e^x | |
| `ln(x)` | 1 | **Natural** logarithm | `ln(exp(1))` = 1 |
| `log(x)` | 1 | **Base-10** logarithm | `log(10)` = 1, `log(100)` = 2 |
| `sqrt(x)` | 1 | Square root | Returns null for negative x |
| `pow(x, n)` | 2 | x^n | Use this instead of `^` operator |
| `fmod(a, b)` | 2 | Floating-point modulo | `fmod(-10, 3)` = -1 |
| `div(a, b)` | 2 | Integer division | `div(7, 2)` = 3, `div(-7, 2)` = -3 |

### Undocumented but working

| Function | Args | Returns | Notes |
|---|---|---|---|
| `round(x, d)` | 2 | Round to d decimal places | `round(2.567, 2)` = 2.57, `round(2.5, 0)` = 3 |

### Functions that do NOT exist

`ceil`, `floor`, `trunc`, `cbrt`, `hypot`, `log2`, `log10`, `clamp`, `lerp`, `step`, `mod`, `rem`, `int`, `float`, `rand`, `random` — all fail with "Function X not found".

**Workarounds:**
- `ceil(x)` → `-div(-x, 1)` or `div(x, 1) + sign(fmod(x, 1))`
- `floor(x)` → `div(x, 1)` (for positive x)
- `log2(x)` → `ln(x) / ln(2)`
- `log10(x)` → `log(x)` (log IS log10)
- `clamp(x, lo, hi)` → `min(max(x, lo), hi)`

## CRITICAL: `log` is log10

The docs just say "logarithm" without specifying the base. **`log` is base-10 logarithm.** Use `ln` for natural log:

```
log(10) = 1        // base-10
log(100) = 2       // base-10
ln(exp(1)) = 1     // natural log
log(exp(1)) = 0.434  // log10(e)
```

## Inter-Expression References

Named expressions reference each other by bare name (no prefix needed inside formulas):

```js
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'width', value: 100 },
    { name: 'height', value: 'width * 0.6' },          // simple ref
    { name: 'diagonal', value: 'sqrt(width*width + height*height)' },  // complex
    { name: 'area', value: 'width * height' },
  ],
})
```

**Multi-level chains work:** `base → doubled → quadrupled → final`. All cascade on update.

**Order in `toCreate` doesn't matter** — forward and backward references both resolve.

## Numeric Behavior

- IEEE 754 double precision (same as JavaScript)
- `0.1 + 0.2 = 0.30000000000000004` (standard floating-point)
- Scientific notation works: `1e3`, `1e-10`, `1e100`
- Max value: ~`1e308`. `1e309` overflows to null.
- `pow(0, 0) = 1`
- Division by zero → null (no error with evaluateExpression)
- `sqrt(-1)` → null, `asin(2)` → null (domain errors return null silently)

## `common.evaluateExpression` Behavior

- Returns the numeric result directly (not wrapped in an object)
- Returns `null` for invalid/error expressions
- `silent: true` suppresses error messages (maxLevel stays 31) but result is still null for errors
- **Cannot reference named expressions** even with `id` parameter — the `id` param does not give access to a part's expression set. It's standalone math only.

## Real-World Expression Patterns

### Clamping
```
min(max(value, lowerBound), upperBound)
```

### Polar to Cartesian
```
x = radius * cos(a_r(angleDeg))
y = radius * sin(a_r(angleDeg))
```

### Pythagorean / diagonal
```
diagonal = sqrt(a*a + b*b)
// or: sqrt(pow(a, 2) + pow(b, 2))
```

### Derived dimensions (enclosure around a component)
```
innerSize = componentSize + 2 * clearance
outerSize = innerSize + 2 * wallThickness
```

### Gear geometry
```
pitchDiam = module * teeth
outsideDiam = pitchDiam + 2 * module
baseCircleDiam = pitchDiam * cos(a_r(pressureAngleDeg))
```

### Sheet metal bend
```
bendAllowance = a_r(bendAngleDeg) * (innerRadius + kFactor * thickness)
```

### Spring rate
```
springRate = G * pow(wireDiam, 4) / (8 * pow(coilDiam, 3) * activeCoils)
```
