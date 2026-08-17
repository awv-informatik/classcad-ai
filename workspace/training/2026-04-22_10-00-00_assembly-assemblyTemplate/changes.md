# Changes — assembly.assemblyTemplate training

## New file: `references/assembly/assemblyTemplate.md`

```diff
+# assembly.assemblyTemplate
+
+Creates a new assembly template (sub-assembly) in the AssemblyContainer. Used for building hierarchical multi-part structures — a sub-assembly groups part instances that move together.
+
+## Prerequisites
+
+- An assembly must exist (`assembly.create` called first). Without it: `result: null`, error "Assembly building is not initialized!"
+
+## Key Parameters
+
+- `name` (string, optional) — display name. Default: `"Assembly"`.
+  - Multiple unnamed calls auto-increment: "Assembly", "Assembly0", "Assembly1", ...
+  - Duplicate names are auto-deduplicated: "Motor", "Motor0", "Motor1", ... — no error.
+  - Empty string is allowed (creates a template with blank name).
+  - Special characters (spaces, parens, slashes) are sanitized to underscores in display name, preserved in `originalName`.
+
+## Return Value
+
+- `result` — numeric ID of the new `CC_Assembly` node. Returns `null` on failure.
+- `maxLevel` — 31 (info) on success.
+
+## Context Switching (Critical)
+
+**`assemblyTemplate()` does NOT switch `currentProduct`.** After calling it, `structure.currentProduct` still points to whatever was current before (usually the assembly root).
+
+## Structure
+
+All assembly templates live flat under AssemblyContainer — nesting is via instances, not container hierarchy.
+Each assembly template consumes ~10 IDs (vs ~46 for part templates).
+
+## Gotchas
+
+- `partTemplate()` always creates in PartContainer regardless of current context
+- Has `originalName` member (unlike `partTemplate`)
+- `getAssemblyTemplate({ name: '' })` fails even if empty-named template exists
+- No `ident` param (unlike `assembly.create`)
+
+## Also documents
+
+- `convertToTemplate` — demotes root to assembly template, creates new root
+- Nested sub-assembly pattern
+- `getAssemblyTemplate` / `deleteTemplate` behavior on assembly templates
```
