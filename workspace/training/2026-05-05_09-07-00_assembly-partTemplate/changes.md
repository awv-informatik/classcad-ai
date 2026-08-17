# Skill Changes — assembly.partTemplate

## New file: `references/assembly/partTemplate.md`

```diff
+# assembly.partTemplate
+
+Creates a new part and adds it as a template to the PartContainer. The returned ID is a full `CC_Part` node — use it with all `part.*` APIs to build geometry inside the template. Templates are then instantiated with `assembly.instance`.
+
+## Prerequisites
+- `assembly.create` must have been called first.
+
+## Key Parameters
+- `name` — (optional) Default: "Part". Subsequent defaults get "Part0", "Part1", etc.
+
+## Context Behavior
+- `partTemplate` does NOT switch `currentProduct`
+- `part.*` calls with template ID DO switch context
+- `assembly.*` calls work regardless of `currentProduct`
+
+## Gotchas
+- Duplicate names allowed (getPartTemplate only returns first match)
+- Template updates do NOT propagate to existing instances
+- No `ident` parameter
+
+## Structure Tree, Working Example, Spatial Facts, Related APIs
+(see full file)
```

## Modified: `references/assembly/create.md`

```diff
-- **Auto-sets currentProduct.** ... But `partTemplate` then switches context to the new part — you need `setCurrentProduct({ id: asmId })` to return to assembly context after building geometry.
++ **Auto-sets currentProduct.** ... Note: `partTemplate` itself does NOT switch context — but subsequent `part.*` calls using the template ID will switch `currentProduct` to the template. Call `setCurrentProduct({ id: asmId })` after building geometry to return to assembly context (good practice, not strictly required for `assembly.*` calls which accept explicit IDs).
```

Corrected a wrong claim from the initial `create.md` training that stated `partTemplate` switches context. Testing confirmed it does NOT — only `part.*` calls do.
