# Training: assembly.getAssemblyTemplate

**Date:** 2026-04-22

## Goal

Testing `v1.assembly.getAssemblyTemplate` — finds assembly templates by name or lists all.

**Methods to cover:**

- `getAssemblyTemplate()` — no args, list all assembly templates
- `getAssemblyTemplate({})` — empty object, list all
- `getAssemblyTemplate({ name: 'X' })` — find by exact name
- `getAssemblyTemplate({ name: '' })` — empty string behavior (reported to fail)
- `getAssemblyTemplate({ name: 'NonExistent' })` — not found case
- Return value shapes: `Array<id>` vs `id` (single) vs `null`
- Behavior without `assembly.create` (no assembly context)
- After `deleteTemplate` — does listing reflect deletion?
- Ordering of results (creation order? alphabetical?)
- Interaction with `convertToTemplate` — does the converted template appear?

**Questions:**

- Is the return shape consistent with `getPartTemplate`? (array for list-all, single id for name lookup)
- Does empty string name actually fail, as claimed in the `assemblyTemplate` LLM doc?
- What error message/level on not-found?
- Does it find templates created via `convertToTemplate`?

---

## 01 — basic list-all and name lookup

Script: `scripts/01-basic-list-and-lookup.mjs` — ✅ as documented.

Created 3 assembly templates: Alpha=22, Beta=32, Gamma=42.

- `getAssemblyTemplate()` (no args) → `[22, 32, 42]` (Array, maxLevel 31)
- `getAssemblyTemplate({})` (empty obj) → `[22, 32, 42]` (same)
- `getAssemblyTemplate({ name: 'Beta' })` → `32` (bare number, not array, maxLevel 31)
- `findBeta.result === tpl2` → true

**Data:** See `files/01-basic-list-and-lookup-basic-results.json`. Return shapes match `getPartTemplate` exactly: array for list-all, single number for name lookup.

---

## 02 — not-found, empty name, case sensitivity

Script: `scripts/02-not-found-and-empty-name.mjs` — surprising result on empty name.

- **Not found:** `result: null`, `maxLevel: 51`, error: `"Assembly with name = \"DoesNotExist\" could not be found"`
- **Empty name, no template with empty name:** `result: null`, `maxLevel: 51`, error: `"Assembly with name = \"\" could not be found"`
- **Created template with `name: ''`**, then retried: `result: 32`, `maxLevel: 31` — **SUCCESS**
- **Case mismatch** (`'exists'` vs `'Exists'`): `result: null`, maxLevel 51 — case-sensitive

**Data:** See `files/02-not-found-and-empty-name-edge-cases.json`.

**Learned:** Empty string name lookup **succeeds** when an empty-named template exists. The `assemblyTemplate.md` LLM doc claims `getAssemblyTemplate({ name: '' })` fails even if an empty-named template exists — this is **wrong** and needs correction.

📌 LLM doc: Correct the `assemblyTemplate.md` claim about empty name lookup failing.
📌 LLM doc: Document that name lookup is case-sensitive, exact match only.

---

## 03 — no assembly context

Script: `scripts/03-no-assembly-context.mjs` — ✅ graceful behavior.

- **List-all without `assembly.create`:** `result: []` (empty array), maxLevel 31 — no crash, no error
- **Name lookup without assembly:** `result: null`, maxLevel 51, error: `"Assembly with name = \"Foo\" could not be found"`

**Data:** See `files/03-no-assembly-context-no-assembly.json`. Consistent with `getPartTemplate` — list-all never crashes.

---

## 04 — deletion and ordering

Script: `scripts/04-delete-and-ordering.mjs` — ✅ as expected.

Created: Charlie=22, Alpha=32, Bravo=42 (note: NOT alphabetical order).

- **List before deletion:** `[22, 32, 42]` — creation order, ascending IDs
- **Deleted Alpha (32):** `deleteTemplate` result=null, maxLevel=31
- **List after deletion:** `[22, 42]` — deletion reflected immediately
- **Find deleted by name:** `result: null`, maxLevel 51

**Data:** See `files/04-delete-and-ordering-delete-ordering.json`. Ordering is creation order (ascending ID), not alphabetical.

---

## 05 — duplicate names and deduplication

Script: `scripts/05-duplicates-and-dedup.mjs` — ✅ deduped names are findable.

Created 3 templates all named "Motor" → deduped to Motor=22, Motor0=32, Motor1=42.

- `getAssemblyTemplate({ name: 'Motor' })` → 22 (first, keeps original name)
- `getAssemblyTemplate({ name: 'Motor0' })` → 32 (second, deduped)
- `getAssemblyTemplate({ name: 'Motor1' })` → 42 (third, deduped)

**Data:** See `files/05-duplicates-and-dedup-duplicates.json`. Must use actual (deduped) name, not the originally requested name.

📌 LLM doc: Document that deduped names (Motor0, Motor1) are the lookup keys.

---

## 06 — cross-container isolation and convertToTemplate

Script: `scripts/06-cross-container-and-convert.mjs` — ✅ containers are isolated.

Part template "Widget"=22, assembly template "Widget"=68. Both found correctly by their respective `get*Template` APIs without cross-contamination.

- `getAssemblyTemplate` list: `[68]` — does NOT include part template 22
- After `convertToTemplate({ name: 'ConvertedAsm' })`: list = `[68, 12]`
- `getAssemblyTemplate({ name: 'ConvertedAsm' })` → 12 (the original root assembly ID)

**Data:** See `files/06-cross-container-and-convert-cross-container.json`.

**Learned:** `convertToTemplate` demotes the root assembly (ID 12) into an assembly template. It keeps its original numeric ID and becomes findable by the new name. It appears at the end of the template list.

📌 LLM doc: Document convertToTemplate interaction — converted templates appear in assembly template list.

---

## 07 — special characters and single-template array

Script: `scripts/07-special-chars-and-single.mjs` — important difference from `getPartTemplate`.

Created template with `name: 'My Sub (v2)'` → sanitized to `'My_Sub__v2_'`.

- **Single template list:** `[22]` — always array even with 1 template
- **Find by sanitized name** `'My_Sub__v2_'`: → 22, maxLevel 31 — **WORKS**
- **Find by original name** `'My Sub (v2)'`: → null, maxLevel 51 — **FAILS**
- **`undefined` param:** → `[22]` — same as no-args

**Data:** See `files/07-special-chars-and-single-special-chars.json`.

**Learned:** Unlike `getPartTemplate` (which preserves special chars verbatim), `getAssemblyTemplate` matches against the **sanitized** display name (underscores replace special chars). You must use the sanitized name. This is because `assemblyTemplate` sanitizes names to underscores while `partTemplate` does not.

📌 LLM doc: Document that lookup uses sanitized name (underscores), not original name.
