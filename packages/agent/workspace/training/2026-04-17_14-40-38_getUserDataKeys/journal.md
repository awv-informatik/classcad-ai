# Training: getUserDataKeys

**Date:** 2026-04-17

## Goal

Testing `v1.common.getUserDataKeys` — the key-listing method in the user data CRUD set.

**Methods to cover:**

- `getUserDataKeys` — basic call with valid ID
- Return value shape: `Array<string>` or something else?
- Key ordering: lexicographic vs insertion vs hash map (existing docs contradict — setUserData says "hash map order", getUserData says "lexicographic order")
- Empty case: object with no user data
- After partial removal: keys removed via `removeUserData`
- After full clear: keys after `clearUserData`
- Large key counts: 20 keys
- Different object types: part, sketch, entity injection, work plane
- Error cases: invalid ID, zero ID, missing `id` param, string ID, VOID ID
- Edge case keys: empty string, unicode, special chars, spaces, tabs, newlines, long keys

---

## 01 — basic happy path

Script: `scripts/01-basic.mjs` — ✅ works as expected. 3 keys set (material, color, version) → returned as `Array<string>`.

**Data:** `result: ["color","version","material"]`, `maxLevel: 31`, `messages: []`. Result type is `object (array)`, length 3. See `files/01-basic-basic-response.json`.

**Learned:** Returns array of strings. Order is NOT insertion order (inserted: material, color, version → returned: color, version, material). Also NOT lexicographic (would be: color, material, version). This is hash map order.

## 02 — ordering investigation

Script: `scripts/02-ordering.mjs` — ⚠️ partially failed (second part creation returned VOID).

**Data:** 5 keys set (z-last, a-first, m-middle, b-second, y-almost) → returned `["b-second","m-middle","y-almost","a-first","z-last"]`. Not insertion, not sorted. `[...keys].sort()` would be `["a-first","b-second","m-middle","y-almost","z-last"]` — different from returned.

Second part test (10 numeric keys on partId2) failed because `part.create` returns VOID for a second part in the same drawing. All `setUserData` calls on VOID ID returned error code 1001. The `getUserDataKeys` on VOID ID returned `null` with maxLevel 51. Not a getUserDataKeys bug — separate part.create limitation.

**Learned:** Ordering is definitively hash map order. The `getUserData.md` claim of "lexicographic order" is wrong — needs correction.
**📌 LLM doc:** Correct `getUserData.md` — change "lexicographic order" to hash map order.

## 03 — empty object (no keys)

Script: `scripts/03-empty.mjs` — ✅ clean behavior. Object with no user data returns empty array.

**Data:** `result: []` (empty array, not null), `maxLevel: 31`. `Array.isArray: true`, `length: 0`. See `files/03-empty-empty-response.json`.

**Learned:** Empty case returns `[]`, not `null`. Distinguishable from error case (which returns `null`).
**📌 LLM doc:** Document empty → `[]`, error → `null`.

## 04 — after removal and clear

Script: `scripts/04-after-removal.mjs` — ✅ all as expected.

**Data:** Before: `["epsilon","delta","beta","gamma","alpha"]` (5 keys, hash order). After removing gamma: `["epsilon","delta","beta","alpha"]` (4 keys, same relative order minus gamma). After clearUserData: `[]`. See `files/04-after-removal-removal-response.json`.

**Learned:** Removal preserves the relative order of remaining keys. clearUserData produces empty array.

## 05 — large key count

Script: `scripts/05-large-key-count.mjs` — ✅ works up to 20 keys.

**Data:** Every step from 1 to 20 keys returned a correctly-sized array with maxLevel 31. No threshold, no truncation, no null. See `files/05-large-key-count-large-key-results.json`.

**Learned:** At least 20 keys work fine. No observed limit.

## 06 — two parts (VOID ID investigation)

Script: `scripts/06-two-parts.mjs` — confirmed script-02 behavior.

**Data:** `partId1: 4`, `partId2: null`. All `setUserData` on null ID → error code 1001 ("Set the parameter \"id\" = VOID is not allowed"). `getUserDataKeys` on null ID → `result: null`, `maxLevel: 51`. Part1 keys: `["b","a"]` (correct). See `files/06-two-parts-two-parts.json`.

**Learned:** Passing VOID/null as ID returns `result: null` with maxLevel 51 and error code 1001. This is consistent with all user data APIs.

## 07 — error cases

Script: `scripts/07-errors.mjs` — ✅ all errors documented.

**Data:** See `files/07-errors-errors.json`.

| Input | result | maxLevel | Error codes |
|---|---|---|---|
| `id: 9999` (nonexistent) | `null` | 51 | warning 0 (ToId didn't get valid id) + error 1006 |
| `id: 0` | `null` | 51 | error 1006 |
| `{}` (missing id) | `null` | 51 | error 1004 ("id must be provided") |
| `id: 'not-a-real-id'` | `null` | 51 | warning 0 (string conversion failed) + error 1006 |

**Learned:** Error behavior is identical to the other user data APIs. All errors return `result: null` with maxLevel 51. Error codes match: 1004 (missing param), 1006 (invalid id), 1001 (VOID id).
**📌 LLM doc:** Document error codes and null return on error.

## 08 — different object types

Script: `scripts/08-object-types.mjs` — ✅ works on all tested types.

**Data:** entity injection (id=54) → keys `["eif-key"]`. Sketch (id=60) → keys `["sketch-key"]`. Work plane (id=68) → keys `["wp-key"]`. Part (id=4) → keys `["part-key"]` only (no leakage from children). `solid.box` returns VOID (can't set user data on direct solids). See `files/08-object-types-object-types.json`.

**Learned:** Works on part, entity injection, sketch, work plane. Per-object isolation confirmed — parent does not see child keys. Cannot set/get keys on objects that return VOID (like solid.box).
**📌 LLM doc:** Document per-object isolation and VOID limitation.

## 09 — edge case keys

Script: `scripts/09-edge-keys.mjs` — ✅ all 7 edge case keys preserved.

**Data:** All 7 keys returned: empty string (len=0), unicode "日本語" (len=3), spaces, tabs, newlines, special chars "!@#$%^&*()", 200-char key. All preserved exactly. maxLevel: 31. See `files/09-edge-keys-edge-keys.json`.

**Learned:** Any string content is valid as a key. No filtering, no truncation, no escaping.

## 10 — realistic CRUD workflow

Script: `scripts/10-realistic-workflow.mjs` — ✅ clean end-to-end workflow.

**Data:** Set 5 keys → `getUserDataKeys` returned all 5. Iterated keys with `getUserData` to build metadata map — all values correct. `allKeys.includes('weight')` → true. After removing 2 keys → 3 remaining. See `files/10-realistic-workflow-workflow.json`.

**Learned:** `getUserDataKeys` is the canonical way to enumerate metadata. Use `allKeys.includes(key)` for existence checks. Iterate + `getUserData` to dump all metadata.
**📌 LLM doc:** Document the enumerate-all pattern and existence-check pattern.

---

## Coverage Checklist

- [x] The API has been called at least once successfully
- [x] Every required parameter has been tested (`id`)
- [x] Key optional parameters have been exercised (none exist — only `id` is accepted)
- [x] Every enum value / type variant has been exercised (N/A)
- [x] The corresponding update*/delete* method tested (N/A — read-only query)
- [x] At least one realistic usage combining this API with its prerequisites (script 10)
- [x] Behavioral claims verified with data (filewrite dumps) AND log values
