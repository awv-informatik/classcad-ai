# Changes — assembly.loadProduct training session

## New file: `references/assembly/loadProduct.md`

```diff
+# assembly.loadProduct
+
+Loads a product from data, file, or URL into an existing assembly as a template. The loaded product is added to the appropriate container (PartContainer for parts, AssemblyContainer for assemblies) and can then be instantiated with `assembly.instance`. Does NOT auto-instantiate.
+
+## Prerequisites
+
+- `assembly.create` must have been called first. Without it: error "Assembly building is not initialized!" (maxLevel=51).
+
+## Key Parameters
+
+- **Source** (pick one):
+  - `data` — content string (from `common.save` or `assembly.exportNode`)
+  - `file` — absolute path on the ClassCAD server's filesystem
+  - `url` — URL to fetch the file from
+  - If none provided: error "Either data, file or url must be provided to load content from."
+- `format` — `'OFB'` (default) or `'STP'` only. **IWP, STL, SCG are NOT supported** (unlike `common.load` which also accepts IWP).
+- `encoding` — `'base64'`. Must match the encoding used on save.
+- `compression` — `'deflate'`. Must match the compression used on save.
+- `ident` — custom string identifier. Stored in the assembly's `IdentToIdMap` as `[identString, templateId]` pairs.
+
+## Return Value — `{ id }` pointing to template in PartContainer or AssemblyContainer.
+
+## Key findings:
+- Part OFBs → CC_PartContainer, Assembly OFBs → CC_AssemblyContainer
+- Does NOT auto-instantiate, does NOT switch currentProduct
+- Only OFB and STP supported (not IWP)
+- ident stored in IdentToIdMap
+- IDs shift when loaded into assembly context
+- Work geometry preserved but must use part.getWorkGeometry on templates
+- exportNode → loadProduct roundtrip works perfectly
+- Comparison table vs common.load included
```
