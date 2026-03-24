# Training: part.expression

**Date:** 2026-03-24

## Goal

Testing `v1.part.expression` — creating named expressions inside a part.

**Methods to cover:**

- `expression` — basic creation with `toCreate` array
- `expression` — single vs. multiple expressions in one call
- `expression` — numeric values vs. string (formula) values
- `expression` — referencing other expressions by name in formulas
- `expression` — using math functions and constants in formulas
- `expression` — error cases: duplicate names, invalid formulas, missing params
- `expression` — batch creation (param as array of objects)
- `expression` — return value: when true vs. false
- Interaction with `evaluateExpression` — verify created expressions are accessible

**Questions:**

- Can you create multiple expressions in a single call?
- Can expression values reference other expression names?
- What happens with duplicate expression names?
- What happens with invalid formula strings?
- Does the `id` param accept partId directly, or does it need something else?
- Can you pass `param` as an array (batch mode per the docs)?
- What's the ExpressionSet ID relationship to partId?

---

## 01 — basic numeric expression

Script: `scripts/01-basic-numeric.mjs` — ✅ Creates expression with numeric value. Result is `1` (number, not boolean `true`). maxLevel 31.

**📌 LLM doc:** Result is numeric 1/0, not boolean true/false as docs claim.

## 02 — multiple expressions in one call

Script: `scripts/02-multiple.mjs` — ✅ Three expressions created in one `toCreate` array. All verified via `evaluateExpression` with ExpressionSet ID 6.

## 03 — formula string values

Script: `scripts/03-formula-values.mjs` — ✅ Formula values work: `'base * 2'` → 80, `'sqrt(base)'` → 6.32, `'C:PI'` → 3.14159. All formulas resolve correctly. No warnings on creation.

**📌 LLM doc:** Formula strings referencing other expressions, math functions, and constants all work as values.

## 04 — dependent expressions in same call

Script: `scripts/04-dependent-same-call.mjs` — ✅ Creating `w=50` and `h='w * 2'` in the same `toCreate` array works. Order within the array is respected — `w` is created before `h` references it.

**📌 LLM doc:** Dependent formulas can be created in one call if the dependency comes first in the `toCreate` array.

## 05 — duplicate name

Script: `scripts/05-duplicate-name.mjs` — ✅ Duplicate name → `result: 0`, maxLevel 51, error code 1014, message "width already exists". Original value preserved.

**📌 LLM doc:** Duplicate expression names fail with error code 1014.

## 06 — invalid formulas

Script: `scripts/06-invalid-formula.mjs` — ✅ All invalid formulas return `result: 0`, maxLevel 51.
- Non-existent reference: "Datamember nonExistent not found"
- Syntax error: "is not a valid expression"
- Empty string: error (same as non-existent ref — errors accumulate)
- Division by zero: "Division by zero!"

**Learned:** Error messages accumulate within a session. Later calls show errors from earlier failed expressions too. This is a server-side accumulation — not reset between calls.

**📌 LLM doc:** Invalid formulas fail loudly. Errors accumulate in messages within the session.

## 07 — missing parameters

Script: `scripts/07-missing-params.mjs` — ✅ findings:
- No `toCreate` → silently succeeds (result 1) — no-op
- Empty `toCreate: []` → silently succeeds (result 1) — no-op
- Missing `name` → error (internal type error)
- Missing `value` → error code 1004, "value must be provided"

**📌 LLM doc:** Both `name` and `value` are required in each toCreate item. Empty/missing toCreate is a silent no-op.

## 08 — array param form (batch mode)

Script: `scripts/08-param-as-array.mjs` — ✅ Passing param as `[{id, toCreate}, {id, toCreate}]` works. Both expressions created.

**📌 LLM doc:** Array param form supported for batch creation.

## 09 — naming rules

Script: `scripts/09-naming-rules.mjs` — ✅ Valid: `simple`, `with_underscore`, `camelCase`, `x1`, `A`. Invalid: `1start` (digit start), `with space`, `with-dash`, `with.dot`, `""` (empty).

**Learned:** Names must match `[a-zA-Z_][a-zA-Z0-9_]*` — word characters only, must start with letter or underscore.

**📌 LLM doc:** Expression naming rules: word chars only, must start with letter/underscore.

## 10 — edge-case values

Script: `scripts/10-edge-values.mjs` — ✅ All work: 0, -42, 3.14159, 1e15, 1e-10, "-100" (string). No issues with any numeric edge cases.

## 11 — named expression refs in box (FAIL)

Script: `scripts/11-use-in-feature.mjs` — ❌ Using expression names (`'L'`, `'W'`, `'H'`) as box param values fails: `result: null`, maxLevel 51.

## 12 — inline formula in box

Script: `scripts/12-use-in-feature-v2.mjs` — ✅ Inline formula strings (`'3*40'`, `'2*40'`, `'50+10'`) work as box params. Returns box ID 56.

## 13 — named expression refs in box (attempt 2)

Script: `scripts/13-named-ref-in-feature.mjs` — ❌ Both `'L'` (bare name) and `'L + 0'` (formula with name) fail with "Could not convert api params." Named expression references do NOT work in feature parameters — you need `linkWithExpression` for that.

**📌 LLM doc:** Named expression references CANNOT be used directly in feature params. Inline formulas (like `'3*40'`) work. To connect named expressions to features, use `linkWithExpression`.

## 14 — box with numeric and inline formulas (sanity check)

Script: `scripts/14-box-with-numeric.mjs` — ✅ Confirms both numeric values and inline formula strings work in box params.

## 15 — circular/chain references

Script: `scripts/15-circular-ref.mjs` — ✅ Chain `c = b + a` (where `b = a * 2`) works, evaluates to 30. Self-reference `d = d + 1` also succeeds (no error on creation).

## 16 — self-reference value

Script: `scripts/16-self-ref-value.mjs` — Self-referencing `d = d + 1` evaluates to 2 with warning level 41. The uninitialized self-ref seems to resolve to something (likely 1), then +1 = 2.

**📌 LLM doc:** Self-referencing formulas don't error on creation but produce undefined behavior — avoid.

## 17 — getStructure (FAIL)

Script: `scripts/17-expressionset-id.mjs` — ❌ `api.v1.common.getStructure` doesn't exist. Removed.

## 18 — ExpressionSet ID discovery

Script: `scripts/18-find-expressionset-id.mjs` — ✅ Scanned IDs 1-20. Only ID 6 resolves named expressions. Structure tree confirms: `tree[4].expressionSet = 6` (part ID 4 → ExpressionSet ID 6).

**📌 LLM doc:** ExpressionSet ID is always 6 for a default part. It's exposed as `tree[partId].expressionSet` in the structure tree. Use this ID (not partId) with `evaluateExpression` to resolve named expressions.

## 19 — formula expressions in structure tree

Script: `scripts/19-formula-in-structure.mjs` — ✅ Expression members in the structure tree have `{ value, type, visible, expression }`. For numeric values, `expression` is `""`. For formulas, `expression` contains the formula string (e.g., `"base * 2 + 10"`) and `value` is the evaluated result (e.g., `110`).

**📌 LLM doc:** Structure tree shows both the formula and evaluated value for each expression.
