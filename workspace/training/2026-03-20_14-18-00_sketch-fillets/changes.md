# Sketch Fillets — Skill Changes

**Date:** 2026-03-20  
**Session:** `workspace/training/2026-03-20_14-18-00_sketch-fillets/`

## Summary

Extended existing AGENT NOTE on `v1.sketch.fillet` (line ~464 in `references/sketch.md`) with 4 new findings from 16 test scripts. The existing note was already comprehensive — these are minor additions.

## Diff

```diff
--- a/references/sketch.md
+++ b/references/sketch.md
@@ -482,6 +482,10 @@
 > - **undoFillet({id, arcId})**: removes arc + fillet constraints...
 > - **v1.sketch.arc does NOT exist** — "Unknown command v1.sketch.arc"
+> - **Double-fillet same corner**: Fails with "Lines don't have incident points!" — after first fillet, lines no longer share a point (arc is between them)
+> - **undoFillet errors**: Wrong ID type → "arcId has a wrong id type! Provide only following id types: ['sketch-arc']"; invalid/nonexistent ID → "An element of parameter 'arcId' has an invalid id!"
+> - **v1.sketch.getConstraints does NOT exist** — constraint inspection requires structure tree traversal
+> - **Full workflow**: fillet all corners → sketchRegion → extrusion works end-to-end (confirmed 2026-03-20, 16 tests)
```

## New findings

1. **Double-fillet same corner** — can't re-fillet an already-filleted corner because the original lines no longer share an incident point
2. **undoFillet error messages** — documented exact error strings for wrong ID type and invalid ID
3. **getConstraints API doesn't exist** — no `v1.sketch.getConstraints` command; constraints visible only via structure tree
4. **End-to-end workflow** — fillet → sketchRegion → extrusion confirmed working
