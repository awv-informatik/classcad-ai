# Skill Changes — assembly.instance, getInstance, deleteInstance

## New files

- `references/assembly/instance.md` — LLM doc for assembly.instance (87 lines)
- `references/assembly/getInstance.md` — LLM doc for assembly.getInstance (67 lines)
- `references/assembly/deleteInstance.md` — LLM doc for assembly.deleteInstance (50 lines)

## Modified files

- `references/assembly/generic.md` — Updated Instances section: removed inaccurate `link`/`coordinateSystem` member claims, added actual structure tree members observed. Added "Template vs Expanded Tree IDs" section documenting CC_ProductReference vs CC_ProductReferenceET distinction.

## Diff summary

```diff
+++ b/references/assembly/instance.md (NEW)
+# assembly.instance
+Creates instances of templates in the assembly tree...
+(87 lines — full API doc with transform formats, gotchas, spatial verification, working example)

+++ b/references/assembly/getInstance.md (NEW)
+# assembly.getInstance
+Queries instances from an owner...
+(67 lines — return value semantics, template vs expanded tree IDs, working example)

+++ b/references/assembly/deleteInstance.md (NEW)
+# assembly.deleteInstance
+Removes instances from the assembly tree...
+(50 lines — error cases, re-delete behavior, working example)

--- a/references/assembly/generic.md
+++ b/references/assembly/generic.md
-  - `link` = template ID (the source)
-  - `coordinateSystem` = `[origin, xDir, yDir, zDir]` (world transform)
+- Structure tree members: `productId` (template link), `isDirty`, `localPath`, `ownPart`, `productRefsET`, `_VERSION`. The transform is stored internally — **not visible** in the structure tree member dump.
+### Template vs Expanded Tree IDs
+When querying from template → CC_ProductReference IDs. From instance → CC_ProductReferenceET IDs.
```
