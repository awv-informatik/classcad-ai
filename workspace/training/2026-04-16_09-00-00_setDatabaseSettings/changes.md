# Changes — common.setDatabaseSettings training

## New file: `references/common/setDatabaseSettings.md`

Created full LLM doc covering:
- All 8 parameters with types, defaults, and purposes
- Return value (VOID, maxLevel=31 success / 51 error)
- Boolean type handling (JS true/false → 0/1)
- chordHeightTol density table (0.01→8385 verts to 5→85 verts on r=20 sphere)
- angleTol threshold behavior (only <10° increases density)
- doCurveTessellation edge schema change
- Persistence (survives clear/create, NOT saved to OFB)
- setFacetingParameters crosstalk (shared backing store)
- Validation edge cases (zero chord = error, negative = silent ignore, invalid modes accepted)
- Gotchas and working example

## Updated file: `references/common/getDatabaseSettings.md`

Corrected two incorrect claims discovered during setDatabaseSettings testing:

1. **facetingParamsMode=1 does NOT suppress mesh data.** Old doc claimed mode=1 means "no mesh data unless per-entity params are set". Testing (scripts 03, 14) showed both modes return identical mesh data. Removed the misleading code example suggesting `setDatabaseSettings({ facetingParamsMode: 0 })` is needed to get graphic data.

2. **No settings are saved to OFB files.** Old doc claimed "chordHeightTol and angleTol are saved to OFB files and restored on common.load()". Testing (script 09) definitively proved load() does not restore any database settings — values stay at pre-load worker state.

### Diff

```diff
diff --git a/references/common/getDatabaseSettings.md b/references/common/getDatabaseSettings.md
--- a/references/common/getDatabaseSettings.md
+++ b/references/common/getDatabaseSettings.md
@@ facetingParamsMode section
-- **mode=1** ("entity-specific", the default): The server expects per-entity tessellation parameters ... API responses return **no mesh data** unless per-entity params are set.
+- **mode=1** ("entity-specific", the default): The server uses per-entity tessellation parameters ... In practice, API responses still include mesh data in `r.graphic` regardless of mode — mode does NOT suppress graphic data.

-**The default mode is 1**, which means API responses do NOT include mesh data out of the box. To get graphic data:
-(code example removed)
+**Note:** Despite mode differences, both mode=0 and mode=1 return identical mesh data in API responses (tested with cylinders and boxes — same vertex counts, same container structure).

@@ Persistence section
-- **Partial save/load.** `chordHeightTol` and `angleTol` are saved to OFB files and restored on `common.load()`. `facetingParamsMode` is NOT saved — it resets to default (1) on load.
+- **NOT saved to OFB files.** `common.load()` does not restore any database settings — not chordHeightTol, not angleTol, not facetingParamsMode, not any field.

@@ Gotchas section
-- The default `facetingParamsMode=1` means you get **no graphic data** in API responses by default. Set to 0 first.
-- `facetingParamsMode` is NOT saved to OFB files. After `common.load()`, it resets to 1 (no graphic). You must re-set it to 0.
+- No database settings are saved to OFB files. After `common.load()`, re-apply any non-default settings.
```
