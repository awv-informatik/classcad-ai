# Training: assembly.deleteTemplate

**Date:** 2026-04-22

## Goal

Testing `v1.assembly.deleteTemplate`.

**Methods to cover:**

- `deleteTemplate` — delete a single part template
- `deleteTemplate` — delete multiple templates in one call (batch `ids`)
- `deleteTemplate` — delete an assembly template
- `deleteTemplate` — delete a template that has active instances
- `deleteTemplate` — delete with invalid/nonexistent IDs
- `deleteTemplate` — delete with empty `ids` array
- `deleteTemplate` — delete a template while in its context (currentProduct)

**Questions:**

- Does deleting a template with active instances remove the instances too, or does it error?
- What happens if you pass a non-template ID (e.g., an instance ID or assembly root ID)?
- Does deletion change `currentProduct`?
- What's the structure tree state after deletion?
- Can you delete from any context (assembly root vs template context)?

---

## 01 — basic single template deletion

Script: `scripts/01-basic-delete.mjs` — ✅ as expected. Created two part templates (22, 105), deleted tpl1 (22). Result: null, maxLevel: 31, no messages.

**Data:** `getPartTemplate` before: `[22, 105]`, after: `[105]`. Template cleanly removed from PartContainer. Structure tree confirms PartContainer has only tpl2 remaining.

## 02 — batch delete (multiple templates)

Script: `scripts/02-batch-delete.mjs` — ✅ batch deletion works. Created 3 templates (22, 105, 170), deleted all in one call: `deleteTemplate({ ids: [22, 105, 170] })`.

**Data:** Result: null, maxLevel: 31. Before: `[22, 105, 170]`, after: `[]`. All templates removed in a single call.

## 03 — delete template with active instances (cascade behavior)

Script: `scripts/03-delete-with-instances.mjs` — ✅ cascade delete. Created one template (22) with two instances (105, 107). Deleted the template.

| ![before](files/03-delete-with-instances-before-delete-solid.png) | ![after](files/03-delete-with-instances-after-delete-workgeo.png) |
| --- | --- |

**Data:** Result: null, maxLevel: 31, no error. Templates after: `[]`. Structure tree shows `instances: []` and `instancesNested: []` — both instances were cascade-deleted along with the template. PartContainer has no children. Assembly root only retains ExpressionSet, ConstraintSet, GeometrySet.

**Learned:** Deleting a template CASCADE DELETES all its instances. No error, no warning. This is destructive and silent.
**📌 LLM doc:** Cascade delete behavior — template deletion removes all instances. Critical safety info.

## 04 — invalid and edge-case IDs

Script: `scripts/04-invalid-ids.mjs` — mixed results, revealing behavior.

**Data:**
- Nonexistent ID (999999): maxLevel=51, error 1006 "An element of parameter 'ids' has an invalid id!"
- Assembly root ID (12): maxLevel=31, no messages, **silent no-op** — template still exists. The ID is type-valid (it's an assembly) but it's not in a template container, so nothing happens.
- ID 0: maxLevel=51, error 1006.

**Learned:** Assembly root ID is silently accepted but nothing is deleted — a no-op. Nonexistent and zero IDs properly error.
**📌 LLM doc:** Silent no-op for assembly root ID. Error for nonexistent/zero IDs.

## 05 — delete assembly template

Script: `scripts/05-delete-assembly-template.mjs` — ✅ works for both template types. Created assembly template (22) containing a part template (32) with an instance. Deleted the assembly template.

**Data:** Result: null, maxLevel: 31. Assembly templates after: `[]`. Part templates after: `[32]` — the part template inside the assembly template survives.

**Learned:** `deleteTemplate` works on assembly templates too. Deleting an assembly template does NOT delete the part templates it references — they live in PartContainer independently.
**📌 LLM doc:** Assembly template deletion leaves part templates intact.

## 06 — delete template while in its context (currentProduct)

Script: `scripts/06-delete-current-context.mjs` — ⚠️ succeeds but leaves stale currentProduct.

**Data:** Result: null, maxLevel: 31. Templates after: `[]`. BUT `structure.currentProduct` still points to the deleted template ID (22). Switching back to asmId with `setCurrentProduct` works fine.

**Learned:** You CAN delete the template you're currently working in. No error. But `currentProduct` becomes a stale pointer to a dead ID. Must call `setCurrentProduct` to fix.
**📌 LLM doc:** Stale currentProduct after deleting active template — always switch context before or immediately after deletion.

## 07 — empty ids array and instance ID

Script: `scripts/07-empty-ids-and-negative.mjs` — edge cases.

**Data:**
- Empty `ids: []`: maxLevel=31, no messages. Silent no-op — accepted gracefully.
- Instance ID (105): maxLevel=51, error 1001: "The parameter 'ids' has a wrong id type! Provide only following id types: ['part/assembly']". Template (22) survives.

**Learned:** Empty array is fine (no-op). Instance IDs are rejected with a clear type error — only part/assembly template IDs accepted.
**📌 LLM doc:** Instance IDs rejected with type error. Empty array is no-op.

## 08 — double delete (idempotency)

Script: `scripts/08-double-delete.mjs` — ✅ proper error on second attempt.

**Data:**
- First delete: maxLevel=31, success.
- Second delete (same ID 22): maxLevel=51, error 1006 "An element of parameter 'ids' has an invalid id!"

**Learned:** Deletion is not idempotent. After a template is deleted, its ID becomes invalid and a second delete properly errors.

## 09 — mixed valid and invalid IDs (atomicity)

Script: `scripts/09-mixed-valid-invalid.mjs` — ⚠️ **atomic behavior discovered**. Mixed valid template (22) with invalid ID (999999) in one call.

**Data:** Result: null, maxLevel: 51, error 1006. Templates after: `[22, 105]` — **NEITHER was deleted**. The invalid ID caused the entire operation to be rolled back.

**Learned:** `deleteTemplate` is ATOMIC. If any ID in the `ids` array is invalid, the entire batch fails and no templates are deleted. This is different from many other ClassCAD APIs that process valid items and error on invalid ones.
**📌 LLM doc:** Atomic batch behavior — one bad ID fails the entire call.

## 10 — recreate template after deletion

Script: `scripts/10-recreate-after-delete.mjs` — ✅ clean lifecycle. Created "Bracket" template (22), instanced it, deleted template (cascade removes instance), recreated "Bracket" with new geometry. New template gets new ID (107), lookup by name works.

| ![recreated](files/10-recreate-after-delete-after-recreate-solid.png) |
| --- |

**Data:** Templates after recreate: `[107]`. `getPartTemplate({ name: 'Bracket' })` returns 107. New instance (190) works fine.

**Learned:** Name reuse after deletion works cleanly. New template gets a fresh ID, no name collision issues.
