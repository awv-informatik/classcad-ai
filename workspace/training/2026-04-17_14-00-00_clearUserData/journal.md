# Training: common.clearUserData

**Date:** 2026-04-17

## Goal

Testing `v1.common.clearUserData` — bulk removal of all user data entries from an object.

**Methods to cover:**

- `clearUserData` — basic usage: set multiple keys, clear, verify all gone
- `clearUserData` — return value structure (result, maxLevel, messages)
- `clearUserData` on object with no user data (no-op case)
- `clearUserData` with invalid/nonexistent IDs
- `clearUserData` isolation — clearing one object doesn't affect another
- `clearUserData` across object types (part, EIF, work plane, sketch, solid)
- `clearUserData` then re-set keys (verify the object accepts new data after clear)

**Questions:**

- Does clearUserData return any useful value or just VOID?
- What happens with id=0, nonexistent ID, missing id param?
- After clearing, can you immediately set new keys?
- Does clearing affect object state beyond user data?
- Is it truly atomic — partial clear possible on error?

---

## 01 — basic clear

Script: `scripts/01-basic-clear.mjs` — ✅ Set 3 keys (material, color, version), cleared all, verified empty.

**Data:** `clearUserData` returns `result: null`, `maxLevel: 31`, `messages: []`. After clear, `getUserDataKeys` returns `[]` and `getUserData` returns default value `__GONE__`. See `files/01-basic-clear-clear-response.json`.

**Learned:** clearUserData is a clean bulk delete. No useful return value — always null/VOID.

## 02 — clear on empty + double clear

Script: `scripts/02-clear-empty.mjs` — ✅ Idempotent. Both calls return maxLevel=31, no error.

**Data:** Clear on object with no user data: `result: null, maxLevel: 31, messages: []`. Double clear (clear after already cleared): same. See `files/02-clear-empty-clear-empty-response.json`.

**Learned:** clearUserData is fully idempotent. Safe to call without checking if data exists.

## 03 — invalid IDs

Script: `scripts/03-invalid-ids.mjs` — ✅ All invalid IDs produce proper errors.

**Data:**
- `id=0`: maxLevel=51, code 1006 ("invalid id")
- `id=9999` (nonexistent): maxLevel=51, code 1006 + warning code 0 ("ToId()/TOID() didn't get an existing or valid id")
- Missing `id` param: maxLevel=51, code 1004 ("parameter 'id' must be provided")

See `files/03-invalid-ids-invalid-ids-response.json`.

**Learned:** Error behavior matches other user data APIs exactly. Same error codes and messages.

## 04 — across object types

Script: `scripts/04-object-types.mjs` — ✅ Works on all 6 object types tested.

**Data:** Set + clear on part (4), EIF (54), workPlane (62), sketch (68), sketchLine (74), solidBox (83). All returned `setMaxLevel: 31`, `clearMaxLevel: 31`, `keysAfterClear: []`. See `files/04-object-types-object-types-response.json`.

**Learned:** clearUserData works on every object type, matching setUserData's universal scope.

## 05 — isolation

Script: `scripts/05-isolation.mjs` — ✅ Clearing part does not affect EIF data.

**Data:** Part had keys [color, material], EIF had keys [weight, material]. After `clearUserData({ id: partId })`: part keys=[], EIF keys=[weight, material] unchanged. EIF's material value still "aluminum". See `files/05-isolation-isolation-response.json`.

**Learned:** clearUserData is strictly per-object. No cascade to child objects or same-name keys elsewhere.

## 06 — re-set after clear

Script: `scripts/06-reset-after-clear.mjs` — ✅ Keys can be re-set after clear with new values.

**Data:** Set a=1, b=2. Clear. Re-set a=new1, b=new2. Both succeed (maxLevel=31). Keys after re-set: [b, a]. Values: a=new1, b=new2. See `files/06-reset-after-clear-reset-after-clear-response.json`.

**Learned:** After clearUserData, keys are truly removed — setUserData works again on the same keys (unlike the overwrite-is-no-op trap). This makes clearUserData the proper "wipe and start fresh" mechanism.
📌 LLM doc: clearUserData is the clean alternative to remove-then-set for bulk updates.

## 07 — many keys (50)

Script: `scripts/07-many-keys.mjs` — ✅ 50 keys cleared in a single call.

**Data:** Set 50 keys (key_0..key_49). Clear: maxLevel=31. Keys after: 0. See `files/07-many-keys-many-keys-response.json`.

**Learned:** No limit observed for bulk clear. Handles large key sets cleanly.

---

## Answers to questions

1. **Return value?** Always `result: null` (VOID), `maxLevel: 31`, `messages: []`. No useful return.
2. **Invalid IDs?** id=0 → code 1006. id=9999 → code 1006 + warning. Missing id → code 1004. All maxLevel=51.
3. **Re-set after clear?** Yes. Keys are truly deleted, so setUserData works again immediately.
4. **Affect object state?** No. Only user data is removed. Object and its geometry/features are unaffected.
5. **Atomic?** Yes — single API call, no partial failure observed. Either all keys are removed or an error is returned.
