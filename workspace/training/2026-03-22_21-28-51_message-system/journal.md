# Training: Message System

**Date:** 2026-03-22

## Goal

Studying the message system: `{ message, level, code, api }` — how warnings and errors are communicated in API responses.

**Questions to answer:**

- What levels exist and what do they mean? (0=ok, 41-50=warning, 51+=error per SKILL.md)
- When does `messages` appear vs. being absent? Is it always present or only on warnings/errors?
- When does `maxLevel` differ from individual message levels?
- Do all APIs return messages on success, or only some?
- How do error messages differ from warning messages in structure?
- Can a call succeed (valid result) but still have warning-level messages?
- Can a call succeed (valid result) but still have error-level messages?
- What does the `code` field represent? Are codes reusable across APIs?
- What does the `api` field contain? The full API path?
- How does `evaluateExpression`'s `silent` param affect messages?
- What happens with multiple messages in a single response?
- Is `maxLevel` always present when `messages` is present?

---

## 01 — success envelope baseline

Script: `scripts/01-success-envelope.mjs` — ✅ On clean success, `messages` is always `[]` (empty array, never absent). `maxLevel` is always `31` (INFO baseline). The client filters level ≤ 31, so INFO traces are invisible.

**📌 LLM doc:** `messages` is always an array (never undefined). `maxLevel = 31` is the success baseline.

## 02 — error messages

Script: `scripts/02-error-messages.mjs` — ✅ Error responses produce structured messages.

**Learned:**
- Error level = 51, `levelStr = "ERROR"`
- Warning level = 41, `levelStr = "WARNING"`
- `result` is `null` on hard errors
- `code` values: 0 (generic), 1004 (missing param), 1006 (invalid ID), 1201 (unknown API)
- Invalid API has no `api` field; known API errors include `api` with full path e.g. `"v1.part.box"`
- Multiple messages possible in single response (invalid ID → warning + 2 errors)
- `maxLevel` = highest level across all messages

**📌 LLM doc:** Error codes, message structure, `result === null` on errors.

## 03 — warning with success

Script: `scripts/03-warning-with-success.mjs` — ✅ Zero-size, negative, and huge dimensions all produce valid IDs with no warnings. ClassCAD is very permissive with geometric parameters.

## 04 — provoke warnings

Script: `scripts/04-provoke-warnings.mjs` — ✅ Found that `evaluateExpression` with `silent: true` suppresses all messages: `messages: []`, `maxLevel: 31`, `result: null`. The expression still fails, but no error is reported.

**📌 LLM doc:** `silent: true` on `evaluateExpression` suppresses messages AND keeps maxLevel=31. Failure is invisible.

## 05 — success with error (flawed)

Script: `scripts/05-success-with-error.mjs` — ❌ Script design error: `part.create` clears the drawing, invalidating IDs from prior creates. Only the first test case ran correctly.

**Learned:** `part.create` clears the entire drawing. Cannot use multiple `part.create` calls to isolate test cases within a single script.

## 06 — boolean messages by type

Script: `scripts/06-boolean-messages.mjs` — Same issue as 05 (invalidated IDs from clearing). UNION non-overlapping succeeded cleanly (maxLevel=31). SUBTRACTION/INTERSECTION with stale IDs produced expected errors.

## 07 — message field structure

Script: `scripts/07-message-fields.mjs` — ✅ Confirmed message field structure.

**Learned:**
- Unknown API: 4 fields (`code`, `level`, `levelStr`, `message`) — no `api`
- Known API errors: 5 fields (`api`, `code`, `level`, `levelStr`, `message`)
- `levelStr` is **undocumented** in source docs (they only mention `level`)
- Division by zero = error (result null)

**📌 LLM doc:** `levelStr` field exists but is undocumented. Message field count varies (4 or 5 depending on whether `api` is present).

## 08 — warning levels

Script: `scripts/08-warning-levels.mjs` — ✅ Confirmed WARNING (41) and ERROR (51) are the only visible levels above the INFO threshold.

**Learned:** Invalid ID consistently produces: WARNING(41, code=0, ToId) → ERROR(51, code=1006, ID not exist) → ERROR(51, code=1004, missing param). This 3-message cascade is a recognizable pattern.

## 09 — other error scenarios

Script: `scripts/09-raw-messages.mjs` — ✅ Additional error codes found.

**Learned:**
- Invalid `lengthUnit` in `setDatabaseSettings` is silently ignored (no error/warning)
- Error code 1013: invalid parameter value — includes helpful list of valid values in message text
- `load` with missing path: code 1004

## 10 — error codes across domains

Script: `scripts/10-error-codes.mjs` — ✅ Error codes are consistent across all domains.

**Learned:**
- Code 1004 (missing required param): universal — part, sketch, common all use it
- Code 1006 (invalid ID): universal
- Code 1201 (unknown command): universal, no `api` field
- Code 0 (generic warning): universal
- `api` field always contains full qualified path: `v1.domain.method`

**📌 LLM doc:** Error codes are cross-domain constants. Document the code → meaning mapping.

## 11 — maxLevel logic

Script: `scripts/11-maxlevel-logic.mjs` — ✅ As documented.

**Learned:** `maxLevel` = max(all message levels). On success: `maxLevel = 31`. Match confirmed: computed max of individual levels always equals reported maxLevel.

## 12 — level ranges and edge cases

Script: `scripts/12-level-ranges.mjs` — ✅ Edge case behaviors.

**Learned:**
- Extra/unknown params are silently ignored
- `setAppearance` returns `null` on success (VOID return type)
- `getUserData` with missing key returns `""` (empty string), no error
- Batch param is `jobs` (not `calls`) — error message helpfully says which param is needed

## 13 — batch messages (wrong param)

Script: `scripts/13-batch-messages.mjs` — Partly flawed: used `calls` instead of `jobs`. But learned that empty `param: {}` triggers error code 1003 ("object is empty").

**📌 LLM doc:** Error code 1003 = empty object parameter.

## 14 — batch per-job messages

Script: `scripts/14-batch-messages2.mjs` — ✅ Major finding on batch message handling.

**Learned:**
- Batch result = array of per-job sub-results
- Each sub-job can have its own `result`, `messages`, `maxLevel`
- Outer `messages` = aggregated copies from all sub-jobs (with `api` changed to `"v1.common.batch"`)
- Outer `maxLevel` = highest across all sub-jobs
- Successful sub-jobs have only `result` (no messages/maxLevel keys)
- Failed sub-jobs have full `result`, `messages`, `maxLevel`

**📌 LLM doc:** Batch message aggregation: outer envelope merges all sub-job messages. Check per-job results for attribution.

## 15 — failure detection patterns

Script: `scripts/15-failure-detection.mjs` — ✅ Critical finding.

**Learned:**
- `result === null` is **NOT reliable** for failure detection (VOID returns null on success)
- `maxLevel > 31` IS reliable for detecting warnings/errors
- But `silent: true` suppresses everything — even maxLevel stays 31 on failure
- `getUserData` with missing key returns `""` not null — no way to detect "key not found" vs "empty value"

**📌 LLM doc:** Failure detection: use `maxLevel > 31`, not `result === null`. Document the VOID/null ambiguity.

## 16 — level summary

Script: `scripts/16-raw-frame-messages.mjs` — ✅ Summarized all level findings.

**Confirmed levels:** 31 (INFO, filtered), 41 (WARNING), 51 (ERROR). No evidence of other levels.

## 17 — multiple messages and ordering

Script: `scripts/17-multiple-messages.mjs` — ✅ Found `levelStr` inconsistency.

**Learned:**
- Messages appear in order: warnings first, then errors
- `evaluateExpression` messages have `api: undefined` — field missing entirely
- `levelStr` inconsistency: `"WARN"` vs `"WARNING"` for the same level 41

**📌 LLM doc:** `levelStr` is unreliable — use numeric `level` for comparisons. `api` field may be absent even on known APIs (evaluateExpression).

## 18 — levelStr consistency verification

Script: `scripts/18-levelstr-inconsistency.mjs` — ✅ Confirmed inconsistency.

**Learned:**
- `part.box` and `setObjectName`: `levelStr = "WARNING"` for level 41
- `evaluateExpression`: `levelStr = "WARN"` for level 41
- ERROR levelStr is consistently `"ERROR"` across all tested APIs
- `evaluateExpression` is the outlier — both `levelStr` and `api` are non-standard

**📌 LLM doc:** Server-side inconsistency in evaluateExpression message formatting. Always compare numeric `level`, never string `levelStr`.
