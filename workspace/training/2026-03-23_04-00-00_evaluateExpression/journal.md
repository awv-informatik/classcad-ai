# Training: common.evaluateExpression

**Date:** 2026-03-23

## Goal

Testing `v1.common.evaluateExpression` — standalone math evaluation engine, plus expression syntax.

---

## 01 — basic arithmetic

Script: `scripts/01-basic-arithmetic.mjs` — ✅ all pass except `--5` (double negative returns null).

**Learned:** Standard +, -, *, / work. Operator precedence correct (2+3*4=14). Parentheses work. Floats work. Double negative `--5` is a syntax error.

📌 LLM doc: No double-negative syntax. Use `(-(-5))` if needed.

## 02 — constants and trig

Script: `scripts/02-constants-trig.mjs` — ✅ all 8 tests pass. C:PI works. All trig in radians.

## 03 — math functions

Script: `scripts/03-math-functions.mjs` — ✅ all 15 tests pass. abs, sign, max, min, sqrt, pow, exp, ln all work as expected.

## 04 — log, special functions

Script: `scripts/04-log-and-special.mjs` — ✅ critical finding on `log`.

**Learned:**
- **`log` is base 10** — log(10)=1, log(100)=2. **`ln` is natural** — ln(e)=1.
- fmod(17,5)=2 ✓, div(17,5)=3 ✓
- a_r(180)=π ✓, r_a(π)=180 ✓ — degree/radian conversions work
- atan(1,1)=π/4 ✓ — two-arg form works
- sinh(0)=0, cosh(0)=1, tanh(0)=0 ✓

📌 LLM doc: `log` is base 10, `ln` is natural. This is non-obvious.

## 05 — error cases

Script: `scripts/05-errors.mjs` — ✅ all errors return result: null, maxLevel: 51.

**Learned:** All invalid expressions get the same generic error: "Expression X could not be evaluated." No specific error codes. Division by zero, sqrt(-1), unknown functions, empty string — all same error pattern.

📌 LLM doc: All errors return null + maxLevel 51 + generic message. 1/0 is an error (not Infinity). sqrt(-1) is an error.

## 06 — silent param

Script: `scripts/06-silent-param.mjs` — ✅ key finding.

**Learned:**
- `silent: true` on invalid: result=null, **maxLevel=31** (not 51), messages=[] — suppresses error
- `silent: false` (or omitted) on invalid: result=null, maxLevel=51, messages=[error]
- `silent: true` on valid: no change, result=5, maxLevel=31

📌 LLM doc: `silent: true` turns errors into silent nulls (maxLevel 31, no messages). Useful for "try evaluate, fallback if null" patterns.

## 07 — id param (first attempt)

Script: `scripts/07-id-param.mjs` — ⚠️ named expression eval with partId failed. "width + 10" returned null.

## 08 — return types

Script: `scripts/08-return-types.mjs` — ✅

**Learned:** Result is always number type for valid expressions. Invalid → null. Large numbers (2^53) work. Scientific precision maintained. No point return type observed from pure math expressions.

## 09 — nested/complex

Script: `scripts/09-nested-complex.mjs` — ✅ all 6 tests pass. sin²+cos²=1, nested functions, round-trip conversions.

## 10 — syntax edge cases

Script: `scripts/10-whitespace-syntax.mjs` — ✅ several findings.

**Learned:**
- Whitespace is fine: " 2 + 3 " = 5
- Scientific notation `1e3` = 1000 ✓
- **No `^` operator** — must use `pow()`
- **No `**` operator** — must use `pow()`
- **No `%` operator** — must use `fmod()`
- **String expressions return the string!** `"hello"` → result: "hello", maxLevel: 31

📌 LLM doc: No power/modulo operators. Use pow() and fmod(). Strings in quotes are valid and return the string value.

## 11 — id param debug

Script: `scripts/11-id-param-debug.mjs` — ✅ key discovery.

**Learned:**
- `id` = partId (4) → FAILS for named expression refs
- `id` = ExpressionSet ID (6) → WORKS but with warning (maxLevel 41)
- The docs say "any id which is a child of the root part" — ExpressionSet is correct

📌 LLM doc: To reference named expressions, pass `id` = ExpressionSet ID (6 in default structure), NOT partId.

## 12 — id param warning

Script: `scripts/12-id-param-warning.mjs` — ✅ confirmed and clarified.

**Learned:**
- Warning message: "The expression could be evaluated but contains probably names which do not exist in the expressions. It has been solved in a different context..."
- Warning is level 41, always present when referencing named expressions via ExpressionSet id
- `silent: true` does NOT suppress this warning (only suppresses errors at level 51+)
- Compound expressions work: `x + y + 5` = 45

📌 LLM doc: Warning is expected and can be ignored — result is correct. silent doesn't suppress warnings.

---

## Coverage Checklist

- [x] API called successfully
- [x] Required param `expression` tested extensively
- [x] Optional param `id` tested (ExpressionSet vs partId)
- [x] Optional param `silent` tested (true/false/omitted)
- [x] All documented functions tested: abs, sign, max, min, a_r, r_a, sin, sinh, asin, cos, cosh, acos, tan, tanh, atan (1-arg and 2-arg), exp, ln, log, sqrt, pow, fmod, div
- [x] Constant C:PI tested
- [x] Error cases: invalid syntax, division by zero, sqrt(-1), unknown function, empty string
- [x] Return types: number, null, string
- [x] Realistic usage: nested expressions, named expression references
