# Training: setUserData

**Date:** 2026-04-17

## Goal

Testing `v1.common.setUserData` — attaching custom string key-value metadata to ClassCAD objects.

**Methods to cover:**

- `setUserData` — set a key-value pair on an object
- `getUserData` — read back a key (used as verification probe, not the primary target)
- `getUserDataKeys` — list all keys (used as verification probe)

**Parameters:**

- `id` — which objects accept user data? (part, feature, sketch, entity injection, work geometry, solid, sketch curve)
- `key` — string key. Edge cases: empty string, special characters, very long keys, duplicate keys (overwrite?)
- `value` — string value. Edge cases: empty string, very long values, special characters, JSON strings

**Questions:**

- Does `setUserData` overwrite an existing key silently, or error?
- What object types accept user data? All? Only parts?
- Does it return VOID on success, or something else?
- What maxLevel on success? On invalid ID?
- Is user data preserved across save/load cycles?
- What happens with numeric/boolean values — auto-coerced to string, or error?

---

## 01 — basic set and get

Script: `scripts/01-basic-set-get.mjs` — ✓ Happy path works as documented.

**Data:** `setUserData` returns `result: null` (VOID), `maxLevel: 31` (info). `getUserData` returns the string value. `getUserDataKeys` returns `["material"]`. See `files/01-basic-set-get-set-response.json`.

---

## 02 — multiple keys and overwrite

Script: `scripts/02-multiple-keys-overwrite.mjs` — ⚠️ Overwrite is a **silent no-op**.

**Data:** After setting 3 keys [material, color, weight], `getUserDataKeys` returns `["weight","color","material"]` — key order is not insertion order. After calling `setUserData` with key 'material' and value 'aluminum', `getUserData` still returns `"steel"`. No error, no warning — `maxLevel: 31`, empty messages. See `files/02-multiple-keys-overwrite-overwrite-check.json`.

**Learned:** `setUserData` does NOT overwrite existing keys. It silently ignores the write. Key ordering is undefined (hash map).
**📌 LLM doc:** Critical gotcha — must remove then re-set to update a value.

---

## 03 — object types

Script: `scripts/03-object-types.mjs` — ✓ All object types accept user data.

**Data:** Tested on part, entity injection, work plane, work axis, sketch, sketch line, solid. All returned maxLevel=31 and `getUserData` returned the expected value. See `files/03-object-types-object-types.json`.

**Learned:** User data works on every object type, not just parts.
**📌 LLM doc:** Works on any object with an ID.

---

## 04 — edge cases (keys and values)

Script: `scripts/04-edge-cases-keys-values.mjs` — ✓ All edge cases roundtrip correctly.

**Data:** Tested empty key, empty value, special chars `!@#$%`, unicode, spaces, JSON string value, newlines, 500-char key, 10K-char value. All pass with maxLevel=31 and exact roundtrip. See `files/04-edge-cases-keys-values-edge-cases.json`.

**Learned:** The string key-value store is very permissive — no length limits encountered, all character sets work.

---

## 05 — overwrite investigation

Script: `scripts/05-overwrite-investigation.mjs` — ✓ Confirms overwrite is no-op. Remove+re-set workaround works.

**Data:** Set 'mat' → 'steel'. Attempted overwrite with 'aluminum' → still 'steel'. Called `removeUserData` (maxLevel=31), then `getUserData` with default returns 'GONE'. Re-set to 'aluminum' → now returns 'aluminum'. See `files/05-overwrite-investigation-overwrite-investigation.json`.

**Learned:** To update a value: `removeUserData` → `setUserData`. The remove+re-set pattern is the only way.
**📌 LLM doc:** Update pattern: remove then re-set.

---

## 06 — type coercion

Script: `scripts/06-type-coercion.mjs` — ❌ Non-string values fail with maxLevel=51.

**Data:** Tested number (42), float (3.14), boolean true/false, null, undefined, array, object. All get `maxLevel: 51` (error) and value is NOT set (`getUserData` returns the defaultValue 'NOT_SET'). No keys created. See `files/06-type-coercion-type-coercion.json`.

**Learned:** Strictly strings only. No auto-coercion. Non-string values are rejected with error-level maxLevel.
**📌 LLM doc:** Values must be strings. Use `String()` or `JSON.stringify()` for non-strings.

---

## 07 — invalid IDs

Script: `scripts/07-invalid-id.mjs` — ⚠️ Negative ID (-1) hangs the server.

**Data:** 
- Valid ID: maxLevel=31 ✓
- id=9999: maxLevel=51, messages: `"An element of parameter \"id\" has an invalid id!"`
- id=0: maxLevel=51, same error
- id=-1: **Timeout — server hung at 100% CPU.** Had to `kill -9` and restart.

**Learned:** Invalid IDs (9999, 0) produce proper errors. But id=-1 causes a server hang — this is a bug.
**📌 LLM doc:** Never pass negative IDs. Warn about potential crash.

---

## 08 — save/load persistence

Script: `scripts/08-save-load-persistence.mjs` — ❌ User data does NOT survive OFB save/load.

**Data:** Set 3 keys on part, 1 on entity injection, 1 on solid. Saved to OFB base64 (44256 chars). After clear+load, part keys are empty `[]`, material returns 'MISSING'. See `files/08-save-load-persistence-persistence.json`.

**Learned:** User data is **session-only**. It is NOT serialized into OFB files. This is not documented.
**📌 LLM doc:** Critical limitation — user data is lost on save/load. Session-only metadata.

---

## 09 — copy behavior

Script: `scripts/09-copy-not-copied.mjs` — ✓ Confirmed: user data is NOT copied on duplication.

**Data:** Original box has key 'tag'='original'. After `solid.copy`, the copy has empty keys and `getUserData` returns 'NOT_COPIED'. See `files/09-copy-not-copied-copy-behavior.json`.

**Learned:** Matches documentation: "If the given object will be copied later, the user data is not copied as well."

---

## 10 — remove and clear

Script: `scripts/10-remove-clear.mjs` — ✓ Both work correctly, idempotent.

**Data:** 
- `removeUserData` on existing key: returns null, maxLevel=31. Key removed.
- `removeUserData` on nonexistent key: silent no-op, maxLevel=31, empty messages.
- `clearUserData`: returns null, maxLevel=31. All keys removed.
- `clearUserData` on already-empty: silent no-op, maxLevel=31.

See `files/10-remove-clear-remove-clear.json`.

---

## 11 — getUserData defaults and case sensitivity

Script: `scripts/11-getdata-defaults.mjs` — ✓ Defaults work as documented. Keys are case-sensitive.

**Data:**
- No default specified, key missing: returns `""` (empty string), maxLevel=31
- Default specified: returns the defaultValue
- **Keys are case-sensitive**: "Material" ≠ "material"
- `getUserDataKeys` on empty: returns `[]`

See `files/11-getdata-defaults-defaults.json`.

**📌 LLM doc:** Keys are case-sensitive. Default is `""` when no defaultValue specified.

---

## 12 — part-level features

Script: `scripts/12-part-features.mjs` — ✓ Works on part-level features (box, extrusion, work plane).

**Data:** Set user data on box feature (id=54), extrusion feature (id=102), and work plane. All returned expected values. maxLevel=31 across the board. See `files/12-part-features-part-features.json`.

---

## 13 — string coercion workaround

Script: `scripts/13-string-coercion-workaround.mjs` — ✓ `String()` and `JSON.stringify()` roundtrip correctly.

**Data:** Stored `String(42)` → `"42"`, `String(3.14159)` → `"3.14159"`, `String(true)` → `"true"`, `JSON.stringify({nested: true})` → `"{\"nested\":true,\"count\":42}"`. All roundtrip perfectly via `Number()`, boolean check, `JSON.parse()`. See `files/13-string-coercion-workaround-coercion-workaround.json`.

**📌 LLM doc:** Working pattern for storing non-string data.

---

## Coverage Checklist

- [x] `setUserData` called successfully
- [x] All required parameters tested (id, key, value)
- [x] Key optional parameters: N/A (none are optional)
- [x] Corresponding remove/clear methods tested
- [x] Realistic usage across multiple object types
- [x] Behavioral claims verified with `filewrite` data
- [x] Edge cases: empty, special chars, unicode, long strings, type errors, invalid IDs
- [x] Persistence behavior: save/load, copy
- [x] Overwrite semantics discovered and documented
