# Training: assembly.updateGear & assembly.getGear

**Date:** 2026-05-01

## Goal

Testing `v1.assembly.updateGear` and `v1.assembly.getGear` — the update and query APIs for gear relations.

**Methods to cover:**

- `updateGear` — change ratio, offset, name, constr1Id, constr2Id
- `updateGear` — partial update behavior (only changed params update)
- `updateGear` — batch update (array param)
- `updateGear` — error cases (invalid id, wrong id type)
- `updateGear` — offset with degree expressions vs radians
- `getGear` — retrieve by name, verify all returned fields
- `getGear` — not-found case
- `getGear` — after rename via updateGear
- `getGear` — batch query (array param)

---

## 01 — setup and getGear basic

Script: `scripts/01-setup-and-getGear.mjs` — ✅ gear created with ratio=2.5, offset='45deg'. `getGear` returns all fields correctly.

| ![solid](files/01-setup-and-getGear-initial-gear-solid.png) | ![workgeo](files/01-setup-and-getGear-initial-gear-workgeo.png) |
|---|---|

**Data:** `getGear` returns `{ id, name, constr1Id, constr2Id, ratio, offset }`. All values match creation params. Offset returned as radians (0.7854) even though created with '45deg'. maxLevel=31 on success.

**📌 LLM doc:** getGear return shape and offset-in-radians behavior.

---

## 02 — update ratio

Script: `scripts/02-update-ratio.mjs` — ✅ ratio updated from 1 to 3. All other params preserved.

**Data:** `updateGear({ id: gearId, ratio: 3 })` returns gear ID (263), maxLevel 31. `getGear` confirms ratio=3, offset=0 (unchanged), name='G1' (unchanged), constr1Id/constr2Id unchanged. See `files/02-update-ratio-ratio-update-comparison.json`.

**Learned:** Partial update is reliable — unset params are preserved.

**📌 LLM doc:** Partial update behavior confirmed.

---

## 03 — update offset

Script: `scripts/03-update-offset.mjs` — ✅ offset updated with radians, degree expression, and zero reset.

**Data:**
- Radian update (1.5708): stored as 1.5708
- Degree expression ('30deg'): stored as 0.5236 (π/6)
- Reset to 0: stored as 0
- Ratio preserved through all offset updates (always 2)

See `files/03-update-offset-offset-updates.json`.

**📌 LLM doc:** Offset accepts both radians and degree expressions in updateGear, same as creation.

---

## 04 — update name (rename)

Script: `scripts/04-update-name.mjs` — ✅ name updated from 'OriginalName' to 'RenamedGear'.

**Data:**
- `getGear({ name: 'OriginalName' })` → null, maxLevel 51 (not found)
- `getGear({ name: 'RenamedGear' })` → found with correct id, ratio (1.5) and offset (~1.0472) preserved

See `files/04-update-name-rename-results.json`.

**📌 LLM doc:** Rename makes old name unfindable — same pattern as updateFastened.

---

## 05 — swap constraints

Script: `scripts/05-swap-constraints.mjs` — ✅ constr1Id and constr2Id can be swapped or individually changed.

**Data:**
- Swap: constr1Id=rev1→rev2, constr2Id=rev2→rev1. Both updated correctly.
- Partial: only constr2Id changed to rev3. constr1Id preserved as rev2 (from previous swap).

See `files/05-swap-constraints-swap-results.json`.

**📌 LLM doc:** Constraints are fully swappable after creation. Partial constraint updates work.

---

## 06 — error cases

Script: `scripts/06-error-cases.mjs` — ✅ five error scenarios tested, gear unchanged after all.

**Data:**
1. Assembly ID as gear ID → null, maxLevel 51, code 1007: "not a constraint or relation"
2. Nonexistent ID (99999) → null, maxLevel 51, code 0: "didn't get an existing or valid id"
3. Revolute ID as gear ID → result=255 (the revolute ID!), maxLevel 51, code 0: "SetRelationParams not found" — returns the input ID but with error
4. Fastened as constr1Id → null, maxLevel 51, code 1001: "wrong id type! Only revoluteconstraint"
5. Missing id param → null, maxLevel 51, code 1004: "id must be provided for update"

Gear unchanged after all errors: ratio=1, offset=0.

See `files/06-error-cases-error-cases.json`.

**📌 LLM doc:** Error codes and messages. Note the quirk: passing a revolute constraint ID as gear ID returns the revolute ID with an error (doesn't return null like other errors).

---

## 07 — batch update

Script: `scripts/07-batch-update.mjs` — ✅ array param updates multiple gears at once.

**Data:** `updateGear([{ id: gear1, ratio: 3, offset: '45deg' }, { id: gear2, ratio: 0.5, name: 'BatchRenamed' }])` → result=[342, 346] (array of gear IDs), maxLevel 31. Both gears verified via getGear.

See `files/07-batch-update-batch-update.json`.

**📌 LLM doc:** Batch update works — same array pattern as other update APIs.

---

## 08 — getGear edge cases

Script: `scripts/08-getGear-edge-cases.mjs` — ✅ five edge cases tested.

**Data:**
1. Not-found name → null, maxLevel 51, message: "couldn't be found a constraint with name X"
2. Instance ID instead of assembly ID → null, maxLevel 51 (must use assembly/product ID)
3. Batch getGear → `[{...found...}, null]`, maxLevel 51 (highest level across batch)
4. Case sensitivity: 'testgear' ≠ 'TestGear' → null (names are case-sensitive)
5. Empty name ('') → null

See `files/08-getGear-edge-cases-getGear-edge-cases.json`.

**📌 LLM doc:** Case-sensitive names. Instance ID doesn't work — use assembly ID. Batch query returns array with nulls for not-found.

---

## 09 — multi-param update

Script: `scripts/09-multi-param-update.mjs` — ✅ all 5 optional params updated in a single call.

**Data:** Updated name, ratio, offset, constr1Id, and constr2Id simultaneously. All verified correct via getGear: name='AllUpdated', ratio=5.5, offset=2.094 (120deg), constraints swapped.

See `files/09-multi-param-update-multi-param-result.json`.

**Learned:** All params can be changed atomically in one call.

---

## 10 — edge ratio/offset values

Script: `scripts/10-edge-ratio-values.mjs` — ✅ all edge values accepted without error.

**Data:** All maxLevel=31:
- ratio: 0, -1, -0.5, 100000, 0.001, -100 — all stored as-is
- offset: -1.5708 — stored as-is (negative offset accepted)
- offset: 10 (> 2π) — stored as-is (no wrapping)

See `files/10-edge-ratio-values-edge-values.json`.

**📌 LLM doc:** No validation on ratio or offset range. Negative, zero, and arbitrarily large values all accepted.

---

## 11 — update then delete underlying constraint

Script: `scripts/11-update-then-delete-constraint.mjs` — ✅ cascade deletion confirmed after update.

**Data:** After updating gear (ratio=5, offset='90deg'), deleted rev1 (constr1Id). `getGear` returns null (gear cascade-deleted). `updateGear` on the deleted gear ID also fails: null, maxLevel 51, code 0.

See `files/11-update-then-delete-constraint-cascade-delete.json`.

**📌 LLM doc:** Cascade deletion still works after updates. Updated gear is deleted when its underlying revolute is deleted.

---

## 12 — structure tree after update

Script: `scripts/12-structure-after-update.mjs` — ✅ API values verified, structure tree didn't expose gear node directly.

**Data:**
- After radian update: ratio=3.5, offset=1.0472 (exact value preserved)
- After deg update: ratio=3.5, offset=3.14159 (π)
- Gear node not found via recursive search of structure tree — may be nested differently than expected

See `files/12-structure-after-update-structure-after-update.json`.

**Learned:** getGear is the reliable way to read gear state, not structure tree traversal.
