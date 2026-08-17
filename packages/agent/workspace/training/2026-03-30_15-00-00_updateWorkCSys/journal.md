# Training: part.updateWorkCSys

**Date:** 2026-03-30

## Goal

Focused study of `v1.part.updateWorkCSys`.

**Coverage checklist:**

- [x] openFeature mandatory
- [x] Update offset
- [x] Update rotation
- [x] Update inverted
- [x] Update name
- [x] Update type (CUSTOM ↔ XYAXISORIGIN)
- [x] Update references on XYAXISORIGIN
- [x] No-op update
- [x] Built-in Origin update
- [x] Wrong ID types
- [x] Multiple updates in one session
- [x] Type change without refs
- [x] Return value structure

---

## 01 — without openFeature

Script: `scripts/01-no-open.mjs` — ❌ confirmed: "not active and open"

---

## 02 — update offset, rotation, inverted + multi-update

Script: `scripts/02-update-offset.mjs` — ✅ all work.

- offset update: maxLevel=31
- rotation update: maxLevel=31
- inverted update: maxLevel=31
- 3 updates in one open session: all maxLevel=31

---

## 03 — rename

Script: `scripts/03-update-name.mjs` — ✅ works. Old name gone, new name found.

---

## 04 — type morphing

Script: `scripts/04-update-type.mjs` — ✅/⚠️

- CUSTOM → XYAXISORIGIN with refs: ✅ maxLevel=31
- XYAXISORIGIN → CUSTOM with offset: ✅ maxLevel=31
- **XYAXISORIGIN without refs: ✅ maxLevel=31** — succeeds silently! Unlike updateWorkAxis which errors "missing references". May leave CSys in ambiguous state.

**📌 LLM doc:** Type change to XYAXISORIGIN without refs succeeds silently (unlike workAxis). Potentially creates an undefined reference state.

---

## 05 — built-in Origin update

Script: `scripts/05-builtin-origin.mjs` — ❌ both fail, but rename takes effect.

- Offset update: maxLevel=51 — "offset: param must have the format: [value_any, isExpression_bl]". Different error from workAxis ("cannot be changed").
- Rename: maxLevel=51 — "Function SetCSysParams not found" internal error
- **But rename took effect**: `getWorkGeometry('Origin')` → null, `getWorkGeometry('MyOrigin')` → 22

**📌 LLM doc:** Built-in Origin has different error messages than other built-in work geometry, but the rename-despite-error quirk is the same.

---

## 06 — no-op + wrong IDs + return value

Script: `scripts/06-noop-wrongid.mjs` — ✅/❌

- No-op (only id): ✅ maxLevel=31, returns same ID, same envelope (result, messages, maxLevel, structure, graphic)
- Part ID: ❌ "not a feature or work geometry id"
- Missing ID: ❌ "id must be provided for update"

---

## 07 — update references

Script: `scripts/07-update-refs.mjs` — ✅ maxLevel=31. Changed origin point, axis refs unchanged.
