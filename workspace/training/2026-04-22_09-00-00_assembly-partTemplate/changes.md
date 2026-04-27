# Changes — assembly.partTemplate

## New file: `references/assembly/partTemplate.md`

```diff
+# assembly.partTemplate
+
+Creates a new part and adds it as a template to the PartContainer. The returned ID is a fully functional `CC_Part` — use it as the `id` parameter for all `part.*` API calls to build geometry inside the template.
+
+## Prerequisites
+
+- An assembly must exist (`assembly.create` called first). Without it: `result: null`, error "Assembly building is not initialized!"
+
+## Key Parameters
+
+- `name` (string, optional) — display name. Default: `"Part"`.
+  - Multiple unnamed calls auto-increment: "Part", "Part0", "Part1", ...
+  - Duplicate names are auto-deduplicated: "Bolt", "Bolt0", "Bolt1", ... — no error.
+  - Empty string is allowed (creates a template with blank name).
+  - Special characters (spaces, parens, slashes) are preserved verbatim — no sanitization.
+  - No `originalName` member (unlike assembly roots).
+
+## Return Value
+
+- `result` — numeric ID of the new `CC_Part` node (first template is typically 22). Returns `null` on failure.
+- `maxLevel` — 31 (info) on success.
+
+## Context Switching (Critical)
+
+**`partTemplate()` does NOT switch `currentProduct`.** After calling it, `structure.currentProduct` still points to whatever was current before (usually the assembly root).
+
+Context switches implicitly when you call any `part.*({ id: tplId })` — e.g., `part.box({ id: tplId })` sets `currentProduct` to the template.
+
+**You must call `assembly.setCurrentProduct({ id: asmId })` to return to assembly context** before calling `assembly.instance()` or other assembly-level APIs.
+
+`partTemplate()` can be called from any context — assembly root or another template. It always just creates the template without switching.
+
+## Structure
+
+- Template lives under `PartContainer` (ID 8) as a `CC_Part` node
+- Full CC_Part — all part.* APIs work (expressions, sketches, work geometry, features)
+
+## Gotchas
+
+- Context is sticky — partTemplate() never switches, only part.*({ id: tplId }) does
+- Each template consumes ~46 IDs for internal nodes
+- No ident param (unlike assembly.create)
+
+## Working Example, Related APIs
+
+- Complete create → build → switch → instantiate workflow
+- Links to create, getPartTemplate, assemblyTemplate, deleteTemplate, setCurrentProduct, instance
```
