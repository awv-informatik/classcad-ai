# Changes — assembly.convertToTemplate

## New file: `references/assembly/convertToTemplate.md`

```diff
+# assembly.convertToTemplate
+
+Demotes the current root assembly into an assembly template and creates a new empty root assembly above it. The converted template is placed in AssemblyContainer and is immediately available for instancing.
+
+## Prerequisites
+
+- An assembly must exist (`assembly.create` called first). Without it: error "Assembly building is not initialized!" (maxLevel 51).
+
+## Key Parameters
+
+- `name` (string, optional) — display name for the converted template. Default: `"Subassembly"`.
+  - **NOT sanitized.** Unlike `assemblyTemplate`, special characters (spaces, parens, slashes) are kept verbatim in the `name` field. `'My Sub/Asm (v2)'` stays as-is.
+  - Duplicate names auto-deduplicate: "Sub", "Sub0", "Sub1", etc.
+  - Empty string is allowed.
+
+## Return Value
+
+- `result` — null (VOID). Always.
+- `maxLevel` — 31 on success, 51 on error.
+
+## What Happens
+
+1. Old root (CC_AssemblyRoot) → becomes CC_Assembly, moves under AssemblyContainer (id 10)
+2. New root (CC_AssemblyRoot) created as child of AllObjects, name "AssemblyRoot"
+3. `structure.root`, `structure.currentProduct`, `structure.currentInstance` all point to new root
+4. All instances inside the old root are preserved in the converted template
+5. Part templates in PartContainer are unchanged
+6. Pre-existing assembly templates in AssemblyContainer are unchanged
+
+## Gotchas
+
+- **Name is NOT sanitized.** `assemblyTemplate` sanitizes `(`, `)`, `/`, spaces → underscores. `convertToTemplate` does NOT. Use `getAssemblyTemplate({ name: 'Conv (v1)/sub' })` with the exact unsanitized name.
+- **`originalName` is immutable.** The `originalName` member retains the original `assembly.create`-time name, not the `convertToTemplate` name.
+- **New root has no `originalName`.** The newly created CC_AssemblyRoot does not have an `originalName` member.
+- **Always resets `currentProduct`.** Even if `currentProduct` was pointing to a part template, conversion switches it to the new root.
+- **Always converts the root.** It doesn't matter what `currentProduct` is — it always converts the root assembly.
+- **Same error for part context.** Calling with a part (not assembly) in the drawing gives the same "Assembly building is not initialized!" error.
+
+(+ Common Errors table, Chaining Conversions section, Working Example, Post-Conversion Operations, Related APIs)
```
