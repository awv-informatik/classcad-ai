# Training: common.batch

**Date:** 2026-03-23

## Goal

Testing `v1.common.batch` — how to sequence multiple API calls in a single request.

**Methods to cover:**

- `batch` — basic: multiple stateless queries
- `batch` — with params: jobs that need `param` objects
- `batch` — empty jobs array
- `batch` — single job
- `batch` — job ordering: do jobs execute sequentially? Can later jobs depend on earlier?
- `batch` — error handling: what happens when one job fails?
- `batch` — per-job envelope shape vs outer envelope shape

**Questions:**

- What does the outer envelope look like? Does it have its own messages/maxLevel?
- What does each per-job result look like? Full envelope or just result?
- Are jobs executed in order? Can job 2 use an ID created by job 1?
- What happens if one job fails — do subsequent jobs still run?
- What happens with an empty jobs array?
- Does the outer maxLevel reflect the worst per-job maxLevel?

---

## 01 — basic stateless batch

Script: `scripts/01-basic-stateless.mjs` — ✅ two stateless queries batch correctly.

**Learned:**
- Outer envelope: `result, messages, maxLevel, structure, graphic` (full envelope)
- Per-job result on success: `{ result }` only — **no messages, no maxLevel keys**
- Outer maxLevel: 31 (info) when all jobs succeed
- Outer messages: `[]` when all jobs succeed

📌 LLM doc: Per-job success envelope is minimal — only `{ result }`. Messages/maxLevel only appear on per-job errors.

## 02 — with params

Script: `scripts/02-with-params.mjs` — ✅ jobs with `param` objects work as expected. `evaluateExpression` returns numbers (42, 300).

## 03 — empty jobs array

Script: `scripts/03-empty-jobs.mjs` — ✅ empty `jobs: []` returns `result: []`, maxLevel 31. No error.

📌 LLM doc: Empty jobs array is valid — returns empty result array.

## 04 — single job

Script: `scripts/04-single-job.mjs` — ✅ single job still returns an array of length 1. Result shape: `[{ result: "" }]`.

## 05 — sequential dependency

Script: `scripts/05-sequential-dependency.mjs` — ✅ `part.create` in job 0 returns partId (4). Jobs execute sequentially — drawing state from job 0 is visible to subsequent jobs.

📌 LLM doc: Jobs execute in order. Drawing state mutations from earlier jobs are visible to later jobs.

## 06 — error in middle

Script: `scripts/06-error-in-middle.mjs` — ✅ critical error handling findings.

**Learned:**
- Failed job (invalid expression): `{ result: null, maxLevel: 51, messages: [{ message, level: 51, levelStr: "ERROR", code: 0 }] }`
- Successful jobs (before and after the failure): `{ result: "" }` — no messages/maxLevel keys
- **Subsequent jobs still run** after a failure — batch does NOT abort
- Outer envelope: maxLevel bubbles up to 51, outer messages include the error with `api: "v1.common.batch"`

📌 LLM doc: Batch is non-aborting. Failed jobs get per-job error envelope. Outer maxLevel reflects worst job. Outer messages bubble up errors.

## 07 — bad API name

Script: `scripts/07-bad-api-name.mjs` — ✅ (re-run with null safety)

**Learned:**
- Unknown API name (`v1.fake.nonexistent`): per-job result is literal **`null`** — not an object
- Error only appears in outer messages: `{ code: 1201, message: "Unknown command v1.fake.nonexistent" }`
- Other jobs still run normally
- **Two different error shapes:**
  - Known API + bad params → `{ result: null, maxLevel: 51, messages: [...] }`
  - Unknown API → `null` (literal null, not an object)

📌 LLM doc: Critical gotcha — unknown API returns null (not an object). Must null-check before accessing `.result`.

## 08 — per-job envelope shape

Script: `scripts/08-per-job-envelope.mjs` — ✅ confirmed: all successful jobs have only `{ result }` — no messages, no maxLevel keys, even for `part.create` which normally has a rich envelope.

📌 LLM doc: Per-job success envelope is always `{ result }` only. The harness strips messages/maxLevel from successful per-job results.

---

## Coverage Checklist

- [x] API called at least once successfully
- [x] Required parameter `jobs` tested
- [x] Key optional parameter `param` on jobs exercised
- [x] Edge cases: empty jobs, single job, bad API name, error in middle
- [x] No update/delete method exists
- [x] Realistic usage: sequential jobs with part.create, mixed success/failure

## Summary

`common.batch` sends multiple API calls sequentially in one request. Key findings:
1. Per-job success envelope: `{ result }` only (no messages/maxLevel)
2. Per-job error envelope (known API): `{ result: null, maxLevel, messages }`
3. Per-job error for unknown API: literal `null` — must null-check
4. Batch is **non-aborting** — all jobs run regardless of failures
5. Outer maxLevel reflects worst per-job maxLevel
6. Outer messages bubble up per-job errors with `api: "v1.common.batch"`
7. Jobs execute in order; drawing state from earlier jobs is visible to later ones
8. Empty jobs array is valid
