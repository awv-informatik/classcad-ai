# Skill Changes — assembly.updateGear & assembly.getGear

## Files changed

- `references/assembly/gear.md` — replaced inline getGear/updateGear sections with cross-references to dedicated docs
- `references/assembly/updateGear.md` — **NEW** — full LLM doc for assembly.updateGear
- `references/assembly/getGear.md` — **NEW** — full LLM doc for assembly.getGear

## Diff

```diff
diff --git a/references/assembly/gear.md b/references/assembly/gear.md
--- a/references/assembly/gear.md
+++ b/references/assembly/gear.md
@@ -28,20 +28,11 @@
 ## getGear
 
-`getGear({ id: asmId, name: 'gearName' })` — retrieves gear relation by name.
-
-Returns: `{ id, name, constr1Id, constr2Id, ratio, offset }`
-
-- `offset` is always returned in radians, even if created with a degree expression
-- Not-found returns null + maxLevel 51
-- Returns first match if multiple gears share the same name
+See [getGear.md](getGear.md) for full documentation.
 
 ## updateGear
 
-`updateGear({ id: gearId, ... })` — update any property by gear relation ID.
-
-- All properties updatable: name, constr1Id, constr2Id, ratio, offset
-- `id` here is the **gear relation ID** (not the assembly ID)
+See [updateGear.md](updateGear.md) for full documentation.

+ references/assembly/updateGear.md (NEW — 88 lines)
+ references/assembly/getGear.md (NEW — 71 lines)
```
