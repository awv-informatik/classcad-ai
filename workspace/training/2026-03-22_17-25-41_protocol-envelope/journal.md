# Training: Protocol Envelope

**Date:** 2026-03-22

## Goal

Study the JSON request/response protocol envelope: `{ result, messages?, maxLevel? }`.

**Aspects to cover:**

- Envelope structure from a successful stateless call (`getAppVersion`, `getClassFileVersion`)
- `result` field — types: string, real, VOID, array, object
- `messages` array — structure: `{ message, level, code, api }`
- `maxLevel` — highest severity among messages
- Message levels: trace=11, debug=21, info=31, warning=41, error=51, fatal=61
- Behavior on error — what does the envelope look like when a call fails?
- Behavior with no messages — is `messages` absent or empty array?
- `evaluateExpression` — returns real/point/VOID, good for testing result types
- Intentional errors — wrong API name, missing required params, bad types
- Batch envelope — nested envelopes inside `batch` result array

**Questions:**

- When a call succeeds cleanly, is `messages` omitted entirely or present as `[]`?
- What `maxLevel` values appear for clean calls vs warnings vs errors?
- Is `code` always present in messages? What values?
- What happens with an unknown API name?
- Does `execute()` in the harness return the full envelope or strip it?

---

## 01 — envelope basic structure

Script: `scripts/01-envelope-basic.mjs` — called `getAppVersion` and `getClassFileVersion`, dumped full envelope.

**Learned:** The actual envelope has **5 keys**, not 3:

```
{ result, messages, maxLevel, structure, graphic }
```

- `result`: `""` (empty string for both version APIs)
- `messages`: `[]` (empty array — NOT absent)
- `maxLevel`: `31` (info level, even on clean calls)
- `structure`: full object tree of the drawing (huge JSON — root, tree, parent/child hierarchy)
- `graphic`: `null` (rendering data for client apps)

The harness `trimResult()` strips `structure` and `graphic` from the display output.

**📌 LLM doc:** Document that envelope is 5 keys, `messages` is always present as array, `maxLevel` baseline is 31.

---

## 02 — result types

Script: `scripts/02-result-types.mjs` — tested string, real, VOID, object, trig.

- **string**: `typeof` is `"string"`, e.g. `""` from `getAppVersion`
- **real**: `typeof` is `"number"`, e.g. `5` from `evaluateExpression('2+3')`
- **VOID**: comes through as `null` in JS (not undefined, not a special token)
- **object**: plain JS object from `getDatabaseSettings` — properties use `1`/`0` numbers for booleans
- **trig**: `sin(C:PI/2)` = `1` — expression syntax `C:PI` accesses the PI constant
- `point(1,2,3)` expression failed — this syntax doesn't work for evaluateExpression

**📌 LLM doc:** VOID = `null`, booleans in objects are `1`/`0` numbers, expression constants use `C:` prefix.

---

## 03 — error envelope

Script: `scripts/03-error-envelope.mjs` — tested bad expression, silent mode.

**Bad expression `"this is garbage"`:**

- `result`: `null`
- `messages`: `[{ api: "v1.common.evaluateExpression", code: 0, level: 51, levelStr: "ERROR", message: "Expression ... could not be evaluated." }]`
- `maxLevel`: `51`

**Silent mode (`silent: true`):**

- `result`: `null` (still null — expression still fails)
- `messages`: `[]` (suppressed!)
- `maxLevel`: `31` (back to baseline)

**Learned:** `silent` suppresses messages but doesn't change the result. Messages have an undocumented `levelStr` field (e.g. `"ERROR"`, `"WARNING"`).

**📌 LLM doc:** `levelStr` is undocumented. `silent: true` suppresses messages but result is still `null`.

---

## 04 — wrong API name

Script: `scripts/04-wrong-api-name.mjs` — called nonexistent APIs.

Does NOT throw. Returns envelope:

- `result`: `null`
- `messages`: `[{ levelStr: "ERROR", level: 51, code: 1201, message: "Unknown command v1.common.doesNotExist" }]`
- Note: `api` field MISSING from error message (contrast with other errors that include it)
- Same for bogus namespace `v1.bogus.fake`

**📌 LLM doc:** Code 1201 = unknown command. `api` field is inconsistently present in messages.

---

## 05 — message levels on success

Script: `scripts/05-message-levels.mjs` — tested part.create, extra params, expression.

- `part.create`: `result: 4` (ID as number), `messages: []`, `maxLevel: 31`
- Extra bogus params: silently ignored, no warning
- Successful expression: `messages: []`, `maxLevel: 31`

**Learned:** `maxLevel: 31` (info) is the universal baseline for successful calls. Extra params are silently ignored.

---

## 06 — batch envelope

Script: `scripts/06-batch-envelope.mjs` — batch with 4 jobs (2 success, 1 error, 1 success).

**Outer envelope:**

- `result`: array of inner envelopes
- `maxLevel: 51` — bubbles up highest severity from any job
- `messages`: contains the error from job[2], re-attributed to `api: "v1.common.batch"`

**Inner envelopes (per job):**

- Successful jobs: only `{ result }` — NO `messages` or `maxLevel` keys
- Failed jobs: full `{ result, messages, maxLevel }`

**Learned:** Batch does NOT stop on error — all jobs run. Inner envelopes are minimal for success. Outer messages include errors from inner jobs re-attributed to batch.

**📌 LLM doc:** Batch inner envelopes are NOT the same shape as outer ones. Batch continues past errors.

---

## 07 — ID and Array result types

Script: `scripts/07-id-and-array-results.mjs` — tested part.create, sketch.create, sketch.rectangle.

- `part.create` result: `4` (number) — IDs are JS numbers
- `sketch.create` result: `52` (number)
- `sketch.rectangle` result: `[58, 64, 70, 76]` — Array of numbers (4 line IDs)

**Learned:** IDs are plain JS numbers. Array results are plain JS arrays of numbers.

---

## 08 — structure field

Script: `scripts/08-structure-field.mjs` — dumped structure before/after part.create and sketch.create.

**Empty drawing:** `{ root: 1, currentProduct: 0, currentInstance: 0, testRoot: 0, tree: { "1": { name: "AllObjects", class: "AllObjects", ... } } }`

**After part.create:** Tree explodes — Part (id=4) with children: ExpressionSet(6), DimensionSet(8), GeometrySet(10), ReferenceSet(12), SketchSet(14), EntitySet(16), OperationSequence(18). GeometrySet contains work geometry: Origin(22), XAxis(26), YAxis(30), ZAxis(34), Top(38), Front(42), Right(46).

**After sketch.create:** Sketch(52) appears under SketchSet(14), SketchReference(54) under OperationSequence(18).

`graphic` field: always `null` for these calls.

**Learned:** `structure` is the full scene graph — every object with its members, parents, children. It's the server-side object database exposed. Agents generally don't need it; the `result` field is what matters.

---

## 09 — missing required params

Script: `scripts/09-missing-required-params.mjs` — omitted required params.

**Missing `expression` param:**

- 2 error messages in one envelope:
  1. `code: 1004` — "The parameter "expression" must be provided in the api call!"
  2. `code: 0` — internal evaluation error (follow-on crash)
- Note: `api` field MISSING from both messages (inconsistent with other APIs)

**Missing `id` param on setUserData:**

- 1 error message: `code: 1004`, `api: "v1.common.setUserData"` (api field IS present)

**📌 LLM doc:** Code 1004 = missing required param. Multiple messages possible per call. `api` field presence is inconsistent.

---

## 10 — error detection patterns

Script: `scripts/10-error-detection.mjs` — wrong ID types and values.

**String where ID expected (`"not-a-real-id"`):**

- WARNING (41): "The string ... couldn't be converted to an id"
- ERROR (51): "An element of parameter "id" has an invalid id!" (code 1006)
- Both messages have `api: "v1.sketch.create"`

**Nonexistent numeric ID (999999):**

- WARNING (41): "ToId()/TOID() didn't get an existing or valid id."
- ERROR (51): code 1006, same as above

**String "TRUE" where boolean expected:**

- ERROR (51): code 1001, "The parameter "silent" has the wrong type! It should be of type (boolean)"

**📌 LLM doc:** Error codes: 1001=wrong type, 1004=missing param, 1006=invalid ID, 1007=wrong ID type, 1201=unknown command. Warnings (41) often appear as precursors to errors.

---

## 11 — parameter passing variants

Script: `scripts/11-no-params-variants.mjs` — tested `[{}]`, `[]`, `undefined`.

- `[{}]`: works fine, `result: ""`, `maxLevel: 31`
- `[]`: works fine, same result
- `undefined`: `result: null`, `maxLevel: undefined` — broken envelope

**Learned:** Always pass at least `[]` or `[{}]`. Passing `undefined` produces an incomplete response.

**📌 LLM doc:** Always pass params as `[{ ... }]` or at minimum `[{}]`. Never pass `undefined`.

---

## 12 — maxLevel baseline

Script: `scripts/12-maxlevel-baseline.mjs` — tried to trigger warning-only scenarios.

- Clean call: `maxLevel: 31` (info)
- `setAppearance` on part ID (not feature ID): code 1007, `maxLevel: 51` — need operation/feature ID
- `clear` with nonexistent keepIds: WARNING + ERROR pair, same pattern as script 10

Could not trigger a warning-only scenario (level 41 without level 51). Warnings always appeared as precursors to errors.

**📌 LLM doc:** In practice, `maxLevel >= 51` means error, `maxLevel == 31` means clean success. Warnings (41) without errors may be theoretically possible but not observed.

---

## Coverage check

- [x] Envelope structure documented (5 keys, not 3)
- [x] All result types tested (string, number, null/VOID, object, array)
- [x] Message structure documented (level, levelStr, code, api, message)
- [x] maxLevel baseline (31) and error levels documented
- [x] Error detection pattern (check `maxLevel >= 51`)
- [x] Batch envelope (nested, minimal for success, continues past errors)
- [x] Error codes cataloged (1001, 1004, 1006, 1007, 1201)
- [x] Edge cases (missing params, wrong types, wrong IDs, unknown APIs, param passing)

All aspects covered. Moving to Step 5.

