# Training: assembly.getAssemblyTemplate

**Date:** 2026-05-05

## Goal

Testing `v1.assembly.getAssemblyTemplate` — query API for finding assembly templates by name or listing all.

**Methods to cover:**

- `getAssemblyTemplate()` — no args, list all assembly templates
- `getAssemblyTemplate({})` — empty object, list all
- `getAssemblyTemplate({ name: 'X' })` — find by exact name

**Questions:**

- Is the return shape identical to `getPartTemplate`? (array for list-all, single id for name lookup)
- Is name lookup case-sensitive and exact-match only?
- Does empty-string name `''` work when an empty-named template exists?
- What happens with duplicate/deduplicated names?
- What happens after `deleteTemplate`?
- Does it work without `assembly.create` (no assembly context)?
- What's the ordering of returned arrays?
- Is there cross-contamination with part templates?
- Does `convertToTemplate` produce templates findable by this API?
- Are special characters in names sanitized (underscores vs original)?

---

## 01 — list all variants

Script: `scripts/01-list-all.mjs` — ✅ All three invocations return identical `[22, 32, 42]`.

**Data:** `getAssemblyTemplate()`, `getAssemblyTemplate({})`, and `getAssemblyTemplate({ name: undefined })` all return the same array. maxLevel=31 for all. All return `isArray: true`. See `files/01-list-all-list-all-results.json`.

**Learned:** No params, empty object, and explicit `undefined` name are equivalent — all return the full array.

## 02 — name lookup and case sensitivity

Script: `scripts/02-by-name.mjs` — ✅ Exact name match works. Case variants and partial match fail.

**Data:** `Alpha` → 22 (maxLevel=31, type=number, isArray=false). `alpha` → null (maxLevel=51). `ALPHA` → null (maxLevel=51). `Alp` → null (maxLevel=51). `DoesNotExist` → null (maxLevel=51). `Beta` → 32 (maxLevel=31). See `files/02-by-name-by-name-results.json`.

**Learned:** Name lookup is **case-sensitive** and **exact match only**. Failures return null with maxLevel=51.
**📌 LLM doc:** Case sensitivity and exact match requirement.

## 03 — return type analysis

Script: `scripts/03-return-types.mjs` — ✅ Listing always returns array; name lookup returns single number.

**Data:** With 0 templates: `getAssemblyTemplate()` → `[]` (isArray=true, length=0). With 1 template: list → `[22]` (isArray=true, length=1), name → `22` (type=number, isArray=false). With 2 templates: list → `[22, 32]` (isArray=true, length=2). See `files/03-return-types-return-types.json`.

**Learned:** Return shape matches `getPartTemplate` exactly: no-name → `Array<id>` (even empty or single-element), with-name → single `id` (number) or `null`.
**📌 LLM doc:** Return type depends on call mode — array vs single number.

## 04 — empty-string name

Script: `scripts/04-empty-name.mjs` — ✅ Empty-string lookup works when an empty-named template exists.

**Data:** Without empty-named template: `getAssemblyTemplate({ name: '' })` → null (maxLevel=51). After creating `assemblyTemplate({ name: '' })` (id=22): lookup → 22 (maxLevel=31). See `files/04-empty-name-empty-name-results.json`.

**Learned:** Empty-string name lookup **succeeds** when an empty-named template exists. The old `assemblyTemplate.md` claim that it "reportedly fails" is wrong.
**📌 LLM doc:** Empty-string name lookup works (correct assemblyTemplate.md cross-ref).

## 05 — duplicate/deduplicated names

Script: `scripts/05-duplicates.mjs` — ✅ Deduped names individually addressable.

**Data:** Three `assemblyTemplate({ name: 'Motor' })` calls created IDs 22, 32, 42. `getAssemblyTemplate({ name: 'Motor' })` → 22. `Motor0` → 32. `Motor1` → 42. All at maxLevel=31. See `files/05-duplicates-duplicate-results.json`.

**Learned:** Name deduplication creates "Motor", "Motor0", "Motor1". Must use actual (deduped) name for lookup.

## 06 — after deleteTemplate

Script: `scripts/06-after-delete.mjs` — ✅ Deletion immediately reflected.

**Data:** Before: `[22, 32, 42]`. Deleted id=32 (result=null, maxLevel=31). After: `[22, 42]`. Name lookup for "Remove" → null (maxLevel=51). "Keep" → 22, "AlsoKeep" → 42 still found. See `files/06-after-delete-after-delete.json`.

**Learned:** Live query — deleted templates vanish immediately from both listing and name lookup.

## 07 — no assembly context

Script: `scripts/07-no-assembly.mjs` — ✅ Graceful behavior without assembly.create.

**Data:** Without `assembly.create`: `getAssemblyTemplate()` → `[]` (maxLevel=31, empty array). `getAssemblyTemplate({ name: 'Foo' })` → null (maxLevel=51). No crash. See `files/07-no-assembly-no-assembly.json`.

**Learned:** Works safely without assembly context. List returns empty array, name returns null with error.

## 08 — ordering

Script: `scripts/08-ordering.mjs` — ✅ Creation order, not alphabetical.

**Data:** Created Charlie=22, Alpha=32, Bravo=42 (non-alphabetical). List → `[22, 32, 42]` (creation order, ascending ID). Calling twice → identical result (stable). See `files/08-ordering-ordering.json`.

**Learned:** Ordering is creation order (ascending ID), not alphabetical. Stable across repeated calls.

## 09 — cross-container isolation

Script: `scripts/09-cross-contamination.mjs` — ✅ No cross-contamination.

**Data:** Part template "Widget"=22, assembly template "Widget"=68 (same name, different containers). `getAssemblyTemplate()` → `[68]` (excludes part). `getAssemblyTemplate({ name: 'Widget' })` → 68. `getPartTemplate()` → `[22]` (excludes assembly). `getPartTemplate({ name: 'Widget' })` → 22. See `files/09-cross-contamination-cross-contamination.json`.

**Learned:** Complete container isolation. Same-named templates in different containers don't interfere.
**📌 LLM doc:** Container isolation guarantees.

## 10 — convertToTemplate interaction

Script: `scripts/10-convertToTemplate.mjs` — ✅ Converted templates appear in listing.

**Data:** Regular template "Regular"=22, root assembly asmId=12. Before convert: `[22]`. After `convertToTemplate({ name: 'ConvertedRoot' })`: list → `[22, 12]`. `getAssemblyTemplate({ name: 'ConvertedRoot' })` → 12 (same as original root assembly ID). See `files/10-convertToTemplate-convert-results.json`.

**Learned:** `convertToTemplate` demotes the root assembly into a template. It keeps its original numeric ID (12) and becomes findable by the new name. Appears at end of template list.
**📌 LLM doc:** convertToTemplate interaction — converted root shows up with its original ID.

## 11 — special character sanitization (CRITICAL)

Script: `scripts/11-special-chars.mjs` — ⚠️ Names are SANITIZED — original names don't work for lookup.

**Data:** Created templates:
- `assemblyTemplate({ name: 'My Sub (v2)' })` → lookup by `'My Sub (v2)'` → null (maxLevel=51), by `'My_Sub__v2_'` → 22 ✓
- `assemblyTemplate({ name: 'Gear-Box_01' })` → lookup by `'Gear-Box_01'` → null (maxLevel=51), by `'Gear_Box_01'` → 32 ✓
- `assemblyTemplate({ name: 'A B C' })` → lookup by `'A B C'` → null (maxLevel=51), by `'A_B_C'` → 42 ✓

See `files/11-special-chars-special-chars.json`.

**Learned:** `assemblyTemplate` **sanitizes** names: spaces → `_`, parentheses → `_`, hyphens → `_`. The lookup must use the sanitized form. This differs from `partTemplate` which preserves special chars verbatim. Sanitization rule: non-alphanumeric, non-underscore characters become `_`.
**📌 LLM doc:** CRITICAL — name sanitization means lookup keys differ from requested names.
