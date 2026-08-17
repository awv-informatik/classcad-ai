# Training: Api study of `part.renameExpression`

**Date:** 2026-03-25

## Goal

Testing `v1.part.renameExpression` — renaming named expressions.

---

## 01 — basic rename

Script: `scripts/01-basic-rename.mjs` — ✅ as expected. `width` → `w`. Old name returns value=null, new name has value=100.

## 02 — formula propagation (CRITICAL)

Script: `scripts/02-formula-propagation.mjs` — ✅ Renaming `base` to `foundation` auto-updates the formula in `derived` from `"base * 2"` to `"foundation * 2"`. Value stays 20. The rename propagates through formulas.

**📌 LLM doc:** Formula references are auto-updated on rename. This is the counterpart to deleteExpression's inlining behavior.

## 03 — multiple renames

Script: `scripts/03-multiple-renames.mjs` — ✅ all three renamed in one call. result=1.

## 04 — non-existent name

Script: `scripts/04-nonexistent.mjs` — result=0, code 1014 "nope does not exist and can not be renamed".

## 05 — collision (rename to existing name)

Script: `scripts/05-collision.mjs` — result=0, code 1014 "height already exists". Both expressions preserved with original values.

**📌 LLM doc:** Cannot rename to an existing name. No overwrite behavior.

## 06 — invalid newName

Script: `scripts/06-invalid-newName.mjs` — All invalid names fail with code 1014:
- Space: "must contain only word characters"
- Digit start: "must start with a non-digit word character"
- Empty string: same as digit start

Same validation rules as `expression()` creation.

## 07 — empty/omitted toRename

Script: `scripts/07-empty-toRename.mjs` — ✅ both are no-ops. result=1, maxLevel=31.

## 08 — wrong form

Script: `scripts/08-wrong-form.mjs` — ✅ confirmed: direct `name`/`newName` params → silent no-op. result=1, expression NOT renamed. Same trap as update/delete.

**📌 LLM doc:** Same silent no-op trap. Must use toRename array.

## 09 — partial batch failure

Script: `scripts/09-partial-batch.mjs` — **Atomic.** One bad rename (nonexistent `nope`) causes result=0, and neither `a→alpha` nor `b→beta` are applied. Both `a` and `b` keep their original names.

## 10 — swap names

Script: `scripts/10-swap-names.mjs` — ❌ Cannot swap. `a→b` fails because `b` already exists. result=0. Neither rename applied (atomic). To swap, you'd need an intermediate name: a→temp, b→a, temp→b.

**📌 LLM doc:** No direct swap. Use a temporary intermediate name.

## 11 — chain rename

Script: `scripts/11-chain-rename.mjs` — ❌ Cannot chain. `a→b` fails because `b` exists. Same as swap. result=0. Each rename in the batch is checked against the CURRENT state, not the state after prior renames in the batch.

**📌 LLM doc:** Renames in a batch do NOT see each other's effects. They all validate against the pre-batch state.

## 12 — return value structure

Script: `scripts/12-return-value.mjs` — Confirmed: numeric 1/0, not boolean. Same as update/delete.

## 13 — array param form

Script: `scripts/13-array-form.mjs` — ❌ Does NOT work. result=null, code 1001. Same as update/delete.

## 14 — rename to same name

Script: `scripts/14-rename-same-name.mjs` — ❌ Fails with "x already exists" (code 1014). Treats it as a collision with itself. Expression preserved.

**📌 LLM doc:** Renaming to the same name is an error, not a no-op.

## 15 — rename formula expression

Script: `scripts/15-rename-formula-expr.mjs` — ✅ Renaming an expression that HAS a formula preserves the formula. `area = "base * base"` renamed to `surfaceArea` still has formula `"base * base"` and value 100.

---

## Coverage Checklist

- [x] The API has been called at least once successfully
- [x] Every required parameter tested (id, toRename with name/newName)
- [x] Key optional parameters exercised (empty toRename, omitted toRename)
- [x] Error cases covered (nonexistent, collision, invalid name, same name, wrong form)
- [x] Batch behavior tested (multiple, partial failure, swap, chain)
- [x] Formula propagation confirmed
- [x] Array form tested (does NOT work)
- [x] Return value structure documented
