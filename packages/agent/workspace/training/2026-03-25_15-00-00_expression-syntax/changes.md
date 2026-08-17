# Changes — expression syntax training

## New file: `references/common/expression-syntax.md`

Comprehensive expression syntax reference covering:
- All operators (and what doesn't work: ^, %, **, comparisons, conditionals)
- `C:PI` is the only constant (no C:E, no others)
- `log` is log10, `ln` is natural log (contradicts ambiguous docs)
- `atan(y, x)` 2-arg form works as atan2
- `round(value, decimals)` — undocumented but works
- Negative value syntax trap: `2 + -3` fails, must use `2 + (-3)`
- No undocumented functions (ceil, floor, etc. don't exist)
- `evaluateExpression` cannot reference named expressions even with id
- IEEE 754 double precision, overflow at 1e309
- Real-world patterns: clamping, polar→cartesian, gear, sheet metal, spring
