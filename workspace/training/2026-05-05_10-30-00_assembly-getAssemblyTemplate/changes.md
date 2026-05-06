# Changes — assembly.getAssemblyTemplate training

## New file: `references/assembly/getAssemblyTemplate.md`

```diff
+# assembly.getAssemblyTemplate
+
+Retrieves assembly templates from the AssemblyContainer — either all of them or one by exact name.
+
+## Prerequisites
+
+- None. Works even without `assembly.create` (returns empty array).
+
+## Key Parameters
+
+- `name` — (optional) Exact name of the template to find. Case-sensitive. If omitted, returns all assembly templates.
+
+## Return Value
+
+**Two distinct return shapes:**
+
+| Call | Result | maxLevel |
+|---|---|---|
+| `getAssemblyTemplate()` or `getAssemblyTemplate({})` | `Array<id>` — all template IDs, creation order | 31 |
+| `getAssemblyTemplate({ name: 'X' })` — found | `id` (single number) | 31 |
+| `getAssemblyTemplate({ name: 'X' })` — not found | `null` | 51 |
+
+The listing mode **always** returns an array, even with 0 or 1 templates. The name mode **always** returns a single number or null — never an array.
+
+## Gotchas
+
+- **Names are SANITIZED.** `assemblyTemplate` replaces non-alphanumeric characters (spaces, parens, hyphens) with underscores. You must look up templates by their **sanitized** name, not the name you originally requested.
+- **Case-sensitive, exact match only.**
+- **Empty-string name works.**
+- **Scoped to AssemblyContainer only.**
+- **Deduplicated names are individually addressable.**
+- **Live query after deletion.**
+- **Ordering is creation order** (ascending ID), not alphabetical.
+- **`convertToTemplate` results appear here.**
+- **No assembly required for listing.**
+
+## Working Example, Related sections included.
```

## Modified: `references/assembly/assemblyTemplate.md`

```diff
-- **Duplicate names allowed.** Two templates can share a name (different IDs). `getAssemblyTemplate({ name: 'X' })` returns only the first match. Use unique names or track IDs directly.
++ **Duplicate names are auto-deduplicated.** Three calls with `name: 'Motor'` create "Motor", "Motor0", "Motor1". `getAssemblyTemplate({ name: 'Motor0' })` finds the second one by its actual stored name.
```

Corrected inaccurate claim that duplicate names are allowed without deduplication. In reality, the server auto-deduplicates by appending a number suffix.
