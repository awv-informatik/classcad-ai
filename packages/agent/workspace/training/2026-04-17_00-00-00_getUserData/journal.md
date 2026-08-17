# Training: common.getUserData

**Date:** 2026-04-17

## Goal

Testing `v1.common.getUserData` — reading string key-value metadata from ClassCAD objects.

**Methods to cover:**

- `getUserData` — basic read of existing key
- `getUserData` — defaultValue param when key exists vs missing
- `getUserData` — default behavior with no defaultValue param (docs say returns "")
- `getUserData` — after removeUserData / clearUserData
- `getUserData` — on different object types (part, eif, work plane, sketch, solid)
- `getUserData` — edge cases: empty key, unicode key, long key
- `getUserData` — error cases: invalid ID, nonexistent ID
- `getUserData` — envelope structure (result type, messages, maxLevel)

**Questions:**

- What exactly does the return envelope look like on success?
- Does defaultValue have to be a string, or does it accept other types?
- What is maxLevel on a successful read? On a missing key with default?
- How does it behave on objects that never had setUserData called?
- Does it work on every object type or are some excluded?

---

## 01 — basic read

Script: `scripts/01-basic-read.mjs` — ✅ as documented. Set "steel" on partId, read it back.

**Data:** `result: "steel"`, `typeof result: "string"`, `maxLevel: 31`. See `files/01-basic-read-basic-read-response.json`.

**Learned:** Returns string, maxLevel=31 on success. Straightforward.

## 02 — defaultValue behavior

Script: `scripts/02-default-value.mjs` — ✅ docs confirmed + one clarification.

**Data** (from `files/02-default-value-default-value-cases.json`):
- Key exists, no defaultValue → `"hello"`, maxLevel=31
- Key exists, with defaultValue `"fallback"` → `"hello"` (ignores default), maxLevel=31
- Key missing, no defaultValue → `""` (empty string), maxLevel=31
- Key missing, with defaultValue `"fallback"` → `"fallback"`, maxLevel=31

**Learned:** Missing key is NOT an error (maxLevel=31 always). Default is `""` when no defaultValue param. When key exists, defaultValue is ignored.

## 03 — after remove and clear

Script: `scripts/03-after-remove-clear.mjs` — ✅ as expected.

**Data** (from `files/03-after-remove-clear-after-remove-clear.json`):
- Before remove: a="alpha", b="beta"
- After removeUserData(key='a'): a="__GONE__" (returns default), b="beta" (unaffected)
- After clearUserData: b="__GONE__", c="__GONE__" (all keys gone)

**Learned:** getUserData correctly reflects removal and clearing. No surprises.

## 04 — different object types

Script: `scripts/04-different-objects.mjs` — ✅ works on all tested types.

**Data** (from `files/04-different-objects-different-objects.json`):
- part (id=4): set maxLevel=31, get result="part"
- eif (id=54): set maxLevel=31, get result="eif"
- workPlane (id=62): set maxLevel=31, get result="workPlane"
- sketch (id=68): set maxLevel=31, get result="sketch"
- solid (id=75): set maxLevel=31, get result="solid"

**Learned:** getUserData works on every object type tested — no exclusions.

## 05 — edge case keys

Script: `scripts/05-edge-case-keys.mjs` — ✅ all edge cases work.

**Data** (from `files/05-edge-case-keys-edge-case-keys.json`):
All cases: set maxLevel=31, get matches=true. Empty string keys, spaces, unicode (日本語キー), emoji (🔧), special chars (!@#$%^&*()), 500-char keys, newline-embedded keys — all store and retrieve correctly.

**Learned:** Key handling is extremely permissive. No restrictions found.

## 06 — error cases

Script: `scripts/06-error-cases.mjs` — mixed results, important findings.

**Data** (from `files/06-error-cases-error-cases.json`):
- id=9999 (nonexistent): result=null, maxLevel=51, code=1006 "invalid id" + warning code=0 "ToId() didn't get an existing or valid id"
- id=0: result=null, maxLevel=51, code=1006 "invalid id"
- Never-set key: result="", maxLevel=31 — **not an error**
- Missing key param: result=null, maxLevel=51, code=1004 "key must be provided"

**Learned:** Invalid/nonexistent IDs produce error 1006. Missing required `key` param produces error 1004. But reading a key that was never set is NOT an error — it silently returns "" (or the defaultValue).
**📌 LLM doc:** Document that missing keys are not errors — maxLevel stays at 31.

## 07 — defaultValue type enforcement (unexpected)

Script: `scripts/07-default-value-types.mjs` — ⚠️ strict type enforcement on defaultValue.

**Data** (from `files/07-default-value-types-default-value-types.json`):
- String "fallback": result="fallback", maxLevel=31 ✅
- Empty string "": result="", maxLevel=31 ✅
- Number 42: result=null, maxLevel=51 ❌
- Boolean true: result=null, maxLevel=51 ❌
- null: result=null, maxLevel=51 ❌

**Learned:** `defaultValue` is strictly validated as a string. Passing number, boolean, or null causes an error (maxLevel=51), not a type coercion. This is a potential trap — the docs declare the type as `string` but an agent might naively pass a number.
**📌 LLM doc:** Warn that defaultValue must be a string — non-string values cause full errors, not coercion.

## 08 — multiple keys

Script: `scripts/08-multiple-keys.mjs` — ✅ 20 keys stored and read back correctly.

**Data:** All 20 key_0..key_19 roundtripped. getUserDataKeys returned 20 keys in lexicographic order (key_0, key_1, key_10, key_11, ..., key_9).

**Learned:** No practical limit found at 20 keys. Key ordering from getUserDataKeys is lexicographic string sort.

## 09 — large values

Script: `scripts/09-large-values.mjs` — ✅ up to 50KB strings work.

**Data** (from `files/09-large-values-large-values.json`):
- 100 chars: match=true
- 1,000 chars: match=true
- 10,000 chars: match=true
- 50,000 chars: match=true
- JSON roundtrip: match=true

**Learned:** Large values (at least up to 50KB) store and retrieve without truncation. JSON.stringify → store → retrieve → JSON.parse roundtrip works perfectly.

## 10 — cross-object isolation

Script: `scripts/10-cross-object-isolation.mjs` — ✅ user data is fully isolated per object.

**Data** (from `files/10-cross-object-isolation-cross-object-isolation.json`):
- Before: part="part-value", eif="eif-value" (same key, different objects)
- After clearUserData on part: part="__GONE__", eif="eif-value" (unaffected)

**Learned:** Each object has its own independent user data map. Operations on one don't affect another.

## 11 — overwrite behavior confirmation

Script: `scripts/11-after-overwrite-attempt.mjs` — ✅ confirms setUserData overwrite is a no-op.

**Data** (from `files/11-after-overwrite-attempt-overwrite-attempt.json`):
- After first set("color", "red"): result="red"
- After second set("color", "blue"): result="red" (unchanged!), overwrite maxLevel=31 (no error)
- After remove + set("color", "blue"): result="blue"

**Learned:** Confirmed from getUserData perspective: calling setUserData on an existing key does nothing. The remove→set pattern is the only way to update. This is critical for agents to know.
**📌 LLM doc:** Reinforce the remove→set update pattern, since overwrite is silent.

## 12 — not copied on duplication

Script: `scripts/12-not-copied-on-dup.mjs` — ✅ confirmed: user data is NOT copied.

**Data** (from `files/12-not-copied-on-dup-not-copied-on-dup.json`):
- Original solid: "original"
- Copied solid (via solid.copy): "__NOT_COPIED__" (returns default)
- Original still has data: true

**Learned:** As documented: solid.copy does not carry user data to the copy.

## 13 — not persisted across save/load

Script: `scripts/13-save-load-persistence.mjs` — ✅ confirmed: user data is lost on OFB save/load.

**Data** (from `files/13-save-load-persistence-save-load-persistence.json`):
- Before clear: "hello"
- After OFB save → clear → load: "__LOST__"

**Learned:** User data does not survive the OFB serialization cycle. Session-only storage. This is NOT documented in the API reference — it's a training finding from the setUserData session that I've now re-confirmed.
**📌 LLM doc:** Document that user data is session-only, not persisted in OFB.

---

## Coverage checklist

- [x] The API has been called at least once successfully (script 01)
- [x] Every required parameter tested — `id` and `key` (scripts 01, 06)
- [x] Key optional parameter exercised — `defaultValue` (scripts 02, 07)
- [x] Corresponding CRUD methods tested via getUserData (remove: 03, clear: 03, set: 11)
- [x] Realistic usage combining getUserData with prerequisites (scripts 10, 11, 12, 13)
- [x] Behavioral claims verified with data (filewrite dumps) — all scripts used filewrite
