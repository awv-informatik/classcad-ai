# Training: assembly.convertToTemplate

**Date:** 2026-04-22

## Goal

Testing `v1.assembly.convertToTemplate` — converts the current root assembly into an assembly template and creates a new root assembly above it.

**Methods to cover:**

- `convertToTemplate` — basic call with no params
- `convertToTemplate` — with custom `name`
- Verify structure changes: old root → CC_Assembly in AssemblyContainer, new root → CC_AssemblyRoot
- Verify `currentProduct` and `root` point to new root after conversion
- Verify part templates survive conversion (in PartContainer)
- Verify instances inside the old root survive as content of the new template
- Test: can you instance the converted template into the new root?
- Test: multiple consecutive conversions (nested demotions)
- Test: conversion of an empty assembly (no templates, no instances)
- Test: conversion when instances already exist in the root
- Edge case: `name` param — empty string, duplicate names, special characters

**Questions:**

- Does `convertToTemplate` preserve instances that were in the old root?
- What ID does the new root get?
- Can you chain multiple conversions to build hierarchy from the bottom up?
- What happens to `structure.currentInstance` after conversion?
- Does calling it when no assembly exists produce an error?

---

## 01 — basic convert (no params)

Script: `scripts/01-basic-convert.mjs` — ✅ Converts root to assembly template, creates new root.

| ![before](files/01-basic-convert-before-convert-solid.png) | ![after](files/01-basic-convert-after-convert-solid.png) |
| --- | --- |

**Data:**
- Before: root=12, currentProduct=12, currentInstance=12 (CC_AssemblyRoot)
- After: root=136, currentProduct=136, currentInstance=136 (new CC_AssemblyRoot)
- Old root (12) → CC_Assembly, name="Subassembly" (default), parent=10 (AssemblyContainer)
- New root (136) → CC_AssemblyRoot, name="AssemblyRoot"
- Instance (105) preserved inside converted template: `instances: [105]`
- Result: null (VOID), maxLevel: 31, no messages
- Part template (22) unchanged in PartContainer

**Learned:** Conversion is purely structural — geometry is unchanged. Old root's class changes from CC_AssemblyRoot to CC_Assembly and it moves under AssemblyContainer. Instances are preserved inside the template.
**📌 LLM doc:** Core behavior: old root → CC_Assembly in AssemblyContainer, new root → CC_AssemblyRoot. Returns VOID. Instances preserved.

---

## 02 — custom name

Script: `scripts/02-custom-name.mjs` — ✅ Custom name applied correctly.

**Data:**
- `convertToTemplate({ name: 'MySubAsm' })` → old root (12) name="MySubAsm", class=CC_Assembly
- `getAssemblyTemplate({ name: 'MySubAsm' })` → returns 12
- `getAssemblyTemplate({ name: 'Subassembly' })` → null (default not used when custom provided)
- New root id: 89

**Learned:** Name param sets the converted template's display name. Findable via `getAssemblyTemplate`.

---

## 03 — instance after convert

Script: `scripts/03-instance-after-convert.mjs` — ✅ Converted template can be instanced.

| ![two instances](files/03-instance-after-convert-two-instances-solid.png) |
| --- |

**Data:**
- Converted template (oldRoot=12) instanced into new root twice: inst1=117, inst2=120
- Second instance offset by [[80,0,0],[1,0,0],[0,1,0]]
- New root instances: [117, 120]
- maxLevel=31 for both instance calls

**Learned:** Converted templates work identically to `assemblyTemplate`-created templates for instancing.
**📌 LLM doc:** Converted template is fully functional — instance it like any assembly template.

---

## 04 — chained conversions

Script: `scripts/04-chained-conversions.mjs` — ✅ Multiple consecutive conversions build hierarchy from bottom up.

| ![chained](files/04-chained-conversions-chained-3-deep-solid.png) |
| --- |

**Data:**
- 1st convert: root 12→107, template at 12 ("Level1")
- 2nd convert: root 107→120, template at 107 ("Level2")
- 3rd convert: root 120→134, template at 120 ("Level3")
- All 3 templates available: `getAssemblyTemplate({})` → [12, 107, 120]
- Each root inherits a higher ID (consuming ~13 IDs per conversion)

**Learned:** Chaining works — useful for building hierarchy incrementally. Each conversion creates a new root and demotes the current one.
**📌 LLM doc:** Can chain multiple conversions to build nested hierarchy from the bottom up.

---

## 05 — empty assembly

Script: `scripts/05-empty-assembly.mjs` — ✅ Works on empty assembly.

**Data:**
- Empty root (no templates, no instances) converts successfully
- New root: 22 (compact — empty assembly uses few IDs)
- `getAssemblyTemplate({ name: 'EmptySub' })` → 12
- Converted template has instances=[]

**Learned:** No requirement for content — empty assemblies convert fine.

---

## 06 — name edge cases

Script: `scripts/06-name-edge-cases.mjs` — ✅ with surprising name behavior.

**Data:**
- Empty string `''` → name="" (allowed), originalName="Root" (retains creation-time name!)
- Special chars `'My Sub/Asm (v2)'` → name="My Sub/Asm (v2)" (NOT sanitized!), originalName="Root"
- No param → name="Subassembly" (default)

**Learned:** `originalName` retains the original `assembly.create` name, not the `convertToTemplate` name. Special characters are NOT sanitized — differs from `assemblyTemplate` behavior.
**📌 LLM doc:** originalName is immutable (keeps creation name). Name is NOT sanitized (unlike assemblyTemplate).

---

## 07 — no assembly error

Script: `scripts/07-no-assembly-error.mjs` — ✅ Errors correctly.

**Data:**
- maxLevel: 51
- Messages: "Assembly building is not initialized!" (code 0) + internal eval error
- result: null

**Learned:** Same error as other assembly APIs when no assembly exists.
**📌 LLM doc:** Document error messages for no-assembly case.

---

## 08 — part context error

Script: `scripts/08-part-context-error.mjs` — ✅ Same error as no-assembly.

**Data:**
- With a part (not assembly): same "Assembly building is not initialized!" error
- maxLevel: 51, result: null

**Learned:** Part context is treated as no-assembly. Error is not specific to parts — it's the general "no assembly" error.

---

## 09 — work inside converted template

Script: `scripts/09-work-inside-converted.mjs` — ✅ Can switch into and modify the converted template.

| ![after adding](files/09-work-inside-converted-after-adding-to-converted-solid.png) |
| --- |

**Data:**
- `setCurrentProduct({ id: oldRoot })` → succeeds (returns previous currentProduct 172)
- `instance({ productId: cylTpl, ownerId: oldRoot })` → cylinder instance 182 added
- Converted template now has instances: [170, 182] (original box + new cylinder)

**Learned:** Converted templates are mutable — you can switch into them and add/remove instances, just like regular assembly templates.
**📌 LLM doc:** Converted template is fully mutable — setCurrentProduct into it, add/remove instances.

---

## 10 — delete converted template

Script: `scripts/10-delete-converted.mjs` — ✅ Deletion cascade works.

**Data:**
- `deleteTemplate({ ids: [12] })` on converted template → maxLevel 31
- Instance (117) cascade-deleted from root
- Root instances after: []
- AssemblyContainer: no children remaining
- PartContainer: [22] (part template survives)

**Learned:** `deleteTemplate` works identically on converted templates — cascade-deletes instances.

---

## 11 — originalName deep dive

Script: `scripts/11-originalName-detail.mjs` — ✅ with important finding.

**Data:**
- BEFORE: name="OrigRoot", class=CC_AssemblyRoot, originalName="OrigRoot"
- AFTER: name="RenamedSub", class=CC_Assembly, originalName="OrigRoot" (unchanged!)
- NEW ROOT: name="AssemblyRoot", originalName=undefined (no originalName member!)

**Learned:** `convertToTemplate` changes the `name` member to the provided param but `originalName` is immutable — it always retains the `assembly.create` creation-time name. The new root assembly does NOT have an `originalName` member.
**📌 LLM doc:** originalName is immutable. New root has no originalName.

---

## 12 — name sanitization comparison

Script: `scripts/12-name-sanitization.mjs` — ✅ Confirms NO sanitization.

**Data:**
- `assemblyTemplate({ name: 'Test (v1)/sub' })` → name="Test__v1__sub", originalName="Test (v1)/sub" (SANITIZED)
- `convertToTemplate({ name: 'Conv (v1)/sub' })` → name="Conv (v1)/sub", originalName="Root" (NOT SANITIZED!)
- `getAssemblyTemplate({ name: 'Conv (v1)/sub' })` → found (12)
- `getAssemblyTemplate({ name: 'Conv__v1__sub' })` → not found

**Learned:** `convertToTemplate` does NOT sanitize special characters (spaces, parens, slashes) in the name, unlike `assemblyTemplate` which sanitizes to underscores. The unsanitized name is the searchable name.
**📌 LLM doc:** Name is NOT sanitized — major difference from assemblyTemplate. Document explicitly.

---

## 13 — convert from part template context

Script: `scripts/13-convert-from-part-context.mjs` — ✅ Works regardless of currentProduct.

**Data:**
- currentProduct was 22 (part template) before conversion
- Conversion succeeds — maxLevel 31, no messages
- After: currentProduct = 105 (new root) — auto-switched

**Learned:** `convertToTemplate` always converts the root assembly and always sets `currentProduct` to the new root, regardless of what `currentProduct` was before.
**📌 LLM doc:** Always converts root. Always resets currentProduct to new root.

---

## 14 — getAssemblyTemplate after convert

Script: `scripts/14-get-template-after-convert.mjs` — ✅ Converted templates are indistinguishable.

**Data:**
- All assembly templates: [105 (ExistingSub), 12 (ConvertedSub)]
- Both findable by name
- Part templates: [22] (unchanged)

**Learned:** Converted templates appear alongside manually-created assembly templates in queries. Indistinguishable from the API consumer's perspective.

---

## 15 — duplicate convert names

Script: `scripts/15-duplicate-convert-names.mjs` — ✅ Auto-deduplication works.

**Data:**
- 1st convert with "Sub" → template 12 name="Sub"
- 2nd convert with "Sub" → template 107 name="Sub0" (auto-deduplicated!)
- `getAssemblyTemplate({ name: 'Sub' })` → returns 12 (first one)

**Learned:** Duplicate names are auto-deduplicated by appending 0, 1, 2, etc. Same behavior as `assemblyTemplate`.
**📌 LLM doc:** Duplicate names auto-deduplicated (appends 0, 1, 2...).
