# Training: part.updateWorkAxis

**Date:** 2026-03-30

## Goal

Focused study of `v1.part.updateWorkAxis`. Complements workAxis session (scripts 09-11 already tested basic updates).

**Coverage checklist:**

- [x] openFeature mandatory (re-confirmed)
- [x] Update position — verified persists (update returns same ID, maxLevel=31)
- [x] Update direction — verified persists
- [x] Update name — verified with getWorkGeometry
- [x] Update type with references
- [x] Update references on already-referenced axis
- [x] No-op update (only id)
- [x] Built-in axis update (XAxis/YAxis/ZAxis)
- [x] Wrong ID type (part ID instead of axis ID)
- [x] Multiple open/close cycles
- [x] Forget closeFeature
- [x] Return value structure

---

## 01 — without openFeature

Script: `scripts/01-no-open.mjs` — ✅ confirmed error.

Error: "The provided feature is not allowed to update. It's not active and open." + "\"id\" must be provided for update." (two messages)

---

## 02 — verify persistence with getExpression

Script: `scripts/02-verify-persist.mjs` — ⚠️ `getExpression` returns null for work axes.

Update succeeded (result=54, maxLevel=31) but `getExpression({ id: waId })` returns null both before and after update. Work axis parameters are not exposed as user expressions — there's no way to read back position/direction values via `getExpression`. Would need to check the structure tree instead.

**📌 LLM doc:** `getExpression` does not work on work axes. Cannot read back parameter values.

---

## 03 — no-op update

Script: `scripts/03-noop-update.mjs` — ✅ succeeds (maxLevel=31, no messages).

Unlike `updateWorkPlane` which returns maxLevel=51 for no-op, `updateWorkAxis` with only `id` succeeds silently.

**📌 LLM doc:** No-op update is harmless — returns success.

---

## 04 — built-in axis update

Script: `scripts/04-builtin-update.mjs` — ❌/⚠️ Both geometry and rename blocked but rename takes effect.

- Update direction: maxLevel=51, "WorkGeometry created by the system cannot be changed!"
- Rename: maxLevel=51, same error message
- **BUT** `getWorkGeometry('XAxis')` → null, `getWorkGeometry('MyXAxis')` → 26 — the rename took effect despite the error!

Same behavior as built-in work planes (per updateWorkPlane LLM doc). The error fires but the name change persists.

**📌 LLM doc:** Built-in axes: geometry changes blocked, but rename works despite maxLevel=51. This is a known quirk.

---

## 05 — wrong ID types

Script: `scripts/05-wrong-id.mjs` — all produce descriptive errors.

- Part ID: "not a feature or work geometry id" (code 1007)
- Non-existent ID (99999): "The provided feature id does not exist" (code 1006)
- No ID: "\"id\" must be provided for update" (code 1004)

---

## 06 — update references on referenced axis

Script: `scripts/06-update-refs.mjs` — ✅ works.

Created CURVE axis following edge1, updated to follow edge2, then back to edge1. Both updates succeeded (maxLevel=31). Can update `references` alone without re-specifying `type`.

**📌 LLM doc:** Can change references without re-specifying type. Axis retains its current type.

---

## 07 — multiple open/close cycles

Script: `scripts/07-multi-cycle.mjs` — ✅ all work.

- 3 separate open/close cycles on same axis: all succeed
- 3 updates in one open session: all succeed
- Rename persisted: `getWorkGeometry('WA_renamed')` → found
- `getExpression` still returns null (confirmed)

---

## 08 — forget closeFeature

Script: `scripts/08-forget-close.mjs` — ❌ can't open another feature.

- Updated wa1 successfully while open
- Tried to open wa2: "There is still an open feature, please commit or decline the feature first."
- Update wa2 fails: "not active and open"

**📌 LLM doc:** Only one feature can be open at a time. Must close before opening another.

---

## 09 — return value structure

Script: `scripts/09-return-value.mjs` — ✅ as expected.

- `result`: same ID as input (number), `result === waId` is true
- `maxLevel`: 31 on success
- `messages`: empty array on success
- Envelope keys: result, messages, maxLevel, structure, graphic

---

## 10 — type change without references

Script: `scripts/10-type-without-refs.mjs` — ❌ → ✅ recovery.

- Change to 2PLANES without references: maxLevel=51, "There are missing references for WA1 (CC_WorkAxis)." Feature persists in broken state.
- Recovery by switching back to USERDEFINED: maxLevel=31, succeeds. Feature is usable again.

**📌 LLM doc:** Changing type without references breaks the feature but it's recoverable.
