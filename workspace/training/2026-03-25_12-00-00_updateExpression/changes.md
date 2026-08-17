# Changes — part.updateExpression training

## New file: `references/part/updateExpression.md`

```diff
+# part.updateExpression
+
+Updates existing named expressions in a part. Can change both numeric values and formula strings.
+
+## Prerequisites
+
+- A part (`part.create`)
+- Expressions already created via `part.expression`
+
+## Key Parameters
+
+- `id` — part ID (required). Missing → result=null, code 1004. Invalid → result=null, code 1006.
+- `toUpdate` — array of `{ name, value }` objects (required for actual updates)
+  - `name` — string, must match an existing expression. Non-existent → result=0, code 1014.
+  - `value` — `real | string`. Numbers set direct values. Strings are parsed as formulas.
+
+## CRITICAL: Use `toUpdate` Array
+
+**The most dangerous gotcha with this API.** You MUST wrap updates in a `toUpdate` array.
+Wrong form (direct name/value) returns result=1, NO error, but value is UNCHANGED.
+
+## Return Value
+
+- Success: result=1 (numeric), maxLevel=31
+- Logical failure: result=0, maxLevel=51
+- Parameter error: result=null, maxLevel=51
+
+## Key Findings
+
+- **Batch is ATOMIC** — one bad item rolls back ALL updates
+- **Array param form does NOT work** (unlike expression() which does)
+- **Syntax errors fully rejected** — old value preserved
+- **Undefined ref formulas half-applied** — formula stored, old value kept (not seed=1)
+- **Cascade is immediate** — no recalc needed for expression reads
+- **Cross-refs in same call work** — derived sees new base value
+- **Duplicates: last wins**
+- **Empty/omitted toUpdate: no-op, result=1**
```
