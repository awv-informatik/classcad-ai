# Training: common.getClassFileVersion

**Date:** 2026-03-23

## Goal

Testing `v1.common.getClassFileVersion`.

**Methods to cover:**

- `getClassFileVersion` — no params, returns class file version string
- Compare with `getAppVersion` — same shape, same behavior?
- Call with extra params — silently ignored?
- Repeated calls — stable result?
- Call before/after object creation — unaffected by drawing state?

**Questions:**

- What is the actual return value? Empty string like `getAppVersion`?
- Is `maxLevel` 31 (info) on success like `getAppVersion`?
- Does it accept `{}` or can be called with no argument?
- Are extra/unknown parameters silently ignored?

---

## 01 — basic call

Script: `scripts/01-basic.mjs` — ✅ result is `""` (empty string), type string, maxLevel 31, messages `[]`. Envelope keys: `result, messages, maxLevel, structure, graphic`.

## 02 — no argument

Script: `scripts/02-no-arg.mjs` — ✅ works with no argument. Same result `""`, maxLevel 31.

## 03 — extra params

Script: `scripts/03-extra-params.mjs` — ✅ extra/unknown params (`foo`, `id`) silently ignored. Same result.

## 04 — repeated calls

Script: `scripts/04-repeated.mjs` — ✅ 5 consecutive calls all return `""`. Stable.

## 05 — compare with getAppVersion

Script: `scripts/05-compare-appversion.mjs` — ✅ both return `""`, both maxLevel 31, identical envelope keys.

## 06 — after part.create

Script: `scripts/06-after-part-create.mjs` — ✅ result unchanged before/after `part.create`. Stateless.

---

## Coverage Checklist

- [x] API called at least once successfully
- [x] No required parameters (none exist)
- [x] Key optional parameters exercised (none — extra params ignored)
- [x] No enum values / type variants apply
- [x] No update/delete method exists
- [x] Realistic usage: connection health check, compared with sibling API

## Summary

`getClassFileVersion` behaves identically to `getAppVersion`: stateless, no params, returns `""`, maxLevel 31. Both are effectively no-ops on this server — useful only as connection health checks.

📌 LLM doc: Write `references/common/getClassFileVersion.md` — document behavior, empty return, comparison with `getAppVersion`.
