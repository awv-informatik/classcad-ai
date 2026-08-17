# Training: common.removeUserData

**Date:** 2026-04-17

## Goal

Testing `v1.common.removeUserData` — removes a single user data entry by key from an object.

**Methods to cover:**

- `removeUserData` — basic removal of an existing key
- `removeUserData` — removal of a nonexistent key (expected no-op)
- `removeUserData` — verify value is actually gone via `getUserData`
- `removeUserData` — with invalid/nonexistent ID
- `removeUserData` — with missing key param
- `removeUserData` — multiple removals in sequence
- `removeUserData` — interaction with `setUserData` overwrite behavior (remove then re-set)
- `removeUserData` — on different object types (not just parts)

**Questions:**

- What does `result` contain on success? (Docs say VOID/null)
- What `maxLevel` on success vs failure?
- What happens when removing a key that doesn't exist?
- What error codes appear for bad inputs?
- Does removing a key on one object affect same key on another object?

---

## 01 — basic removal

Script: `scripts/01-basic-remove.mjs` — ✅ as documented. Sets a key, removes it, verifies it's gone.

**Data:** `result: null`, `maxLevel: 31`, `messages: []` on success (see `files/01-basic-remove-remove-response.json`). After removal, `getUserData` with `defaultValue: '__MISSING__'` returns `'__MISSING__'` — key is fully gone.

📌 LLM doc: Returns `null` (VOID) with `maxLevel: 31` and empty messages on success.

## 02 — nonexistent key

Script: `scripts/02-nonexistent-key.mjs` — ✅ removing a key that was never set is a silent no-op (`maxLevel: 31`, no error). Same for double-removing a key that was already removed.

**Data:** Both cases return `{ result: null, messages: [], maxLevel: 31 }` (see `files/02-nonexistent-key-nonexistent-key-response.json`, `files/02-nonexistent-key-double-remove-response.json`).

📌 LLM doc: Removing a nonexistent key is idempotent — safe to call without checking existence first.

## 03 — bad inputs

Script: `scripts/03-bad-inputs.mjs` — error cases tested.

**Data:**

| Input | maxLevel | Error code | Message |
|---|---|---|---|
| Missing `key` param | 51 | 1004 | `The parameter "key" must be provided in the api call!` |
| Fake string ID | 51 | 0 + 1006 | String conversion error + invalid id |
| `id: 0` | 51 | 1006 | `An element of parameter "id" has an invalid id!` |
| Empty key `""` | 31 | — | Success — treated as removing a key named empty string |

See `files/03-bad-inputs-missing-key-response.json`, `files/03-bad-inputs-fake-id-response.json`, `files/03-bad-inputs-zero-id-response.json`, `files/03-bad-inputs-empty-key-response.json`.

📌 LLM doc: Missing key param → error 1004. Invalid/zero ID → error 1006. Empty string key is valid (not an error).

## 04 — multiple keys

Script: `scripts/04-multiple-keys.mjs` — ✅ set 4 keys (a,b,c,d), removed b and c, verified a and d remain with correct values. Removed keys return `'__GONE__'` via defaultValue.

**Data:** `keysBefore: ['d','b','c','a']` → `keysAfter: ['d','a']`. Values: `a: '1'`, `d: '4'`, `b: '__GONE__'` (see `files/04-multiple-keys-multiple-keys.json`).

## 05 — update pattern (remove + re-set)

Script: `scripts/05-update-pattern.mjs` — ✅ confirms the documented update pattern. Direct overwrite via `setUserData` is a no-op (value stays `'v1'`). After `removeUserData` + `setUserData`, value correctly updates to `'v2'`.

**Data:** `{ initial: 'v1', afterDirectOverwrite: 'v1', afterRemoveAndSet: 'v2' }` (see `files/05-update-pattern-update-pattern.json`).

📌 LLM doc: Confirm: the remove-then-set pattern is the only way to update a value.

## 06 — different object types (part vs solid.box)

Script: `scripts/06-different-object-types.mjs` — `solid.box` returns VOID (null) as its result, not a body ID. Passing null to user data APIs produces `maxLevel: 51`. This is a `solid.box` issue, not a `removeUserData` issue.

**Data:** `partBefore: 'part-tag'`, `boxBefore: null`, `partAfter: '__GONE__'`, `boxAfter: null` (see `files/06-different-object-types-object-isolation.json`).

## 07 — special character keys

Script: `scripts/07-special-keys.mjs` — ✅ all special keys (unicode emoji, spaces, embedded newlines, 200-char long key) set and removed successfully. All removals returned `maxLevel: 31`. Keys after: 0 (all removed).

**Data:** See `files/07-special-keys-special-keys.json` — `keysAfter: []`, all remove results `maxLevel: 31`.

## 08 — solid.box returns null (investigation)

Script: `scripts/08-solid-box-userdata.mjs` — confirmed: `solid.box` result is `null`. All user data ops on `id: null` fail with error code 1001: `Set the parameter "id" = VOID is not allowed in this situation!`

**Data:** See `files/08-solid-box-userdata-remove-from-solid-response.json`. This is expected behavior — `solid.box` is a direct modeling API that returns VOID.

## 09 — entity injection (cross-object type)

Script: `scripts/09-entity-injection.mjs` — ✅ user data works on entity injection IDs. Set `'source': 'injected'` on EI, removed it, verified gone. Part's same-key data unaffected.

**Data:** `eiGet: 'injected'`, `eiRemove maxLevel: 31`, `eiAfter: '__GONE__'`, `partStill: 'part-val'` (see `files/09-entity-injection-ei-isolation.json`).

📌 LLM doc: Removal is per-object — removing a key from one object does not affect the same key on other objects.

---

## Coverage Checklist

- [x] The API has been called at least once successfully
- [x] Every required parameter has been tested (id, key)
- [x] Key optional parameters have been exercised (N/A — no optional params)
- [x] Every enum value / type variant has been exercised (N/A)
- [x] The corresponding update/delete methods tested (removeUserData IS the delete method)
- [x] At least one realistic usage combining this API with its prerequisites (scripts 05, 09)
- [x] Behavioral claims verified with data (filewrite dumps) — all entries cite JSON evidence
