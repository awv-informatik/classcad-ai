# Changes — assembly.assemblyTemplate

## New file: `references/assembly/assemblyTemplate.md`

```diff
+# assembly.assemblyTemplate
+
+Creates a sub-assembly template — a `CC_Assembly` node in `CC_AssemblyContainer`. Use this to build nested, reusable assembly structures (e.g., a "Table" sub-assembly containing a base plate + 4 legs that can be instantiated multiple times in the root assembly).
+
+## Prerequisites
+
+- `assembly.create` must have been called first. Without it: error "Assembly building is not initialized!" (maxLevel=51).
+
+## Key Parameters
+
+- `name` — (optional) Name of the sub-assembly template. Default: `"Assembly"`.
+
+## Return Value
+
+- **Success:** `result` = numeric ID of the `CC_Assembly` node (stored in `CC_AssemblyContainer`). `maxLevel` = 31.
+- **Failure:** `result` = null, `maxLevel` = 51.
+
+## Context Behavior
+
+- **`assemblyTemplate` does NOT switch `currentProduct`.** After calling it, context remains on whatever product was current (typically the root assembly).
+- To build inside the sub-assembly (add instances), call `setCurrentProduct({ id: subAsmId })` first.
+- `assembly.*` calls with explicit IDs (like `instance({ ownerId: subAsmId })`) work regardless of `currentProduct`.
+
+## Building a Sub-Assembly
+
+Sub-assemblies contain instances of part templates (and/or other assembly templates). The workflow:
+
+1. Call `assemblyTemplate({ name: '...' })` — get the sub-assembly ID
+2. Call `setCurrentProduct({ id: subAsmId })` — switch context
+3. Create part templates with `partTemplate()` (or reuse existing ones)
+4. Build geometry inside part templates (`part.box`, `part.cylinder`, etc.)
+5. Instance parts inside the sub-assembly: `instance({ productId: tplId, ownerId: subAsmId })`
+6. Return to root: `setCurrentProduct({ id: asmId })`
+7. Instance the sub-assembly: `instance({ productId: subAsmId, ownerId: asmId })`
+
+## Gotchas
+
+- **Part templates are GLOBAL.** `partTemplate` called from any context always stores the part in `CC_PartContainer`. `getPartTemplate({})` returns the same list regardless of `currentProduct`. Any part template can be instanced inside any assembly or sub-assembly.
+- **Duplicate names allowed.** Two templates can share a name (different IDs). `getAssemblyTemplate({ name: 'X' })` returns only the first match. Use unique names or track IDs directly.
+- **Nesting is unlimited.** Assembly templates can contain instances of other assembly templates. Transform composition works correctly at arbitrary depth.
+
+## Structure Tree
+
+(tree diagram showing CC_AssemblyContainer → CC_Assembly with ExpressionSet/ConstraintSet/GeometrySet children)
+
+## Spatial Facts (verified)
+
+- Instance COG = sum of parent transform origins + weighted local COG
+- Transform composition verified at 3 nesting levels with calculateMassProperties
+
+## Working Example + Related APIs included
```
