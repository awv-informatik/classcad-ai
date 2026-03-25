# Changes — part.getExpression training

## Files changed

### `references/part/getExpression.md` (rewritten)

Previous version had basic notes from prior session. Rewrote with verified findings from 14 test scripts.

Key additions:
- Two distinct result shapes documented (success/not-found vs parameter error)
- "How to Detect Not Found" section — `value === null` check, zero vs null distinction
- Expression field behavior table (numeric, formula, constant, broken, circular)
- Timing section — values update immediately after `updateExpression`, no `recalc()` needed
- Expanded gotchas: broken formulas readable with seed value 1, empty string name, case sensitivity, delete/rename indistinguishable from never-existed
- Updated working example with existence check pattern

### `references/part/expression.md` (one-line update)

Updated the `getExpression` hint in Usage Hints to note `value: number|null` return type and cross-reference `getExpression.md`.

## Diff

```diff
--- a/references/part/expression.md
+++ b/references/part/expression.md
@@ -145,7 +145,7 @@
-- `getExpression` returns `{ expression: "<formula>", value: <number> }`. For plain numeric values, `expression` is empty string.
-+ `getExpression` returns `{ expression: "<formula>", value: <number|null> }`. For plain numeric values, `expression` is empty string. For non-existent names, `value` is `null` (not an error). See `references/part/getExpression.md` for full details.
+- `getExpression` returns `{ expression: "<formula>", value: <number> }`.
++ `getExpression` returns `{ expression: "<formula>", value: <number|null> }`. For non-existent names, `value` is `null` (not an error). See `references/part/getExpression.md`.
```

`references/part/getExpression.md` — full rewrite, see file for complete content.
