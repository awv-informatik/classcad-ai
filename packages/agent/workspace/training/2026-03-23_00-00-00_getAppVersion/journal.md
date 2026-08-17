# Training: common.getAppVersion

**Date:** 2026-03-23

## Goal

Testing `v1.common.getAppVersion`.

**Methods to cover:**

- `getAppVersion` — no parameters, returns version string
- Envelope shape (result, messages, maxLevel, structure, graphic)
- Edge cases: extra params, repeated calls

**Questions:**

- What exact version string is returned?
- What does the full envelope look like (all 5 keys)?
- Does passing extra/unknown params cause errors?
- Is the result stable across repeated calls?
- What does structure/graphic contain for a stateless call?

---

## 01 — basic call

Script: `scripts/01-basic.mjs` — ✅ Call succeeds with maxLevel 31.

**Learned:** Result is `""` (empty string), not a version. Docs say "app version or empty string if not available" — server returns the "not available" case. Envelope has all 5 keys: `result, messages, maxLevel, structure, graphic`. Messages is `[]`. Structure is present (non-null even on empty drawing). Graphic is falsy.

**📌 LLM doc:** Result is always empty string on this server — usable as a health check but not for version detection.

## 02 — no-arg vs empty-obj

Script: `scripts/02-no-params.mjs` — ✅ Both `getAppVersion()` and `getAppVersion({})` return identical results (`""`, maxLevel 31).

## 03 — extra params

Script: `scripts/03-extra-params.mjs` — ✅ Extra params (`foo`, `id`, `name`) silently ignored. No error, no warning.

## 04 — repeated calls

Script: `scripts/04-repeated.mjs` — ✅ 5 calls all return `""`. Stable, deterministic.

## 05 — structure and graphic on empty drawing

Script: `scripts/05-structure-detail.mjs` — ✅ Structure is non-null with keys: `root, currentProduct, currentInstance, testRoot, tree`. On empty drawing: `root: 1` (AllObjects), `currentProduct: 0`, tree has one node. Graphic is `null`.

**📌 LLM doc:** Structure is always populated (even on stateless calls to empty drawings). Contains the scene graph. Graphic is null in CLI context.

## 06 — version format

Script: `scripts/06-version-format.mjs` — ✅ Confirms empty string: length 0, no dots, no content. Not a semver, not anything.

## 07 — comparison with getClassFileVersion

Script: `scripts/07-with-getClassFileVersion.mjs` — ✅ Both return `""` (empty string). Both are type `string`. Both are identical on this server.

**📌 LLM doc:** Both version APIs return empty strings. They are distinct APIs but yield identical results on this server instance.

## 08 — via batch

Script: `scripts/08-via-batch.mjs` — ✅ Works in batch. Inner envelope has only `result` key (no messages/maxLevel on success). Confirms batch inner envelope behavior documented in generic.md.

## 09 — after part.create

Script: `scripts/09-after-part-create.mjs` — ✅ Version is still `""` after creating a part. Drawing state doesn't affect it. Pure stateless query.

---

## Coverage Checklist

- [x] API called at least once successfully
- [x] No required parameters (API takes none)
- [x] No optional parameters documented — tested extra params (silently ignored)
- [x] No enum values (N/A)
- [x] No update/delete variant (N/A)
- [x] Realistic usage: health check pattern, batch usage, comparison with getClassFileVersion
