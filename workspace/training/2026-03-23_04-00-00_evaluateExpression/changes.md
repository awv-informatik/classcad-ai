# Changes — common.evaluateExpression

## New file: `references/common/evaluateExpression.md` (+102 lines)

Key content:
- Complete function reference table (24 functions + C:PI constant)
- **`log` is base 10, `ln` is natural** — opposite of many programming languages
- No `^`, `**`, `%` operators — must use pow(), fmod()
- `--5` (double negative) is a syntax error
- `1/0` and `sqrt(-1)` are errors, not Infinity/NaN
- `silent: true` suppresses errors (→ maxLevel 31) but NOT warnings (level 41)
- `id` param must be ExpressionSet ID (typically 6), NOT partId — partId fails
- Named expression references always produce a harmless warning (level 41)
- Quoted strings are valid expressions returning the string value
- Scientific notation (1e3) works
