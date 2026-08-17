# Training: Study of expression syntax

**Date:** 2026-03-25

## Goal

Comprehensive study of expression syntax — constants, functions, operators, inter-expression references, and real-world patterns.

---

## 01-08 — Function and operator verification

All documented functions verified working: `abs`, `sign`, `max`, `min`, `a_r`, `r_a`, `sin`, `sinh`, `asin`, `cos`, `cosh`, `acos`, `tan`, `tanh`, `atan` (1-arg and 2-arg), `exp`, `ln`, `log`, `sqrt`, `pow`, `fmod`, `div`.

All basic arithmetic operators work: `+`, `-`, `*`, `/`, unary `-`, unary `+`, parentheses.

**📌 LLM doc:** `^` does NOT work as power operator. Use `pow(base, exp)`. `%` and `**` also invalid.

## Key discoveries from probing:

**log is log10** (base-10), NOT natural log:
- `log(10) = 1`, `log(100) = 2`, `log(exp(1)) = 0.434`
- `ln` is the natural logarithm: `ln(exp(1)) = 1`

**📌 LLM doc:** `log` = log10, `ln` = natural log. This contradicts the docs which just say "logarithm".

**atan 2-arg form works like atan2(y, x):**
- `atan(1, 1) = 0.785` (π/4), `atan(-1, 1) = -0.785`, `atan(1, -1) = 2.356` (3π/4)

**📌 LLM doc:** `atan(y, x)` is atan2 — returns angle in full [-π, π] range.

**C:PI is the ONLY constant.** Probed C:E, E, PI, pi, INF, NaN, C:TAU, C:SQRT2 — all fail.

**round(value, decimals) is undocumented but works:**
- `round(2.5, 0) = 3`, `round(2.567, 2) = 2.57`, `round(2.5, 1) = 2.5`
- Requires exactly 2 args. 0-arg and 1-arg forms fail.

**📌 LLM doc:** `round(value, decimals)` exists but is undocumented. Useful for rounding to N decimal places.

**Inline negative syntax:** `2 + -3` FAILS (syntax error). Must use parentheses: `2 + (-3)`.

**📌 LLM doc:** Always parenthesize negative values in addition/subtraction: `a + (-b)`, not `a + -b`.

**Division by zero** returns null with maxLevel=31 (silent failure via evaluateExpression). `sqrt(-1)`, `ln(-1)`, `asin(2)`, `acos(2)` all return null silently.

**Scientific notation works:** `1e3 = 1000`, `1e-10`, `1e100`. Overflow at `1e309` (null). `1e308` works. Standard IEEE 754 double precision.

**`--5` (double negative) fails.** Use `-(-(5))` or `-(-5)`.

**`pow(0, 0) = 1`.** `pow(0, -1) = null` (division by zero).

**Whitespace is fully flexible.** Leading, trailing, and internal spaces all tolerated.

**No undocumented functions exist.** `ceil`, `floor`, `cbrt`, `hypot`, `log2`, `log10`, `clamp`, `lerp`, `step`, `mod`, `rem`, `int`, `float`, `rand`, `random` — ALL fail. The `silent: true` param on evaluateExpression was masking errors.

**evaluateExpression with `id` does NOT reference named expressions.** Passing a part ID still can't resolve expression names in the formula.

**No comparison, boolean, or conditional operators.** `>`, `<`, `==`, `&&`, `||`, `?:`, `if()` — all fail.

## 09-10 — Inter-expression references

All reference patterns work: simple (`a + b`), complex (`sqrt(pow(a, 2) + pow(b, 2))`), multi-level chains (base → doubled → squared → rooted → final). Full cascade on update.

## 15-19 — Real-world patterns

All tested successfully:
- **Bolt circle** (script 15): Polar-to-cartesian conversion with `cos`/`sin` and `a_r` for degree→radian
- **Gear dimensions** (script 16): Module/teeth-based calculation with trig functions
- **Sheet metal** (script 17): Bend allowance with `tan(angle/2)` and k-factor
- **Spring calculations** (script 18): Wire stress with `pow(d, 4)` and helix angle with `atan(y, x)`
- **Electronics enclosure** (script 19): PCB + clearance + wall thickness cascading derivations

## 20 — Operator precedence

Standard math precedence: `*` and `/` before `+` and `-`. Unary minus works. Parentheses work for grouping. `2 + -3` fails — must use `2 + (-3)`.

---

## Coverage Checklist

- [x] All documented functions tested and verified
- [x] All operators tested (including what doesn't work: ^, %, **)
- [x] Constants probed (only C:PI exists)
- [x] Undocumented functions probed (only round(v,d) works)
- [x] log vs ln clarified (log=log10, ln=natural)
- [x] atan 2-arg form tested (atan2 behavior)
- [x] Inter-expression references tested
- [x] Multi-level chain cascade tested
- [x] Whitespace handling tested
- [x] Edge cases tested (overflow, underflow, domain errors, division by zero)
- [x] Syntax errors tested (no comparisons, no conditionals)
- [x] Real-world patterns tested (5 engineering examples)
- [x] Precision limits tested (IEEE 754 doubles)
- [x] evaluateExpression with id tested (doesn't reference named exprs)
