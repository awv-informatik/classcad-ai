# Changes — part.expression training

## New file: `references/part/expression.md`

```diff
+# part.expression
+
+Creates named expressions (parametric variables) inside a part. Expressions can hold numeric values or formula strings that reference other expressions, math functions, and constants.
+
+## Prerequisites
+
+- A part (`part.create`)
+
+## Key Parameters
+
+- `id` — part ID (from `part.create`). Accepts partId directly.
+- `toCreate` — array of `{ name, value }` objects. Both `name` and `value` are required in each item.
+  - `name` — string, must match `[a-zA-Z_][a-zA-Z0-9_]*` (word characters, starts with letter or underscore).
+  - `value` — `real` or `string`. Numbers are stored directly. Strings are formula expressions.
+- `param` can be an array of objects for batch creation.
+
+## Return Value
+
+- `result` — numeric `1` on success, `0` on failure. **Not boolean** despite docs.
+
+## Key Gotchas
+
+- Named expressions CANNOT be used directly in feature parameters — need `linkWithExpression`.
+- Duplicate names fail with error code 1014.
+- Dependent formulas work in one call if dependency comes first in the toCreate array.
+- Error messages accumulate within a session.
+- Self-referencing formulas produce undefined behavior.
+
+## ExpressionSet ID
+
+- For default part (partId=4), ExpressionSet ID is 6.
+- Use this ID (not partId) with `evaluateExpression` to resolve named expressions.
+- Available in structure tree: `structure.tree[partId].expressionSet`.
```
