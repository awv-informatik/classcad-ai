# Training: part.getExpression

**Date:** 2026-03-24

## Goal

Testing `v1.part.getExpression` — reads back an expression's formula and current value.

**Methods to cover:**

- `getExpression` — basic retrieval of numeric expression
- `getExpression` — retrieval of formula-based expression
- `getExpression` — return value structure: `{ value, expression }`
- `getExpression` — non-existent expression name
- `getExpression` — invalid/missing part ID
- `getExpression` — after updateExpression (value changes)
- `getExpression` — derived/cross-ref expressions
- `getExpression` — broken formula expression
- `getExpression` — missing `name` param
- `getExpression` — empty string name
- `getExpression` — case sensitivity of names

**Questions:**

- What does `expression` field contain for plain numeric vs formula values?
- What does VOID result look like for non-existent expressions?
- Does `value` update immediately after `updateExpression` (before `recalc`)?
- Is expression name lookup case-sensitive?
- What happens with broken/circular ref expressions?

---

## 01 — basic numeric expression

Script: `scripts/01-basic-numeric.mjs` — ✅ as documented.

Result: `{ expression: "", value: 50 }`. Plain numeric values have `expression` as empty string, `value` as number.

📌 LLM doc: `expression` field is empty string for plain numeric values, not null/undefined.

## 02 — formula-based expressions

Script: `scripts/02-formula-expr.mjs` — ✅ as documented.

- `base` (numeric 100): `{ expression: "", value: 100 }`
- `derived` (formula `base * 2 + 10`): `{ expression: "base * 2 + 10", value: 210 }`
- `piArea` (formula `C:PI * pow(base, 2)`): `{ expression: "C:PI * pow(base, 2)", value: 31415.93... }`

**Learned:** `expression` field contains the original formula string exactly as written. Value is the evaluated result.

📌 LLM doc: Formula expressions return the original formula string in `expression`, with evaluated `value`.

## 03 — non-existent expression name

Script: `scripts/03-nonexistent.mjs` — ✅ no error, returns `{ expression: "", value: null }`.

**Learned:** Non-existent names return `{ expression: "", value: null }` with maxLevel=31 and no messages. This is NOT an error condition — the result object is always returned, never VOID/null at the top level. You must check `value === null` to detect "not found".

📌 LLM doc: Non-existent names return `{ expression: "", value: null }`, not an error. Check `value === null`.

## 04 — invalid/missing part ID

Script: `scripts/04-invalid-part.mjs` — ✅ errors as expected.

- Bad ID (`'bogus'`): `result: null`, maxLevel=51, error messages about invalid id conversion
- Missing `id` param: `result: null`, maxLevel=51, "The parameter \"id\" must be provided"

**Learned:** Invalid/missing `id` returns `result: null` (not the `{ expression, value }` object) with error messages. This is a different shape from the success case.

📌 LLM doc: Document the two different result shapes — `null` on param errors vs `{ expression, value }` on success/not-found.

## 05 — missing/empty name param

Script: `scripts/05-missing-name.mjs` — mixed behavior.

- Missing `name` param: `result: null`, maxLevel=51, "The parameter \"name\" must be provided"
- Empty string `name: ''`: `result: { expression: "", value: null }`, maxLevel=31, no error

**Learned:** Missing `name` is an error (null result). Empty string `name` is treated as "not found" — same response as a non-existent name, no error.

📌 LLM doc: Empty string name is silently treated as non-existent, not an error.

## 06 — case sensitivity

Script: `scripts/06-case-sensitivity.mjs` — ✅ case-sensitive.

- `MyVar` (exact): `{ expression: "", value: 42 }`
- `myvar` (lower): `{ expression: "", value: null }`
- `MYVAR` (upper): `{ expression: "", value: null }`
- `myVar` (camel diff): `{ expression: "", value: null }`

**Learned:** Expression name lookup is **case-sensitive**. Only the exact name matches.

📌 LLM doc: Names are case-sensitive.

## 07 — after updateExpression

Script: `scripts/07-after-update.mjs` — key finding about timing.

- Before update: base=50, derived=150
- After `updateExpression` (no recalc): base=100, derived=300
- After `recalc`: base=100, derived=300 (same)

**Learned:** `getExpression` returns updated values **immediately** after `updateExpression`, including cascaded derived expressions. `recalc()` is NOT needed for expression values — only for feature geometry. The existing LLM doc says "updateExpression updates the expression value immediately (getExpression returns the new value)" — **confirmed**. Derived expressions also cascade immediately.

📌 LLM doc: Confirm that derived expressions cascade immediately too, not just the directly updated one.

## 08 — after deleteExpression

Script: `scripts/08-after-delete.mjs` — ✅ consistent.

- Before delete: `{ expression: "", value: 99 }`
- After delete: `{ expression: "", value: null }`

**Learned:** Deleted expression returns the same `{ expression: "", value: null }` as a non-existent one. No error, no special indication that it was deleted vs never existed.

## 09 — broken formula expression

Script: `scripts/09-broken-formula.mjs` — interesting behavior.

- Create with `undefinedVar + 5`: result=0, maxLevel=51 (error on create)
- `getExpression` afterward: `{ expression: "undefinedVar + 5", value: 1 }`, maxLevel=31, no messages

**Learned:** A broken formula expression (created with result=0) is still registered and readable. `getExpression` returns the formula string and the seed value (1) with NO error. The GET call itself succeeds — the creation error doesn't affect subsequent reads. You cannot tell from `getExpression` alone that the formula is broken.

📌 LLM doc: Broken formula expressions are readable — getExpression returns seed value 1 with no error indicator. Only creation returned the error.

## 10 — circular reference

Script: `scripts/10-circular-ref.mjs` — confirms prior training.

- `a` (formula `b + 1`): `{ expression: "b + 1", value: 3 }`
- `b` (formula `a + 1`): `{ expression: "a + 1", value: 2 }`

**Learned:** Circular refs are readable. Values are the seed-pass results (a=3, b=2). Formula strings are preserved exactly.

## 11 — after formula update (not just value)

Script: `scripts/11-update-formula-get.mjs` — ✅ as expected.

- Before: `{ expression: "x + 5", value: 15 }`
- After updating formula to `x * 10`: `{ expression: "x * 10", value: 100 }`

**Learned:** `getExpression` reflects formula changes immediately. Both `expression` and `value` update.

## 12 — after rename

Script: `scripts/12-rename-get.mjs` — ✅ correct after fix.

- Before rename: `oldName` → `{ expression: "", value: 77 }`
- After rename: `oldName` → `{ expression: "", value: null }`, `newName` → `{ expression: "", value: 77 }`

**Learned:** After rename, old name returns "not found" and new name has the value. Clean transition.

Note: First attempt used wrong API signature (`oldName/newName` params instead of `toRename` array). Important — `renameExpression` uses `toRename: [{ name, newName }]`.

## 13 — part with no expressions

Script: `scripts/13-no-expressions.mjs` — ✅ consistent.

- Result: `{ expression: "", value: null }`, maxLevel=31, no messages

**Learned:** Same "not found" response whether the part has no expressions at all or just doesn't have the requested name.

## 14 — special values

Script: `scripts/14-special-values.mjs` — ✅ all preserved correctly.

- `zero`: `{ expression: "", value: 0 }`
- `negative`: `{ expression: "", value: -42.5 }`
- `large`: `{ expression: "", value: 1000000000000000 }`
- `small`: `{ expression: "", value: 1e-10 }`
- `pi` (formula `C:PI`): `{ expression: "C:PI", value: 3.141592653589793 }`

**Learned:** Zero, negative, large, and small values all work. Constants like `C:PI` are stored as formula strings (not resolved to numeric). `1e-10` is preserved in scientific notation.

📌 LLM doc: Constants stored as formula strings. Zero is value 0, not null — important for "not found" detection.

---

## Coverage Checklist

- [x] API called successfully (01, 02)
- [x] Required param `id` tested — valid (01), invalid (04), missing (04)
- [x] Required param `name` tested — valid (01), non-existent (03), missing (05), empty (05), case (06)
- [x] Return structure fully documented — numeric vs formula, not-found vs error
- [x] After update (07, 11), delete (08), rename (12)
- [x] Edge cases: broken formula (09), circular ref (10), no expressions (13), special values (14)
- [x] Realistic usage: create → update → getExpression → verify cascade (07)
