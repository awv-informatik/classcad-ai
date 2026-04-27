# Changes — assembly.getAssemblyTemplate

## New file: `references/assembly/getAssemblyTemplate.md`

Created full LLM doc covering:
- Two call modes (list-all vs name lookup) with distinct return shapes
- Key parameter details (case-sensitive, sanitized names, deduped names)
- Graceful behavior without assembly context
- Ordering (creation order), deletion reflection, convertToTemplate interaction
- Cross-container isolation (AssemblyContainer only)

## Modified: `references/assembly/assemblyTemplate.md`

```diff
-- **`getAssemblyTemplate({ name: '' })` fails** even if an empty-named template exists — returns error, not the template.
+- **`getAssemblyTemplate({ name: '' })` works** if an empty-named template exists — returns its ID. Only fails when no empty-named template exists.
```

Corrected based on script 02 evidence: empty string lookup succeeds after creating a template with `assemblyTemplate({ name: '' })`.

## Modified: `references/assembly/getPartTemplate.md`

```diff
-  - Empty string `''` works — finds a template created with `partTemplate({ name: '' })`. (Unlike `getAssemblyTemplate`, which fails on empty name.)
+  - Empty string `''` works — finds a template created with `partTemplate({ name: '' })`. (`getAssemblyTemplate` also works with empty name.)
```

Corrected cross-reference to match the actual behavior.
