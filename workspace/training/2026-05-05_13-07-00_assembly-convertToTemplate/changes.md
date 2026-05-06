# Changes — assembly.convertToTemplate

## New file: `references/assembly/convertToTemplate.md`

```diff
+# assembly.convertToTemplate
+
+Converts the current root assembly into an assembly template and creates a new root assembly above it. The old root becomes a reusable sub-assembly template.
+
+## Prerequisites
+
+- An assembly must exist (`assembly.create` called first)
+- The drawing must be in assembly context (not part context)
+
+## Key Parameters
+
+- `name` (optional) — name for the converted template. Default: `"Subassembly"`. Empty string `''` is allowed. Names are NOT deduplicated — duplicates are permitted but cause lookup issues.
+
+## Return Value
+
+Returns VOID (`null`). maxLevel=31 on success.
+
+The old root assembly ID becomes the converted template's ID. A new root is created with a higher ID. Both `structure.root` and `structure.currentProduct` update to the new root.
+
+## Spatial Behavior
+
+Instance transforms inside the old root are preserved exactly. When you instance the converted template, internal offsets compose additively with the new instance's transform:
+
+world_COG = instance_transform + internal_instance_offset + local_body_COG
+
+Verified numerically: box at local [20,10,5] + internal offset [50,30,20] + outer offset [100,0,0] → COG [170,40,25] — exact match.
+
+## Gotchas & Dead Ends
+
+- Name collisions: Duplicate names allowed but getAssemblyTemplate by name returns first match
+- Part context: maxLevel=51 "Assembly building is not initialized!"
+- State after part.create: may fail with maxLevel=51 due to residual state
+- Empty assemblies: Convert successfully
+
+## Common Patterns (build hierarchy, chain conversions, modify after conversion)
+## Working Example (create → instance → convert → re-instance)
+## Related APIs (assemblyTemplate, deleteTemplate, getAssemblyTemplate, setCurrentProduct, instance)
```
